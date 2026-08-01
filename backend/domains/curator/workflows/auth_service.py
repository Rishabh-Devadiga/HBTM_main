"""Curator authentication service."""

from __future__ import annotations

import hashlib
import hmac
import secrets
from dataclasses import dataclass
from datetime import datetime, timedelta

from sqlalchemy import select

from backend.database.crud import get_db_session
from backend.database.database import engine
from backend.database.models import (
    CuratorIdentityProfile,
    User,
    UserCredential,
    UserSession,
)
from backend.domains.curator.schemas.auth import AuthUser


SESSION_TTL = timedelta(days=30)


@dataclass(frozen=True)
class AuthenticatedUser:
    user: User
    onboarding_completed: bool


class CuratorAuthService:
    """Register, login, and resolve persistent Curator sessions."""

    def __init__(self) -> None:
        self._ensure_tables()

    def register(self, *, name: str, email: str, password: str) -> AuthUser:
        normalized_email = email.strip().lower()
        with get_db_session() as session:
            existing = session.scalars(
                select(User).where(User.email == normalized_email)
            ).first()
            if existing is not None:
                raise ValueError("An account with this email already exists.")
            user = User(name=name.strip(), email=normalized_email)
            session.add(user)
            session.flush()
            session.add(
                UserCredential(
                    user_id=user.id,
                    password_hash=self._hash_password(password),
                )
            )
            session.flush()
            session.refresh(user)
            return self._to_auth_user(user)

    def login(self, *, email: str, password: str) -> tuple[str, AuthUser, bool]:
        normalized_email = email.strip().lower()
        with get_db_session() as session:
            user = session.scalars(
                select(User).where(User.email == normalized_email)
            ).first()
            if user is None:
                raise ValueError("Invalid email or password.")
            credential = session.scalars(
                select(UserCredential).where(UserCredential.user_id == user.id)
            ).first()
            if credential is None or not self._verify_password(
                password,
                credential.password_hash,
            ):
                raise ValueError("Invalid email or password.")
            token = secrets.token_urlsafe(48)
            session.add(
                UserSession(
                    user_id=user.id,
                    token=token,
                    expires_at=datetime.utcnow() + SESSION_TTL,
                )
            )
            session.flush()
            return token, self._to_auth_user(user), self._has_onboarding(session, user.id)

    def authenticate_token(self, token: str | None) -> AuthenticatedUser | None:
        if not token:
            return None
        with get_db_session() as session:
            record = session.scalars(
                select(UserSession).where(UserSession.token == token)
            ).first()
            if record is None or record.expires_at < datetime.utcnow():
                return None
            user = session.get(User, record.user_id)
            if user is None:
                return None
            return AuthenticatedUser(
                user=user,
                onboarding_completed=self._has_onboarding(session, user.id),
            )

    def logout(self, token: str | None) -> None:
        if not token:
            return
        with get_db_session() as session:
            record = session.scalars(
                select(UserSession).where(UserSession.token == token)
            ).first()
            if record is not None:
                session.delete(record)

    def _has_onboarding(self, session, user_id: int) -> bool:
        return (
            session.scalars(
                select(CuratorIdentityProfile.id)
                .where(CuratorIdentityProfile.user_id == user_id)
                .limit(1)
            ).first()
            is not None
        )

    def _hash_password(self, password: str) -> str:
        salt = secrets.token_hex(16)
        digest = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            salt.encode("utf-8"),
            120_000,
        ).hex()
        return f"pbkdf2_sha256${salt}${digest}"

    def _verify_password(self, password: str, stored_hash: str) -> bool:
        try:
            algorithm, salt, digest = stored_hash.split("$", 2)
        except ValueError:
            return False
        if algorithm != "pbkdf2_sha256":
            return False
        candidate = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            salt.encode("utf-8"),
            120_000,
        ).hex()
        return hmac.compare_digest(candidate, digest)

    def _to_auth_user(self, user: User) -> AuthUser:
        return AuthUser(
            id=user.id,
            name=user.name,
            email=user.email,
            createdAt=user.created_at.isoformat(),
        )

    def _ensure_tables(self) -> None:
        for table in (User.__table__, UserCredential.__table__, UserSession.__table__):
            table.create(bind=engine, checkfirst=True)
