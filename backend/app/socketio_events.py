import logging

import socketio
from bson import ObjectId

from app.config import get_settings
from app.db import get_db
from app.utils.mongo_helpers import is_valid_object_id
from app.utils.security import decode_token

logger = logging.getLogger("bloodconnect.socket")


def create_socket_server() -> socketio.AsyncServer:
    settings = get_settings()
    is_dev = settings["APP_ENV"] in ("development", "test")
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
