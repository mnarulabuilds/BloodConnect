import logging
from datetime import datetime, timezone

import socketio
from bson import ObjectId

from app.config import get_settings
from app.db import get_db
from app.utils.mongo_helpers import is_valid_object_id, serialize_doc
from app.utils.security import decode_token

logger = logging.getLogger("bloodconnect.socket")


def create_socket_server() -> socketio.AsyncServer:
    settings = get_settings()
    is_dev = settings["NODE_ENV"] in ("development", "test")
    # Dev: allow any origin (matches REST CORS regex); prod: explicit list
    cors_origins = "*" if is_dev else settings["CORS_ORIGINS"]
    return socketio.AsyncServer(
        async_mode="asgi",
        cors_allowed_origins=cors_origins,
        logger=False,
        engineio_logger=False,
    )


def register_socket_events(sio: socketio.AsyncServer) -> None:
    @sio.event
    async def connect(sid, environ, auth):
        token = (auth or {}).get("token")
        if not token:
            return False
        try:
            payload = decode_token(token)
            await sio.save_session(sid, {"userId": payload["id"]})
            logger.info("User connected: %s", payload["id"])
        except Exception:
            return False

    @sio.event
    async def disconnect(sid):
        session = await sio.get_session(sid)
        logger.debug("User disconnected: %s", session.get("userId"))

    @sio.on("join_chat")
    async def join_chat(sid, chat_id):
        session = await sio.get_session(sid)
        user_id = session.get("userId")
        if not is_valid_object_id(chat_id):
            await sio.emit("error", {"error": "Invalid chat ID"}, to=sid)
            return
        chat = get_db().chats.find_one({"_id": ObjectId(chat_id)})
        participants = [str(p) for p in chat.get("participants", [])] if chat else []
        if not chat or user_id not in participants:
            await sio.emit("error", {"error": "Not authorized to join this chat"}, to=sid)
            return
        await sio.enter_room(sid, chat_id)

    @sio.on("send_message")
    async def send_message(sid, data):
        session = await sio.get_session(sid)
        user_id = session.get("userId")
        chat_id = (data or {}).get("chatId")
        text = ((data or {}).get("text") or "").strip()
        if not is_valid_object_id(chat_id):
            await sio.emit("message_error", {"error": "Invalid chat ID"}, to=sid)
            return
        if not text or len(text) > 2000:
            await sio.emit("message_error", {"error": "Message must be 1-2000 characters"}, to=sid)
            return

        db = get_db()
        chat = db.chats.find_one({"_id": ObjectId(chat_id)})
        participants = [str(p) for p in chat.get("participants", [])] if chat else []
        if not chat or user_id not in participants:
            await sio.emit("message_error", {"error": "Not authorized"}, to=sid)
            return

        now = datetime.now(timezone.utc)
        message = {
            "chatId": ObjectId(chat_id),
            "senderId": ObjectId(user_id),
            "text": text,
            "read": False,
            "createdAt": now,
            "updatedAt": now,
        }
        result = db.messages.insert_one(message)
        message["_id"] = result.inserted_id
        db.chats.update_one({"_id": ObjectId(chat_id)}, {"$set": {"lastMessage": result.inserted_id, "updatedAt": now}})
        await sio.emit("receive_message", serialize_doc(message), room=chat_id)
