"""Planner Agent for generating Curator growth plans."""

from __future__ import annotations

from crewai import Agent, Crew, Process, Task

from backend.domains.curator.prompts import load_prompt_block
from backend.domains.curator.schemas.identity import IdentityProfile
from backend.domains.curator.schemas.planner import (
    CurationStrategy,
    DailyFocus,
    GrowthHabits,
    GrowthJourney,
    GrowthMission,
    GrowthPlan,
    SuccessMetrics,
    WeeklyMilestone,
)
from backend.framework.agents.base_agent import create_base_agent, run_with_gemini_retry
from backend.framework.base.config import get_settings


PLANNER_AGENT_ROLE = load_prompt_block("planner.md", "role")
PLANNER_AGENT_GOAL = load_prompt_block("planner.md", "goal")
PLANNER_AGENT_BACKSTORY = load_prompt_block("planner.md", "backstory")
GROWTH_PLAN_PROMPT = load_prompt_block("planner.md", "prompt")


def create_planner_agent() -> Agent:
    """Create the CrewAI agent that generates Curator growth plans."""

    return create_base_agent(
        role=PLANNER_AGENT_ROLE,
        goal=PLANNER_AGENT_GOAL,
        backstory=PLANNER_AGENT_BACKSTORY,
        max_iter=4,
        max_retry_limit=0,
    )


def create_planner_task(
    *,
    planner_agent: Agent,
    identity_profile: IdentityProfile,
) -> Task:
    """Create the Planner task with the Identity Agent output as its input."""

    return Task(
        description=GROWTH_PLAN_PROMPT.format(
            identity_profile_json=identity_profile.model_dump_json(indent=2)
        ),
        expected_output="A structured GrowthPlan object grounded in the Identity Profile.",
        agent=planner_agent,
        output_pydantic=GrowthPlan,
    )


def generate_growth_plan(
    identity_profile: IdentityProfile,
    agent: Agent | None = None,
) -> GrowthPlan:
    """Generate a structured Growth Plan from an Identity Profile."""

    if get_settings().mock_mode:
        return _generate_mock_growth_plan(identity_profile)

    planner_agent = agent or create_planner_agent()
    planner_task = create_planner_task(
        planner_agent=planner_agent,
        identity_profile=identity_profile,
    )
    crew = Crew(
        agents=[planner_agent],
        tasks=[planner_task],
        process=Process.sequential,
        verbose=False,
    )
    result = run_with_gemini_retry(
        "Curator Planner Agent",
        lambda: crew.kickoff(),
        prompt=planner_task.description,
    )
    pydantic_output = getattr(result, "pydantic", None)
    if pydantic_output is None and getattr(planner_task, "output", None) is not None:
        pydantic_output = planner_task.output.pydantic
    if pydantic_output is None:
        raise ValueError("Planner Agent did not return structured output.")
    return pydantic_output


def _generate_mock_growth_plan(identity_profile: IdentityProfile) -> GrowthPlan:
    """Return a deterministic Growth Plan for local schema verification."""

    primary_theme = identity_profile.growth_themes[0]
    primary_interest = identity_profile.core_interests[0]
    preferred_learning = identity_profile.learning_preferences[0]

    return GrowthPlan(
        journey=GrowthJourney(
            title=f"{primary_interest} Growth Journey",
            currentStage=identity_profile.current_identity,
            destination=identity_profile.desired_future_identity,
            estimatedDuration="90 days",
            growthTheme=primary_theme,
        ),
        mission=GrowthMission(
            purpose=(
                "Turn the desired future identity into repeatable action, "
                "reflection, and curated practice."
            ),
            successDefinition=(
                "Progress is visible through consistent habits, completed "
                "milestones, and clearer decisions about the next step."
            ),
        ),
        dailyFocus=DailyFocus(
            objective=f"Spend focused time on one action connected to {primary_theme}.",
            estimatedMinutes=25,
        ),
        weeklyMilestones=[
            WeeklyMilestone(
                week=1,
                title="Set the baseline",
                outcome="Clarify the current routine and choose one repeatable habit.",
            ),
            WeeklyMilestone(
                week=2,
                title="Practice consistency",
                outcome="Complete the daily focus at least four times in one week.",
            ),
            WeeklyMilestone(
                week=3,
                title="Reflect and adjust",
                outcome="Use reflection notes to refine the next week of action.",
            ),
        ],
        habits=GrowthHabits(
            daily=[
                "Complete one focused action",
                "Capture one sentence of reflection",
            ],
            weekly=[
                "Review progress signals",
                "Choose the next milestone",
            ],
        ),
        curationStrategy=CurationStrategy(
            recommendedMediaCategories=identity_profile.core_interests[:3],
            recommendedLearningStyle=preferred_learning,
            recommendedActivityTypes=[
                "Short practice sessions",
                "Reflection prompts",
                "Applied experiments",
            ],
        ),
        reflectionPrompts=[
            "What action made the future identity feel more real this week?",
            "Where did momentum feel easiest to protect?",
            "What should Curator adjust for the next milestone?",
        ],
        successMetrics=SuccessMetrics(
            indicators=[
                "Daily focus completions",
                "Weekly milestone progress",
                "Reflection consistency",
            ],
        ),
        aiSummary=(
            f"This plan helps translate {identity_profile.desired_future_identity} "
            f"into focused action, curated learning, and steady reflection."
        ),
    )
