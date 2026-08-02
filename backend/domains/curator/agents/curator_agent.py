"""Curator Agent for Growth Journey page data."""

from __future__ import annotations

from typing import Any

from crewai import Agent

from backend.domains.curator.prompts import load_prompt_block
from backend.domains.curator.schemas.decision import Decision
from backend.domains.curator.schemas.coach import CuratorCoachAgentResponse
from backend.domains.curator.schemas.growth_journey import (
    ActivityStatus,
    CuratorJourneyActivity,
    CuratorJourneyAgentOutput,
    CuratorJourneyPhase,
    CuratorJourneyResource,
)
from backend.domains.curator.schemas.identity import IdentityProfile
from backend.domains.curator.schemas.planner import GrowthPlan
from backend.domains.curator.schemas.resources import (
    CuratedResource,
    CuratedResourceAgentOutput,
)
from backend.framework.agents.base_agent import create_base_agent, run_structured_agent
from backend.framework.base.config import get_settings


CURATOR_AGENT_ROLE = load_prompt_block("curator.md", "role")
CURATOR_AGENT_GOAL = load_prompt_block("curator.md", "goal")
CURATOR_AGENT_BACKSTORY = load_prompt_block("curator.md", "backstory")
CURATOR_PROMPT = load_prompt_block("curator.md", "prompt")
CURATOR_COACH_PROMPT = load_prompt_block("curator.md", "coach_prompt")
CURATOR_COACH_SUGGESTIONS_PROMPT = load_prompt_block(
    "curator.md",
    "coach_suggestions_prompt",
)
CURATOR_RESOURCES_PROMPT = load_prompt_block("curator.md", "resources_prompt")


def create_curator_agent() -> Agent:
    """Create the CrewAI Curator Agent."""

    return create_base_agent(
        role=CURATOR_AGENT_ROLE,
        goal=CURATOR_AGENT_GOAL,
        backstory=CURATOR_AGENT_BACKSTORY,
        max_iter=3,
        max_retry_limit=0,
    )


def generate_growth_journey_view(
    *,
    identity_profile: IdentityProfile,
    growth_plan: GrowthPlan,
    decision: Decision,
    onboarding_json: dict[str, Any],
    progress_json: dict[str, Any],
    agent: Agent | None = None,
) -> CuratorJourneyAgentOutput:
    """Generate the Growth Journey view model."""

    if get_settings().mock_mode:
        return _generate_deterministic_journey(
            growth_plan=growth_plan,
            decision=decision,
            progress_json=progress_json,
        )

    curator_agent = agent or create_curator_agent()
    prompt = CURATOR_PROMPT.format(
        identity_profile_json=identity_profile.model_dump_json(indent=2),
        growth_plan_json=growth_plan.model_dump_json(indent=2),
        decision_json=decision.model_dump_json(indent=2),
        onboarding_json=onboarding_json,
        progress_json=progress_json,
    )
    return run_structured_agent(
        operation="Curator Agent",
        agent=curator_agent,
        prompt=prompt,
        response_model=CuratorJourneyAgentOutput,
        missing_output_error="Curator Agent did not return structured journey output.",
    )


def generate_growth_coach_response(
    *,
    identity_profile: IdentityProfile,
    growth_plan: GrowthPlan,
    decision: Decision,
    growth_journey: CuratorJourneyAgentOutput,
    onboarding_json: dict[str, Any],
    habits_json: dict[str, Any],
    reflections_json: list[dict[str, Any]],
    progress_json: dict[str, Any],
    conversation_history: str,
    message: str,
    agent: Agent | None = None,
) -> CuratorCoachAgentResponse:
    """Generate one personalized Growth Coach chat response."""

    if get_settings().mock_mode:
        return _generate_deterministic_coach_response(
            growth_journey=growth_journey,
            message=message,
        )

    curator_agent = agent or create_curator_agent()
    prompt = CURATOR_COACH_PROMPT.format(
        identity_profile_json=identity_profile.model_dump_json(indent=2),
        growth_plan_json=growth_plan.model_dump_json(indent=2),
        decision_json=decision.model_dump_json(indent=2),
        growth_journey_json=growth_journey.model_dump_json(indent=2),
        onboarding_json=onboarding_json,
        habits_json=habits_json,
        reflections_json=reflections_json,
        progress_json=progress_json,
        conversation_history=conversation_history,
        message=message,
    )
    return run_structured_agent(
        operation="Curator Coach Agent",
        agent=curator_agent,
        prompt=prompt,
        response_model=CuratorCoachAgentResponse,
        missing_output_error="Curator Agent did not return structured coach output.",
    )


