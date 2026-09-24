from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, Request

from app.config import BLOOD_GROUPS
from app.db import get_db
from app.dependencies import get_optional_user
from app.rate_limit import limiter, public_api_limit
from app.services.donor_eligibility import eligible_donor_filter
from app.utils.mongo_helpers import (
    ALLOWED_DONOR_SELECT,
    default_donor_projection,
    donor_public,
)

router = APIRouter(prefix="/api/donors", tags=["donors"])

ALLOWED_SORT = {"createdAt", "name", "bloodGroup", "location"}


@router.get("/stats")
@limiter.limit(public_api_limit())
def get_donor_stats(request: Request):
    db = get_db()
    eligibility = eligible_donor_filter()
    donor_count = db.users.count_documents(eligibility)
    saved_count = db.bloodrequests.count_documents({"status": "completed"})
    pipeline = [{"$match": eligibility}, {"$group": {"_id": "$bloodGroup", "count": {"$sum": 1}}}]
    group_stats = [{"group": row["_id"], "count": row["count"]} for row in db.users.aggregate(pipeline)]
    return {"success": True, "totalDonors": donor_count, "totalSaved": saved_count, "groupStats": group_stats}


@router.get("")
@limiter.limit(public_api_limit())
def get_donors(
    request: Request,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    bloodGroup: str | None = None,
    latitude: float | None = None,
    longitude: float | None = None,
    radius: float | None = 10,
    select: str | None = None,
    sort: str | None = None,
    viewer=Depends(get_optional_user),
):
    db = get_db()
    bg = bloodGroup if bloodGroup in BLOOD_GROUPS else None
    filt = eligible_donor_filter(blood_group=bg)

    if latitude is not None and longitude is not None:
        if -90 <= latitude <= 90 and -180 <= longitude <= 180:
            filt["coordinates"] = {
                "$near": {
                    "$geometry": {"type": "Point", "coordinates": [longitude, latitude]},
                    "$maxDistance": (radius or 10) * 1000,
                }
            }

    selected_fields: set[str] | None = None
    if select:
        fields = {f.strip() for f in select.split(",") if f.strip() in ALLOWED_DONOR_SELECT}
        if fields:
            selected_fields = fields

    projection = default_donor_projection(selected_fields)

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
    include_phone = viewer is not None
    donors = [donor_public(doc, include_phone=include_phone) for doc in cursor]
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
@limiter.limit(public_api_limit())
def get_donor(donor_id: str, request: Request, viewer=Depends(get_optional_user)):
    if not ObjectId.is_valid(donor_id):
        raise HTTPException(status_code=400, detail={"success": False, "error": f"Invalid id: {donor_id}"})
    donor = get_db().users.find_one({"_id": ObjectId(donor_id)}, default_donor_projection())
    if not donor or donor.get("role") != "donor":
        raise HTTPException(status_code=404, detail={"success": False, "error": "Donor not found"})
    return {"success": True, "data": donor_public(donor, include_phone=viewer is not None)}
