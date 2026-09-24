from fastapi import HTTPException

from app.config import BLOOD_GROUPS
from app.db import get_db

MAX_AVATAR_LENGTH = 400_000


def apply_profile_updates(user: dict, fields: dict) -> dict:
    update_data: dict = {}

    for key in (
        "name",
        "email",
        "phone",
        "location",
        "avatar",
        "isAvailable",
        "lastDonationDate",
        "nextEligibleDate",
        "isMedicalHistoryClear",
        "role",
        "bloodGroup",
    ):
        if key in fields:
            update_data[key] = fields[key]

    if "email" in update_data:
        normalized = str(update_data["email"]).lower()
        existing = get_db().users.find_one({"email": normalized, "_id": {"$ne": user["_id"]}})
        if existing:
            raise HTTPException(status_code=400, detail={"success": False, "error": "Email already in use"})
        update_data["email"] = normalized

    if "role" in update_data:
        new_role = update_data["role"]
        if new_role not in ("donor", "hospital"):
            raise HTTPException(status_code=400, detail={"success": False, "error": "Invalid role"})
        blood_group = update_data.get("bloodGroup", user.get("bloodGroup"))
        if new_role == "donor" and not blood_group:
            raise HTTPException(
                status_code=400,
                detail={"success": False, "error": "Donors must specify a blood group"},
            )
        if new_role == "hospital":
            update_data.pop("bloodGroup", None)

    if "bloodGroup" in update_data and update_data["bloodGroup"] not in BLOOD_GROUPS:
        raise HTTPException(status_code=400, detail={"success": False, "error": "Invalid blood group"})

    if "avatar" in update_data:
        avatar = update_data["avatar"] or ""
        if len(avatar) > MAX_AVATAR_LENGTH:
            raise HTTPException(status_code=400, detail={"success": False, "error": "Avatar image is too large"})

    if "latitude" in fields and "longitude" in fields:
        if fields["latitude"] is not None and fields["longitude"] is not None:
            update_data["coordinates"] = {
                "type": "Point",
                "coordinates": [float(fields["longitude"]), float(fields["latitude"])],
            }

    return update_data
