"""Feedback Agent for generating personalized learning feedback.

The Feedback Agent consumes an existing LearningPlan and the latest
ProgressReport. It produces targeted feedback only; it does not create
reminders, notifications, memory entries, database updates, or orchestration.
"""

from __future__ import annotations

from crewai import Agent

from backend.domains.learning.prompts import load_prompt_block
from backend.framework.agents.base_agent import create_base_agent, run_structured_agent
from backend.framework.base.config import get_settings
from backend.domains.learning.schemas.feedback import FeedbackReport
from backend.domains.learning.schemas.planner import LearningPlan
from backend.domains.learning.schemas.progress import ProgressReport


FEEDBACK_AGENT_ROLE = load_prompt_block("feedback.md", "role")
FEEDBACK_AGENT_GOAL = load_prompt_block("feedback.md", "goal")
FEEDBACK_AGENT_BACKSTORY = load_prompt_block("feedback.md", "backstory")
FEEDBACK_PROMPT = load_prompt_block("feedback.md", "prompt")


class FeedbackValidationError(ValueError):
    """Raised when feedback inputs are incomplete or inconsistent."""


def create_feedback_agent() -> Agent:
    """Create the CrewAI agent that generates personalized feedback."""

    return create_base_agent(
        role=FEEDBACK_AGENT_ROLE,
        goal=FEEDBACK_AGENT_GOAL,
        backstory=FEEDBACK_AGENT_BACKSTORY,
        max_iter=3,
        max_retry_limit=0,
    )


def _plan_topics(plan: LearningPlan) -> set[str]:
    """Return all roadmap topics normalized for validation."""

    return {
        topic.lower()
        for phase in plan.phases
        for topic in phase.recommended_topics
    }


def _validate_feedback_inputs(
    plan: LearningPlan,
    progress_report: ProgressReport,
) -> None:
    """Validate that feedback generation has enough reliable information."""

    if not plan.phases:
        raise FeedbackValidationError("LearningPlan must contain at least one phase.")

    phase_numbers = {phase.phase_number for phase in plan.phases}
    if progress_report.current_phase not in phase_numbers:
        raise FeedbackValidationError(
            "ProgressReport current_phase must refer to an existing phase in the "
            "LearningPlan."
        )

    if not progress_report.next_recommended_task.strip():
        raise FeedbackValidationError(
            "ProgressReport next_recommended_task is required for feedback."
        )

    if not progress_report.summary.strip():
        raise FeedbackValidationError("ProgressReport summary is required for feedback.")

    has_progress_context = any(
        [
            progress_report.completed_topics,
            progress_report.remaining_topics,
            progress_report.completed_milestones,
        ]
    )
    if not has_progress_context:
        raise FeedbackValidationError(
            "ProgressReport must include completed topics, remaining topics, "
            "or completed milestones before feedback can be generated."
        )

    plan_topics = _plan_topics(plan)
    report_topics = progress_report.completed_topics + progress_report.remaining_topics
    unknown_topics = [
        topic for topic in report_topics if topic.lower() not in plan_topics
    ]
    if unknown_topics:
        raise FeedbackValidationError(
            "ProgressReport contains topics that are not present in the "
            f"LearningPlan: {unknown_topics}."
        )


def _generate_mock_feedback_report(
    plan: LearningPlan,
    progress_report: ProgressReport,
) -> FeedbackReport:
    """Return a realistic schema-valid feedback report without calling Gemini."""

    next_topic = (
        progress_report.remaining_topics[0]
        if progress_report.remaining_topics
        else plan.final_milestone
    )

    return FeedbackReport(
        overall_performance_assessment=(
            "Mock Mode assessment: the learner is making steady progress through "
            f"{plan.subject} and is currently marked as {progress_report.learner_status} "
            f"at {progress_report.overall_completion_percentage}% completion."
        ),
        strengths=[
            "Completed foundational topics show consistent follow-through.",
            "Progress milestones indicate the learner can apply concepts in practice.",
            "The current next task is specific enough to support focused study.",
        ],
        areas_for_improvement=[
            f"Spend more time on the next unresolved topic: {next_topic}.",
            "Convert each remaining topic into a small practice outcome before moving on.",
        ],
        personalized_study_recommendations=[
            f"Start the next session by reviewing notes from phase {progress_report.current_phase}.",
            f"Practice {next_topic} with a short exercise or mini project.",
            "End the session by writing a brief summary of what became clearer and what still feels uncertain.",
        ],
        motivation_message=(
            "You have enough momentum to keep going. Focus on the next small "
            "task, make it concrete, and let consistency do its quiet work."
        ),
        next_study_session_focus=f"Focus on {next_topic} and produce one small evidence-of-learning artifact.",
    )


def generate_feedback_report(
    plan: LearningPlan,
    progress_report: ProgressReport,
    agent: Agent | None = None,
) -> FeedbackReport:
    """Generate personalized feedback from a plan and progress report."""

    _validate_feedback_inputs(plan, progress_report)
    if get_settings().mock_mode:
        return _generate_mock_feedback_report(plan, progress_report)

    feedback_agent = agent or create_feedback_agent()
    prompt = FEEDBACK_PROMPT.format(
        learning_plan=plan.model_dump_json(indent=2),
        progress_report=progress_report.model_dump_json(indent=2),
    )
    return run_structured_agent(
        operation="Feedback Agent",
        agent=feedback_agent,
        prompt=prompt,
        response_model=FeedbackReport,
        missing_output_error="Feedback Agent did not return structured output.",
    )
