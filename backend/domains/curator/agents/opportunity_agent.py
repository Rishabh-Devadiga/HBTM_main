"""Curator Opportunity Agent for real-world recommendations."""

from __future__ import annotations

from typing import Any

from crewai import Agent

from backend.domains.curator.prompts import load_prompt_block
from backend.domains.curator.schemas.decision import Decision
from backend.domains.curator.schemas.growth_journey import CuratorJourneyAgentOutput
from backend.domains.curator.schemas.identity import IdentityProfile
from backend.domains.curator.schemas.opportunities import OpportunityAgentOutput
from backend.domains.curator.schemas.planner import GrowthPlan
from backend.framework.agents.base_agent import create_base_agent, run_structured_agent


OPPORTUNITY_AGENT_ROLE = load_prompt_block("opportunities.md", "role")
OPPORTUNITY_AGENT_GOAL = load_prompt_block("opportunities.md", "goal")
OPPORTUNITY_AGENT_BACKSTORY = load_prompt_block("opportunities.md", "backstory")
OPPORTUNITY_RANKING_PROMPT = load_prompt_block("opportunities.md", "ranking_prompt")


def create_opportunity_agent() -> Agent:
    """Create the CrewAI Opportunity Agent."""

    return create_base_agent(
        role=OPPORTUNITY_AGENT_ROLE,
        goal=OPPORTUNITY_AGENT_GOAL,
        backstory=OPPORTUNITY_AGENT_BACKSTORY,
        max_iter=2,
        max_retry_limit=0,
    )


def generate_opportunity_recommendations(
    *,
    identity_profile: IdentityProfile,
    growth_plan: GrowthPlan,
    decision: Decision,
    growth_journey: CuratorJourneyAgentOutput,
    onboarding_json: dict[str, Any],
    completed_activities_json: list[dict[str, Any]],
    reflections_json: list[dict[str, Any]],
    candidate_opportunities_json: list[dict[str, Any]],
    agent: Agent | None = None,
) -> OpportunityAgentOutput:
    """Rank fetched opportunities with Gemini-backed structured output."""

    opportunity_agent = agent or create_opportunity_agent()
    prompt = OPPORTUNITY_RANKING_PROMPT.format(
        identity_profile_json=identity_profile.model_dump_json(indent=2),
        growth_plan_json=growth_plan.model_dump_json(indent=2),
        decision_json=decision.model_dump_json(indent=2),
        growth_journey_json=growth_journey.model_dump_json(indent=2),
        onboarding_json=onboarding_json,
        completed_activities_json=completed_activities_json,
        reflections_json=reflections_json,
        candidate_opportunities_json=candidate_opportunities_json,
    )
    return run_structured_agent(
        operation="Curator Opportunity Recommendations",
        agent=opportunity_agent,
        prompt=prompt,
        response_model=OpportunityAgentOutput,
        missing_output_error="Opportunity Agent did not return structured recommendations.",
    )
