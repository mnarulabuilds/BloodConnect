from bson import ObjectId
from fastapi import Depends, HTTPException
from fastapi.responses import JSONResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from starlette.requests import Request

from app.db import get_db
from app.utils.security import decode_token

security = HTTPBearer(auto_error=False)


def get_current_user(credentials: HTTPAuthorizationCredentials | None = Depends(security)):
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=401, detail={"success": False, "error": "Not authorized to access this route"})

    try:
        payload = decode_token(credentials.credentials)
    except Exception:
        raise HTTPException(status_code=401, detail={"success": False, "error": "Not authorized to access this route"})

    user = get_db().users.find_one({"_id": ObjectId(payload["id"])})
    if not user:
        raise HTTPException(status_code=401, detail={"success": False, "error": "User no longer exists"})
    user["id"] = str(user["_id"])
    return user


def http_exception_handler(_request: Request, exc: HTTPException):
    if isinstance(exc.detail, dict):
        return JSONResponse(status_code=exc.status_code, content=exc.detail)
    return JSONResponse(status_code=exc.status_code, content={"success": False, "error": str(exc.detail)})
