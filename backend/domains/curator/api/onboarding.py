"""Curator onboarding API endpoints."""

from __future__ import annotations

import logging

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Path, status
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel, Field, field_validator

from backend.api.schemas.common import ErrorResponse, SuccessResponse
from backend.domains.learning.schemas.feedback import FeedbackReport
from backend.domains.learning.schemas.intent import LearnerIntent
from backend.domains.learning.schemas.learning_session import LearningSessionResponse
from backend.domains.learning.schemas.planner import LearningPhase, LearningPlan
from backend.domains.learning.schemas.progress import ProgressReport
from backend.domains.learning.schemas.nudge import NudgeReport
from backend.domains.curator.schemas.identity import IdentityProfile
from backend.domains.curator.schemas.growth_journey import CuratorGrowthJourneyResponse
from backend.domains.curator.schemas.onboarding import (
    CuratorOnboardingRequest,
    CuratorOnboardingResponse,
)
from backend.domains.curator.schemas.planner import GrowthPlan
from backend.domains.curator.workflows.identity_profile_persistence_service import (
    IdentityProfilePersistenceService,
    PersistedIdentityProfile,
)
from backend.domains.curator.agents.planner_agent import generate_growth_plan
from backend.domains.curator.workflows.onboarding_service import (
    CuratorOnboardingService,
)
from backend.domains.curator.workflows.growth_journey_service import (
    CuratorGrowthJourneyService,
)
from backend.framework.agents.base_agent import TransientLLMError


logger = logging.getLogger(__name__)
router = APIRouter(tags=["curator"])


class CuratorIdentityProfileRecordResponse(BaseModel):
    """Persisted Curator identity profile response."""

    id: int = Field(..., gt=0)
    displayName: str
    profession: str
    identityProfile: IdentityProfile
    createdAt: datetime


class CuratorGrowthJourneyRequest(BaseModel):
    """Request payload for generating a Curator growth journey."""

    user_name: str = Field(default="Curator Member", min_length=1, max_length=255)
    email: str | None = Field(default=None, max_length=255)
    prompt: str = Field(..., min_length=1, max_length=4000)

    @field_validator("user_name", "prompt")
    @classmethod
    def _validate_non_empty_text(cls, value: str) -> str:
        """Reject whitespace-only text fields."""

        stripped_value = value.strip()
        if not stripped_value:
            raise ValueError("Value cannot be empty.")
        return stripped_value


class CompleteJourneyActivityRequest(BaseModel):
    """Request payload for completing one Curator journey activity."""

    activityId: str = Field(..., min_length=3, max_length=120)


def get_curator_onboarding_service() -> CuratorOnboardingService:
    """Return the Curator onboarding service dependency."""

    return CuratorOnboardingService()


def get_identity_profile_persistence_service() -> IdentityProfilePersistenceService:
    """Return the Curator identity profile persistence service dependency."""

    return IdentityProfilePersistenceService()


def get_curator_growth_journey_service() -> CuratorGrowthJourneyService:
    """Return the Curator growth journey service dependency."""

    return CuratorGrowthJourneyService()


