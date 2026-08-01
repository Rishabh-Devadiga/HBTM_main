"""Schemas for Curator identity profiling."""

from __future__ import annotations

from pydantic import BaseModel, Field, field_validator


class IdentityProfile(BaseModel):
    """Primary Curator domain object generated from onboarding."""

    current_identity: str = Field(..., min_length=8, max_length=600)
    desired_future_identity: str = Field(..., min_length=8, max_length=600)
    core_interests: list[str] = Field(..., min_length=1, max_length=12)
    growth_themes: list[str] = Field(..., min_length=1, max_length=8)
    strengths: list[str] = Field(..., min_length=1, max_length=8)
    growth_opportunities: list[str] = Field(..., min_length=1, max_length=8)
    learning_preferences: list[str] = Field(..., min_length=1, max_length=8)
    coach_preferences: list[str] = Field(..., min_length=1, max_length=8)
    available_time: str = Field(..., min_length=3, max_length=240)
    initial_personalization_summary: str = Field(..., min_length=20, max_length=1000)

    @field_validator(
        "core_interests",
        "growth_themes",
        "strengths",
        "growth_opportunities",
        "learning_preferences",
        "coach_preferences",
    )
    @classmethod
    def _clean_list_values(cls, values: list[str]) -> list[str]:
        """Normalize list values and reject empty labels."""

        cleaned_values = [value.strip() for value in values if value.strip()]
        if not cleaned_values:
            raise ValueError("At least one non-empty value is required.")
        return list(dict.fromkeys(cleaned_values))
