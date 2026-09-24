import re

from starlette.middleware.cors import CORSMiddleware
from starlette.types import ASGIApp

from app.config import get_settings

# Local dev: localhost, loopback, and private LAN (Expo --host lan uses your machine IP)
DEV_ORIGIN_REGEX = (
    r"https?://("
    r"localhost|127\.0\.0\.1|\[::1\]|"
    r"192\.168\.\d{1,3}\.\d{1,3}|"
    r"10\.\d{1,3}\.\d{1,3}\.\d{1,3}|"
    r"172\.(?:1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}"
    r")(:\d+)?"
)

_DEV_ORIGIN_PATTERN = re.compile(DEV_ORIGIN_REGEX)


def is_dev_origin(origin: str | None) -> bool:
    if not origin:
        return False
    return _DEV_ORIGIN_PATTERN.fullmatch(origin) is not None


def wrap_cors(asgi_app: ASGIApp) -> ASGIApp:
    settings = get_settings()
    is_dev = settings["APP_ENV"] in ("development", "test")

    if is_dev:
        return CORSMiddleware(
            asgi_app,
            allow_origins=settings["CORS_ORIGINS"],
            allow_origin_regex=DEV_ORIGIN_REGEX,
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
            expose_headers=["*"],
            max_age=600,
        )

    return CORSMiddleware(
        asgi_app,
        allow_origins=settings["CORS_ORIGINS"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["*"],
        max_age=600,
    )
