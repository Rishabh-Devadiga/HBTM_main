"""Schemas for Curator next-focus decisions."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


RecommendedAction = Literal["learn", "practice", "reflect", "build_habit", "review"]
RecommendedResourceType = Literal["youtube", "article", "book", "podcast", "course"]
DecisionDifficulty = Literal["beginner", "intermediate", "advanced"]
DecisionPriority = Literal["low", "medium", "high"]


class Decision(BaseModel):
    """Structured next-focus decision generated from identity and growth plan."""

    currentFocus: str = Field(..., min_length=4, max_length=240)
    recommendedAction: RecommendedAction
    recommendedResourceType: RecommendedResourceType
    difficulty: DecisionDifficulty
    estimatedDurationMinutes: int = Field(..., ge=5, le=180)
    priority: DecisionPriority
    reasoning: str = Field(..., min_length=20, max_length=1000)
