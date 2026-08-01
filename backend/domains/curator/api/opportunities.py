"""Curator opportunities API endpoints."""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.concurrency import run_in_threadpool

from backend.api.schemas.common import ErrorResponse, SuccessResponse
from backend.domains.curator.schemas.opportunities import (
    OpportunitiesResponse,
    OpportunityEngagementRequest,
    OpportunityEngagementResponse,
)
from backend.domains.curator.workflows.opportunity_service import (
    CuratorOpportunityService,
)
from backend.framework.agents.base_agent import TransientLLMError


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/curator/opportunities", tags=["curator"])


def get_curator_opportunity_service() -> CuratorOpportunityService:
    """Return the Curator opportunity service dependency."""

    return CuratorOpportunityService()


@router.get(
    "",
    response_model=SuccessResponse[OpportunitiesResponse],
    status_code=status.HTTP_200_OK,
    summary="Get Curator opportunity recommendations",
    responses={
        status.HTTP_404_NOT_FOUND: {
            "model": ErrorResponse,
            "description": "No Curator identity profile has been created yet.",
        },
        status.HTTP_503_SERVICE_UNAVAILABLE: {
            "model": ErrorResponse,
            "description": "The AI provider is temporarily unavailable.",
        },
    },
)
async def get_curator_opportunities(
    refresh: bool = Query(default=False),
    service: CuratorOpportunityService = Depends(get_curator_opportunity_service),
) -> SuccessResponse[OpportunitiesResponse]:
    """Return cached or freshly generated Curator opportunity recommendations."""

    try:
        response = await run_in_threadpool(
            service.get_opportunities,
            refresh=refresh,
        )
    except TransientLLMError as exc:
        logger.warning("Curator opportunities failed because Gemini is unavailable: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "message": "The AI service is temporarily unavailable. Please try again shortly.",
                "error_code": "LLM_UNAVAILABLE",
            },
        ) from exc
    except RuntimeError as exc:
        message = str(exc)
        if "Gemini API key" in message:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail={
                    "message": (
                        "Opportunities require a Gemini API key for ranking and "
                        "personalization."
                    ),
                    "error_code": "OPPORTUNITIES_SETUP_INCOMPLETE",
                },
            ) from exc
        raise
    if response is None:
        raise _not_found("Complete Curator onboarding before opening opportunities.")
    return SuccessResponse(message="Curator opportunities retrieved.", data=response)


@router.post(
    "/bookmark",
    response_model=SuccessResponse[OpportunityEngagementResponse],
    status_code=status.HTTP_200_OK,
    summary="Bookmark or unbookmark a Curator opportunity",
)
async def bookmark_curator_opportunity(
    request: OpportunityEngagementRequest,
    service: CuratorOpportunityService = Depends(get_curator_opportunity_service),
) -> SuccessResponse[OpportunityEngagementResponse]:
    """Persist bookmark state for one opportunity."""

    response = await run_in_threadpool(
        service.set_bookmark,
        opportunity=request.opportunity,
        bookmarked=request.value,
    )
    if response is None:
        raise _not_found("Complete Curator onboarding before bookmarking opportunities.")
    return SuccessResponse(message="Opportunity bookmark updated.", data=response)


@router.post(
    "/dismiss",
    response_model=SuccessResponse[OpportunityEngagementResponse],
    status_code=status.HTTP_200_OK,
    summary="Dismiss or restore a Curator opportunity",
)
async def dismiss_curator_opportunity(
    request: OpportunityEngagementRequest,
    service: CuratorOpportunityService = Depends(get_curator_opportunity_service),
) -> SuccessResponse[OpportunityEngagementResponse]:
    """Persist dismissed state for one opportunity."""

    response = await run_in_threadpool(
        service.set_dismissed,
        opportunity=request.opportunity,
        dismissed=request.value,
    )
    if response is None:
        raise _not_found("Complete Curator onboarding before dismissing opportunities.")
    return SuccessResponse(message="Opportunity dismissal updated.", data=response)


def _not_found(message: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail={"message": message, "error_code": "not_found"},
    )
