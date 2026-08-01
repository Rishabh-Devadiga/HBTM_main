"""Service layer for Curator onboarding."""

from __future__ import annotations

from backend.domains.curator.schemas.onboarding import (
    CuratorOnboardingRequest,
    CuratorOnboardingResponse,
)
from backend.domains.curator.workflows.onboarding_workflow import (
    CuratorOnboardingWorkflow,
)


class CuratorOnboardingService:
    """Coordinate Curator onboarding without persistence."""

    def __init__(self, workflow: CuratorOnboardingWorkflow | None = None) -> None:
        self.workflow = workflow or CuratorOnboardingWorkflow()

    def submit_onboarding(
        self,
        request: CuratorOnboardingRequest,
    ) -> CuratorOnboardingResponse:
        """Submit onboarding data to the workflow."""

        return self.workflow.run(request)
