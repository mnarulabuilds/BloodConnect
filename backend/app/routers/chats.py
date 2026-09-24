from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException

from app.db import get_db
from app.dependencies import get_current_user
from app.schemas import SendMessageBody, StartChatBody
from app.utils.mongo_helpers import is_valid_object_id, serialize_doc

router = APIRouter(prefix="/api/chats", tags=["chats"])


def _participant(user_id: ObjectId):
    return get_db().users.find_one({"_id": user_id}, {"name": 1, "bloodGroup": 1, "avatar": 1, "role": 1})


def _serialize_chat(chat: dict) -> dict:
    data = serialize_doc(chat) or {}
    participants = []
    for pid in chat.get("participants", []):
        user = _participant(pid if isinstance(pid, ObjectId) else ObjectId(pid))
        if user:
            participants.append(serialize_doc(user))
    data["participants"] = participants
    if chat.get("lastMessage"):
        msg = get_db().messages.find_one({"_id": chat["lastMessage"]})
        data["lastMessage"] = serialize_doc(msg) if msg else None
    return data


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
        "data": [_serialize_chat(chat) for chat in chats],
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
    return {"success": True, "data": _serialize_chat(chat)}


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
def send_message(chat_id: str, body: SendMessageBody, user=Depends(get_current_user)):
    if not is_valid_object_id(chat_id):
        raise HTTPException(status_code=400, detail={"success": False, "error": "Invalid chat ID", "code": "VALIDATION_ERROR"})
    db = get_db()
    chat = db.chats.find_one({"_id": ObjectId(chat_id)})
    if not chat:
        raise HTTPException(status_code=404, detail={"success": False, "error": "Chat not found"})
    if user["_id"] not in chat.get("participants", []):
        raise HTTPException(status_code=403, detail={"success": False, "error": "Not authorized to send messages in this chat"})

    from datetime import datetime, timezone

    now = datetime.now(timezone.utc)
    message = {
        "chatId": ObjectId(chat_id),
        "senderId": user["_id"],
        "text": body.text.strip(),
        "read": False,
        "createdAt": now,
        "updatedAt": now,
    }
    result = db.messages.insert_one(message)
    message["_id"] = result.inserted_id
    db.chats.update_one({"_id": ObjectId(chat_id)}, {"$set": {"lastMessage": result.inserted_id, "updatedAt": now}})
    return {"success": True, "data": serialize_doc(message)}
