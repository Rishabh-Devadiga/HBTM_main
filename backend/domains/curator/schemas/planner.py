"""Schemas for Curator growth planning."""

from __future__ import annotations

from pydantic import BaseModel, Field, field_validator


class GrowthJourney(BaseModel):
    """High-level growth journey direction."""

    title: str = Field(..., min_length=4, max_length=160)
    currentStage: str = Field(..., min_length=4, max_length=240)
    destination: str = Field(..., min_length=4, max_length=240)
    estimatedDuration: str = Field(..., min_length=2, max_length=80)
    growthTheme: str = Field(..., min_length=3, max_length=160)


class GrowthMission(BaseModel):
    """Purpose and success definition for the growth plan."""

    purpose: str = Field(..., min_length=8, max_length=600)
    successDefinition: str = Field(..., min_length=8, max_length=600)


class DailyFocus(BaseModel):
    """Daily focus recommendation."""

    objective: str = Field(..., min_length=8, max_length=400)
    estimatedMinutes: int = Field(..., ge=5, le=180)


class WeeklyMilestone(BaseModel):
    """One ordered weekly milestone."""

    week: int = Field(..., ge=1, le=52)
    title: str = Field(..., min_length=4, max_length=160)
    outcome: str = Field(..., min_length=8, max_length=400)


class GrowthHabits(BaseModel):
    """Daily and weekly habit recommendations."""

    daily: list[str] = Field(..., min_length=1, max_length=8)
    weekly: list[str] = Field(..., min_length=1, max_length=8)


class CurationStrategy(BaseModel):
    """Resource and activity curation strategy."""

    recommendedMediaCategories: list[str] = Field(..., min_length=1, max_length=8)
    recommendedLearningStyle: str = Field(..., min_length=3, max_length=240)
    recommendedActivityTypes: list[str] = Field(..., min_length=1, max_length=8)


class SuccessMetrics(BaseModel):
    """Measurable indicators for growth progress."""

    indicators: list[str] = Field(..., min_length=1, max_length=10)


class GrowthPlan(BaseModel):
    """Structured growth plan generated from a Curator Identity Profile."""

    journey: GrowthJourney
    mission: GrowthMission
    dailyFocus: DailyFocus
    weeklyMilestones: list[WeeklyMilestone] = Field(..., min_length=1, max_length=12)
    habits: GrowthHabits
    curationStrategy: CurationStrategy
    reflectionPrompts: list[str] = Field(..., min_length=1, max_length=10)
    successMetrics: SuccessMetrics
    aiSummary: str = Field(..., min_length=20, max_length=1000)

    @field_validator("weeklyMilestones")
    @classmethod
    def _validate_milestone_order(
        cls,
        values: list[WeeklyMilestone],
    ) -> list[WeeklyMilestone]:
        """Ensure milestones are ordered by week."""

        weeks = [milestone.week for milestone in values]
        if weeks != sorted(weeks):
            raise ValueError("Weekly milestones must be ordered by week.")
        if len(set(weeks)) != len(weeks):
            raise ValueError("Weekly milestones cannot duplicate week numbers.")
        return values

    @field_validator("reflectionPrompts")
    @classmethod
    def _clean_reflection_prompts(cls, values: list[str]) -> list[str]:
        """Normalize reflection prompts."""

        cleaned_values = [value.strip() for value in values if value.strip()]
        if not cleaned_values:
            raise ValueError("At least one reflection prompt is required.")
        return list(dict.fromkeys(cleaned_values))
