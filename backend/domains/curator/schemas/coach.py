"""Schemas for Curator Growth Coach conversations."""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator


CoachMessageRole = Literal["user", "assistant"]


class CuratorCoachAgentResponse(BaseModel):
    """Structured response produced by the Curator Agent for coach chat."""

    reply: str = Field(..., min_length=20, max_length=4000)
    suggestedPrompts: list[str] = Field(default_factory=list, max_length=5)


class CuratorCoachMessageResponse(BaseModel):
    """Persisted chat message returned to the frontend."""

    id: int = Field(..., gt=0)
    role: CoachMessageRole
    content: str
    createdAt: datetime


class CuratorCoachConversationSummary(BaseModel):
    """Conversation metadata for history lists."""

    id: int = Field(..., gt=0)
    title: str
    createdAt: datetime
    updatedAt: datetime


class CuratorCoachConversationResponse(CuratorCoachConversationSummary):
    """Conversation metadata plus persisted messages."""

    messages: list[CuratorCoachMessageResponse] = Field(default_factory=list)


class CuratorCoachConversationsResponse(BaseModel):
    """Current Growth Coach conversation state."""

    identityProfileId: int
    conversations: list[CuratorCoachConversationSummary] = Field(default_factory=list)
    activeConversation: CuratorCoachConversationResponse | None = None
    suggestedPrompts: list[str] = Field(default_factory=list, max_length=5)


class CuratorCoachCreateConversationRequest(BaseModel):
    """Request to create a fresh Growth Coach conversation."""

    title: str | None = Field(default=None, max_length=255)


class CuratorCoachSendMessageRequest(BaseModel):
    """Request to send a user message to the Growth Coach."""

    message: str = Field(..., min_length=1, max_length=8000)

    @field_validator("message")
    @classmethod
    def _validate_message(cls, value: str) -> str:
        stripped_value = value.strip()
        if not stripped_value:
            raise ValueError("Message cannot be empty.")
        return stripped_value


class CuratorCoachChatResponse(BaseModel):
    """Response after a Growth Coach message is generated and persisted."""

    conversation: CuratorCoachConversationResponse
    reply: str
    suggestedPrompts: list[str] = Field(default_factory=list, max_length=5)