@router.post(
    "/curator/onboarding",
    response_model=SuccessResponse[CuratorOnboardingResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Submit Curator onboarding",
    description=(
        "Validate Curator onboarding data, generate personalization outputs, "
        "persist the identity profile, and return an accepted response."
    ),
    responses={
        status.HTTP_201_CREATED: {
            "description": "Curator onboarding accepted successfully."
        },
        status.HTTP_400_BAD_REQUEST: {
            "model": ErrorResponse,
            "description": "The onboarding payload is invalid.",
        },
        status.HTTP_422_UNPROCESSABLE_ENTITY: {
            "model": ErrorResponse,
            "description": "The onboarding payload failed schema validation.",
        },
        status.HTTP_500_INTERNAL_SERVER_ERROR: {
            "model": ErrorResponse,
            "description": "Unexpected onboarding failure.",
        },
    },
)
async def submit_curator_onboarding(
    request: CuratorOnboardingRequest,
    service: CuratorOnboardingService = Depends(get_curator_onboarding_service),
) -> SuccessResponse[CuratorOnboardingResponse]:
    """Submit Curator onboarding through the service layer."""

    logger.info("Received Curator onboarding request.")
    try:
        response = await run_in_threadpool(service.submit_onboarding, request)
    except TransientLLMError as exc:
        logger.warning("Curator onboarding failed because Gemini is unavailable: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "message": (
                    "The AI service is temporarily unavailable. "
                    "Please try again shortly."
                ),
                "error_code": "LLM_UNAVAILABLE",
            },
        ) from exc
    except RuntimeError as exc:
        message = str(exc)
        if "Gemini API key" in message:
            logger.warning("Curator onboarding setup is incomplete: %s", exc)
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail={
                    "message": (
                        "Curator onboarding needs MOCK_MODE=true or at least one "
                        "Gemini API key configured."
                    ),
                    "error_code": "ONBOARDING_SETUP_INCOMPLETE",
                },
            ) from exc
        raise
    except ValueError as exc:
        logger.exception("Curator onboarding validation failed.")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": str(exc), "error_code": "bad_request"},
        ) from exc
    except Exception as exc:
        logger.exception("Unexpected Curator onboarding failure.")
        raise

    return SuccessResponse(
        message="Curator onboarding accepted successfully.",
        data=response,
    )


@router.post(
    "/curator/growth-journey/session",
    response_model=SuccessResponse[LearningSessionResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Create Curator growth journey",
    description=(
        "Use the latest persisted Curator Identity Profile as Planner Agent input "
        "and return a dashboard-compatible growth journey response."
    ),
    responses={
        status.HTTP_201_CREATED: {
            "description": "Curator growth journey created successfully."
        },
        status.HTTP_404_NOT_FOUND: {
            "model": ErrorResponse,
            "description": "No Curator identity profile has been created yet.",
        },
        status.HTTP_500_INTERNAL_SERVER_ERROR: {
            "model": ErrorResponse,
            "description": "Unexpected growth journey failure.",
        },
    },
)
async def create_curator_growth_journey(
    request: CuratorGrowthJourneyRequest,
    service: IdentityProfilePersistenceService = Depends(
        get_identity_profile_persistence_service
    ),
) -> SuccessResponse[LearningSessionResponse]:
    """Create a Curator growth journey from the latest Identity Agent output."""

    logger.info("Received Curator growth journey request.")
    try:
        persisted_profile = await run_in_threadpool(service.get_latest_identity_profile)
        if persisted_profile is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "message": "Complete Curator onboarding before creating a journey.",
                    "error_code": "identity_profile_required",
                },
            )
        identity_profile = _apply_growth_prompt_to_identity_profile(
            persisted_profile.profile,
            request.prompt,
        )
        growth_plan = await run_in_threadpool(generate_growth_plan, identity_profile)
        response = _to_learning_session_response(
            persisted_profile=persisted_profile,
            prompt=request.prompt,
            growth_plan=growth_plan,
        )
    except HTTPException:
        raise
    except TransientLLMError as exc:
        logger.warning("Curator growth journey failed because Gemini is unavailable: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "message": (
                    "The AI service is temporarily unavailable. "
                    "Please try again shortly."
                ),
                "error_code": "LLM_UNAVAILABLE",
            },
        ) from exc
    except Exception as exc:
        logger.exception("Unexpected Curator growth journey failure.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "message": "Failed to create Curator growth journey.",
                "error_code": "growth_journey_failed",
            },
        ) from exc

    return SuccessResponse(
        message="Curator growth journey created successfully.",
        data=response,
    )


@router.get(
    "/curator/growth-journey",
    response_model=SuccessResponse[CuratorGrowthJourneyResponse],
    status_code=status.HTTP_200_OK,
    summary="Get Curator growth journey",
)
async def get_curator_growth_journey(
    service: CuratorGrowthJourneyService = Depends(
        get_curator_growth_journey_service
    ),
) -> SuccessResponse[CuratorGrowthJourneyResponse]:
    """Return the persisted Curator growth journey, creating it once if absent."""

    response = await run_in_threadpool(service.get_growth_journey)
    if response is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "message": "Complete Curator onboarding before opening the journey.",
                "error_code": "identity_profile_required",
            },
        )
    return SuccessResponse(message="Curator growth journey retrieved.", data=response)


