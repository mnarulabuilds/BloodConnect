from datetime import datetime, timezone


def eligible_donor_filter(*, blood_group: str | None = None, exclude_user_id=None) -> dict:
    filt: dict = {
        "role": "donor",
        "isAvailable": True,
        "nextEligibleDate": {"$lte": datetime.now(timezone.utc)},
        "isMedicalHistoryClear": True,
    }
    if blood_group:
        filt["bloodGroup"] = blood_group
    if exclude_user_id is not None:
        filt["_id"] = {"$ne": exclude_user_id}
    return filt
