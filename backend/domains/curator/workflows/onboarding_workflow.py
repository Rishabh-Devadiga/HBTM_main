"""Curator onboarding workflow."""

from __future__ import annotations

import logging
from datetime import UTC, datetime

from backend.domains.curator.schemas.onboarding import (
    CuratorOnboardingRequest,
    CuratorOnboardingResponse,
)
from backend.domains.curator.agents.decision_agent import (
    _generate_mock_decision,
    generate_decision,
)
from backend.domains.curator.agents.identity_agent import (
    _generate_mock_identity_profile,
    generate_identity_profile,
)
from backend.domains.curator.agents.planner_agent import (
    _generate_mock_growth_plan,
    generate_growth_plan,
)
from backend.domains.curator.workflows.identity_profile_persistence_service import (
    IdentityProfilePersistenceService,
)
from backend.framework.agents.base_agent import TransientLLMError


logger = logging.getLogger(__name__)


class CuratorOnboardingWorkflow:
    """Validate onboarding input and generate Curator personalization outputs."""

    def __init__(
        self,
        persistence_service: IdentityProfilePersistenceService | None = None,
    ) -> None:
        self.persistence_service = persistence_service or IdentityProfilePersistenceService()

    def run(self, request: CuratorOnboardingRequest) -> CuratorOnboardingResponse:
        """Validate the request and return identity and growth-plan outputs."""

        self._validate_request(request)
        identity_profile = self._generate_identity_profile(request)
        growth_plan = self._generate_growth_plan(identity_profile)
        decision = self._generate_decision(identity_profile, growth_plan)
        persisted_profile = self.persistence_service.save_identity_profile(
            onboarding=request,
            profile=identity_profile,
        )
        return CuratorOnboardingResponse(
            message="Curator onboarding completed successfully.",
            nextRoute="/dashboard",
            submittedAt=datetime.now(UTC),
            identityProfileId=persisted_profile.id,
            identityProfile=persisted_profile.profile,
            growthPlan=growth_plan,
            decision=decision,
        )

    def _validate_request(self, request: CuratorOnboardingRequest) -> None:
        """Apply cross-field validation that belongs to workflow orchestration."""

        has_interest = bool(request.curiosity.interests) or bool(
            request.curiosity.customInterest.strip()
        )
        if not has_interest:
            raise ValueError("At least one interest is required.")

        if request.availability.weeklyHours < len(request.availability.preferredDays):
            raise ValueError(
                "Weekly availability should support the selected time windows."
            )

    def _generate_identity_profile(
        self,
        request: CuratorOnboardingRequest,
    ):
        """Generate the identity profile, falling back when Gemini is unavailable."""

        try:
            return generate_identity_profile(request)
        except TransientLLMError as exc:
            logger.exception(
                "Curator Identity Agent exhausted Gemini retries/key rotation; "
                "using deterministic onboarding fallback.",
            )
            return _generate_mock_identity_profile(request)

    def _generate_growth_plan(self, identity_profile):
        """Generate the growth plan, falling back when Gemini is unavailable."""

        try:
            return generate_growth_plan(identity_profile)
        except TransientLLMError:
            logger.exception(
                "Curator Planner Agent exhausted Gemini retries/key rotation; "
                "using deterministic onboarding fallback.",
            )
            return _generate_mock_growth_plan(identity_profile)

    def _generate_decision(self, identity_profile, growth_plan):
        """Generate the decision, falling back when Gemini is unavailable."""

        try:
            return generate_decision(identity_profile, growth_plan)
        except TransientLLMError:
            logger.exception(
                "Curator Decision Agent exhausted Gemini retries/key rotation; "
                "using deterministic onboarding fallback.",
            )
            return _generate_mock_decision(identity_profile, growth_plan)
