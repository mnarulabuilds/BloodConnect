from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from pymongo import ReturnDocument

from app.db import get_db
from app.dependencies import get_current_user
from app.schemas import UpdateProfileBody
from app.services.profile import apply_profile_updates
from app.utils.mongo_helpers import user_public

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("/me")
def get_me(user=Depends(get_current_user)):
    return {"success": True, "data": user_public(user)}


@router.put("/profile")
def update_profile(body: UpdateProfileBody, user=Depends(get_current_user)):
    fields = body.model_dump(exclude_unset=True)
    update_data = apply_profile_updates(user, fields)

    db = get_db()
    unset_data: dict[str, str] = {}
    if update_data.get("role") == "hospital":
        unset_data["bloodGroup"] = ""
    update_ops: dict = {"$set": update_data}
    if unset_data:
        update_ops["$unset"] = unset_data
    updated = db.users.find_one_and_update({"_id": user["_id"]}, update_ops, return_document=ReturnDocument.AFTER)
    if not updated:
        raise HTTPException(status_code=404, detail={"success": False, "error": "User not found"})
    return {"success": True, "data": user_public(updated)}


@router.delete("/me")
def delete_account(user=Depends(get_current_user)):
    db = get_db()
    user_id = user["_id"]
    db.pushtokens.delete_many({"userId": user_id})
    db.chats.delete_many({"participants": user_id})
    db.bloodrequests.delete_many({"requestor": user_id})
    db.users.delete_one({"_id": user_id})
    return {"success": True, "data": "Account deleted successfully"}
