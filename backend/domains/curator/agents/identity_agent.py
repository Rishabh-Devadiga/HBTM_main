"""Identity Agent for generating Curator identity profiles."""

from __future__ import annotations

from crewai import Agent

from backend.domains.curator.prompts import load_prompt_block
from backend.domains.curator.schemas.identity import IdentityProfile
from backend.domains.curator.schemas.onboarding import CuratorOnboardingRequest
from backend.framework.agents.base_agent import create_base_agent, run_structured_agent
from backend.framework.base.config import get_settings


IDENTITY_AGENT_ROLE = load_prompt_block("identity.md", "role")
IDENTITY_AGENT_GOAL = load_prompt_block("identity.md", "goal")
IDENTITY_AGENT_BACKSTORY = load_prompt_block("identity.md", "backstory")
IDENTITY_PROFILE_PROMPT = load_prompt_block("identity.md", "prompt")


def create_identity_agent() -> Agent:
    """Create the CrewAI agent that generates Curator identity profiles."""

    return create_base_agent(
        role=IDENTITY_AGENT_ROLE,
        goal=IDENTITY_AGENT_GOAL,
        backstory=IDENTITY_AGENT_BACKSTORY,
        max_iter=3,
        max_retry_limit=0,
    )


def generate_identity_profile(
    onboarding: CuratorOnboardingRequest,
    agent: Agent | None = None,
) -> IdentityProfile:
    """Generate a structured Curator identity profile from onboarding."""

    if get_settings().mock_mode:
        return _generate_mock_identity_profile(onboarding)

    identity_agent = agent or create_identity_agent()
    prompt = IDENTITY_PROFILE_PROMPT.format(
        onboarding_json=onboarding.model_dump_json(indent=2)
    )
    return run_structured_agent(
        operation="Curator Identity Agent",
        agent=identity_agent,
        prompt=prompt,
        response_model=IdentityProfile,
        missing_output_error="Identity Agent did not return structured output.",
    )


def _generate_mock_identity_profile(
    onboarding: CuratorOnboardingRequest,
) -> IdentityProfile:
    """Return a deterministic profile for local and test execution."""

    interests = [
        *onboarding.curiosity.interests,
        *([onboarding.curiosity.customInterest] if onboarding.curiosity.customInterest else []),
    ]
    content_preferences = [
        *onboarding.content.types,
        f"{onboarding.content.depth} depth",
    ]
    coach_preferences = [
        onboarding.coach.personality,
        onboarding.coach.communicationStyle,
        onboarding.coach.checkInFrequency,
    ]
    first_interest = interests[0] if interests else "personal growth"

    return IdentityProfile(
        current_identity=(
            f"{onboarding.identity.name} is a {onboarding.identity.profession} "
            f"currently exploring {first_interest} with intentional curiosity."
        ),
        desired_future_identity=onboarding.aspirations.futureIdentity,
        core_interests=interests or ["Personal Growth"],
        growth_themes=[
            onboarding.aspirations.aspiration,
            f"{onboarding.aspirations.horizon} transformation horizon",
            "Consistent action",
        ],
        strengths=[
            "Self-awareness",
            "Willingness to reflect",
            "Clear aspiration setting",
        ],
        growth_opportunities=[
            "Translate intention into repeatable habits",
            "Protect focused time",
            "Use reflection to adjust direction",
        ],
        learning_preferences=content_preferences,
        coach_preferences=coach_preferences,
        available_time=(
            f"{onboarding.availability.weeklyHours} hours weekly, usually during "
            f"{', '.join(onboarding.availability.preferredDays)}."
        ),
        initial_personalization_summary=(
            f"Curator should help {onboarding.identity.name} pursue "
            f"{onboarding.aspirations.aspiration} with {onboarding.content.depth.lower()} "
            f"resources, {onboarding.coach.communicationStyle.lower()}, and a rhythm "
            f"anchored around {onboarding.availability.habitAnchor}."
        ),
    )
