"""Curator Growth Coach API endpoints."""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, Path, status
from fastapi.concurrency import run_in_threadpool

from backend.api.schemas.common import ErrorResponse, SuccessResponse
from backend.domains.curator.schemas.coach import (
    CuratorCoachChatResponse,
    CuratorCoachConversationResponse,
    CuratorCoachConversationsResponse,
    CuratorCoachCreateConversationRequest,
    CuratorCoachSendMessageRequest,
)
from backend.domains.curator.workflows.coach_service import CuratorCoachService
from backend.framework.agents.base_agent import TransientLLMError


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/curator/growth-coach", tags=["curator"])


def get_curator_coach_service() -> CuratorCoachService:
    """Return the Curator Growth Coach service dependency."""

    return CuratorCoachService()


@router.get(
    "/conversations",
    response_model=SuccessResponse[CuratorCoachConversationsResponse],
    status_code=status.HTTP_200_OK,
    summary="List Curator Growth Coach conversations",
    responses={
        status.HTTP_404_NOT_FOUND: {
            "model": ErrorResponse,
            "description": "No Curator identity profile has been created yet.",
        },
    },
)
async def list_curator_coach_conversations(
    service: CuratorCoachService = Depends(get_curator_coach_service),
) -> SuccessResponse[CuratorCoachConversationsResponse]:
    """Return prior conversations and dynamic prompt chips."""

    response = await run_in_threadpool(service.get_conversations)
    if response is None:
        raise _not_found("Complete Curator onboarding before opening Growth Coach.")
    return SuccessResponse(message="Growth Coach conversations retrieved.", data=response)


@router.post(
    "/conversations",
    response_model=SuccessResponse[CuratorCoachConversationsResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Create Curator Growth Coach conversation",
)
async def create_curator_coach_conversation(
    request: CuratorCoachCreateConversationRequest,
    service: CuratorCoachService = Depends(get_curator_coach_service),
) -> SuccessResponse[CuratorCoachConversationsResponse]:
    """Start a fresh conversation while retaining user context."""

    response = await run_in_threadpool(service.create_conversation, request.title)
    if response is None:
        raise _not_found("Complete Curator onboarding before starting Growth Coach.")
    return SuccessResponse(message="Growth Coach conversation created.", data=response)


@router.get(
    "/conversations/{conversation_id}",
    response_model=SuccessResponse[CuratorCoachConversationResponse],
    status_code=status.HTTP_200_OK,
    summary="Get Curator Growth Coach conversation",
)
async def get_curator_coach_conversation(
    conversation_id: int = Path(..., gt=0),
    service: CuratorCoachService = Depends(get_curator_coach_service),
) -> SuccessResponse[CuratorCoachConversationResponse]:
    """Restore one persisted Growth Coach conversation."""

    response = await run_in_threadpool(service.get_conversation, conversation_id)
    if response is None:
        raise _not_found("Growth Coach conversation not found.")
    return SuccessResponse(message="Growth Coach conversation retrieved.", data=response)


@router.post(
    "/conversations/{conversation_id}/messages",
    response_model=SuccessResponse[CuratorCoachChatResponse],
    status_code=status.HTTP_200_OK,
    summary="Send Curator Growth Coach message",
    responses={
        status.HTTP_503_SERVICE_UNAVAILABLE: {
            "model": ErrorResponse,
            "description": "The AI provider is temporarily unavailable.",
        },
    },
)
async def send_curator_coach_message(
    request: CuratorCoachSendMessageRequest,
    conversation_id: int = Path(..., gt=0),
    service: CuratorCoachService = Depends(get_curator_coach_service),
) -> SuccessResponse[CuratorCoachChatResponse]:
    """Generate and persist one Curator Agent coach response."""

    try:
        response = await run_in_threadpool(
            service.send_message,
            conversation_id=conversation_id,
            message=request.message,
        )
    except TransientLLMError as exc:
        logger.warning("Curator Growth Coach failed because Gemini is unavailable: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "message": "The AI service is temporarily unavailable. Please try again shortly.",
                "error_code": "LLM_UNAVAILABLE",
            },
        ) from exc
    if response is None:
        raise _not_found("Growth Coach conversation not found.")
    return SuccessResponse(message="Growth Coach response generated.", data=response)


def _not_found(message: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail={"message": message, "error_code": "not_found"},
    )
