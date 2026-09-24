import logging
from contextlib import asynccontextmanager

import socketio
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import ValidationError
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.config import get_settings
from app.db import close_client, get_client, get_db
from app.dependencies import http_exception_handler
from app.routers import auth, chats, donors, notifications, requests, users
from app.socketio_events import create_socket_server, register_socket_events

logger = logging.getLogger("bloodconnect")
logging.basicConfig(level=logging.INFO)

limiter = Limiter(key_func=get_remote_address)
sio = create_socket_server()
register_socket_events(sio)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    get_client()
    logger.info("Connected to MongoDB")
    yield
    close_client()


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title="BloodConnect API", lifespan=lifespan)
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings["CORS_ORIGINS"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(_request: Request, exc: RequestValidationError):
        messages = []
        for err in exc.errors():
            msg = err.get("msg", "Validation error")
            if msg.startswith("Value error, "):
                msg = msg.replace("Value error, ", "")
            messages.append(msg)
        return JSONResponse(
            status_code=400,
            content={"success": False, "error": ", ".join(messages), "code": "VALIDATION_ERROR"},
        )

    @app.get("/health")
    def health():
        try:
            get_db().command("ping")
            db_ok = True
        except Exception:
            db_ok = False
        return JSONResponse(
            status_code=200 if db_ok else 503,
            content={
                "status": "ok" if db_ok else "degraded",
                "db": "connected" if db_ok else "disconnected",
            },
        )

    @app.get("/")
    def root():
        return {"message": "Welcome to BloodConnect API"}

    app.include_router(auth.router)
    app.include_router(donors.router)
    app.include_router(requests.router)
    app.include_router(users.router)
    app.include_router(chats.router)
    app.include_router(notifications.router)

    return app


fastapi_app = create_app()
combined_app = socketio.ASGIApp(sio, other_asgi_app=fastapi_app)
