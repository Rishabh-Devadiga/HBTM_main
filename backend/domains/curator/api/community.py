"""Curator community workshop API endpoints."""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.concurrency import run_in_threadpool

from backend.api.schemas.common import ErrorResponse, SuccessResponse
from backend.domains.curator.api.auth import get_current_curator_user
from backend.domains.curator.schemas.community import (
    CommunityWorkshopMembershipResponse,
    CommunityWorkshopsResponse,
)
from backend.domains.curator.workflows.auth_service import AuthenticatedUser
from backend.domains.curator.workflows.community_service import CuratorCommunityService
from backend.domains.curator.workflows.growth_journey_service import (
    CuratorGrowthJourneyService,
)
from backend.domains.curator.workflows.identity_profile_persistence_service import (
    IdentityProfilePersistenceService,
)
from backend.framework.agents.base_agent import TransientLLMError


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/curator/community", tags=["curator-community"])


def get_curator_community_service(
    auth_user: AuthenticatedUser = Depends(get_current_curator_user),
) -> CuratorCommunityService:
    """Return the Curator community service dependency."""

    identity_service = IdentityProfilePersistenceService(user_id=auth_user.user.id)
    return CuratorCommunityService(
        user_id=auth_user.user.id,
        identity_service=identity_service,
        journey_service=CuratorGrowthJourneyService(identity_service=identity_service),
    )


@router.get(
    "/workshops",
    response_model=SuccessResponse[CommunityWorkshopsResponse],
    status_code=status.HTTP_200_OK,
    summary="Get Curator community workshops",
    responses={
        status.HTTP_404_NOT_FOUND: {
            "model": ErrorResponse,
            "description": "No Curator identity profile or growth journey exists.",
        },
        status.HTTP_503_SERVICE_UNAVAILABLE: {
            "model": ErrorResponse,
            "description": "The AI provider is temporarily unavailable.",
        },
    },
)
async def get_curator_community_workshops(
    service: CuratorCommunityService = Depends(get_curator_community_service),
) -> SuccessResponse[CommunityWorkshopsResponse]:
    """Return persisted or freshly generated Community Agent workshops."""

    try:
        response = await run_in_threadpool(service.get_workshops)
    except TransientLLMError as exc:
        logger.warning("Community Agent failed because Gemini is unavailable: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "message": "The AI service is temporarily unavailable. Please try again shortly.",
                "error_code": "LLM_UNAVAILABLE",
            },
        ) from exc
    except RuntimeError as exc:
        if "Gemini API key" in str(exc):
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail={
                    "message": "Community workshops require a Gemini API key.",
                    "error_code": "COMMUNITY_SETUP_INCOMPLETE",
                },
            ) from exc
        raise
    if response is None:
        raise _not_found("Complete Curator onboarding before opening community.")
    return SuccessResponse(message="Curator community workshops retrieved.", data=response)


@router.post(
    "/workshops/{workshop_id}/join",
    response_model=SuccessResponse[CommunityWorkshopMembershipResponse],
    status_code=status.HTTP_200_OK,
    summary="Join a Curator community workshop",
)
async def join_curator_community_workshop(
    workshop_id: int,
    service: CuratorCommunityService = Depends(get_curator_community_service),
) -> SuccessResponse[CommunityWorkshopMembershipResponse]:
    """Join one persisted workshop."""

    response = await run_in_threadpool(service.join_workshop, workshop_id)
    if response is None:
        raise _not_found("Workshop was not found for your Curator profile.")
    return SuccessResponse(message="Workshop joined.", data=response)


@router.post(
    "/workshops/{workshop_id}/leave",
    response_model=SuccessResponse[CommunityWorkshopMembershipResponse],
    status_code=status.HTTP_200_OK,
    summary="Leave a Curator community workshop",
)
async def leave_curator_community_workshop(
    workshop_id: int,
    service: CuratorCommunityService = Depends(get_curator_community_service),
) -> SuccessResponse[CommunityWorkshopMembershipResponse]:
    """Leave one persisted workshop."""

    response = await run_in_threadpool(service.leave_workshop, workshop_id)
    if response is None:
        raise _not_found("Workshop was not found for your Curator profile.")
    return SuccessResponse(message="Workshop left.", data=response)


def _not_found(message: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail={"message": message, "error_code": "not_found"},
    )
