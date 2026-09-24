#!/usr/bin/env python3
"""Seed demo users and an open blood request for local development."""

from __future__ import annotations

import os
import sys
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv

_BACKEND_ROOT = Path(__file__).resolve().parents[1]
load_dotenv(_BACKEND_ROOT / ".env")

os.environ.setdefault("MONGODB_URI", "mongodb://127.0.0.1:27017/bloodconnect")
os.environ.setdefault("JWT_SECRET", "dev_jwt_secret_change_in_production_min_32_chars")
os.environ.setdefault("APP_ENV", "development")
os.environ.setdefault("NODE_ENV", "development")

from pymongo import MongoClient

from app.config import get_settings
from app.db import ensure_indexes, get_db
from app.utils.security import hash_password

get_settings.cache_clear()

_SEED_MONGO_TIMEOUT_MS = 3000


def main() -> None:
    settings = get_settings()
    try:
        with MongoClient(settings["MONGODB_URI"], serverSelectionTimeoutMS=_SEED_MONGO_TIMEOUT_MS) as client:
            client.admin.command("ping")
        ensure_indexes()
        db = get_db()
    except Exception as exc:
        print(
            "Could not connect to MongoDB. Start MongoDB (e.g. npm run dev:docker) or set MONGODB_URI.",
            file=sys.stderr,
        )
        print(f"Details: {exc}", file=sys.stderr)
        raise SystemExit(1) from exc

    now = datetime.now(timezone.utc)
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
                "nextEligibleDate": now,
                "createdAt": now,
            }
        },
        upsert=True,
    )
    db.users.update_one(
        {"email": "hospital@demo.local"},
        {
            "$set": {
                "name": "Demo Hospital",
                "email": "hospital@demo.local",
                "password": hash_password("Password1"),
                "phone": "0987654321",
                "location": "Demo City",
                "role": "hospital",
                "isAvailable": True,
                "isMedicalHistoryClear": True,
                "nextEligibleDate": now,
                "createdAt": now,
            }
        },
        upsert=True,
    )
    hospital = db.users.find_one({"email": "hospital@demo.local"})
    if not hospital:
        print("Failed to upsert hospital user.", file=sys.stderr)
        raise SystemExit(1)

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
                "createdAt": now,
            }
        },
        upsert=True,
    )
    print("Seeded demo accounts:")
    print("  donor@demo.local / Password1")
    print("  hospital@demo.local / Password1")


if __name__ == "__main__":
    main()
