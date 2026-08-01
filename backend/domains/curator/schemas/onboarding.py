"""Schemas for Curator onboarding."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field, field_validator


class CuratorIdentity(BaseModel):
    """Basic identity details captured during onboarding."""

    name: str = Field(..., min_length=2, max_length=120)
    age: int = Field(..., ge=13, le=100)
    profession: str = Field(..., min_length=2, max_length=160)


class CuratorCuriosity(BaseModel):
    """Interest and curiosity details captured during onboarding."""

    interests: list[str] = Field(default_factory=list, max_length=12)
    customInterest: str = Field(default="", max_length=160)
    curiosityPrompt: str = Field(..., min_length=8, max_length=1200)

    @field_validator("interests")
    @classmethod
    def _clean_interests(cls, values: list[str]) -> list[str]:
        """Normalize interest labels and remove empty values."""

        cleaned_values = [value.strip() for value in values if value.strip()]
        return list(dict.fromkeys(cleaned_values))


class CuratorAspirations(BaseModel):
    """Future identity and aspiration details."""

    futureIdentity: str = Field(..., min_length=8, max_length=1200)
    aspiration: str = Field(..., min_length=8, max_length=1200)
    horizon: str = Field(..., min_length=1, max_length=80)


class CuratorAvailability(BaseModel):
    """Availability and habit details."""

    weeklyHours: int = Field(..., ge=1, le=20)
    preferredDays: list[str] = Field(..., min_length=1, max_length=7)
    habitAnchor: str = Field(..., min_length=4, max_length=240)

    @field_validator("preferredDays")
    @classmethod
    def _clean_preferred_days(cls, values: list[str]) -> list[str]:
        """Normalize preferred availability labels."""

        cleaned_values = [value.strip() for value in values if value.strip()]
        return list(dict.fromkeys(cleaned_values))


class CuratorContentPreferences(BaseModel):
    """Preferred content types and depth."""

    types: list[str] = Field(..., min_length=1, max_length=12)
    depth: str = Field(..., min_length=1, max_length=80)

    @field_validator("types")
    @classmethod
    def _clean_types(cls, values: list[str]) -> list[str]:
        """Normalize content type labels."""

        cleaned_values = [value.strip() for value in values if value.strip()]
        return list(dict.fromkeys(cleaned_values))


class CuratorCoachPreferences(BaseModel):
    """Coach personality and communication preferences."""

    personality: str = Field(..., min_length=1, max_length=80)
    communicationStyle: str = Field(..., min_length=1, max_length=120)
    checkInFrequency: str = Field(..., min_length=1, max_length=80)


class CuratorOnboardingRequest(BaseModel):
    """Request payload submitted by the Curator onboarding wizard."""

    identity: CuratorIdentity
    curiosity: CuratorCuriosity
    aspirations: CuratorAspirations
    availability: CuratorAvailability
    content: CuratorContentPreferences
    coach: CuratorCoachPreferences


class CuratorOnboardingResponse(BaseModel):
    """Response returned after Curator onboarding is accepted."""

    accepted: bool = True
    status: str = "completed"
    message: str
    nextRoute: str
    submittedAt: datetime
