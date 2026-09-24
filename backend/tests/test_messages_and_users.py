from datetime import datetime, timezone

from bson import ObjectId

from app.services.messages import persist_chat_message
from app.utils.security import create_access_token, hash_password


def _auth_header(user_id: ObjectId):
    return {"Authorization": f"Bearer {create_access_token(user_id)}"}


def test_persist_chat_message_service(mongo_client):
    uid1, uid2 = ObjectId(), ObjectId()
    mongo_client.users.insert_many(
        [
            {"_id": uid1, "email": "a@test.com", "password": "x", "name": "A", "phone": "1", "location": "L", "role": "donor"},
            {"_id": uid2, "email": "b@test.com", "password": "x", "name": "B", "phone": "1", "location": "L", "role": "donor"},
        ]
    )
    chat_id = mongo_client.chats.insert_one(
        {"participants": [uid1, uid2], "status": "active", "createdAt": datetime.now(timezone.utc), "updatedAt": datetime.now(timezone.utc)}
    ).inserted_id

    payload = persist_chat_message(str(chat_id), uid1, "Hello service")
    assert payload["text"] == "Hello service"
    assert mongo_client.messages.count_documents({"chatId": chat_id}) == 1


def test_users_me_and_delete(client, mongo_client):
    uid = ObjectId()
    mongo_client.users.insert_one(
        {
            "_id": uid,
            "name": "Me",
            "email": "me@test.com",
            "password": hash_password("Password1"),
            "phone": "1234567890",
            "location": "City",
            "role": "donor",
            "bloodGroup": "A+",
        }
    )
    me = client.get("/api/users/me", headers=_auth_header(uid))
    assert me.status_code == 200
    assert me.json()["data"]["email"] == "me@test.com"
    assert "password" not in me.json()["data"]

    deleted = client.delete("/api/users/me", headers=_auth_header(uid))
    assert deleted.status_code == 200
    assert mongo_client.users.count_documents({"_id": uid}) == 0


def test_profile_duplicate_email_rejected(client, mongo_client):
    uid1, uid2 = ObjectId(), ObjectId()
    mongo_client.users.insert_many(
        [
            {
                "_id": uid1,
                "name": "One",
                "email": "one@test.com",
                "password": hash_password("Password1"),
                "phone": "1234567890",
                "location": "City",
                "role": "donor",
                "bloodGroup": "A+",
            },
            {
                "_id": uid2,
                "name": "Two",
                "email": "two@test.com",
                "password": hash_password("Password1"),
                "phone": "1234567890",
                "location": "City",
                "role": "donor",
                "bloodGroup": "B+",
            },
        ]
    )
    res = client.put(
        "/api/users/profile",
        headers=_auth_header(uid2),
        json={"email": "one@test.com"},
    )
    assert res.status_code == 400


def test_public_request_hides_requestor_phone(client, mongo_client):
    uid = ObjectId()
    mongo_client.users.insert_one(
        {
            "_id": uid,
            "name": "Requestor",
            "email": "req@test.com",
            "password": hash_password("Password1"),
            "phone": "9999999999",
            "location": "City",
            "role": "hospital",
        }
    )
    mongo_client.bloodrequests.insert_one(
        {
            "bloodGroup": "O+",
            "hospital": "City Hospital",
            "location": "Block A",
            "contact": "8888888888",
            "status": "open",
            "requestor": uid,
            "createdAt": datetime.now(timezone.utc),
        }
    )
    res = client.get("/api/requests")
    assert res.status_code == 200
    requestor = res.json()["data"][0]["requestor"]
    assert requestor["name"] == "Requestor"
    assert "phone" not in requestor
