"""Intent Agent for structuring learner requests.

The Intent Agent is responsible only for understanding what the learner wants.
It does not create plans, store memory, call databases, or orchestrate crews.
"""

from __future__ import annotations

from crewai import Agent

from backend.domains.learning.prompts import load_prompt_block
from backend.framework.agents.base_agent import create_base_agent, run_structured_agent
from backend.framework.base.config import get_settings
from backend.domains.learning.schemas.intent import LearnerIntent, reconcile_intent_completeness


INTENT_AGENT_ROLE = load_prompt_block("intent.md", "role")
INTENT_AGENT_GOAL = load_prompt_block("intent.md", "goal")
INTENT_AGENT_BACKSTORY = load_prompt_block("intent.md", "backstory")
INTENT_EXTRACTION_PROMPT = load_prompt_block("intent.md", "prompt")


def create_intent_agent() -> Agent:
    """Create the CrewAI agent that extracts structured learner intent."""

    return create_base_agent(
        role=INTENT_AGENT_ROLE,
        goal=INTENT_AGENT_GOAL,
        backstory=INTENT_AGENT_BACKSTORY,
        max_iter=3,
        max_retry_limit=0,
    )


def _generate_mock_learner_intent(user_request: str) -> LearnerIntent:
    """Return deterministic learner intent without calling Gemini."""

    normalized_request = user_request.lower()
    if "i want to learn ai" in normalized_request:
        return LearnerIntent(
            learning_goal="Learn AI",
            subject="AI",
            current_skill_level=None,
            available_time=None,
            target_deadline=None,
            preferred_learning_style=None,
            is_complete=False,
            missing_information=[
                "current_skill_level",
                "available_time",
                "target_deadline",
            ],
            follow_up_questions=[
                "What is your current skill level with AI or related topics?",
                "How much time can you study each day or week?",
                "Do you have a target deadline for learning AI?",
            ],
        )

    return LearnerIntent(
        learning_goal="Learn Python from scratch",
        subject="Python",
        current_skill_level="Beginner",
        available_time="2 hours daily",
        target_deadline="3 months",
        preferred_learning_style=None,
        is_complete=True,
        missing_information=[],
        follow_up_questions=[],
    )


def analyze_learner_intent(
    user_request: str,
    agent: Agent | None = None,
) -> LearnerIntent:
    """Analyze a learner request and return structured intent data."""

    if not user_request.strip():
        raise ValueError("Learner request cannot be empty.")

    if get_settings().mock_mode:
        return reconcile_intent_completeness(
            _generate_mock_learner_intent(user_request)
        )

    intent_agent = agent or create_intent_agent()
    prompt = INTENT_EXTRACTION_PROMPT.format(user_request=user_request)
    result = run_structured_agent(
        operation="Intent Agent",
        agent=intent_agent,
        prompt=prompt,
        response_model=LearnerIntent,
        missing_output_error="Intent Agent did not return structured output.",
    )
    return reconcile_intent_completeness(result)
