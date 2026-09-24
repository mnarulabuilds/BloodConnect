import os
from functools import lru_cache

from dotenv import load_dotenv

load_dotenv()

BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]


def get_app_env() -> str:
    return os.getenv("APP_ENV") or os.getenv("NODE_ENV", "development")


def _parse_cors_origins() -> list[str]:
    raw = os.getenv("CORS_ORIGIN", "*").strip()
    if raw == "*":
        return [
            "http://localhost:8081",
            "http://127.0.0.1:8081",
            "http://localhost:19006",
            "http://127.0.0.1:19006",
        ]
    origins = [part.strip() for part in raw.split(",") if part.strip()]
    for origin in (
        "http://localhost:8081",
        "http://127.0.0.1:8081",
        "http://localhost:19006",
        "http://127.0.0.1:19006",
    ):
        if origin not in origins:
            origins.append(origin)
    return origins


@lru_cache
def get_settings():
    mongodb_uri = os.getenv("MONGODB_URI")
    jwt_secret = os.getenv("JWT_SECRET")
    app_env = get_app_env()

    if not mongodb_uri:
        raise RuntimeError("FATAL: Missing required environment variable: MONGODB_URI")
    if not jwt_secret:
        raise RuntimeError("FATAL: Missing required environment variable: JWT_SECRET")
    if app_env == "production" and len(jwt_secret) < 32:
        raise RuntimeError("FATAL: JWT_SECRET must be at least 32 characters in production")

    return {
        "PORT": int(os.getenv("PORT", "5000")),
        "MONGODB_URI": mongodb_uri,
        "JWT_SECRET": jwt_secret,
        "CORS_ORIGINS": _parse_cors_origins(),
        "APP_ENV": app_env,
        "NODE_ENV": app_env,
        "JWT_ACCESS_EXPIRE": "15m",
        "JWT_REFRESH_EXPIRE": "30d",
        "EMAIL_USER": os.getenv("EMAIL_USER"),
        "EMAIL_PASS": os.getenv("EMAIL_PASS"),
        "CLIENT_URL": os.getenv("CLIENT_URL", "http://localhost:8081"),
    }
