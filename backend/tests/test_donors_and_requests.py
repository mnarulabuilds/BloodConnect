from datetime import datetime, timezone

from bson import ObjectId

from app.utils.security import hash_password, create_access_token


def _auth_header(user_id: ObjectId):
    return {"Authorization": f"Bearer {create_access_token(user_id)}"}


def test_donor_listing_and_stats(client, mongo_client):
    mongo_client.users.insert_one(
        {
            "_id": ObjectId(),
            "name": "Donor",
            "email": "d1@test.com",
            "password": hash_password("Password1"),
            "phone": "1234567890",
            "location": "City",
            "role": "donor",
            "bloodGroup": "O+",
            "isAvailable": True,
            "isMedicalHistoryClear": True,
            "nextEligibleDate": datetime.now(timezone.utc),
        }
    )
    donors = client.get("/api/donors")
    assert donors.status_code == 200
    assert donors.json()["totalCount"] >= 1

    stats = client.get("/api/donors/stats")
    assert stats.status_code == 200
    assert stats.json()["totalDonors"] >= 1


def test_requests_crud(client, mongo_client):
    user_id = ObjectId()
    mongo_client.users.insert_one(
        {
            "_id": user_id,
            "name": "Req",
            "email": "req@test.com",
            "password": hash_password("Password1"),
            "phone": "1234567890",
            "location": "City",
            "role": "hospital",
        }
    )
    created = client.post(
        "/api/requests",
        headers=_auth_header(user_id),
        json={
            "bloodGroup": "A+",
            "hospital": "City Hospital",
            "location": "Block A",
            "contact": "9999999999",
            "urgency": "Urgent",
        },
    )
    assert created.status_code == 200
    request_id = created.json()["data"]["_id"]

    listed = client.get("/api/requests")
    assert listed.status_code == 200
    assert listed.json()["count"] >= 1

    updated = client.put(
        f"/api/requests/{request_id}",
        headers=_auth_header(user_id),
        json={"status": "cancelled"},
    )
    assert updated.status_code == 200

    deleted = client.delete(f"/api/requests/{request_id}", headers=_auth_header(user_id))
    assert deleted.status_code == 200