def generate_growth_coach_suggestions(
    *,
    identity_profile: IdentityProfile,
    growth_plan: GrowthPlan,
    decision: Decision,
    growth_journey: CuratorJourneyAgentOutput,
    onboarding_json: dict[str, Any],
    progress_json: dict[str, Any],
    agent: Agent | None = None,
) -> CuratorCoachAgentResponse:
    """Generate dynamic prompt chips for the Growth Coach page."""

    if get_settings().mock_mode:
        return _generate_deterministic_coach_response(
            growth_journey=growth_journey,
            message="suggest prompts",
        )

    curator_agent = agent or create_curator_agent()
    prompt = CURATOR_COACH_SUGGESTIONS_PROMPT.format(
        identity_profile_json=identity_profile.model_dump_json(indent=2),
        growth_plan_json=growth_plan.model_dump_json(indent=2),
        decision_json=decision.model_dump_json(indent=2),
        growth_journey_json=growth_journey.model_dump_json(indent=2),
        onboarding_json=onboarding_json,
        progress_json=progress_json,
    )
    return run_structured_agent(
        operation="Curator Coach Suggestions",
        agent=curator_agent,
        prompt=prompt,
        response_model=CuratorCoachAgentResponse,
        missing_output_error="Curator Agent did not return structured coach suggestions.",
    )


def generate_curated_resources(
    *,
    identity_profile: IdentityProfile,
    growth_plan: GrowthPlan,
    decision: Decision,
    growth_journey: CuratorJourneyAgentOutput,
    onboarding_json: dict[str, Any],
    habits_json: dict[str, Any],
    reflections_json: list[dict[str, Any]],
    progress_json: dict[str, Any],
    completed_activities_json: list[dict[str, Any]],
    preferences_json: dict[str, Any],
    previous_interactions_json: list[dict[str, Any]],
    bookmarks_json: list[dict[str, Any]],
    views_json: list[dict[str, Any]],
    agent: Agent | None = None,
) -> CuratedResourceAgentOutput:
    """Generate personalized resource recommendations with the Curator Agent."""

    if get_settings().mock_mode:
        return _generate_deterministic_resources(
            growth_plan=growth_plan,
            decision=decision,
            growth_journey=growth_journey,
        )

    curator_agent = agent or create_curator_agent()
    prompt = CURATOR_RESOURCES_PROMPT.format(
        identity_profile_json=identity_profile.model_dump_json(indent=2),
        growth_plan_json=growth_plan.model_dump_json(indent=2),
        decision_json=decision.model_dump_json(indent=2),
        growth_journey_json=growth_journey.model_dump_json(indent=2),
        onboarding_json=onboarding_json,
        habits_json=habits_json,
        reflections_json=reflections_json,
        progress_json=progress_json,
        completed_activities_json=completed_activities_json,
        preferences_json=preferences_json,
        previous_interactions_json=previous_interactions_json,
        bookmarks_json=bookmarks_json,
        views_json=views_json,
    )
    return run_structured_agent(
        operation="Curator Resource Recommendations",
        agent=curator_agent,
        prompt=prompt,
        response_model=CuratedResourceAgentOutput,
        missing_output_error="Curator Agent did not return structured resources.",
    )


def _generate_deterministic_journey(
    *,
    growth_plan: GrowthPlan,
    decision: Decision,
    progress_json: dict[str, Any],
) -> CuratorJourneyAgentOutput:
    """Create deterministic journey data from planner and decision outputs."""

    completed = set(progress_json.get("completedActivityIds", []))
    phases = _build_phases(growth_plan, decision, completed)
    current_phase = next(
        (phase for phase in phases if phase.status == "current"),
        phases[-1],
    )
    activities = current_phase.activities
    today = next(
        (activity for activity in activities if activity.status == "available"),
        activities[-1],
    )
    return CuratorJourneyAgentOutput(
        phases=phases,
        currentPhase=current_phase,
        todayActivity=today,
        dailyActivities=activities,
        currentPriorities=current_phase.priorities,
        estimatedCompletion=growth_plan.journey.estimatedDuration,
        coachSummary=(
            f"Focus on {today.task}. This keeps momentum tied to "
            f"{growth_plan.journey.growthTheme} without changing the roadmap."
        ),
    )


