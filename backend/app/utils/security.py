import hashlib
import secrets
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from bson import ObjectId

from app.config import get_settings


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt(rounds=12)).decode("utf-8")


def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))


def _jwt_expires(delta_str: str) -> datetime:
    now = datetime.now(timezone.utc)
    if delta_str.endswith("m"):
        return now + timedelta(minutes=int(delta_str[:-1]))
    if delta_str.endswith("d"):
        return now + timedelta(days=int(delta_str[:-1]))
    return now + timedelta(minutes=15)


def create_access_token(user_id: ObjectId | str) -> str:
    settings = get_settings()
    exp = _jwt_expires(settings["JWT_ACCESS_EXPIRE"])
    return jwt.encode({"id": str(user_id), "exp": exp}, settings["JWT_SECRET"], algorithm="HS256")


def create_refresh_token(user_id: ObjectId | str) -> str:
    settings = get_settings()
    exp = _jwt_expires(settings["JWT_REFRESH_EXPIRE"])
    return jwt.encode(
        {"id": str(user_id), "type": "refresh", "exp": exp},
        settings["JWT_SECRET"],
        algorithm="HS256",
    )


def decode_token(token: str) -> dict:
    settings = get_settings()
    return jwt.decode(token, settings["JWT_SECRET"], algorithms=["HS256"])


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def generate_reset_token() -> tuple[str, str, datetime]:
    raw = secrets.token_hex(20)
    hashed = hashlib.sha256(raw.encode("utf-8")).hexdigest()
    expire = datetime.now(timezone.utc) + timedelta(minutes=10)
    return raw, hashed, expire