@router.get(
    "/curator/growth-journey/today",
    response_model=SuccessResponse[CuratorGrowthJourneyResponse],
    status_code=status.HTTP_200_OK,
    summary="Get today's Curator journey activity",
)
async def get_curator_growth_journey_today(
    service: CuratorGrowthJourneyService = Depends(
        get_curator_growth_journey_service
    ),
) -> SuccessResponse[CuratorGrowthJourneyResponse]:
    """Return the current persisted Curator journey view."""

    response = await run_in_threadpool(service.get_today)
    if response is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "message": "Complete Curator onboarding before opening today's activity.",
                "error_code": "identity_profile_required",
            },
        )
    return SuccessResponse(message="Curator journey activity retrieved.", data=response)


@router.post(
    "/curator/growth-journey/complete",
    response_model=SuccessResponse[CuratorGrowthJourneyResponse],
    status_code=status.HTTP_200_OK,
    summary="Complete Curator journey activity",
)
async def complete_curator_growth_journey_activity(
    request: CompleteJourneyActivityRequest,
    service: CuratorGrowthJourneyService = Depends(
        get_curator_growth_journey_service
    ),
) -> SuccessResponse[CuratorGrowthJourneyResponse]:
    """Complete one activity and return the refreshed persisted journey."""

    response = await run_in_threadpool(service.complete_activity, request.activityId)
    if response is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "message": "Curator growth journey not found.",
                "error_code": "growth_journey_required",
            },
        )
    return SuccessResponse(message="Curator journey activity completed.", data=response)


@router.get(
    "/curator/identity-profiles/{profile_id}",
    response_model=SuccessResponse[CuratorIdentityProfileRecordResponse],
    status_code=status.HTTP_200_OK,
    summary="Get Curator identity profile",
    description="Retrieve one persisted Curator identity profile by id.",
    responses={
        status.HTTP_200_OK: {
            "description": "Curator identity profile retrieved successfully."
        },
        status.HTTP_404_NOT_FOUND: {
            "model": ErrorResponse,
            "description": "The requested identity profile was not found.",
        },
        status.HTTP_500_INTERNAL_SERVER_ERROR: {
            "model": ErrorResponse,
            "description": "Unexpected identity profile retrieval failure.",
        },
    },
)
async def get_curator_identity_profile(
    profile_id: int = Path(..., gt=0, description="Positive identity profile id."),
    service: IdentityProfilePersistenceService = Depends(
        get_identity_profile_persistence_service
    ),
) -> SuccessResponse[CuratorIdentityProfileRecordResponse]:
    """Retrieve a persisted Curator identity profile."""

    logger.info("Received Curator identity profile request for id=%s.", profile_id)
    try:
        record = await run_in_threadpool(service.get_identity_profile, profile_id)
    except Exception as exc:
        logger.exception("Unexpected Curator identity profile retrieval failure.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "message": "Failed to retrieve Curator identity profile.",
                "error_code": "identity_profile_retrieval_failed",
            },
        ) from exc

    if record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "message": "Curator identity profile not found.",
                "error_code": "not_found",
            },
        )

    return SuccessResponse(
        message="Curator identity profile retrieved successfully.",
        data=CuratorIdentityProfileRecordResponse(
            id=record.id,
            displayName=record.display_name,
            profession=record.profession,
            identityProfile=record.profile,
            createdAt=record.created_at,
        ),
    )


