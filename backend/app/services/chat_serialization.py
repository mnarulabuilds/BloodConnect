from bson import ObjectId

from app.db import get_db
from app.utils.mongo_helpers import serialize_doc


def serialize_chats(chats: list[dict]) -> list[dict]:
    if not chats:
        return []

    db = get_db()
    participant_ids: set[ObjectId] = set()
    last_message_ids: set[ObjectId] = set()
    for chat in chats:
        for pid in chat.get("participants", []):
            participant_ids.add(pid if isinstance(pid, ObjectId) else ObjectId(pid))
        last_msg = chat.get("lastMessage")
        if isinstance(last_msg, ObjectId):
            last_message_ids.add(last_msg)

    users_by_id: dict[str, dict] = {}
    if participant_ids:
        for user in db.users.find(
            {"_id": {"$in": list(participant_ids)}},
            {"name": 1, "bloodGroup": 1, "avatar": 1, "role": 1},
        ):
            users_by_id[str(user["_id"])] = user

    messages_by_id: dict[str, dict] = {}
    if last_message_ids:
        for msg in db.messages.find({"_id": {"$in": list(last_message_ids)}}):
            messages_by_id[str(msg["_id"])] = msg

    serialized: list[dict] = []
    for chat in chats:
        data = serialize_doc(chat) or {}
        participants = []
        for pid in chat.get("participants", []):
            oid = pid if isinstance(pid, ObjectId) else ObjectId(pid)
            user = users_by_id.get(str(oid))
            if user:
                participants.append(serialize_doc(user))
        data["participants"] = participants
        last_msg = chat.get("lastMessage")
        if isinstance(last_msg, ObjectId):
            msg = messages_by_id.get(str(last_msg))
            data["lastMessage"] = serialize_doc(msg) if msg else None
        serialized.append(data)
    return serialized


def serialize_chat(chat: dict) -> dict:
    return serialize_chats([chat])[0]
