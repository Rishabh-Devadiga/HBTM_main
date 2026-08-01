"""Curator authentication service."""

from __future__ import annotations

import hashlib
import hmac
import secrets
from dataclasses import dataclass
from datetime import datetime, timedelta

import jwt
import requests
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token
from sqlalchemy import select

from backend.database.crud import get_db_session
from backend.database.database import engine
from backend.database.models import (
    CuratorIdentityProfile,
    User,
    UserCredential,
    UserSession,
    UserSocialIdentity,
)
from backend.domains.curator.schemas.auth import AuthUser
from backend.framework.base.config import get_settings


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
            token = self._create_session_token(session, user.id)
            return token, self._to_auth_user(user), self._has_onboarding(session, user.id)

    def login_with_google(
        self,
        *,
        id_token: str | None = None,
        code: str | None = None,
    ) -> tuple[str, AuthUser, bool]:
        settings = get_settings()
        if not settings.google_client_id:
            raise ValueError("Google login is not configured.")
        token_to_verify = id_token
        if code:
            if not settings.google_client_secret:
                raise ValueError("Google login code exchange is not configured.")
            try:
                token_response = requests.post(
                    "https://oauth2.googleapis.com/token",
                    data={
                        "code": code,
                        "client_id": settings.google_client_id,
                        "client_secret": settings.google_client_secret,
                        "redirect_uri": "postmessage",
                        "grant_type": "authorization_code",
                    },
                    timeout=15,
                )
                token_response.raise_for_status()
                token_to_verify = token_response.json().get("id_token")
            except requests.RequestException as exc:
                raise ValueError("Google login code exchange failed.") from exc
        if not token_to_verify:
            raise ValueError("Google login token is required.")
        try:
            claims = google_id_token.verify_oauth2_token(
                token_to_verify,
                google_requests.Request(),
                settings.google_client_id,
            )
        except ValueError as exc:
            raise ValueError("Google login token is invalid.") from exc

        if not claims.get("email_verified"):
            raise ValueError("Google account email is not verified.")
        subject = str(claims.get("sub") or "").strip()
        email = str(claims.get("email") or "").strip().lower()
        name = str(claims.get("name") or email.split("@")[0] or "Google User").strip()
        if not subject or not email:
            raise ValueError("Google login token is missing account details.")
        return self._login_with_social_identity(
            provider="google",
            provider_subject=subject,
            email=email,
            name=name,
        )

    def login_with_apple(
        self,
        *,
        id_token: str | None,
        name: str | None = None,
    ) -> tuple[str, AuthUser, bool]:
        settings = get_settings()
        if not settings.apple_client_id:
            raise ValueError("Apple login is not configured.")
        if not id_token:
            raise ValueError("Apple login token is required.")
        try:
            jwk_client = jwt.PyJWKClient("https://appleid.apple.com/auth/keys")
            signing_key = jwk_client.get_signing_key_from_jwt(id_token)
            claims = jwt.decode(
                id_token,
                signing_key.key,
                algorithms=["RS256"],
                audience=settings.apple_client_id,
                issuer="https://appleid.apple.com",
            )
        except jwt.PyJWTError as exc:
            raise ValueError("Apple login token is invalid.") from exc

        subject = str(claims.get("sub") or "").strip()
        email = str(claims.get("email") or "").strip().lower() or None
        display_name = (name or email or "Apple User").strip()
        if not subject:
            raise ValueError("Apple login token is missing account details.")
        return self._login_with_social_identity(
            provider="apple",
            provider_subject=subject,
            email=email,
            name=display_name,
        )

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

    def _login_with_social_identity(
        self,
        *,
        provider: str,
        provider_subject: str,
        email: str | None,
        name: str,
    ) -> tuple[str, AuthUser, bool]:
        with get_db_session() as session:
            identity = session.scalars(
                select(UserSocialIdentity).where(
                    UserSocialIdentity.provider == provider,
                    UserSocialIdentity.provider_subject == provider_subject,
                )
            ).first()
            if identity is not None:
                user = session.get(User, identity.user_id)
                if user is None:
                    raise ValueError("Linked account no longer exists.")
                if email and identity.email != email:
                    identity.email = email
            else:
                user = None
                if email:
                    user = session.scalars(select(User).where(User.email == email)).first()
                if user is None:
                    user = User(name=name.strip() or "saarthi.ai Member", email=email)
                    session.add(user)
                    session.flush()
                session.add(
                    UserSocialIdentity(
                        user_id=user.id,
                        provider=provider,
                        provider_subject=provider_subject,
                        email=email,
                    )
                )
            token = self._create_session_token(session, user.id)
            return token, self._to_auth_user(user), self._has_onboarding(session, user.id)

    def _create_session_token(self, session, user_id: int) -> str:
        token = secrets.token_urlsafe(48)
        session.add(
            UserSession(
                user_id=user_id,
                token=token,
                expires_at=datetime.utcnow() + SESSION_TTL,
            )
        )
        session.flush()
        return token

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
        for table in (
            User.__table__,
            UserCredential.__table__,
            UserSocialIdentity.__table__,
            UserSession.__table__,
        ):
            table.create(bind=engine, checkfirst=True)
