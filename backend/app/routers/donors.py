from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, HTTPException, Query

from app.config import BLOOD_GROUPS
from app.db import get_db
from app.utils.mongo_helpers import serialize_doc

router = APIRouter(prefix="/api/donors", tags=["donors"])

ALLOWED_SELECT = {"name", "bloodGroup", "location", "phone", "isAvailable", "coordinates", "avatar", "role", "createdAt"}
ALLOWED_SORT = {"createdAt", "name", "bloodGroup", "location"}


@router.get("/stats")
def get_donor_stats():
    db = get_db()
    eligibility = {
        "role": "donor",
        "isAvailable": True,
        "nextEligibleDate": {"$lte": datetime.now(timezone.utc)},
        "isMedicalHistoryClear": True,
    }
    donor_count = db.users.count_documents(eligibility)
    saved_count = db.bloodrequests.count_documents({"status": "completed"})
    pipeline = [{"$match": eligibility}, {"$group": {"_id": "$bloodGroup", "count": {"$sum": 1}}}]
    group_stats = [{"group": row["_id"], "count": row["count"]} for row in db.users.aggregate(pipeline)]
    return {"success": True, "totalDonors": donor_count, "totalSaved": saved_count, "groupStats": group_stats}


@router.get("")
def get_donors(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    bloodGroup: str | None = None,
    latitude: float | None = None,
    longitude: float | None = None,
    radius: float | None = 10,
    select: str | None = None,
    sort: str | None = None,
):
    db = get_db()
    filt = {
        "role": "donor",
        "isAvailable": True,
        "nextEligibleDate": {"$lte": datetime.now(timezone.utc)},
        "isMedicalHistoryClear": True,
    }
    if bloodGroup and bloodGroup in BLOOD_GROUPS:
        filt["bloodGroup"] = bloodGroup

    if latitude is not None and longitude is not None:
        if -90 <= latitude <= 90 and -180 <= longitude <= 180:
            filt["coordinates"] = {
                "$near": {
                    "$geometry": {"type": "Point", "coordinates": [longitude, latitude]},
                    "$maxDistance": (radius or 10) * 1000,
                }
            }

    projection = None
    if select:
        fields = [f.strip() for f in select.split(",") if f.strip() in ALLOWED_SELECT]
        if fields:
            projection = {field: 1 for field in fields}
            projection["_id"] = 1

    sort_spec = [("createdAt", -1)]
    if sort:
        parsed = []
        for token in sort.split(","):
            token = token.strip()
            if not token:
                continue
            direction = -1 if token.startswith("-") else 1
            field = token.lstrip("-")
            if field in ALLOWED_SORT:
                parsed.append((field, direction))
        if parsed:
            sort_spec = parsed

    skip = (page - 1) * limit
    cursor = db.users.find(filt, projection).sort(sort_spec).skip(skip).limit(limit)
    donors = [serialize_doc(doc) for doc in cursor]
    total = db.users.count_documents(filt)
    return {
        "success": True,
        "totalCount": total,
        "totalPages": (total + limit - 1) // limit,
        "currentPage": page,
        "count": len(donors),
        "data": donors,
    }


@router.get("/{donor_id}")
def get_donor(donor_id: str):
    if not ObjectId.is_valid(donor_id):
        raise HTTPException(status_code=400, detail={"success": False, "error": f"Invalid id: {donor_id}"})
    donor = get_db().users.find_one({"_id": ObjectId(donor_id)})
    if not donor or donor.get("role") != "donor":
        raise HTTPException(status_code=404, detail={"success": False, "error": "Donor not found"})
    return {"success": True, "data": serialize_doc(donor)}
