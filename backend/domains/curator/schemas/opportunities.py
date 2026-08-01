"""Schemas for Curator real-world opportunity recommendations."""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, HttpUrl, field_validator


OpportunityCategory = Literal[
    "Hackathon",
    "Internship",
    "Job",
    "Workshop",
    "Meetup",
    "Conference",
    "Community",
    "Open Source",
    "Competition",
    "Certification",
]
OpportunityMode = Literal["Online", "Offline", "Hybrid", "Unknown"]


class OpportunityCandidate(BaseModel):
    """One source-backed candidate fetched before AI ranking."""

    id: str = Field(..., min_length=6, max_length=200)
    title: str = Field(..., min_length=2, max_length=240)
    category: OpportunityCategory
    organizer: str = Field(..., min_length=1, max_length=180)
    location: str = Field(..., min_length=2, max_length=180)
    mode: OpportunityMode = "Unknown"
    date: str = Field(..., min_length=3, max_length=120)
    description: str = Field(..., min_length=10, max_length=1200)
    url: HttpUrl
    tags: list[str] = Field(default_factory=list, max_length=12)
    source: str = Field(..., min_length=2, max_length=120)
    sourceFetchedAt: datetime

    @field_validator("tags")
    @classmethod
    def _clean_tags(cls, values: list[str]) -> list[str]:
        cleaned = [value.strip() for value in values if value.strip()]
        return list(dict.fromkeys(cleaned))[:12]


class OpportunityRecommendation(BaseModel):
    """One personalized real-world opportunity."""

    id: str = Field(..., min_length=6, max_length=200)
    title: str = Field(..., min_length=2, max_length=240)
    category: OpportunityCategory
    organizer: str = Field(..., min_length=1, max_length=180)
    location: str = Field(..., min_length=2, max_length=180)
    mode: OpportunityMode = "Unknown"
    date: str = Field(..., min_length=3, max_length=120)
    description: str = Field(..., min_length=10, max_length=1200)
    relevanceScore: int = Field(..., ge=0, le=100)
    aiExplanation: str = Field(..., min_length=20, max_length=1000)
    url: HttpUrl
    tags: list[str] = Field(default_factory=list, max_length=12)
    source: str = Field(..., min_length=2, max_length=120)
    isBookmarked: bool = False
    isDismissed: bool = False

    @field_validator("tags")
    @classmethod
    def _clean_tags(cls, values: list[str]) -> list[str]:
        cleaned = [value.strip() for value in values if value.strip()]
        return list(dict.fromkeys(cleaned))[:12]


class OpportunityAgentOutput(BaseModel):
    """Structured Opportunity Agent output."""

    recommendationSummary: str = Field(..., min_length=20, max_length=1000)
    selectionReasons: list[str] = Field(..., min_length=1, max_length=8)
    opportunities: list[OpportunityRecommendation] = Field(default_factory=list)


class OpportunityFilters(BaseModel):
    """Persisted filter state used by the frontend."""

    category: OpportunityCategory | Literal["All"] = "All"
    search: str = ""
    location: str = ""
    mode: OpportunityMode | Literal["All"] = "All"


class OpportunitiesResponse(BaseModel):
    """API response for opportunity recommendations."""

    identityProfileId: int
    recommendationId: int
    generatedAt: datetime
    staleAfter: datetime
    recommendationSummary: str
    selectionReasons: list[str]
    opportunities: list[OpportunityRecommendation]
    filters: OpportunityFilters = Field(default_factory=OpportunityFilters)


class OpportunityEngagementRequest(BaseModel):
    """Bookmark or dismiss one opportunity."""

    opportunity: OpportunityRecommendation
    value: bool


class OpportunityEngagementResponse(BaseModel):
    """Persisted engagement state for one opportunity."""

    opportunityId: str
    isBookmarked: bool
    isDismissed: bool
