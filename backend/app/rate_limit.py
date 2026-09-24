import os

from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)


def _is_relaxed_env() -> bool:
    return os.getenv("NODE_ENV", "development") in ("test", "development")


def auth_route_limit() -> str:
    return "120/minute" if _is_relaxed_env() else "10/minute"


def sensitive_auth_limit() -> str:
    return "120/minute" if _is_relaxed_env() else "5/minute"
