#!/usr/bin/env python3
"""Seed demo users and an open blood request for local development."""

from datetime import datetime, timezone

from bson import ObjectId

from app.db import ensure_indexes, get_db
from app.utils.security import hash_password


def main() -> None:
    ensure_indexes()
    db = get_db()

    hospital_id = ObjectId()
    db.users.update_one(
        {"email": "donor@demo.local"},
        {
            "$set": {
                "name": "Demo Donor",
                "email": "donor@demo.local",
                "password": hash_password("Password1"),
                "phone": "1234567890",
                "location": "Demo City",
                "role": "donor",
                "bloodGroup": "O+",
                "isAvailable": True,
                "isMedicalHistoryClear": True,
                "nextEligibleDate": datetime.now(timezone.utc),
                "createdAt": datetime.now(timezone.utc),
            }
        },
        upsert=True,
    )
    db.users.update_one(
        {"email": "hospital@demo.local"},
        {
            "$set": {
                "_id": hospital_id,
                "name": "Demo Hospital",
                "email": "hospital@demo.local",
                "password": hash_password("Password1"),
                "phone": "0987654321",
                "location": "Demo City",
                "role": "hospital",
                "isAvailable": True,
                "isMedicalHistoryClear": True,
                "nextEligibleDate": datetime.now(timezone.utc),
                "createdAt": datetime.now(timezone.utc),
            }
        },
        upsert=True,
    )
    hospital = db.users.find_one({"email": "hospital@demo.local"})
    db.bloodrequests.update_one(
        {"hospital": "Demo General", "requestor": hospital["_id"]},
        {
            "$set": {
                "patientName": "Demo Patient",
                "bloodGroup": "O+",
                "hospital": "Demo General",
                "location": "Ward 3",
                "units": 2,
                "urgency": "Urgent",
                "contact": "1112223333",
                "status": "open",
                "requestor": hospital["_id"],
                "createdAt": datetime.now(timezone.utc),
            }
        },
        upsert=True,
    )
    print("Seeded demo accounts:")
    print("  donor@demo.local / Password1")
    print("  hospital@demo.local / Password1")


if __name__ == "__main__":
    main()
