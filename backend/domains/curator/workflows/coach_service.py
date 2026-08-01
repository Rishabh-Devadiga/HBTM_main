"""Service layer for persistent Curator Growth Coach conversations."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from sqlalchemy import select

from backend.database.crud import get_db_session
from backend.database.models import (
    CuratorCoachConversation,
    CuratorCoachMessage,
    CuratorGrowthJourney,
)
from backend.domains.curator.agents.curator_agent import (
    generate_growth_coach_response,
    generate_growth_coach_suggestions,
)
from backend.domains.curator.schemas.coach import (
    CuratorCoachAgentResponse,
    CuratorCoachChatResponse,
    CuratorCoachConversationResponse,
    CuratorCoachConversationsResponse,
    CuratorCoachConversationSummary,
    CuratorCoachMessageResponse,
)
from backend.domains.curator.schemas.decision import Decision
from backend.domains.curator.schemas.growth_journey import CuratorJourneyAgentOutput
from backend.domains.curator.schemas.planner import GrowthPlan
from backend.domains.curator.workflows.growth_journey_service import (
    CuratorGrowthJourneyService,
)
from backend.domains.curator.workflows.identity_profile_persistence_service import (
    IdentityProfilePersistenceService,
    PersistedIdentityProfile,
)


class CuratorCoachService:
    """Create, restore, and continue Curator Growth Coach conversations."""

    def __init__(
        self,
        identity_service: IdentityProfilePersistenceService | None = None,
        journey_service: CuratorGrowthJourneyService | None = None,
    ) -> None:
        self.identity_service = identity_service or IdentityProfilePersistenceService()
        self.journey_service = journey_service or CuratorGrowthJourneyService(
            identity_service=self.identity_service
        )

    def get_conversations(self) -> CuratorCoachConversationsResponse | None:
        identity_record = self.identity_service.get_latest_identity_profile()
        if identity_record is None:
            return None

        journey_record = self._ensure_journey_record(identity_record.id)
        if journey_record is None:
            return None

        conversations = self._list_conversation_summaries(identity_record.id)
        active = self._get_conversation(conversations[0].id) if conversations else None
        suggestions = self._generate_suggestions(identity_record, journey_record)
        return CuratorCoachConversationsResponse(
            identityProfileId=identity_record.id,
            conversations=conversations,
            activeConversation=active,
            suggestedPrompts=suggestions.suggestedPrompts,
        )

    def create_conversation(
        self,
        title: str | None = None,
    ) -> CuratorCoachConversationsResponse | None:
        identity_record = self.identity_service.get_latest_identity_profile()
        if identity_record is None:
            return None

        journey_record = self._ensure_journey_record(identity_record.id)
        if journey_record is None:
            return None

        conversation_title = title.strip() if title else "New Growth Coach chat"
        with get_db_session() as session:
            conversation = CuratorCoachConversation(
                identity_profile_id=identity_record.id,
                title=conversation_title[:255],
            )
            session.add(conversation)
            session.flush()
            session.refresh(conversation)
            conversation_id = conversation.id

        conversations = self._list_conversation_summaries(identity_record.id)
        suggestions = self._generate_suggestions(identity_record, journey_record)
        return CuratorCoachConversationsResponse(
            identityProfileId=identity_record.id,
            conversations=conversations,
            activeConversation=self._get_conversation(conversation_id),
            suggestedPrompts=suggestions.suggestedPrompts,
        )

    def get_conversation(
        self,
        conversation_id: int,
    ) -> CuratorCoachConversationResponse | None:
        return self._get_conversation(conversation_id)

    def send_message(
        self,
        *,
        conversation_id: int,
        message: str,
    ) -> CuratorCoachChatResponse | None:
        identity_record = self.identity_service.get_latest_identity_profile()
        if identity_record is None:
            return None

        journey_record = self._ensure_journey_record(identity_record.id)
        if journey_record is None:
            return None

        conversation = self._get_conversation(conversation_id)
        if conversation is None:
            return None

        context = self._to_context(journey_record)
        history = self._format_history(conversation.messages)
        response = generate_growth_coach_response(
            identity_profile=identity_record.profile,
            growth_plan=context["growth_plan"],
            decision=context["decision"],
            growth_journey=context["journey"],
            onboarding_json=identity_record.onboarding_json,
            habits_json=context["habits"],
            reflections_json=[],
            progress_json=journey_record.progress_json,
            conversation_history=history,
            message=message,
        )
        with get_db_session() as session:
            stored_conversation = session.get(CuratorCoachConversation, conversation_id)
            if stored_conversation is None:
                return None
            session.add(
                CuratorCoachMessage(
                    conversation_id=conversation_id,
                    role="user",
                    content=message,
                )
            )
            session.add(
                CuratorCoachMessage(
                    conversation_id=conversation_id,
                    role="assistant",
                    content=response.reply,
                )
            )
            if stored_conversation.title == "New Growth Coach chat":
                stored_conversation.title = self._title_from_message(message)
            stored_conversation.updated_at = datetime.utcnow()
            session.flush()

        refreshed = self._get_conversation(conversation_id)
        if refreshed is None:
            return None
        return CuratorCoachChatResponse(
            conversation=refreshed,
            reply=response.reply,
            suggestedPrompts=response.suggestedPrompts,
        )

    def _ensure_journey_record(
        self,
        identity_profile_id: int,
    ) -> CuratorGrowthJourney | None:
        self.journey_service.get_growth_journey()
        with get_db_session() as session:
            statement = select(CuratorGrowthJourney).where(
                CuratorGrowthJourney.identity_profile_id == identity_profile_id
            )
            return session.scalars(statement).first()

    def _list_conversation_summaries(
        self,
        identity_profile_id: int,
    ) -> list[CuratorCoachConversationSummary]:
        with get_db_session() as session:
            statement = (
                select(CuratorCoachConversation)
                .where(CuratorCoachConversation.identity_profile_id == identity_profile_id)
                .order_by(
                    CuratorCoachConversation.updated_at.desc(),
                    CuratorCoachConversation.id.desc(),
                )
            )
            return [
                self._to_conversation_summary(conversation)
                for conversation in session.scalars(statement).all()
            ]

    def _get_conversation(
        self,
        conversation_id: int,
    ) -> CuratorCoachConversationResponse | None:
        with get_db_session() as session:
            conversation = session.get(CuratorCoachConversation, conversation_id)
            if conversation is None:
                return None
            statement = (
                select(CuratorCoachMessage)
                .where(CuratorCoachMessage.conversation_id == conversation_id)
                .order_by(CuratorCoachMessage.id.asc())
            )
            messages = session.scalars(statement).all()
            return CuratorCoachConversationResponse(
                **self._to_conversation_summary(conversation).model_dump(),
                messages=[self._to_message_response(message) for message in messages],
            )

    def _generate_suggestions(
        self,
        identity_record: PersistedIdentityProfile,
        journey_record: CuratorGrowthJourney,
    ) -> CuratorCoachAgentResponse:
        context = self._to_context(journey_record)
        return generate_growth_coach_suggestions(
            identity_profile=identity_record.profile,
            growth_plan=context["growth_plan"],
            decision=context["decision"],
            growth_journey=context["journey"],
            onboarding_json=identity_record.onboarding_json,
            progress_json=journey_record.progress_json,
        )

    def _to_context(self, journey_record: CuratorGrowthJourney) -> dict[str, Any]:
        growth_plan = GrowthPlan.model_validate(journey_record.growth_plan_json)
        return {
            "growth_plan": growth_plan,
            "decision": Decision.model_validate(journey_record.decision_json),
            "journey": CuratorJourneyAgentOutput.model_validate(
                journey_record.journey_json
            ),
            "habits": growth_plan.habits.model_dump(mode="json"),
        }

    def _format_history(self, messages: list[CuratorCoachMessageResponse]) -> str:
        if not messages:
            return "No previous conversation."
        return "\n\n".join(
            f"{message.role.title()}:\n{message.content}" for message in messages[-16:]
        )

    def _to_conversation_summary(
        self,
        conversation: CuratorCoachConversation,
    ) -> CuratorCoachConversationSummary:
        return CuratorCoachConversationSummary(
            id=conversation.id,
            title=conversation.title,
            createdAt=conversation.created_at,
            updatedAt=conversation.updated_at,
        )

    def _to_message_response(
        self,
        message: CuratorCoachMessage,
    ) -> CuratorCoachMessageResponse:
        return CuratorCoachMessageResponse(
            id=message.id,
            role=message.role,
            content=message.content,
            createdAt=message.created_at,
        )

    def _title_from_message(self, message: str) -> str:
        words = message.strip().split()
        title = " ".join(words[:8])
        if len(words) > 8:
            title = f"{title}..."
        return title[:255] or "Growth Coach chat"
