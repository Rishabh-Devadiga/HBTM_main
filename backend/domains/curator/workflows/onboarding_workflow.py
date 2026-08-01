"""Validation-only Curator onboarding workflow."""

from __future__ import annotations

from datetime import UTC, datetime

from backend.domains.curator.schemas.onboarding import (
    CuratorOnboardingRequest,
    CuratorOnboardingResponse,
)


class CuratorOnboardingWorkflow:
    """Validate Curator onboarding input without invoking agents or persistence."""

    def run(self, request: CuratorOnboardingRequest) -> CuratorOnboardingResponse:
        """Validate the request and return a successful onboarding response."""

        self._validate_request(request)
        return CuratorOnboardingResponse(
            message="Curator onboarding completed successfully.",
            nextRoute="/curator/onboarding/success",
            submittedAt=datetime.now(UTC),
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
