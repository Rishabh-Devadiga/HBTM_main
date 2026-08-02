"""Curator Opportunity Agent for real-world recommendations."""

from __future__ import annotations

from typing import Any

from crewai import Agent

from backend.domains.curator.prompts import load_prompt_block
from backend.domains.curator.schemas.decision import Decision
from backend.domains.curator.schemas.growth_journey import CuratorJourneyAgentOutput
from backend.domains.curator.schemas.identity import IdentityProfile
from backend.domains.curator.schemas.opportunities import (
    OpportunityAgentOutput,
    OpportunityRecommendation,
)
from backend.domains.curator.schemas.planner import GrowthPlan
from backend.framework.agents.base_agent import create_base_agent, run_structured_agent
from backend.framework.base.config import get_settings


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

    if get_settings().mock_mode:
        return _generate_mock_recommendations(
            candidate_opportunities_json=candidate_opportunities_json
        )

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


_VALID_CATEGORIES = {
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
}
_VALID_MODES = {"Online", "Offline", "Hybrid", "Unknown"}


def _generate_mock_recommendations(
    candidate_opportunities_json: list[dict[str, Any]],
) -> OpportunityAgentOutput:
    """Deterministically rank source candidates for local and test runs."""

    opportunities: list[OpportunityRecommendation] = []
    for index, item in enumerate(candidate_opportunities_json[:10]):
        url = item.get("url")
        if not url or not str(url).startswith(("http://", "https://")):
            continue
        category = str(item.get("category", "Community"))
        if category not in _VALID_CATEGORIES:
            category = "Community"
        mode = str(item.get("mode", "Unknown"))
        if mode not in _VALID_MODES:
            mode = "Unknown"
        title = str(item.get("title", "Opportunity")).strip()
        if len(title) < 2:
            title = "Professional opportunity"
        description = str(item.get("description", "")).strip()
        if len(description) < 10:
            description = "Opportunity matched to your growth profile."
        opportunities.append(
            OpportunityRecommendation(
                id=str(item.get("id", f"mock-opportunity-{index}")),
                title=title[:240],
                category=category,
                organizer=str(item.get("organizer", "Verified source"))[:180],
                location=str(item.get("location", "Online"))[:180],
                mode=mode,
                date=str(item.get("date", "Ongoing"))[:120],
                description=description[:1200],
                relevanceScore=max(0, min(100, 80 - index * 3)),
                aiExplanation=(
                    "This source-backed opportunity matched your profile and "
                    "current growth focus in mock mode."
                ),
                url=url,
                tags=[str(tag)[:60] for tag in item.get("tags", [])[:12]],
                source=str(item.get("source", "Verified public directory"))[:120],
            )
        )
    if not opportunities:
        return OpportunityAgentOutput(
            recommendationSummary=(
                "No source-backed opportunities were available from the public "
                "sources checked for this profile."
            ),
            selectionReasons=["No verified source results available"],
            opportunities=[],
        )
    return OpportunityAgentOutput(
        recommendationSummary=(
            "These real opportunities were fetched from public sources and "
            "ranked against your profile, current phase, interests, and availability."
        ),
        selectionReasons=[
            "Matched to your Curator identity profile",
            "Filtered to source-backed public listings",
            "Sorted by relevance and timing",
        ],
        opportunities=opportunities,
    )
