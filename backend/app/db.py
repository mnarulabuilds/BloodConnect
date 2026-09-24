from pymongo import ASCENDING, DESCENDING, MongoClient
from pymongo.database import Database

from app.config import get_settings

_client: MongoClient | None = None
_indexes_ensured = False


def get_client() -> MongoClient:
    global _client
    if _client is None:
        settings = get_settings()
        _client = MongoClient(settings["MONGODB_URI"])
    return _client


def get_db() -> Database:
    client = get_client()
    uri = get_settings()["MONGODB_URI"]
    db_name = uri.rsplit("/", 1)[-1].split("?")[0] or "bloodconnect"
    return client[db_name]


def ensure_indexes() -> None:
    global _indexes_ensured
    if _indexes_ensured:
        return

    db = get_db()
    db.users.create_index("email", unique=True)
    db.users.create_index([("coordinates", "2dsphere")])
    db.users.create_index([("role", ASCENDING), ("isAvailable", ASCENDING), ("nextEligibleDate", ASCENDING)])

    db.bloodrequests.create_index([("createdAt", DESCENDING)])
    db.bloodrequests.create_index("status")
    db.bloodrequests.create_index("bloodGroup")
    db.bloodrequests.create_index("requestor")

    db.chats.create_index("participants")
    db.chats.create_index([("updatedAt", DESCENDING)])
    db.messages.create_index([("chatId", ASCENDING), ("createdAt", ASCENDING)])
    db.pushtokens.create_index("token", unique=True)
    db.pushtokens.create_index("userId")

    _indexes_ensured = True


def close_client() -> None:
    global _client, _indexes_ensured
    if _client is not None:
        _client.close()
        _client = None
    _indexes_ensured = False


def set_client(client: MongoClient | None) -> None:
    global _client, _indexes_ensured
    _client = client
    _indexes_ensured = False
