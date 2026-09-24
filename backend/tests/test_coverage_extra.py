from datetime import datetime, timezone
from unittest.mock import MagicMock, patch

import pytest
from bson import ObjectId

from app.utils.email import send_email
from app.utils.push import notify_matching_donors, send_push_notifications
from app.utils.security import create_access_token, generate_reset_token, hash_password


def _auth_header(user_id: ObjectId):
    return {"Authorization": f"Bearer {create_access_token(user_id)}"}


def test_register_duplicate_email(client, mongo_client):
    payload = {
        "name": "Alice",
        "email": "dup@test.com",
        "password": "Password1",
        "phone": "1234567890",
        "location": "Delhi",
        "bloodGroup": "A+",
    }
    assert client.post("/api/auth/register", json=payload).status_code == 201
    assert client.post("/api/auth/register", json=payload).status_code == 400


def test_reset_password_flow(client, mongo_client):
    raw, hashed, expire = generate_reset_token()
    mongo_client.users.insert_one(
        {
            "_id": ObjectId(),
            "email": "reset@test.com",
            "password": hash_password("Password1"),
            "name": "R",
            "phone": "1234567890",
            "location": "X",
            "role": "donor",
            "bloodGroup": "A+",
            "resetPasswordToken": hashed,
            "resetPasswordExpire": expire,
        }
    )
    bad = client.put("/api/auth/resetpassword/badtoken", json={"password": "Password2"})
    assert bad.status_code == 400
    ok = client.put(f"/api/auth/resetpassword/{raw}", json={"password": "Password2"})
    assert ok.status_code == 200


def test_forgot_password_existing_user(client, mongo_client):
    mongo_client.users.insert_one(
        {
            "_id": ObjectId(),
            "email": "exists@test.com",
            "password": hash_password("Password1"),
            "name": "E",
            "phone": "1234567890",
            "location": "X",
            "role": "donor",
            "bloodGroup": "A+",
        }
    )
    with patch("app.routers.auth.send_email") as mocked:
        res = client.post("/api/auth/forgotpassword", json={"email": "exists@test.com"})
        assert res.status_code == 200
        mocked.assert_called_once()


def test_donor_filters_and_get(client, mongo_client):
    mongo_client.users.insert_one(
        {
            "_id": ObjectId(),
            "name": "Donor",
            "email": "filter@test.com",
            "password": hash_password("Password1"),
            "phone": "1234567890",
            "location": "City",
            "role": "donor",
            "bloodGroup": "B+",
            "isAvailable": True,
            "isMedicalHistoryClear": True,
            "nextEligibleDate": datetime.now(timezone.utc),
        }
    )
    res = client.get("/api/donors", params={"bloodGroup": "B+", "select": "name,bloodGroup", "sort": "name"})
    assert res.status_code == 200
    donor_id = res.json()["data"][0]["_id"]
    detail = client.get(f"/api/donors/{donor_id}")
    assert detail.status_code == 200
    assert "password" not in detail.json()["data"]
    assert "email" not in detail.json()["data"]
    assert client.get("/api/donors/notanid").status_code == 400
    assert client.get(f"/api/donors/{ObjectId()}").status_code == 404


def test_request_authorization(client, mongo_client):
    owner = ObjectId()
    other = ObjectId()
    mongo_client.users.insert_many(
        [
            {"_id": owner, "email": "o@test.com", "password": "x", "name": "O", "phone": "1", "location": "L", "role": "hospital"},
            {"_id": other, "email": "t@test.com", "password": "x", "name": "T", "phone": "1", "location": "L", "role": "hospital"},
        ]
    )
    req_id = mongo_client.bloodrequests.insert_one(
        {"bloodGroup": "A+", "hospital": "H", "location": "L", "contact": "1234567890", "requestor": owner, "status": "open"}
    ).inserted_id
    forbidden = client.put(
        f"/api/requests/{req_id}",
        headers=_auth_header(other),
        json={"status": "cancelled"},
    )
    assert forbidden.status_code == 403


def test_chat_authorization(client, mongo_client):
    uid = ObjectId()
    mongo_client.users.insert_one(
        {"_id": uid, "email": "chat@test.com", "password": "x", "name": "C", "phone": "1", "location": "L", "role": "donor", "bloodGroup": "A+"}
    )
    chat_id = mongo_client.chats.insert_one({"participants": [ObjectId()], "status": "active"}).inserted_id
    res = client.get(f"/api/chats/{chat_id}", headers=_auth_header(uid))
    assert res.status_code == 403


