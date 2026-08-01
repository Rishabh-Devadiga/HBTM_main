"""Service layer for Curator community workshop recommendations."""

from __future__ import annotations

import re
from datetime import datetime
from typing import Any

from sqlalchemy import func, select

from backend.database.crud import get_db_session
from backend.database.database import engine
from backend.database.models import (
    CuratorCommunityWorkshop,
    CuratorCommunityWorkshopMembership,
    CuratorIdentityProfile,
)
from backend.domains.curator.agents.community_agent import generate_community_workshops
from backend.domains.curator.schemas.community import (
    CommunityWorkshopMembershipResponse,
    CommunityWorkshopRecommendation,
    CommunityWorkshopsResponse,
)
from backend.domains.curator.schemas.growth_journey import CuratorJourneyAgentOutput
from backend.domains.curator.workflows.growth_journey_service import (
    CuratorGrowthJourneyService,
)
from backend.domains.curator.workflows.identity_profile_persistence_service import (
    IdentityProfilePersistenceService,
    PersistedIdentityProfile,
)


class CuratorCommunityService:
    """Generate, persist, and manage Curator community workshops."""

    def __init__(
        self,
        *,
        user_id: int,
        identity_service: IdentityProfilePersistenceService | None = None,
        journey_service: CuratorGrowthJourneyService | None = None,
    ) -> None:
        self.user_id = user_id
        self.identity_service = identity_service or IdentityProfilePersistenceService(
            user_id=user_id
        )
        self.journey_service = journey_service or CuratorGrowthJourneyService(
            identity_service=self.identity_service
        )
        self._ensure_tables()

    def get_workshops(self) -> CommunityWorkshopsResponse | None:
        """Return persisted workshops, generating them from real user data when needed."""

        identity_record = self.identity_service.get_latest_identity_profile()
        if identity_record is None:
            return None

        existing = self._list_workshop_records(identity_record.id)
        if existing:
            return self._to_response(identity_record.id, existing)

        journey_response = self.journey_service.get_growth_journey()
        if journey_response is None:
            return None

        growth_journey = CuratorJourneyAgentOutput(
            phases=journey_response.phases,
            currentPhase=journey_response.currentPhase,
            todayActivity=journey_response.todayActivity,
            dailyActivities=journey_response.dailyActivities,
            currentPriorities=journey_response.currentPriorities,
            estimatedCompletion=journey_response.estimatedCompletion,
            coachSummary=journey_response.coachSummary,
        )
        similar_profiles = self._similar_profiles(identity_record)
        location = self._extract_location(identity_record.onboarding_json)
        output = generate_community_workshops(
            identity_profile=identity_record.profile,
            onboarding_json=identity_record.onboarding_json,
            growth_journey=growth_journey,
            similar_profiles_json=similar_profiles,
            location=location,
        )

        context = {
            "identityProfileId": identity_record.id,
            "userId": self.user_id,
            "location": location,
            "similarProfiles": similar_profiles,
            "growthJourney": growth_journey.model_dump(mode="json"),
        }
        with get_db_session() as session:
            for workshop in output.workshops:
                session.add(
                    CuratorCommunityWorkshop(
                        identity_profile_id=identity_record.id,
                        title=workshop.title,
                        topic_goal=workshop.topicGoal,
                        scheduled_at=workshop.dateTime,
                        location=workshop.location,
                        is_online=workshop.isOnline,
                        matching_reason=workshop.matchingReason,
                        context_json=context,
                    )
                )
            session.flush()

        return self._to_response(
            identity_record.id,
            self._list_workshop_records(identity_record.id),
        )

    def join_workshop(self, workshop_id: int) -> CommunityWorkshopMembershipResponse | None:
        """Persist the current user's membership for one workshop."""

        if not self._can_access_workshop(workshop_id):
            return None
        with get_db_session() as session:
            membership = session.scalars(
                select(CuratorCommunityWorkshopMembership).where(
                    CuratorCommunityWorkshopMembership.workshop_id == workshop_id,
                    CuratorCommunityWorkshopMembership.user_id == self.user_id,
                )
            ).first()
            if membership is None:
                session.add(
                    CuratorCommunityWorkshopMembership(
                        workshop_id=workshop_id,
                        user_id=self.user_id,
                        joined=True,
                    )
                )
            else:
                membership.joined = True
                membership.updated_at = datetime.utcnow()
            session.flush()
        return CommunityWorkshopMembershipResponse(
            workshopId=workshop_id,
            participantsCount=self._participants_count(workshop_id),
            isJoined=True,
        )

    def leave_workshop(self, workshop_id: int) -> CommunityWorkshopMembershipResponse | None:
        """Mark the current user as no longer joined for one workshop."""

        if not self._can_access_workshop(workshop_id):
            return None
        with get_db_session() as session:
            membership = session.scalars(
                select(CuratorCommunityWorkshopMembership).where(
                    CuratorCommunityWorkshopMembership.workshop_id == workshop_id,
                    CuratorCommunityWorkshopMembership.user_id == self.user_id,
                )
            ).first()
            if membership is not None:
                membership.joined = False
                membership.updated_at = datetime.utcnow()
            session.flush()
        return CommunityWorkshopMembershipResponse(
            workshopId=workshop_id,
            participantsCount=self._participants_count(workshop_id),
            isJoined=False,
        )

    def _list_workshop_records(
        self,
        identity_profile_id: int,
    ) -> list[CuratorCommunityWorkshop]:
        with get_db_session() as session:
            return list(
                session.scalars(
                    select(CuratorCommunityWorkshop)
                    .where(
                        CuratorCommunityWorkshop.identity_profile_id
                        == identity_profile_id
                    )
                    .order_by(
                        CuratorCommunityWorkshop.scheduled_at.asc(),
                        CuratorCommunityWorkshop.id.asc(),
                    )
                ).all()
            )

    def _to_response(
        self,
        identity_profile_id: int,
        records: list[CuratorCommunityWorkshop],
    ) -> CommunityWorkshopsResponse:
        joined = self._joined_workshop_ids()
        counts = self._participant_counts([record.id for record in records])
        generated_at = min((record.created_at for record in records), default=None)
        return CommunityWorkshopsResponse(
            identityProfileId=identity_profile_id,
            generatedAt=generated_at,
            workshops=[
                CommunityWorkshopRecommendation(
                    id=record.id,
                    title=record.title,
                    topicGoal=record.topic_goal,
                    dateTime=record.scheduled_at,
                    location=record.location,
                    isOnline=record.is_online,
                    participantsCount=counts.get(record.id, 0),
                    matchingReason=record.matching_reason,
                    isJoined=record.id in joined,
                )
                for record in records
            ],
        )

    def _similar_profiles(self, identity_record: PersistedIdentityProfile) -> list[dict[str, Any]]:
        current_terms = self._profile_terms(identity_record)
        with get_db_session() as session:
            records = session.scalars(
                select(CuratorIdentityProfile)
                .where(CuratorIdentityProfile.id != identity_record.id)
                .order_by(CuratorIdentityProfile.created_at.desc())
                .limit(50)
            ).all()

        ranked: list[tuple[int, CuratorIdentityProfile]] = []
        for record in records:
            terms = self._profile_terms_from_json(
                record.profession,
                record.profile_json,
                record.onboarding_json,
            )
            overlap = len(current_terms.intersection(terms))
            if overlap:
                ranked.append((overlap, record))
        ranked.sort(key=lambda item: (-item[0], item[1].created_at), reverse=False)
        return [
            {
                "identityProfileId": record.id,
                "profession": record.profession,
                "interests": record.profile_json.get("core_interests", []),
                "growthThemes": record.profile_json.get("growth_themes", []),
                "desiredFutureIdentity": record.profile_json.get(
                    "desired_future_identity",
                    "",
                ),
                "availableTime": record.profile_json.get("available_time", ""),
                "location": self._extract_location(record.onboarding_json),
                "sharedSignals": score,
            }
            for score, record in ranked[:8]
        ]

    def _profile_terms(self, identity_record: PersistedIdentityProfile) -> set[str]:
        return self._profile_terms_from_json(
            identity_record.profession,
            identity_record.profile.model_dump(mode="json"),
            identity_record.onboarding_json,
        )

    def _profile_terms_from_json(
        self,
        profession: str,
        profile_json: dict[str, Any],
        onboarding_json: dict[str, Any],
    ) -> set[str]:
        values = [
            profession,
            profile_json.get("current_identity", ""),
            profile_json.get("desired_future_identity", ""),
            *profile_json.get("core_interests", []),
            *profile_json.get("growth_themes", []),
            onboarding_json.get("aspirations", {}).get("aspiration", ""),
        ]
        return {
            word.lower()
            for value in values
            for word in re.findall(r"[A-Za-z][A-Za-z0-9+#.-]{2,30}", str(value))
        }

    def _extract_location(self, onboarding_json: dict[str, Any]) -> str:
        text = str(onboarding_json)
        match = re.search(
            r"\b(?:in|from|near)\s+([A-Z][A-Za-z .-]+(?:,\s*[A-Z][A-Za-z .-]+)?)",
            text,
        )
        return match.group(1).strip() if match else ""

    def _can_access_workshop(self, workshop_id: int) -> bool:
        identity_record = self.identity_service.get_latest_identity_profile()
        if identity_record is None:
            return False
        with get_db_session() as session:
            workshop = session.get(CuratorCommunityWorkshop, workshop_id)
            return (
                workshop is not None
                and workshop.identity_profile_id == identity_record.id
            )

    def _joined_workshop_ids(self) -> set[int]:
        with get_db_session() as session:
            records = session.scalars(
                select(CuratorCommunityWorkshopMembership.workshop_id).where(
                    CuratorCommunityWorkshopMembership.user_id == self.user_id,
                    CuratorCommunityWorkshopMembership.joined.is_(True),
                )
            ).all()
            return set(records)

    def _participant_counts(self, workshop_ids: list[int]) -> dict[int, int]:
        if not workshop_ids:
            return {}
        with get_db_session() as session:
            rows = session.execute(
                select(
                    CuratorCommunityWorkshopMembership.workshop_id,
                    func.count(CuratorCommunityWorkshopMembership.id),
                )
                .where(
                    CuratorCommunityWorkshopMembership.workshop_id.in_(workshop_ids),
                    CuratorCommunityWorkshopMembership.joined.is_(True),
                )
                .group_by(CuratorCommunityWorkshopMembership.workshop_id)
            ).all()
            return {int(workshop_id): int(count) for workshop_id, count in rows}

    def _participants_count(self, workshop_id: int) -> int:
        return self._participant_counts([workshop_id]).get(workshop_id, 0)

    def _ensure_tables(self) -> None:
        for table in (
            CuratorCommunityWorkshop.__table__,
            CuratorCommunityWorkshopMembership.__table__,
        ):
            table.create(bind=engine, checkfirst=True)
