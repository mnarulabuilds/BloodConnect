from fastapi import APIRouter, Depends, HTTPException

from app.db import get_db
from app.dependencies import get_current_user
from app.schemas import UpdateProfileBody
from app.utils.mongo_helpers import user_public

router = APIRouter(prefix="/api/users", tags=["users"])


@router.put("/profile")
def update_profile(body: UpdateProfileBody, user=Depends(get_current_user)):
    fields = body.model_dump(exclude_unset=True)
    update_data = {}
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

    if body.latitude is not None and body.longitude is not None:
        update_data["coordinates"] = {"type": "Point", "coordinates": [float(body.longitude), float(body.latitude)]}

    db = get_db()
    updated = db.users.find_one_and_update({"_id": user["_id"]}, {"$set": update_data}, return_document=True)
    if not updated:
        raise HTTPException(status_code=404, detail={"success": False, "error": "User not found"})
    return {"success": True, "data": user_public(updated)}
