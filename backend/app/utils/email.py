import logging
import smtplib
from email.message import EmailMessage

from app.config import get_settings

logger = logging.getLogger("bloodconnect.email")


def send_email(to: str, subject: str, text: str) -> None:
    settings = get_settings()
    user = settings.get("EMAIL_USER")
    password = settings.get("EMAIL_PASS")
    if not user or not password:
        logger.info("Email skipped (EMAIL_USER/EMAIL_PASS not configured)")
        return

    message = EmailMessage()
    message["From"] = user
    message["To"] = to
    message["Subject"] = subject
    message.set_content(text)

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
            smtp.login(user, password)
            smtp.send_message(message)
    except Exception as exc:
        logger.error("Sending mail failed: %s", exc)
