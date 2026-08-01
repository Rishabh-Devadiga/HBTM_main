"""Service layer for Curator onboarding."""

from __future__ import annotations

from backend.domains.curator.schemas.onboarding import (
    CuratorOnboardingRequest,
    CuratorOnboardingResponse,
)
from backend.domains.curator.workflows.onboarding_workflow import (
    CuratorOnboardingWorkflow,
)
from backend.domains.curator.workflows.identity_profile_persistence_service import (
    IdentityProfilePersistenceService,
)


class CuratorOnboardingService:
    """Coordinate Curator onboarding without persistence."""

    def __init__(
        self,
        workflow: CuratorOnboardingWorkflow | None = None,
        user_id: int | None = None,
    ) -> None:
        self.workflow = workflow or CuratorOnboardingWorkflow()
        if user_id is not None:
            self.workflow.persistence_service = IdentityProfilePersistenceService(
                user_id=user_id
            )

    def submit_onboarding(
        self,
        request: CuratorOnboardingRequest,
    ) -> CuratorOnboardingResponse:
        """Submit onboarding data to the workflow."""

        return self.workflow.run(request)
