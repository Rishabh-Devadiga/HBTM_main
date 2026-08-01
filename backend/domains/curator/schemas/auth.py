"""Curator authentication schemas."""

from __future__ import annotations

from pydantic import BaseModel, Field


class CuratorRegisterRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    username: str = Field(..., min_length=3, max_length=80, pattern=r"^[A-Za-z0-9_.-]+$")
    email: str = Field(..., min_length=3, max_length=255, pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    password: str = Field(..., min_length=8, max_length=128)


class CuratorLoginRequest(BaseModel):
    identifier: str = Field(..., min_length=3, max_length=255)
    password: str = Field(..., min_length=1, max_length=128)


class CuratorSocialLoginRequest(BaseModel):
    idToken: str | None = Field(default=None, min_length=20)
    code: str | None = Field(default=None, min_length=3)


class CuratorAppleLoginRequest(BaseModel):
    idToken: str | None = Field(default=None, min_length=20)
    code: str | None = Field(default=None, min_length=3)
    name: str | None = Field(default=None, max_length=255)


class AuthUser(BaseModel):
    id: int
    name: str
    username: str | None
    email: str | None
    avatarUrl: str | None
    createdAt: str


class CuratorProfileUpdateRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    username: str | None = Field(default=None, min_length=3, max_length=80, pattern=r"^[A-Za-z0-9_.-]+$")
    email: str | None = Field(default=None, min_length=3, max_length=255, pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    avatarUrl: str | None = Field(default=None, max_length=2000)


class CuratorPasswordUpdateRequest(BaseModel):
    currentPassword: str = Field(..., min_length=1, max_length=128)
    newPassword: str = Field(..., min_length=8, max_length=128)


class CuratorAuthResponse(BaseModel):
    token: str
    user: AuthUser
    onboardingCompleted: bool


class CuratorAuthStatusResponse(BaseModel):
    authenticated: bool
    user: AuthUser | None = None
    onboardingCompleted: bool = False


class CuratorRegisterResponse(BaseModel):
    user: AuthUser
    message: str