def _generate_deterministic_coach_response(
    *,
    growth_journey: CuratorJourneyAgentOutput,
    message: str,
) -> CuratorCoachAgentResponse:
    current_phase = growth_journey.currentPhase
    today = growth_journey.todayActivity
    return CuratorCoachAgentResponse(
        reply=(
            f"You're working through {current_phase.title}. For your question "
            f"about \"{message}\", the most useful next step is to protect one "
            f"small action: {today.task}. Keep it simple, finish that activity, "
            "then review what made it easier or harder."
        ),
        suggestedPrompts=[
            f"How should I approach {today.task}?",
            f"What could block {current_phase.title}?",
            "Give me a short reflection prompt",
        ],
    )


def _generate_deterministic_resources(
    *,
    growth_plan: GrowthPlan,
    decision: Decision,
    growth_journey: CuratorJourneyAgentOutput,
) -> CuratedResourceAgentOutput:
    """Create deterministic resource recommendations for local and test runs."""

    current_phase = growth_journey.currentPhase
    entries = [
        ("Book", "The Art of Focused Growth"),
        ("Video", f"Understanding {growth_plan.journey.growthTheme}"),
        ("Podcast", f"Growing With {growth_plan.journey.growthTheme}"),
        ("Article", "Building a Sustainable Growth Loop"),
    ]
    resources = [
        CuratedResource(
            id=f"mock-resource-{index}",
            title=title,
            creator="saarthi.ai curated picks",
            description=(
                f"A {resource_type.lower()} selected to support "
                f"{growth_plan.journey.growthTheme} and your current phase."
            ),
            tags=[
                *growth_plan.curationStrategy.recommendedMediaCategories[:3],
                growth_plan.journey.growthTheme,
            ],
            estimatedDuration="25 min",
            type=resource_type,
            url="https://example.com/curated",
            reason=(
                f"Supports {current_phase.title} and your preferred "
                f"{decision.recommendedResourceType} format."
            ),
        )
        for index, (resource_type, title) in enumerate(entries)
    ]
    return CuratedResourceAgentOutput(
        recommendationSummary=(
            f"A focused starter set for {growth_plan.journey.growthTheme} "
            "based on your current phase."
        ),
        selectionReasons=[
            f"Matches {growth_plan.journey.growthTheme}",
            "Aligned with your current phase priorities",
            "Selected for your preferred learning style",
        ],
        resources=resources,
    )


def _build_phases(
    growth_plan: GrowthPlan,
    decision: Decision,
    completed: set[str],
) -> list[CuratorJourneyPhase]:
    phases: list[CuratorJourneyPhase] = []
    previous_complete = True
    for milestone in growth_plan.weeklyMilestones:
        activity_id = f"phase-{milestone.week}-activity-1"
        status = _activity_status(activity_id, completed, previous_complete)
        phase_status = "completed" if status == "completed" else (
            "current" if previous_complete else "upcoming"
        )
        activity = CuratorJourneyActivity(
            id=activity_id,
            task=(
                decision.currentFocus
                if phase_status == "current"
                else milestone.outcome
            ),
            durationMinutes=decision.estimatedDurationMinutes,
            status=status,
        )
        phases.append(
            CuratorJourneyPhase(
                phaseNumber=milestone.week,
                title=milestone.title,
                weekRange=f"Week {milestone.week}",
                summary=milestone.outcome,
                status=phase_status,
                activities=[activity],
                resources=[
                    CuratorJourneyResource(
                        title=category,
                        resourceType=decision.recommendedResourceType,
                        purpose=f"Support {milestone.title}.",
                    )
                    for category in growth_plan.curationStrategy.recommendedMediaCategories
                ],
                priorities=[
                    *growth_plan.habits.daily[:2],
                    growth_plan.dailyFocus.objective,
                ],
            )
        )
        previous_complete = status == "completed"
    return phases


def _activity_status(
    activity_id: str,
    completed: set[str],
    previous_complete: bool,
) -> ActivityStatus:
    if activity_id in completed:
        return "completed"
    if previous_complete:
        return "available"
    return "locked"
