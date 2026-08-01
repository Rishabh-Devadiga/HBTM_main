"""Gemini-backed quiz generation and deterministic scoring."""

from __future__ import annotations

import json
from typing import Protocol

from pydantic import BaseModel, ValidationError

from backend.domains.learning.prompts import load_prompt_block
from backend.framework.agents.base_agent import run_with_gemini_retry
from backend.framework.base.llm import get_gemini_llm
from backend.domains.learning.schemas.quiz import (
    QuizGenerationRequest,
    QuizGenerationResponse,
    QuizQuestion,
    QuizQuestionResult,
    QuizSubmissionRequest,
    QuizSubmissionResponse,
)


SYSTEM_PROMPT = load_prompt_block("quiz.md", "system_prompt").rstrip("\n")
GENERATION_PROMPT = load_prompt_block("quiz.md", "generation_prompt").rstrip(
    "\n"
)


class QuizServiceError(RuntimeError):
    """Base error raised by quiz generation."""


class InvalidQuizResponseError(QuizServiceError):
    """Raised when generated quiz JSON is malformed or invalid."""


class _GeneratedQuestions(BaseModel):
    questions: list[QuizQuestion]


class QuizLLM(Protocol):
    """Minimal shared LLM interface required by the Quiz service."""

    def call(
        self,
        messages: str,
        *,
        response_model: type[BaseModel] | None = None,
    ) -> object:
        """Generate one completion."""


class QuizService:
    """Generate quizzes with shared Gemini infrastructure and score locally."""

    def __init__(self, llm: QuizLLM | None = None) -> None:
        self.llm = llm

    def generate_quiz(
        self,
        request: QuizGenerationRequest,
    ) -> QuizGenerationResponse:
        """Generate and validate a multiple-choice quiz."""

        topics = ", ".join(request.topics)
        user_prompt = GENERATION_PROMPT.format(
            number_of_questions=request.number_of_questions,
            topics=topics,
            difficulty=request.difficulty.value,
        )

        prompt = f"{SYSTEM_PROMPT}\n\n{user_prompt}"
        llm = self.llm or get_gemini_llm()
        response = run_with_gemini_retry(
            "Quiz Generator",
            lambda: llm.call(
                prompt,
                response_model=_GeneratedQuestions,
            ),
            prompt=prompt,
        )

        if isinstance(response, _GeneratedQuestions):
            generated = response
        else:
            generated = self._parse_generated_questions(response)

        if len(generated.questions) != request.number_of_questions:
            raise InvalidQuizResponseError(
                "Gemini returned an unexpected number of quiz questions."
            )

        return QuizGenerationResponse(
            topics=request.topics,
            difficulty=request.difficulty,
            questions=generated.questions,
        )

    def _parse_generated_questions(self, response: object) -> _GeneratedQuestions:
        """Validate a Gemini JSON response with the quiz Pydantic model."""

        if isinstance(response, str):
            try:
                payload = json.loads(response)
            except json.JSONDecodeError as exc:
                raise InvalidQuizResponseError(
                    "Gemini returned invalid quiz JSON."
                ) from exc
        else:
            payload = response

        try:
            return _GeneratedQuestions.model_validate(payload)
        except ValidationError as exc:
            raise InvalidQuizResponseError(
                "Gemini returned quiz data that failed validation."
            ) from exc

    def submit_quiz(
        self,
        request: QuizSubmissionRequest,
    ) -> QuizSubmissionResponse:
        """Score selected answers without using an LLM."""

        results: list[QuizQuestionResult] = []
        score = 0
        for index, (question, selected_answer) in enumerate(
            zip(
                request.generated_quiz.questions,
                request.selected_answers,
                strict=True,
            ),
            start=1,
        ):
            is_correct = selected_answer == question.correct_answer
            score += int(is_correct)
            results.append(
                QuizQuestionResult(
                    question_number=index,
                    question=question.question,
                    selected_answer=selected_answer,
                    correct_answer=question.correct_answer,
                    is_correct=is_correct,
                    explanation=question.explanation,
                )
            )

        total_questions = len(request.generated_quiz.questions)
        return QuizSubmissionResponse(
            score=score,
            total_questions=total_questions,
            percentage=round(score / total_questions * 100, 2),
            results=results,
        )
