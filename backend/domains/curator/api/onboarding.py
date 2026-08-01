"""Curator onboarding API endpoints."""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.concurrency import run_in_threadpool

from backend.api.schemas.common import ErrorResponse, SuccessResponse
from backend.domains.curator.schemas.onboarding import (
    CuratorOnboardingRequest,
    CuratorOnboardingResponse,
)
from backend.domains.curator.workflows.onboarding_service import (
    CuratorOnboardingService,
)


logger = logging.getLogger(__name__)
router = APIRouter(tags=["curator"])


def get_curator_onboarding_service() -> CuratorOnboardingService:
    """Return the Curator onboarding service dependency."""

    return CuratorOnboardingService()


@router.post(
    "/curator/onboarding",
    response_model=SuccessResponse[CuratorOnboardingResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Submit Curator onboarding",
    description=(
        "Validate Curator onboarding data and return an accepted response. "
        "This endpoint does not invoke agents or persist data."
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
    except ValueError as exc:
        logger.exception("Curator onboarding validation failed.")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": str(exc), "error_code": "bad_request"},
        ) from exc
    except Exception as exc:
        logger.exception("Unexpected Curator onboarding failure.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "message": "Failed to submit Curator onboarding.",
                "error_code": "onboarding_failed",
            },
        ) from exc

    return SuccessResponse(
        message="Curator onboarding accepted successfully.",
        data=response,
    )
