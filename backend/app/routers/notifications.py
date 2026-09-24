import logging

from fastapi import APIRouter, Depends, HTTPException

from app.db import get_db
from app.dependencies import get_current_user
from app.schemas import PushTokenBody, UnregisterTokenBody

router = APIRouter(prefix="/api/notifications", tags=["notifications"])
logger = logging.getLogger("bloodconnect.notifications")


@router.post("/register-token")
def register_token(body: PushTokenBody, user=Depends(get_current_user)):
    db = get_db()
    db.pushtokens.update_one(
        {"token": body.token},
        {"$set": {"userId": user["_id"], "token": body.token, "platform": body.platform}},
        upsert=True,
    )
    logger.info("Push token registered for user %s on %s", user["_id"], body.platform)
    return {"success": True, "data": "Token registered"}


@router.delete("/unregister-token")
def unregister_token(body: UnregisterTokenBody, user=Depends(get_current_user)):
    if not body.token:
        raise HTTPException(status_code=400, detail={"success": False, "error": "Token is required"})
    get_db().pushtokens.delete_one({"token": body.token, "userId": user["_id"]})
    logger.info("Push token unregistered for user %s", user["_id"])
    return {"success": True, "data": "Token unregistered"}
