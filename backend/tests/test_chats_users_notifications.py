from datetime import datetime, timezone

from bson import ObjectId

from app.utils.security import create_access_token, hash_password


def _auth_header(user_id: ObjectId):
    return {"Authorization": f"Bearer {create_access_token(user_id)}"}


def _user(email: str, role: str = "donor"):
    uid = ObjectId()
    doc = {
        "_id": uid,
        "name": email.split("@")[0],
        "email": email,
        "password": hash_password("Password1"),
        "phone": "1234567890",
        "location": "City",
        "role": role,
        "isAvailable": True,
        "isMedicalHistoryClear": True,
        "nextEligibleDate": datetime.now(timezone.utc),
    }
    if role == "donor":
        doc["bloodGroup"] = "A+"
    return uid, doc


def test_profile_update(client, mongo_client):
    uid, doc = _user("profile@test.com")
    mongo_client.users.insert_one(doc)
    res = client.put(
        "/api/users/profile",
        headers=_auth_header(uid),
        json={"name": "Updated Name", "isAvailable": False},
    )
    assert res.status_code == 200
    assert res.json()["data"]["name"] == "Updated Name"


def test_chat_flow(client, mongo_client):
    uid1, doc1 = _user("c1@test.com")
    uid2, doc2 = _user("c2@test.com")
    mongo_client.users.insert_many([doc1, doc2])

    start = client.post(
        "/api/chats",
        headers=_auth_header(uid1),
        json={"recipientId": str(uid2)},
    )
    assert start.status_code == 200
    chat_id = start.json()["data"]["_id"]

    msg = client.post(
        f"/api/chats/{chat_id}/messages",
        headers=_auth_header(uid1),
        json={"text": "Hello"},
    )
    assert msg.status_code == 200

    messages = client.get(f"/api/chats/{chat_id}/messages", headers=_auth_header(uid1))
    assert messages.status_code == 200
    assert messages.json()["count"] == 1


def test_push_tokens(client, mongo_client):
    uid, doc = _user("push@test.com")
    mongo_client.users.insert_one(doc)
    reg = client.post(
        "/api/notifications/register-token",
        headers=_auth_header(uid),
        json={"token": "ExponentPushToken[test]", "platform": "web"},
    )
    assert reg.status_code == 200

    unreg = client.request(
        "DELETE",
        "/api/notifications/unregister-token",
        headers=_auth_header(uid),
        json={"token": "ExponentPushToken[test]"},
    )
    assert unreg.status_code == 200


def test_health(client):
    res = client.get("/health")
    assert res.status_code == 200
