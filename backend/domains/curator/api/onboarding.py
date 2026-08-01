"""Curator onboarding API endpoints."""

from __future__ import annotations

import logging

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Path, status
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel, Field

from backend.api.schemas.common import ErrorResponse, SuccessResponse
from backend.domains.curator.schemas.identity import IdentityProfile
from backend.domains.curator.schemas.onboarding import (
    CuratorOnboardingRequest,
    CuratorOnboardingResponse,
)
from backend.domains.curator.workflows.identity_profile_persistence_service import (
    IdentityProfilePersistenceService,
)
from backend.domains.curator.workflows.onboarding_service import (
    CuratorOnboardingService,
)


logger = logging.getLogger(__name__)
router = APIRouter(tags=["curator"])


class CuratorIdentityProfileRecordResponse(BaseModel):
    """Persisted Curator identity profile response."""

    id: int = Field(..., gt=0)
    displayName: str
    profession: str
    identityProfile: IdentityProfile
    createdAt: datetime


def get_curator_onboarding_service() -> CuratorOnboardingService:
    """Return the Curator onboarding service dependency."""

    return CuratorOnboardingService()


def get_identity_profile_persistence_service() -> IdentityProfilePersistenceService:
    """Return the Curator identity profile persistence service dependency."""

    return IdentityProfilePersistenceService()


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
