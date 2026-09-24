import logging
from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request

from app.config import get_settings
from app.rate_limit import auth_route_limit, limiter, sensitive_auth_limit
from app.dependencies import get_current_user
from app.db import get_db
from app.schemas import (
    ForgotPasswordBody,
    LoginBody,
    RefreshBody,
    RegisterBody,
    ResetPasswordBody,
)
from app.utils.email import send_email
from app.utils.mongo_helpers import user_public
from app.utils.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    generate_reset_token,
    hash_password,
    hash_token,
    verify_password,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])
logger = logging.getLogger("bloodconnect.auth")


def _token_response(user: dict, status_code: int = 200):
    access = create_access_token(user["_id"])
    refresh = create_refresh_token(user["_id"])
    get_db().users.update_one({"_id": user["_id"]}, {"$set": {"refreshToken": hash_token(refresh)}})
    return {
        "success": True,
        "accessToken": access,
        "refreshToken": refresh,
        "user": user_public(user),
    }


@router.post("/register", status_code=201)
@limiter.limit(auth_route_limit())
def register(request: Request, body: RegisterBody):
    role = "hospital" if body.role == "hospital" else "donor"
    if role == "donor" and not body.bloodGroup:
        raise HTTPException(status_code=400, detail={"success": False, "error": "Donors must specify a blood group"})

    db = get_db()
    if db.users.find_one({"email": body.email.lower()}):
        raise HTTPException(status_code=400, detail={"success": False, "error": "An account with this email already exists"})

    user_doc = {
        "name": body.name.strip(),
        "email": body.email.lower(),
        "password": hash_password(body.password),
        "location": body.location.strip(),
        "phone": body.phone,
        "role": role,
        "isAvailable": True,
        "avatar": "",
        "isMedicalHistoryClear": True,
        "nextEligibleDate": datetime.now(timezone.utc),
        "createdAt": datetime.now(timezone.utc),
    }
    if role == "donor":
        user_doc["bloodGroup"] = body.bloodGroup
    if body.latitude is not None and body.longitude is not None:
        user_doc["coordinates"] = {"type": "Point", "coordinates": [float(body.longitude), float(body.latitude)]}

    result = db.users.insert_one(user_doc)
    user_doc["_id"] = result.inserted_id
    return _token_response(user_doc, 201)


@router.post("/login")
@limiter.limit(sensitive_auth_limit())
def login(request: Request, body: LoginBody):
    user = get_db().users.find_one({"email": body.email.lower()})
    if not user or not verify_password(body.password, user["password"]):
        raise HTTPException(status_code=401, detail={"success": False, "error": "Invalid credentials"})
    return _token_response(user)


@router.post("/forgotpassword")
@limiter.limit(sensitive_auth_limit())
def forgot_password(request: Request, body: ForgotPasswordBody, background_tasks: BackgroundTasks):
    db = get_db()
    user = db.users.find_one({"email": body.email.lower()})
    if not user:
        return {"success": True, "data": "If an account with that email exists, a reset link has been sent"}

    raw, hashed, expire = generate_reset_token()
    db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"resetPasswordToken": hashed, "resetPasswordExpire": expire}},
    )

    settings = get_settings()
    if settings["NODE_ENV"] != "production":
        logger.info("Password reset token generated (dev only): %s", raw)

    reset_url = f"{settings['CLIENT_URL']}/reset-password?token={raw}"
    message = (
        "Hello,\n\nYou requested to reset your password.\n\n"
        f"Click the link below:\n\n{reset_url}\n\n"
        "This link will expire in 10 minutes.\n\nIf you didn't request this, simply ignore this email."
    )
    background_tasks.add_task(send_email, user["email"], "Password Reset", message)
    return {"success": True, "data": "If an account with that email exists, a reset link has been sent"}


@router.put("/resetpassword/{resettoken}")
@limiter.limit(sensitive_auth_limit())
def reset_password(request: Request, resettoken: str, body: ResetPasswordBody):
    hashed = __import__("hashlib").sha256(resettoken.encode("utf-8")).hexdigest()
    db = get_db()
    user = db.users.find_one({"resetPasswordToken": hashed, "resetPasswordExpire": {"$gt": datetime.now(timezone.utc)}})
    if not user:
        raise HTTPException(status_code=400, detail={"success": False, "error": "Invalid or expired token"})

    db.users.update_one(
        {"_id": user["_id"]},
        {
            "$set": {"password": hash_password(body.password)},
            "$unset": {"resetPasswordToken": "", "resetPasswordExpire": ""},
        },
    )
    return {"success": True, "data": "Password reset successful"}


@router.post("/refresh")
@limiter.limit(auth_route_limit())
def refresh_token(request: Request, body: RefreshBody):
    if not body.refreshToken:
        raise HTTPException(status_code=400, detail={"success": False, "error": "Refresh token is required"})
    try:
        decoded = decode_token(body.refreshToken)
    except Exception:
        raise HTTPException(status_code=401, detail={"success": False, "error": "Invalid or expired refresh token"})

    user = get_db().users.find_one({"_id": ObjectId(decoded["id"])})
    if not user or user.get("refreshToken") != hash_token(body.refreshToken):
        raise HTTPException(status_code=401, detail={"success": False, "error": "Invalid refresh token"})
    return _token_response(user)


@router.post("/logout")
def logout_user(user=Depends(get_current_user)):
    get_db().users.update_one({"_id": user["_id"]}, {"$unset": {"refreshToken": ""}})
    return {"success": True, "data": "Logged out successfully"}
