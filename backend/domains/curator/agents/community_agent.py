"""Curator Community Agent for workshop recommendations."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Any

from crewai import Agent

from backend.domains.curator.prompts import load_prompt_block
from backend.domains.curator.schemas.community import (
    CommunityAgentOutput,
    CommunityAgentWorkshop,
)
from backend.domains.curator.schemas.growth_journey import CuratorJourneyAgentOutput
from backend.domains.curator.schemas.identity import IdentityProfile
from backend.framework.agents.base_agent import create_base_agent, run_structured_agent
from backend.framework.base.config import get_settings


COMMUNITY_AGENT_ROLE = load_prompt_block("community.md", "role")
COMMUNITY_AGENT_GOAL = load_prompt_block("community.md", "goal")
COMMUNITY_AGENT_BACKSTORY = load_prompt_block("community.md", "backstory")
COMMUNITY_WORKSHOP_PROMPT = load_prompt_block("community.md", "workshop_prompt")


def create_community_agent() -> Agent:
    """Create the CrewAI Community Agent."""

    return create_base_agent(
        role=COMMUNITY_AGENT_ROLE,
        goal=COMMUNITY_AGENT_GOAL,
        backstory=COMMUNITY_AGENT_BACKSTORY,
        max_iter=2,
        max_retry_limit=0,
    )


def generate_community_workshops(
    *,
    identity_profile: IdentityProfile,
    onboarding_json: dict[str, Any],
    growth_journey: CuratorJourneyAgentOutput,
    similar_profiles_json: list[dict[str, Any]],
    location: str,
    agent: Agent | None = None,
) -> CommunityAgentOutput:
    """Generate personalized workshop recommendations with structured output."""

    if get_settings().mock_mode:
        return _generate_mock_workshops(
            growth_journey=growth_journey,
            location=location,
        )

    community_agent = agent or create_community_agent()
    prompt = COMMUNITY_WORKSHOP_PROMPT.format(
        identity_profile_json=identity_profile.model_dump_json(indent=2),
        onboarding_json=onboarding_json,
        growth_journey_json=growth_journey.model_dump_json(indent=2),
        similar_profiles_json=similar_profiles_json,
        location=location or "Online or unspecified",
    )
    return run_structured_agent(
        operation="Curator Community Workshops",
        agent=community_agent,
        prompt=prompt,
        response_model=CommunityAgentOutput,
        missing_output_error="Community Agent did not return structured workshops.",
    )


def _generate_mock_workshops(
    *,
    growth_journey: CuratorJourneyAgentOutput,
    location: str,
) -> CommunityAgentOutput:
    """Return deterministic workshop recommendations for local and test runs."""

    current_phase = growth_journey.currentPhase
    today_task = growth_journey.todayActivity.task
    loc = str(location or "").strip()
    if len(loc) < 2:
        loc = "Online"
    is_online = loc.lower() in {"", "online", "remote"}
    now = datetime.now(UTC)
    topic_goal = (
        current_phase.priorities[0]
        if current_phase.priorities
        else today_task
    )
    return CommunityAgentOutput(
        workshops=[
            CommunityAgentWorkshop(
                title=f"{current_phase.title} Growth Circle",
                topicGoal=topic_goal,
                dateTime=now + timedelta(days=7),
                location=loc,
                isOnline=is_online,
                matchingReason=(
                    "Hands-on support aligned to your current phase and today's "
                    "focus activity, keeping momentum steady."
                ),
            ),
            CommunityAgentWorkshop(
                title=f"{current_phase.title} Reflection Meetup",
                topicGoal=today_task,
                dateTime=now + timedelta(days=14),
                location=loc,
                isOnline=is_online,
                matchingReason=(
                    "A structured peer session to share progress and stay "
                    "accountable while you work through this journey phase."
                ),
            ),
        ]
    )
