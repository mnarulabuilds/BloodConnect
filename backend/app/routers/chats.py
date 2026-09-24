from bson import ObjectId
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException

from app.db import get_db
from app.dependencies import get_current_user
from app.realtime import get_socket_server
from app.schemas import SendMessageBody, StartChatBody
from app.services.chat_serialization import serialize_chat, serialize_chats
from app.services.messages import persist_chat_message
from app.utils.mongo_helpers import is_valid_object_id, serialize_doc

router = APIRouter(prefix="/api/chats", tags=["chats"])


async def _emit_message(chat_id: str, payload: dict) -> None:
    sio = get_socket_server()
    if sio:
        await sio.emit("receive_message", payload, room=chat_id)


@router.get("")
def get_chats(page: int = 1, limit: int = 20, user=Depends(get_current_user)):
    page = max(1, page)
    limit = min(50, max(1, limit))
    db = get_db()
    filt = {"participants": user["_id"]}
    skip = (page - 1) * limit
    chats = list(db.chats.find(filt).sort("updatedAt", -1).skip(skip).limit(limit))
    total = db.chats.count_documents(filt)
    return {
        "success": True,
        "totalCount": total,
        "totalPages": (total + limit - 1) // limit,
        "currentPage": page,
        "count": len(chats),
        "data": serialize_chats(chats),
    }


@router.post("")
def start_chat(body: StartChatBody, user=Depends(get_current_user)):
    if not is_valid_object_id(body.recipientId):
        raise HTTPException(status_code=400, detail={"success": False, "error": "Invalid recipient ID", "code": "VALIDATION_ERROR"})
    if body.bloodRequestId and not is_valid_object_id(body.bloodRequestId):
        raise HTTPException(status_code=400, detail={"success": False, "error": "Invalid blood request ID", "code": "VALIDATION_ERROR"})

    db = get_db()
    query = {"participants": {"$all": [user["_id"], ObjectId(body.recipientId)]}}
    if body.bloodRequestId:
        query["bloodRequestId"] = ObjectId(body.bloodRequestId)
    else:
        query["bloodRequestId"] = {"$exists": False}

    chat = db.chats.find_one(query)
    if not chat:
        from datetime import datetime, timezone

        now = datetime.now(timezone.utc)
        doc = {
            "participants": [user["_id"], ObjectId(body.recipientId)],
            "status": "active",
            "createdAt": now,
            "updatedAt": now,
        }
        if body.bloodRequestId:
            doc["bloodRequestId"] = ObjectId(body.bloodRequestId)
        inserted = db.chats.insert_one(doc)
        chat = db.chats.find_one({"_id": inserted.inserted_id})
    return {"success": True, "data": serialize_doc(chat)}


@router.get("/{chat_id}")
def get_chat(chat_id: str, user=Depends(get_current_user)):
    if not is_valid_object_id(chat_id):
        raise HTTPException(status_code=400, detail={"success": False, "error": "Invalid chat ID", "code": "VALIDATION_ERROR"})
    chat = get_db().chats.find_one({"_id": ObjectId(chat_id)})
    if not chat:
        raise HTTPException(status_code=404, detail={"success": False, "error": "Chat not found"})
    if user["_id"] not in chat.get("participants", []):
        raise HTTPException(status_code=403, detail={"success": False, "error": "Not authorized to view this chat"})
    return {"success": True, "data": serialize_chat(chat)}


@router.get("/{chat_id}/messages")
def get_messages(chat_id: str, page: int = 1, limit: int = 50, user=Depends(get_current_user)):
    if not is_valid_object_id(chat_id):
        raise HTTPException(status_code=400, detail={"success": False, "error": "Invalid chat ID", "code": "VALIDATION_ERROR"})
    db = get_db()
    chat = db.chats.find_one({"_id": ObjectId(chat_id)})
    if not chat:
        raise HTTPException(status_code=404, detail={"success": False, "error": "Chat not found"})
    if user["_id"] not in chat.get("participants", []):
        raise HTTPException(status_code=403, detail={"success": False, "error": "Not authorized to view this chat"})

    page = max(1, page)
    limit = min(100, max(1, limit))
    skip = (page - 1) * limit
    filt = {"chatId": ObjectId(chat_id)}
    messages = [serialize_doc(m) for m in db.messages.find(filt).sort("createdAt", 1).skip(skip).limit(limit)]
    total = db.messages.count_documents(filt)
    return {
        "success": True,
        "totalCount": total,
        "totalPages": (total + limit - 1) // limit,
        "currentPage": page,
        "count": len(messages),
        "data": messages,
    }


@router.post("/{chat_id}/messages")
def send_message(
    chat_id: str,
    body: SendMessageBody,
    background_tasks: BackgroundTasks,
    user=Depends(get_current_user),
):
    try:
        payload = persist_chat_message(chat_id, user["_id"], body.text)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail={"success": False, "error": str(exc), "code": "VALIDATION_ERROR"})
    except LookupError:
        raise HTTPException(status_code=404, detail={"success": False, "error": "Chat not found"})
    except PermissionError:
        raise HTTPException(status_code=403, detail={"success": False, "error": "Not authorized to send messages in this chat"})

    background_tasks.add_task(_emit_message, chat_id, payload)
    return {"success": True, "data": payload}
