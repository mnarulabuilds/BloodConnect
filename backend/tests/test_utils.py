from app.utils.mongo_helpers import is_valid_object_id, serialize_doc, user_public
from app.utils.security import hash_password, verify_password, hash_token


def test_security_helpers():
    hashed = hash_password("Password1")
    assert verify_password("Password1", hashed)
    assert not verify_password("wrong", hashed)
    assert len(hash_token("abc")) == 64


def test_mongo_helpers():
    assert is_valid_object_id("507f1f77bcf86cd799439011")
    assert not is_valid_object_id("bad")
    doc = {"_id": __import__("bson").ObjectId(), "name": "Test"}
    serialized = serialize_doc(doc)
    assert isinstance(serialized["_id"], str)
    public = user_public({**doc, "email": "a@b.com", "role": "donor"})
    assert public["id"] == serialized["_id"]
