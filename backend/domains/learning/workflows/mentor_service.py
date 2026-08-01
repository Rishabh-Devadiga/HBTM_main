"""Conversational AI Mentor backed by the project's shared Gemini client."""

from __future__ import annotations

from typing import Protocol

from backend.domains.learning.config import get_learning_domain_config
from backend.domains.learning.prompts import load_prompt_block
from backend.framework.agents.base_agent import run_with_gemini_retry
from backend.framework.base.llm import get_gemini_llm
from backend.domains.learning.schemas.mentor import MentorChatRequest, MentorChatResponse


LEARNING_DOMAIN_CONFIG = get_learning_domain_config()
MENTOR_SYSTEM_PROMPT = load_prompt_block("mentor.md", "system_prompt")
MENTOR_PROMPT_TEMPLATE = load_prompt_block("mentor.md", "prompt")


class MentorServiceError(RuntimeError):
    """Raised when Gemini does not return a usable mentor response."""


class MentorLLM(Protocol):
    """Minimal shared LLM interface required by the Mentor service."""

    def call(self, messages: str) -> object:
        """Generate one mentor response."""


class MentorService:
    """Answer learner questions using shared Gemini infrastructure."""

    def __init__(self, llm: MentorLLM | None = None) -> None:
        self.llm = llm

    def chat(self, request: MentorChatRequest) -> MentorChatResponse:
        """Generate one contextual mentor response."""

        prompt = self._build_prompt(request)
        llm = self.llm or get_gemini_llm()
        response = run_with_gemini_retry(
            "AI Mentor",
            lambda: llm.call(prompt),
            prompt=prompt,
        )

        if not isinstance(response, str) or not response.strip():
            raise MentorServiceError(
                "Gemini returned an empty or invalid mentor response."
            )

        return MentorChatResponse(
            reply=response.strip(),
            suggested_followups=self._suggest_followups(request),
        )

    def _build_prompt(self, request: MentorChatRequest) -> str:
        """Build the mentor prompt from learning and conversation context."""

        history = "\n\n".join(
            (
                f"{'User' if message.role == 'user' else 'Assistant'}:\n"
                f"{message.content}"
            )
            for message in request.conversation_history
        )
        return MENTOR_PROMPT_TEMPLATE.format(
            system_prompt=MENTOR_SYSTEM_PROMPT,
            learning_goal=request.learning_goal
            or LEARNING_DOMAIN_CONFIG.mentor_not_provided_label,
            current_topic=request.current_topic
            or LEARNING_DOMAIN_CONFIG.mentor_not_provided_label,
            conversation_history=history
            or LEARNING_DOMAIN_CONFIG.mentor_no_previous_conversation_label,
            message=request.message,
        )

    def _suggest_followups(self, request: MentorChatRequest) -> list[str]:
        """Return concise context-aware continuations without another LLM call."""

        topic = request.current_topic or "this concept"
        return [
            f"Explain {topic} with an analogy.",
            f"Give me a practical example of {topic}.",
            f"Test my understanding of {topic}.",
        ]
