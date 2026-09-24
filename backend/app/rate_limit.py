from slowapi import Limiter
from slowapi.util import get_remote_address

from app.config import get_app_env

limiter = Limiter(key_func=get_remote_address)


def _is_relaxed_env() -> bool:
    return get_app_env() in ("test", "development")


def auth_route_limit() -> str:
    return "120/minute" if _is_relaxed_env() else "10/minute"


def sensitive_auth_limit() -> str:
    return "120/minute" if _is_relaxed_env() else "5/minute"


def public_api_limit() -> str:
    return "300/minute" if _is_relaxed_env() else "60/minute"
