import logging
from typing import Any

import httpx
from bson import ObjectId

from app.db import get_db
from app.services.donor_eligibility import eligible_donor_filter

logger = logging.getLogger("bloodconnect.push")
EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"


def send_push_notifications(push_tokens: list[str], title: str, body: str, data: dict[str, Any] | None = None) -> None:
    if not push_tokens:
        return

    messages = [
        {
            "to": token,
            "sound": "default",
            "title": title,
            "body": body,
            "data": data or {},
            "channelId": "blood-requests",
        }
        for token in push_tokens
    ]

    db = get_db()
    for i in range(0, len(messages), 100):
        chunk = messages[i : i + 100]
        try:
            response = httpx.post(
                EXPO_PUSH_URL,
                json=chunk,
                headers={"Content-Type": "application/json", "Accept": "application/json"},
                timeout=15.0,
            )
            result = response.json()
            receipts = result.get("data") or []
            invalid = []
            for idx, receipt in enumerate(receipts):
                if receipt.get("status") == "error" and receipt.get("details", {}).get("error") == "DeviceNotRegistered":
                    invalid.append(chunk[idx]["to"])
            if invalid:
                db.pushtokens.delete_many({"token": {"$in": invalid}})
        except Exception as exc:
            logger.error("Failed to send push notifications: %s", exc)


def notify_matching_donors(blood_request: dict, requestor_id: str) -> None:
    db = get_db()
    try:
        filt = eligible_donor_filter(
            blood_group=blood_request.get("bloodGroup"),
            exclude_user_id=ObjectId(requestor_id),
        )
        matching = list(db.users.find(filt, {"_id": 1}))
        if not matching:
            return

        donor_ids = [donor["_id"] for donor in matching]
        tokens = list(db.pushtokens.find({"userId": {"$in": donor_ids}}, {"token": 1}))
        push_tokens = [t["token"] for t in tokens]
        if not push_tokens:
            return

        urgency = blood_request.get("urgency", "Normal")
        emoji = "🚨" if urgency == "Critical" else "⚠️" if urgency == "Urgent" else "ℹ️"
        send_push_notifications(
            push_tokens,
            f"{emoji} {blood_request.get('bloodGroup')} Blood Needed",
            f"{urgency} request at {blood_request.get('location')}. {blood_request.get('units', 1)} unit(s) needed.",
            {
                "type": "blood_request",
                "requestId": str(blood_request.get("_id")),
                "bloodGroup": blood_request.get("bloodGroup"),
            },
        )
    except Exception as exc:
        logger.error("Failed to notify matching donors: %s", exc)
