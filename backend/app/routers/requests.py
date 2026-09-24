from datetime import datetime, timedelta, timezone

from bson import ObjectId
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request

from app.db import get_db
from app.dependencies import get_current_user
from app.rate_limit import limiter, public_api_limit
from app.schemas import CreateRequestBody, UpdateRequestBody
from app.utils.mongo_helpers import is_valid_object_id, requestor_public, serialize_doc
from app.utils.push import notify_matching_donors

router = APIRouter(prefix="/api/requests", tags=["requests"])


def _serialize_public_request(doc: dict) -> dict:
    serialized = serialize_doc(doc) or {}
    requestor_id = doc.get("requestor")
    if isinstance(requestor_id, ObjectId):
        user = get_db().users.find_one({"_id": requestor_id}, {"name": 1})
        serialized["requestor"] = requestor_public(user)
    return serialized


@router.get("")
@limiter.limit(public_api_limit())
def get_requests(
    request: Request,
    page: int = 1,
    limit: int = 10,
    bloodGroup: str | None = None,
    urgency: str | None = None,
    status: str | None = None,
):
    page = max(1, page)
    limit = min(50, max(1, limit))
    filt: dict = {}
    if bloodGroup:
        filt["bloodGroup"] = bloodGroup
    if urgency:
        filt["urgency"] = urgency
    if status:
        filt["status"] = status

    db = get_db()
    skip = (page - 1) * limit
    docs = list(db.bloodrequests.find(filt).sort("createdAt", -1).skip(skip).limit(limit))
    total = db.bloodrequests.count_documents(filt)
    data = [_serialize_public_request(doc) for doc in docs]
    return {
        "success": True,
        "totalCount": total,
        "totalPages": (total + limit - 1) // limit,
        "currentPage": page,
        "count": len(data),
        "data": data,
    }


@router.post("")
def create_request(body: CreateRequestBody, background_tasks: BackgroundTasks, user=Depends(get_current_user)):
    db = get_db()
    doc = {
        "patientName": body.patientName,
        "bloodGroup": body.bloodGroup,
        "hospital": body.hospital or "General Hospital",
        "location": body.location.strip(),
        "units": body.units or 1,
        "urgency": body.urgency or "Normal",
        "contact": body.contact,
        "status": "open",
        "requestor": user["_id"],
        "createdAt": datetime.now(timezone.utc),
    }
    result = db.bloodrequests.insert_one(doc)
    doc["_id"] = result.inserted_id
    background_tasks.add_task(notify_matching_donors, doc, str(user["_id"]))
    return {"success": True, "data": serialize_doc(doc)}


@router.put("/{request_id}")
def update_request(request_id: str, body: UpdateRequestBody, user=Depends(get_current_user)):
    if not is_valid_object_id(request_id):
        raise HTTPException(status_code=400, detail={"success": False, "error": "Invalid request ID", "code": "VALIDATION_ERROR"})

    db = get_db()
    existing = db.bloodrequests.find_one({"_id": ObjectId(request_id)})
    if not existing:
        raise HTTPException(status_code=404, detail={"success": False, "error": "Request not found"})

    if str(existing.get("requestor")) != str(user["_id"]):
        raise HTTPException(status_code=403, detail={"success": False, "error": "Not authorized to update this request"})

    updates = body.model_dump(exclude_unset=True)
    if updates.get("status") == "completed":
        donor_id = updates.get("donor")
        if not donor_id or not is_valid_object_id(donor_id):
            raise HTTPException(status_code=400, detail={"success": False, "error": "Valid donor ID required to complete request"})
        next_eligible = datetime.now(timezone.utc) + timedelta(days=90)
        db.users.update_one(
            {"_id": ObjectId(donor_id)},
            {
                "$set": {
                    "lastDonationDate": datetime.now(timezone.utc),
                    "nextEligibleDate": next_eligible,
                    "isAvailable": False,
                }
            },
        )

    allowed = {"status", "units", "urgency", "hospital", "location", "contact", "patientName", "donor"}
    update_data = {k: (ObjectId(v) if k == "donor" and v else v) for k, v in updates.items() if k in allowed}
    db.bloodrequests.update_one({"_id": ObjectId(request_id)}, {"$set": update_data})
    updated = db.bloodrequests.find_one({"_id": ObjectId(request_id)})
    return {"success": True, "data": serialize_doc(updated)}


@router.delete("/{request_id}")
def delete_request(request_id: str, user=Depends(get_current_user)):
    if not is_valid_object_id(request_id):
        raise HTTPException(status_code=400, detail={"success": False, "error": "Invalid request ID", "code": "VALIDATION_ERROR"})

    db = get_db()
    existing = db.bloodrequests.find_one({"_id": ObjectId(request_id)})
    if not existing:
        raise HTTPException(status_code=404, detail={"success": False, "error": "Request not found"})

    if str(existing.get("requestor")) != str(user["_id"]):
        raise HTTPException(status_code=403, detail={"success": False, "error": "Not authorized to delete this request"})

    db.bloodrequests.delete_one({"_id": ObjectId(request_id)})
    return {"success": True, "data": {}}
