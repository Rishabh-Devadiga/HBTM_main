"""Curator onboarding workflow."""

from __future__ import annotations

from datetime import UTC, datetime

from backend.domains.curator.schemas.onboarding import (
    CuratorOnboardingRequest,
    CuratorOnboardingResponse,
)
from backend.domains.curator.agents.identity_agent import generate_identity_profile
from backend.domains.curator.workflows.identity_profile_persistence_service import (
    IdentityProfilePersistenceService,
)


class CuratorOnboardingWorkflow:
    """Validate onboarding input and generate the Curator identity profile."""

    def __init__(
        self,
        persistence_service: IdentityProfilePersistenceService | None = None,
    ) -> None:
        self.persistence_service = persistence_service or IdentityProfilePersistenceService()

    def run(self, request: CuratorOnboardingRequest) -> CuratorOnboardingResponse:
        """Validate the request and return an identity-profile response."""

        self._validate_request(request)
        identity_profile = generate_identity_profile(request)
        persisted_profile = self.persistence_service.save_identity_profile(
            onboarding=request,
            profile=identity_profile,
        )
        return CuratorOnboardingResponse(
            message="Curator onboarding completed successfully.",
            nextRoute="/curator/onboarding/success",
            submittedAt=datetime.now(UTC),
            identityProfileId=persisted_profile.id,
            identityProfile=persisted_profile.profile,
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
