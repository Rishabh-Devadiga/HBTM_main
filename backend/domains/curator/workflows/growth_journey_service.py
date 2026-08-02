"""Service layer for Curator Growth Journey persistence and progress."""

from __future__ import annotations

import logging
from typing import Any

from sqlalchemy import select

from backend.database.crud import get_db_session
from backend.database.database import engine
from backend.database.models import CuratorGrowthJourney
from backend.domains.curator.agents.curator_agent import (
    _generate_deterministic_journey,
    generate_growth_journey_view,
)
from backend.domains.curator.agents.decision_agent import (
    _generate_mock_decision,
    generate_decision,
)
from backend.domains.curator.agents.planner_agent import (
    _generate_mock_growth_plan,
    generate_growth_plan,
)
from backend.domains.curator.schemas.decision import Decision
from backend.domains.curator.schemas.growth_journey import (
    CuratorGrowthJourneyResponse,
    CuratorJourneyAgentOutput,
)
from backend.domains.curator.schemas.planner import GrowthPlan
from backend.domains.curator.workflows.identity_profile_persistence_service import (
    IdentityProfilePersistenceService,
    PersistedIdentityProfile,
)
from backend.framework.agents.base_agent import TransientLLMError


logger = logging.getLogger(__name__)


class CuratorGrowthJourneyService:
    """Create, retrieve, and update persisted Curator growth journeys."""

    def __init__(
        self,
        identity_service: IdentityProfilePersistenceService | None = None,
    ) -> None:
        self.identity_service = identity_service or IdentityProfilePersistenceService()
        self._ensure_tables()

    def _ensure_tables(self) -> None:
        CuratorGrowthJourney.__table__.create(bind=engine, checkfirst=True)

    def get_growth_journey(self) -> CuratorGrowthJourneyResponse | None:
        """Return the latest persisted journey, creating it once if needed."""

        identity_record = self.identity_service.get_latest_identity_profile()
        if identity_record is None:
            return None

        existing = self._get_record(identity_record.id)
        if existing is not None:
            return self._to_response(identity_record, existing)

        return self._create_journey(identity_record)

    def get_today(self) -> CuratorGrowthJourneyResponse | None:
        """Return the current persisted journey view for today's activity."""

        return self.get_growth_journey()

    def complete_activity(self, activity_id: str) -> CuratorGrowthJourneyResponse | None:
        """Mark one activity complete and unlock the next activity."""

        identity_record = self.identity_service.get_latest_identity_profile()
        if identity_record is None:
            return None

        record = self._get_record(identity_record.id)
        if record is None:
            self._create_journey(identity_record)
            record = self._get_record(identity_record.id)
        if record is None:
            return None

        progress_json = dict(record.progress_json)
        completed_ids = list(progress_json.get("completedActivityIds", []))
        if activity_id not in completed_ids:
            completed_ids.append(activity_id)
        progress_json["completedActivityIds"] = completed_ids
        journey = self._generate_journey_view_with_fallback(
            identity_record=identity_record,
            growth_plan=GrowthPlan.model_validate(record.growth_plan_json),
            decision=Decision.model_validate(record.decision_json),
            progress_json=progress_json,
        )

        with get_db_session() as session:
            stored = session.get(CuratorGrowthJourney, record.id)
            if stored is None:
                return None
            stored.progress_json = progress_json
            stored.journey_json = journey.model_dump(mode="json")
            session.flush()
            session.refresh(stored)
            return self._to_response(identity_record, stored)

    def _generate_growth_plan_with_fallback(
        self,
        identity_profile: Any,
    ) -> GrowthPlan:
        """Generate a growth plan, falling back to a deterministic plan when Gemini fails."""

        try:
            return generate_growth_plan(identity_profile)
        except TransientLLMError:
            logger.exception(
                "Curator Planner Agent exhausted Gemini retries; using deterministic fallback."
            )
            return _generate_mock_growth_plan(identity_profile)

    def _generate_decision_with_fallback(
        self,
        identity_profile: Any,
        growth_plan: GrowthPlan,
    ) -> Decision:
        """Generate a decision, falling back to a deterministic decision when Gemini fails."""

        try:
            return generate_decision(identity_profile, growth_plan)
        except TransientLLMError:
            logger.exception(
                "Curator Decision Agent exhausted Gemini retries; using deterministic fallback."
            )
            return _generate_mock_decision(identity_profile, growth_plan)

    def _generate_journey_view_with_fallback(
        self,
        *,
        identity_record: PersistedIdentityProfile,
        growth_plan: GrowthPlan,
        decision: Decision,
        progress_json: dict[str, Any],
    ) -> CuratorJourneyAgentOutput:
        """Generate the journey view, falling back to a deterministic view when Gemini fails."""

        try:
            return generate_growth_journey_view(
                identity_profile=identity_record.profile,
                growth_plan=growth_plan,
                decision=decision,
                onboarding_json=identity_record.onboarding_json,
                progress_json=progress_json,
            )
        except TransientLLMError:
            logger.exception(
                "Curator Agent exhausted Gemini retries; using deterministic journey fallback."
            )
            return _generate_deterministic_journey(
                growth_plan=growth_plan,
                decision=decision,
                progress_json=progress_json,
            )

    def _create_journey(
        self,
        identity_record: PersistedIdentityProfile,
    ) -> CuratorGrowthJourneyResponse:
        growth_plan = self._generate_growth_plan_with_fallback(identity_record.profile)
        decision = self._generate_decision_with_fallback(identity_record.profile, growth_plan)
        progress_json: dict[str, Any] = {"completedActivityIds": []}
        journey = self._generate_journey_view_with_fallback(
            identity_record=identity_record,
            growth_plan=growth_plan,
            decision=decision,
            progress_json=progress_json,
        )
        with get_db_session() as session:
            record = CuratorGrowthJourney(
                identity_profile_id=identity_record.id,
                growth_plan_json=growth_plan.model_dump(mode="json"),
                decision_json=decision.model_dump(mode="json"),
                journey_json=journey.model_dump(mode="json"),
                progress_json=progress_json,
            )
            session.add(record)
            session.flush()
            session.refresh(record)
            return self._to_response(identity_record, record)

    def _get_record(self, identity_profile_id: int) -> CuratorGrowthJourney | None:
        with get_db_session() as session:
            statement = select(CuratorGrowthJourney).where(
                CuratorGrowthJourney.identity_profile_id == identity_profile_id
            )
            return session.scalars(statement).first()

    def _to_response(
        self,
        identity_record: PersistedIdentityProfile,
        record: CuratorGrowthJourney,
    ) -> CuratorGrowthJourneyResponse:
        journey = CuratorJourneyAgentOutput.model_validate(record.journey_json)
        completed = set(record.progress_json.get("completedActivityIds", []))
        total = sum(len(phase.activities) for phase in journey.phases)
        completed_count = sum(
            1
            for phase in journey.phases
            for activity in phase.activities
            if activity.id in completed
        )
        progress = 0 if total == 0 else round((completed_count / total) * 100)
        return CuratorGrowthJourneyResponse(
            identityProfileId=identity_record.id,
            identityProfile=identity_record.profile,
            growthPlan=GrowthPlan.model_validate(record.growth_plan_json),
            decision=Decision.model_validate(record.decision_json),
            currentPhase=journey.currentPhase,
            todayActivity=journey.todayActivity,
            dailyActivities=journey.dailyActivities,
            currentPriorities=journey.currentPriorities,
            estimatedCompletion=journey.estimatedCompletion,
            coachSummary=journey.coachSummary,
            phases=journey.phases,
            progressPercentage=progress,
        )
