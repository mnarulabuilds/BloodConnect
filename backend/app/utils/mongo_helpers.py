from datetime import datetime
from typing import Any

from bson import ObjectId


def is_valid_object_id(value: str | None) -> bool:
    if not value:
        return False
    try:
        ObjectId(value)
        return True
    except Exception:
        return False


def serialize_doc(doc: dict[str, Any] | None) -> dict[str, Any] | None:
    if doc is None:
        return None
    out: dict[str, Any] = {}
    for key, value in doc.items():
        if key == "_id":
            out["_id"] = str(value)
            continue
        if isinstance(value, ObjectId):
            out[key] = str(value)
        elif isinstance(value, datetime):
            out[key] = value.isoformat()
        elif isinstance(value, dict):
            out[key] = serialize_doc(value)
        elif isinstance(value, list):
            out[key] = [
                serialize_doc(item) if isinstance(item, dict) else str(item) if isinstance(item, ObjectId) else item
                for item in value
            ]
        else:
            out[key] = value
    return out


ALLOWED_DONOR_SELECT = {
    "name",
    "bloodGroup",
    "location",
    "phone",
    "isAvailable",
    "coordinates",
    "avatar",
    "role",
    "createdAt",
}

DONOR_PUBLIC_FIELDS = (
    *ALLOWED_DONOR_SELECT,
    "lastDonationDate",
    "nextEligibleDate",
    "isMedicalHistoryClear",
)

def default_donor_projection(extra_fields: set[str] | None = None) -> dict[str, int]:
    fields = set(DONOR_PUBLIC_FIELDS)
    if extra_fields:
        fields &= extra_fields
    projection = {field: 1 for field in fields}
    projection["_id"] = 1
    return projection


def donor_public(user: dict[str, Any]) -> dict[str, Any]:
    serialized = serialize_doc(user) or {}
    return {key: serialized[key] for key in DONOR_PUBLIC_FIELDS if key in serialized} | {"_id": serialized.get("_id")}


def user_public(user: dict[str, Any]) -> dict[str, Any]:
    coords = user.get("coordinates") or {}
    coord_values = coords.get("coordinates") or [None, None]
    return {
        "id": str(user["_id"]),
        "name": user.get("name"),
        "email": user.get("email"),
        "bloodGroup": user.get("bloodGroup"),
        "role": user.get("role"),
        "phone": user.get("phone"),
        "location": user.get("location"),
        "avatar": user.get("avatar", ""),
        "isAvailable": user.get("isAvailable", True),
        "lastDonationDate": user.get("lastDonationDate"),
        "nextEligibleDate": user.get("nextEligibleDate"),
        "isMedicalHistoryClear": user.get("isMedicalHistoryClear", True),
        "latitude": coord_values[1] if len(coord_values) > 1 else None,
        "longitude": coord_values[0] if len(coord_values) > 0 else None,
    }
