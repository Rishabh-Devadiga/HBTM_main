"""Compatibility chat service for direct CrewAI-backed prompt requests.

This endpoint remains separate from domain workflows so existing `/chat`
clients can send a standalone prompt without starting a domain session.
"""

from __future__ import annotations

from backend.framework.agents.base_agent import create_base_agent
from backend.framework.base.config import get_settings
from backend.framework.base.llm import GEMINI_FLASH_MODEL, get_gemini_llm
from backend.schemas.chat import ChatRequest, ChatResponse


class ChatServiceError(RuntimeError):
    """Raised when the temporary CrewAI chat call fails."""


def generate_chat_response(request: ChatRequest) -> ChatResponse:
    """Generate a response using one temporary CrewAI agent."""

    if get_settings().mock_mode:
        return ChatResponse(
            response=(
                f"Mock mode: you asked \"{request.prompt.strip()}\". "
                "This deterministic reply avoids Gemini API usage in local runs."
            ),
            model=GEMINI_FLASH_MODEL,
        )

    try:
        agent = create_base_agent(
            role="Temporary Learning Assistant",
            goal="Answer user learning questions clearly and concisely.",
            backstory=(
                "You are a temporary validation assistant for the "
                "AI-Learning-Agent backend. You provide clear, direct answers "
                "without invoking tools, memory, or workflows."
            ),
            llm=get_gemini_llm(),
            max_iter=3,
        )
        result = agent.kickoff(request.prompt)
    except Exception as exc:
        raise ChatServiceError("Failed to generate response from Gemini.") from exc

    return ChatResponse(response=result.raw, model=GEMINI_FLASH_MODEL)