def _apply_growth_prompt_to_identity_profile(
    identity_profile: IdentityProfile,
    prompt: str,
) -> IdentityProfile:
    """Add the user's current growth goal to Planner input without rerunning identity."""

    growth_goal = prompt.strip()
    return identity_profile.model_copy(
        update={
            "growth_themes": [
                growth_goal,
                *[
                    theme
                    for theme in identity_profile.growth_themes
                    if theme.strip().lower() != growth_goal.lower()
                ],
            ],
            "initial_personalization_summary": (
                f"{identity_profile.initial_personalization_summary} "
                f"Current growth goal: {growth_goal}"
            ),
        }
    )


def _to_learning_session_response(
    *,
    persisted_profile: PersistedIdentityProfile,
    prompt: str,
    growth_plan: GrowthPlan,
) -> LearningSessionResponse:
    """Adapt a Curator GrowthPlan into the existing frontend workflow shape."""

    learning_plan = _to_learning_plan(
        persisted_profile=persisted_profile,
        prompt=prompt,
        growth_plan=growth_plan,
    )
    all_topics = [
        topic
        for phase in learning_plan.phases
        for topic in phase.recommended_topics
    ]
    next_task = growth_plan.dailyFocus.objective
    return LearningSessionResponse(
        learner_intent=LearnerIntent(
            learning_goal=prompt,
            subject=growth_plan.journey.growthTheme,
            current_skill_level=growth_plan.journey.currentStage,
            available_time=persisted_profile.profile.available_time,
            target_deadline=growth_plan.journey.estimatedDuration,
            preferred_learning_style=", ".join(
                persisted_profile.profile.learning_preferences
            ),
            is_complete=True,
            missing_information=[],
            follow_up_questions=[],
        ),
        learning_plan=learning_plan,
        progress_report=ProgressReport(
            current_phase=1,
            overall_completion_percentage=0,
            completed_topics=[],
            remaining_topics=all_topics,
            completed_milestones=[],
            next_recommended_task=next_task,
            learner_status="On Track",
            summary=growth_plan.aiSummary,
        ),
        feedback_report=FeedbackReport(
            overall_performance_assessment=growth_plan.mission.successDefinition,
            strengths=persisted_profile.profile.strengths or ["Clear growth intention"],
            areas_for_improvement=(
                persisted_profile.profile.growth_opportunities
                or ["Build a repeatable habit"]
            ),
            personalized_study_recommendations=growth_plan.habits.daily,
            motivation_message=growth_plan.mission.purpose,
            next_study_session_focus=next_task,
        ),
        nudge_report=NudgeReport(
            intervention_required=False,
            learner_status="On Track",
            nudge_type="Study Suggestion",
            personalized_message=growth_plan.aiSummary,
            recommended_action=next_task,
            urgency="Low",
        ),
        workflow_completed=True,
        current_stage="completed",
        error_message=None,
    )


def _to_learning_plan(
    *,
    persisted_profile: PersistedIdentityProfile,
    prompt: str,
    growth_plan: GrowthPlan,
) -> LearningPlan:
    """Map Curator planner output to the dashboard's existing plan model."""

    recommended_topics = [
        *growth_plan.curationStrategy.recommendedMediaCategories,
        *growth_plan.curationStrategy.recommendedActivityTypes,
    ]
    if not recommended_topics:
        recommended_topics = [growth_plan.dailyFocus.objective]

    phases = [
        LearningPhase(
            phase_number=milestone.week,
            title=milestone.title,
            objective=milestone.outcome,
            recommended_topics=recommended_topics,
            estimated_duration=f"Week {milestone.week}",
            milestones=[milestone.outcome],
            suggested_resource_categories=(
                growth_plan.curationStrategy.recommendedMediaCategories
            ),
        )
        for milestone in growth_plan.weeklyMilestones
    ]
    return LearningPlan(
        learning_goal=prompt,
        subject=growth_plan.journey.growthTheme,
        learner_level=growth_plan.journey.currentStage,
        total_available_time=persisted_profile.profile.available_time,
        target_deadline=growth_plan.journey.estimatedDuration,
        preferred_learning_style=(
            growth_plan.curationStrategy.recommendedLearningStyle
        ),
        overview=growth_plan.aiSummary,
        phases=phases,
        final_milestone=growth_plan.journey.destination,
    )
