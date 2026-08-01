"""Persistence service for Curator identity profiles."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Any

from backend.database.crud import get_db_session
from backend.database.models import CuratorIdentityProfile
from backend.domains.curator.schemas.identity import IdentityProfile
from backend.domains.curator.schemas.onboarding import CuratorOnboardingRequest


@dataclass(frozen=True)
class PersistedIdentityProfile:
    """Persisted Curator identity profile record."""

    id: int
    display_name: str
    profession: str
    profile: IdentityProfile
    onboarding_json: dict[str, Any]
    created_at: datetime


class IdentityProfilePersistenceService:
    """Persist and retrieve Curator identity profiles."""

    def save_identity_profile(
        self,
        *,
        onboarding: CuratorOnboardingRequest,
        profile: IdentityProfile,
    ) -> PersistedIdentityProfile:
        """Persist a generated identity profile and return the stored record."""

        with get_db_session() as session:
            record = CuratorIdentityProfile(
                user_id=None,
                display_name=onboarding.identity.name,
                profession=onboarding.identity.profession,
                profile_json=profile.model_dump(mode="json"),
                onboarding_json=onboarding.model_dump(mode="json"),
            )
            session.add(record)
            session.flush()
            session.refresh(record)
            return _to_persisted_profile(record)

    def get_identity_profile(self, profile_id: int) -> PersistedIdentityProfile | None:
        """Return one persisted identity profile by id."""

        with get_db_session() as session:
            record = session.get(CuratorIdentityProfile, profile_id)
            if record is None:
                return None
            return _to_persisted_profile(record)


def _to_persisted_profile(record: CuratorIdentityProfile) -> PersistedIdentityProfile:
    """Convert an ORM record into a domain persistence DTO."""

    return PersistedIdentityProfile(
        id=record.id,
        display_name=record.display_name,
        profession=record.profession,
        profile=IdentityProfile.model_validate(record.profile_json),
        onboarding_json=record.onboarding_json,
        created_at=record.created_at,
    )
