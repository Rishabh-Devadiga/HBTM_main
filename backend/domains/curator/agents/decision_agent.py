"""Decision Agent for choosing the user's next Curator focus."""

from __future__ import annotations

from crewai import Agent

from backend.domains.curator.prompts import load_prompt_block
from backend.domains.curator.schemas.decision import Decision, RecommendedResourceType
from backend.domains.curator.schemas.identity import IdentityProfile
from backend.domains.curator.schemas.planner import GrowthPlan
from backend.framework.agents.base_agent import create_base_agent, run_structured_agent
from backend.framework.base.config import get_settings


DECISION_AGENT_ROLE = load_prompt_block("decision.md", "role")
DECISION_AGENT_GOAL = load_prompt_block("decision.md", "goal")
DECISION_AGENT_BACKSTORY = load_prompt_block("decision.md", "backstory")
DECISION_PROMPT = load_prompt_block("decision.md", "prompt")


def create_decision_agent() -> Agent:
    """Create the CrewAI agent that chooses the next Curator focus."""

    return create_base_agent(
        role=DECISION_AGENT_ROLE,
        goal=DECISION_AGENT_GOAL,
        backstory=DECISION_AGENT_BACKSTORY,
        max_iter=3,
        max_retry_limit=0,
    )


def generate_decision(
    identity_profile: IdentityProfile,
    growth_plan: GrowthPlan,
    agent: Agent | None = None,
) -> Decision:
    """Generate a structured next-focus Decision."""

    if get_settings().mock_mode:
        return _generate_mock_decision(identity_profile, growth_plan)

    decision_agent = agent or create_decision_agent()
    prompt = DECISION_PROMPT.format(
        identity_profile_json=identity_profile.model_dump_json(indent=2),
        growth_plan_json=growth_plan.model_dump_json(indent=2),
    )
    return run_structured_agent(
        operation="Curator Decision Agent",
        agent=decision_agent,
        prompt=prompt,
        response_model=Decision,
        missing_output_error="Decision Agent did not return structured output.",
    )


def _generate_mock_decision(
    identity_profile: IdentityProfile,
    growth_plan: GrowthPlan,
) -> Decision:
    """Return a deterministic Decision for local and test execution."""

    current_focus = growth_plan.dailyFocus.objective
    recommended_resource_type = _select_mock_resource_type(identity_profile)
    return Decision(
        currentFocus=current_focus,
        recommendedAction="build_habit",
        recommendedResourceType=recommended_resource_type,
        difficulty="beginner",
        estimatedDurationMinutes=growth_plan.dailyFocus.estimatedMinutes,
        priority="high",
        reasoning=(
            "This focus aligns with the user's current growth theme, available "
            "time, and need for a repeatable next step before expanding into "
            "more complex milestones."
        ),
    )


def _select_mock_resource_type(
    identity_profile: IdentityProfile,
) -> RecommendedResourceType:
    """Pick a deterministic resource type from stated preferences."""

    preferences = " ".join(identity_profile.learning_preferences).lower()
    if "video" in preferences or "visual" in preferences:
        return "youtube"
    if "book" in preferences:
        return "book"
    if "podcast" in preferences or "audio" in preferences:
        return "podcast"
    if "course" in preferences:
        return "course"
    return "article"
