import os

import mongomock
import pytest

os.environ.setdefault("JWT_SECRET", "test_jwt_secret_for_unit_tests_only_32chars")
os.environ.setdefault("MONGODB_URI", "mongodb://localhost/bloodconnect_test")
os.environ.setdefault("APP_ENV", "test")
os.environ.setdefault("NODE_ENV", "test")
os.environ.setdefault("CORS_ORIGIN", "*")

from app.config import get_settings
from app import db as db_module


@pytest.fixture(autouse=True)
def mongo_client():
    get_settings.cache_clear()
    client = mongomock.MongoClient()
    db_module.set_client(client)
    db_module.ensure_indexes()
    yield client[db_module.get_db().name]
    db_module.set_client(None)
    get_settings.cache_clear()


@pytest.fixture
def client():
    from fastapi.testclient import TestClient
    from app.main import fastapi_app

    return TestClient(fastapi_app)