def test_refresh_invalid_token(client):
    res = client.post("/api/auth/refresh", json={"refreshToken": "invalid.token.value"})
    assert res.status_code == 401


def test_email_and_push_helpers():
    send_email("a@b.com", "subj", "body")
    with patch("app.utils.push.httpx.post") as post:
        post.return_value = MagicMock(json=lambda: {"data": []})
        send_push_notifications(["token"], "title", "body")
        post.assert_called_once()

    with patch("app.utils.push.get_db") as get_db:
        db = MagicMock()
        get_db.return_value = db
        db.users.find.return_value = [{"_id": ObjectId()}]
        db.pushtokens.find.return_value = [{"token": "ExponentPushToken[x]"}]
        notify_matching_donors({"bloodGroup": "A+", "location": "X", "urgency": "Critical", "_id": ObjectId()}, str(ObjectId()))


def test_app_error_class():
    from app.errors import AppError

    err = AppError("boom", 400, "TEST")
    assert err.status_code == 400


def test_chat_list_and_detail(client, mongo_client):
    uid1 = ObjectId()
    uid2 = ObjectId()
    mongo_client.users.insert_many(
        [
            {"_id": uid1, "email": "l1@test.com", "password": "x", "name": "L1", "phone": "1", "location": "L", "role": "donor", "bloodGroup": "A+"},
            {"_id": uid2, "email": "l2@test.com", "password": "x", "name": "L2", "phone": "1", "location": "L", "role": "donor", "bloodGroup": "A+"},
        ]
    )
    chat_id = mongo_client.chats.insert_one({"participants": [uid1, uid2], "status": "active", "updatedAt": datetime.now(timezone.utc)}).inserted_id
    listed = client.get("/api/chats", headers=_auth_header(uid1))
    assert listed.status_code == 200
    detail = client.get(f"/api/chats/{chat_id}", headers=_auth_header(uid1))
    assert detail.status_code == 200


def test_start_chat_with_request_id(client, mongo_client):
    uid1 = ObjectId()
    uid2 = ObjectId()
    req_id = ObjectId()
    mongo_client.users.insert_many(
        [
            {"_id": uid1, "email": "s1@test.com", "password": "x", "name": "S1", "phone": "1", "location": "L", "role": "donor", "bloodGroup": "A+"},
            {"_id": uid2, "email": "s2@test.com", "password": "x", "name": "S2", "phone": "1", "location": "L", "role": "donor", "bloodGroup": "A+"},
        ]
    )
    res = client.post(
        "/api/chats",
        headers=_auth_header(uid1),
        json={"recipientId": str(uid2), "bloodRequestId": str(req_id)},
    )
    assert res.status_code == 200


def test_donor_geo_query(client):
    res = client.get("/api/donors", params={"latitude": 28.6, "longitude": 77.2, "radius": 10})
    assert res.status_code == 200


def test_requests_filters(client, mongo_client):
    mongo_client.bloodrequests.insert_one(
        {"bloodGroup": "O+", "hospital": "H", "location": "L", "contact": "1234567890", "requestor": ObjectId(), "status": "open", "urgency": "Critical"}
    )
    res = client.get("/api/requests", params={"bloodGroup": "O+", "urgency": "Critical", "status": "open"})
    assert res.status_code == 200


def test_notification_missing_token(client, mongo_client):
    uid = ObjectId()
    mongo_client.users.insert_one({"_id": uid, "email": "n@test.com", "password": "x", "name": "N", "phone": "1", "location": "L", "role": "donor", "bloodGroup": "A+"})
    res = client.request("DELETE", "/api/notifications/unregister-token", headers=_auth_header(uid), json={})
    assert res.status_code == 400


def test_send_email_with_smtp(monkeypatch):
    monkeypatch.setenv("EMAIL_USER", "user@test.com")
    monkeypatch.setenv("EMAIL_PASS", "secret")
    from app.config import get_settings

    get_settings.cache_clear()
    with patch("app.utils.email.smtplib.SMTP_SSL") as smtp_cls:
        smtp = MagicMock()
        smtp_cls.return_value.__enter__.return_value = smtp
        send_email("to@test.com", "Hello", "Body")
        smtp.login.assert_called_once()
