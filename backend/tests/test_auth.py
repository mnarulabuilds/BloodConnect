from datetime import datetime, timezone

from bson import ObjectId

from app.utils.security import hash_password


def _create_donor(db, email="donor@test.com"):
    user_id = ObjectId()
    db.users.insert_one(
        {
            "_id": user_id,
            "name": "Donor",
            "email": email,
            "password": hash_password("Password1"),
            "phone": "1234567890",
            "location": "City",
            "role": "donor",
            "bloodGroup": "A+",
            "isAvailable": True,
            "isMedicalHistoryClear": True,
            "nextEligibleDate": datetime.now(timezone.utc),
        }
    )
    return user_id


def test_register_requires_blood_group(client):
    res = client.post(
        "/api/auth/register",
        json={
            "name": "A",
            "email": "a@test.com",
            "password": "Password1",
            "phone": "1234567890",
            "location": "X",
        },
    )
    assert res.status_code == 400


def test_register_and_login(client, mongo_client):
    res = client.post(
        "/api/auth/register",
        json={
            "name": "Alice",
            "email": "alice@test.com",
            "password": "Password1",
            "phone": "1234567890",
            "location": "Delhi",
            "bloodGroup": "A+",
        },
    )
    assert res.status_code == 201
    assert res.json()["accessToken"]

    bad = client.post("/api/auth/login", json={"email": "alice@test.com", "password": "wrong"})
    assert bad.status_code == 401

    ok = client.post("/api/auth/login", json={"email": "alice@test.com", "password": "Password1"})
    assert ok.status_code == 200
    assert ok.json()["user"]["email"] == "alice@test.com"


def test_refresh_and_logout(client, mongo_client):
    _create_donor(mongo_client, "refresh@test.com")
    login = client.post("/api/auth/login", json={"email": "refresh@test.com", "password": "Password1"})
    tokens = login.json()
    refreshed = client.post("/api/auth/refresh", json={"refreshToken": tokens["refreshToken"]})
    assert refreshed.status_code == 200

    logout = client.post(
        "/api/auth/logout",
        headers={"Authorization": f"Bearer {refreshed.json()['accessToken']}"},
    )
    assert logout.status_code == 200


def test_forgot_password_unknown_user(client):
    res = client.post("/api/auth/forgotpassword", json={"email": "missing@test.com"})
    assert res.status_code == 200
    assert res.json()["success"] is True


def test_validation_errors(client):
    res = client.post("/api/auth/register", json={})
    assert res.status_code == 400
    assert res.json()["code"] == "VALIDATION_ERROR"
