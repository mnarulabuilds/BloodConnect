import re
from typing import Literal

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.config import BLOOD_GROUPS

PHONE_RE = re.compile(r"^\+?[0-9]{10,15}$")


class RegisterBody(BaseModel):
    name: str = Field(min_length=2, max_length=50)
    email: EmailStr
    password: str = Field(min_length=8)
    phone: str
    location: str = Field(min_length=1)
    bloodGroup: str | None = None
    role: Literal["donor", "hospital"] | None = None
    latitude: float | None = None
    longitude: float | None = None

    @field_validator("password")
    @classmethod
    def password_strength(cls, value: str) -> str:
        if not re.search(r"[A-Z]", value):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[0-9]", value):
            raise ValueError("Password must contain at least one number")
        return value

    @field_validator("phone")
    @classmethod
    def phone_valid(cls, value: str) -> str:
        if not PHONE_RE.match(value):
            raise ValueError("Phone must be 10-15 digits")
        return value

    @field_validator("bloodGroup")
    @classmethod
    def blood_group_valid(cls, value: str | None) -> str | None:
        if value is not None and value not in BLOOD_GROUPS:
            raise ValueError("Invalid blood group")
        return value


class LoginBody(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1)


class ForgotPasswordBody(BaseModel):
    email: EmailStr


class ResetPasswordBody(BaseModel):
    password: str = Field(min_length=8)


class RefreshBody(BaseModel):
    refreshToken: str


class CreateRequestBody(BaseModel):
    patientName: str | None = Field(default=None, max_length=100)
    bloodGroup: str
    hospital: str | None = Field(default=None, max_length=200)
    location: str = Field(min_length=1)
    units: int | None = Field(default=1, ge=1, le=50)
    urgency: Literal["Normal", "Urgent", "Critical"] | None = "Normal"
    contact: str

    @field_validator("bloodGroup")
    @classmethod
    def blood_group_valid(cls, value: str) -> str:
        if value not in BLOOD_GROUPS:
            raise ValueError("Invalid blood group")
        return value

    @field_validator("contact")
    @classmethod
    def contact_valid(cls, value: str) -> str:
        if not PHONE_RE.match(value):
            raise ValueError("Contact must be 10-15 digits")
        return value


class UpdateRequestBody(BaseModel):
    status: Literal["open", "completed", "cancelled"] | None = None
    units: int | None = Field(default=None, ge=1, le=50)
    urgency: Literal["Normal", "Urgent", "Critical"] | None = None
    hospital: str | None = None
    location: str | None = None
    contact: str | None = None
    patientName: str | None = None
    donor: str | None = None


class UpdateProfileBody(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=50)
    email: EmailStr | None = None
    phone: str | None = None
    location: str | None = None
    avatar: str | None = None
    isAvailable: bool | None = None
    lastDonationDate: str | None = None
    nextEligibleDate: str | None = None
    isMedicalHistoryClear: bool | None = None
    role: Literal["donor", "hospital"] | None = None
    bloodGroup: str | None = None
    latitude: float | None = None
    longitude: float | None = None

    @field_validator("phone")
    @classmethod
    def phone_valid(cls, value: str | None) -> str | None:
        if value is not None and not PHONE_RE.match(value):
            raise ValueError("Phone must be 10-15 digits")
        return value

    @field_validator("bloodGroup")
    @classmethod
    def blood_group_valid(cls, value: str | None) -> str | None:
        if value is not None and value not in BLOOD_GROUPS:
            raise ValueError("Invalid blood group")
        return value


class StartChatBody(BaseModel):
    recipientId: str
    bloodRequestId: str | None = None


class SendMessageBody(BaseModel):
    text: str = Field(min_length=1, max_length=2000)


class PushTokenBody(BaseModel):
    token: str
    platform: Literal["ios", "android", "web"]


class UnregisterTokenBody(BaseModel):
    token: str
