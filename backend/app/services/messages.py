from datetime import datetime, timezone

from bson import ObjectId

from app.db import get_db
from app.utils.mongo_helpers import is_valid_object_id, serialize_doc


def persist_chat_message(chat_id: str, sender_id: ObjectId, text: str) -> dict:
    if not is_valid_object_id(chat_id):
        raise ValueError("Invalid chat ID")

    cleaned = text.strip()
    if not cleaned or len(cleaned) > 2000:
        raise ValueError("Message must be 1-2000 characters")

    db = get_db()
    chat = db.chats.find_one({"_id": ObjectId(chat_id)})
    if not chat:
        raise LookupError("Chat not found")
    if sender_id not in chat.get("participants", []):
        raise PermissionError("Not authorized to send messages in this chat")

    now = datetime.now(timezone.utc)
    message = {
        "chatId": ObjectId(chat_id),
        "senderId": sender_id,
        "text": cleaned,
        "read": False,
        "createdAt": now,
        "updatedAt": now,
    }
    result = db.messages.insert_one(message)
    message["_id"] = result.inserted_id
    db.chats.update_one({"_id": ObjectId(chat_id)}, {"$set": {"lastMessage": result.inserted_id, "updatedAt": now}})
    return serialize_doc(message) or {}
