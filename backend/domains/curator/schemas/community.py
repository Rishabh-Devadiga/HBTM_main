"""Schemas for Curator community workshop recommendations."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class CommunityWorkshopRecommendation(BaseModel):
    """One persisted workshop returned to the frontend."""

    id: int
    title: str = Field(..., min_length=2, max_length=240)
    topicGoal: str = Field(..., min_length=2, max_length=255)
    dateTime: datetime
    location: str = Field(..., min_length=2, max_length=255)
    isOnline: bool
    participantsCount: int = Field(..., ge=0)
    matchingReason: str = Field(..., min_length=20, max_length=1200)
    isJoined: bool


class CommunityWorkshopsResponse(BaseModel):
    """API response for community workshops."""

    identityProfileId: int
    generatedAt: datetime | None
    workshops: list[CommunityWorkshopRecommendation]


class CommunityWorkshopMembershipResponse(BaseModel):
    """Join/leave state for one community workshop."""

    workshopId: int
    participantsCount: int = Field(..., ge=0)
    isJoined: bool


class CommunityAgentWorkshop(BaseModel):
    """Structured AI output for one workshop before persistence."""

    title: str = Field(..., min_length=2, max_length=240)
    topicGoal: str = Field(..., min_length=2, max_length=255)
    dateTime: datetime
    location: str = Field(..., min_length=2, max_length=255)
    isOnline: bool
    matchingReason: str = Field(..., min_length=20, max_length=1200)


class CommunityAgentOutput(BaseModel):
    """Structured Community Agent output."""

    workshops: list[CommunityAgentWorkshop] = Field(..., min_length=1, max_length=6)
