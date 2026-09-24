from pymongo import MongoClient
from pymongo.database import Database

from app.config import get_settings

_client: MongoClient | None = None


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


def close_client() -> None:
    global _client
    if _client is not None:
        _client.close()
        _client = None


def set_client(client: MongoClient | None) -> None:
    global _client
    _client = client
