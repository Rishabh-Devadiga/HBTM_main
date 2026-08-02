"""Service layer for Curator resource recommendations and engagement."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from sqlalchemy import func, select

from backend.database.crud import get_db_session
from backend.database.database import engine
from backend.database.models import (
    CuratorCoachConversation,
    CuratorCoachMessage,
    CuratorResourceBookmark,
    CuratorResourcePreference,
    CuratorResourceRecommendation,
    CuratorResourceView,
)
from backend.domains.curator.agents.curator_agent import generate_curated_resources
from backend.domains.curator.schemas.growth_journey import CuratorJourneyAgentOutput
from backend.domains.curator.schemas.resources import (
    CuratedResource,
    CuratedResourceAgentOutput,
    CuratorResourceEngagementResponse,
    CuratorResourcePreferences,
    CuratorResourcesResponse,
)
from backend.domains.curator.workflows.growth_journey_service import (
    CuratorGrowthJourneyService,
)
from backend.domains.curator.workflows.identity_profile_persistence_service import (
    IdentityProfilePersistenceService,
    PersistedIdentityProfile,
)


class CuratorResourceService:
    """Generate, restore, and update Curator resources."""

    def __init__(
        self,
        identity_service: IdentityProfilePersistenceService | None = None,
        journey_service: CuratorGrowthJourneyService | None = None,
    ) -> None:
        self.identity_service = identity_service or IdentityProfilePersistenceService()
        self.journey_service = journey_service or CuratorGrowthJourneyService(
            identity_service=self.identity_service
        )
        self._ensure_tables()

    def get_resources(self, *, refresh: bool = False) -> CuratorResourcesResponse | None:
        """Return the latest recommendations or generate a fresh set."""

        identity_record = self.identity_service.get_latest_identity_profile()
        if identity_record is None:
            return None

        journey_response = self.journey_service.get_growth_journey()
        if journey_response is None:
            return None

        if not refresh:
            latest = self._get_latest_recommendation(identity_record.id)
            if latest is not None:
                return self._to_response(identity_record.id, latest)

        context = self._build_context(identity_record, journey_response)
        recommendation = generate_curated_resources(**context["agent_context"])
        recommendation = self._hydrate_resources(identity_record.id, recommendation)
        with get_db_session() as session:
            record = CuratorResourceRecommendation(
                identity_profile_id=identity_record.id,
                recommendation_json=recommendation.model_dump(mode="json"),
                context_json=context["persisted_context"],
            )
            session.add(record)
            session.flush()
            session.refresh(record)
            return self._to_response(identity_record.id, record)

    def set_bookmark(
        self,
        *,
        resource: CuratedResource,
        bookmarked: bool,
    ) -> CuratorResourceEngagementResponse | None:
        """Persist bookmark state for one resource."""

        identity_record = self.identity_service.get_latest_identity_profile()
        if identity_record is None:
            return None

        resource_json = resource.model_dump(mode="json")
        with get_db_session() as session:
            statement = select(CuratorResourceBookmark).where(
                CuratorResourceBookmark.identity_profile_id == identity_record.id,
                CuratorResourceBookmark.resource_id == resource.id,
            )
            bookmark = session.scalars(statement).first()
            if bookmark is None:
                bookmark = CuratorResourceBookmark(
                    identity_profile_id=identity_record.id,
                    resource_id=resource.id,
                    resource_json=resource_json,
                    bookmarked=bookmarked,
                )
                session.add(bookmark)
            else:
                bookmark.resource_json = resource_json
                bookmark.bookmarked = bookmarked
                bookmark.updated_at = datetime.now(UTC)
            session.flush()

        return CuratorResourceEngagementResponse(
            resourceId=resource.id,
            isBookmarked=bookmarked,
            viewedCount=self._view_count(identity_record.id, resource.id),
        )

    def record_open(
        self,
        *,
        resource: CuratedResource,
    ) -> CuratorResourceEngagementResponse | None:
        """Persist a resource view/open event."""

        identity_record = self.identity_service.get_latest_identity_profile()
        if identity_record is None:
            return None

        with get_db_session() as session:
            session.add(
                CuratorResourceView(
                    identity_profile_id=identity_record.id,
                    resource_id=resource.id,
                    resource_json=resource.model_dump(mode="json"),
                    opened_url=str(resource.url),
                )
            )
            session.flush()

        return CuratorResourceEngagementResponse(
            resourceId=resource.id,
            isBookmarked=self._bookmark_map(identity_record.id).get(resource.id, False),
            viewedCount=self._view_count(identity_record.id, resource.id),
        )

    def update_preferences(
        self,
        preferences: CuratorResourcePreferences,
    ) -> CuratorResourcePreferences | None:
        """Persist resource content preferences."""

        identity_record = self.identity_service.get_latest_identity_profile()
        if identity_record is None:
            return None

        with get_db_session() as session:
            statement = select(CuratorResourcePreference).where(
                CuratorResourcePreference.identity_profile_id == identity_record.id
            )
            record = session.scalars(statement).first()
            if record is None:
                record = CuratorResourcePreference(
                    identity_profile_id=identity_record.id,
                    preferences_json=preferences.model_dump(mode="json"),
                )
                session.add(record)
            else:
                record.preferences_json = preferences.model_dump(mode="json")
                record.updated_at = datetime.now(UTC)
            session.flush()
        return preferences

    def _build_context(
        self,
        identity_record: PersistedIdentityProfile,
        journey_response: Any,
    ) -> dict[str, Any]:
        growth_plan = journey_response.growthPlan
        decision = journey_response.decision
        journey = CuratorJourneyAgentOutput(
            phases=journey_response.phases,
            currentPhase=journey_response.currentPhase,
            todayActivity=journey_response.todayActivity,
            dailyActivities=journey_response.dailyActivities,
            currentPriorities=journey_response.currentPriorities,
            estimatedCompletion=journey_response.estimatedCompletion,
            coachSummary=journey_response.coachSummary,
        )
        preferences = self._get_preferences(identity_record.id)
        progress_json = self._get_progress_json(identity_record.id)
        completed_activities = [
            activity.model_dump(mode="json")
            for phase in journey.phases
            for activity in phase.activities
            if activity.status == "completed"
        ]
        previous_interactions = self._previous_interactions(identity_record.id)
        bookmarks = self._bookmarked_resources(identity_record.id)
        views = self._viewed_resources(identity_record.id)
        agent_context = {
            "identity_profile": identity_record.profile,
            "growth_plan": growth_plan,
            "decision": decision,
            "growth_journey": journey,
            "onboarding_json": identity_record.onboarding_json,
            "habits_json": growth_plan.habits.model_dump(mode="json"),
            "reflections_json": [],
            "progress_json": progress_json,
            "completed_activities_json": completed_activities,
            "preferences_json": preferences.model_dump(mode="json"),
            "previous_interactions_json": previous_interactions,
            "bookmarks_json": bookmarks,
            "views_json": views,
        }
        persisted_context = {
            "identityProfileId": identity_record.id,
            "growthPlan": growth_plan.model_dump(mode="json"),
            "decision": decision.model_dump(mode="json"),
            "currentPhase": journey.currentPhase.model_dump(mode="json"),
            "progress": progress_json,
            "preferences": preferences.model_dump(mode="json"),
            "previousInteractions": previous_interactions,
            "bookmarks": bookmarks,
            "views": views,
        }
        return {"agent_context": agent_context, "persisted_context": persisted_context}

    def _get_latest_recommendation(
        self,
        identity_profile_id: int,
    ) -> CuratorResourceRecommendation | None:
        with get_db_session() as session:
            statement = (
                select(CuratorResourceRecommendation)
                .where(
                    CuratorResourceRecommendation.identity_profile_id
                    == identity_profile_id
                )
                .order_by(
                    CuratorResourceRecommendation.created_at.desc(),
                    CuratorResourceRecommendation.id.desc(),
                )
            )
            return session.scalars(statement).first()

    def _to_response(
        self,
        identity_profile_id: int,
        record: CuratorResourceRecommendation,
    ) -> CuratorResourcesResponse:
        recommendation = CuratedResourceAgentOutput.model_validate(
            record.recommendation_json
        )
        recommendation = self._hydrate_resources(identity_profile_id, recommendation)
        return CuratorResourcesResponse(
            identityProfileId=identity_profile_id,
            recommendationId=record.id,
            generatedAt=record.created_at,
            preferences=self._get_preferences(identity_profile_id),
            **recommendation.model_dump(mode="json"),
        )

    def _hydrate_resources(
        self,
        identity_profile_id: int,
        recommendation: CuratedResourceAgentOutput,
    ) -> CuratedResourceAgentOutput:
        bookmark_map = self._bookmark_map(identity_profile_id)
        view_counts = self._view_counts(identity_profile_id)
        return recommendation.model_copy(
            update={
                "resources": [
                    resource.model_copy(
                        update={
                            "isBookmarked": bookmark_map.get(resource.id, False),
                            "viewedCount": view_counts.get(resource.id, 0),
                        }
                    )
                    for resource in recommendation.resources
                ]
            }
        )

    def _get_preferences(self, identity_profile_id: int) -> CuratorResourcePreferences:
        with get_db_session() as session:
            statement = select(CuratorResourcePreference).where(
                CuratorResourcePreference.identity_profile_id == identity_profile_id
            )
            record = session.scalars(statement).first()
            if record is None:
                return CuratorResourcePreferences()
            return CuratorResourcePreferences.model_validate(record.preferences_json)

    def _get_progress_json(self, identity_profile_id: int) -> dict[str, Any]:
        from backend.database.models import CuratorGrowthJourney

        with get_db_session() as session:
            statement = select(CuratorGrowthJourney).where(
                CuratorGrowthJourney.identity_profile_id == identity_profile_id
            )
            record = session.scalars(statement).first()
            return dict(record.progress_json) if record is not None else {}

    def _previous_interactions(self, identity_profile_id: int) -> list[dict[str, Any]]:
        with get_db_session() as session:
            conversations = session.scalars(
                select(CuratorCoachConversation)
                .where(CuratorCoachConversation.identity_profile_id == identity_profile_id)
                .order_by(CuratorCoachConversation.updated_at.desc())
                .limit(5)
            ).all()
            conversation_ids = [conversation.id for conversation in conversations]
            if not conversation_ids:
                return []
            messages = session.scalars(
                select(CuratorCoachMessage)
                .where(CuratorCoachMessage.conversation_id.in_(conversation_ids))
                .order_by(CuratorCoachMessage.created_at.desc())
                .limit(20)
            ).all()
            return [
                {
                    "role": message.role,
                    "content": message.content[:800],
                    "createdAt": message.created_at.isoformat(),
                }
                for message in messages
            ]

    def _bookmarked_resources(self, identity_profile_id: int) -> list[dict[str, Any]]:
        with get_db_session() as session:
            records = session.scalars(
                select(CuratorResourceBookmark)
                .where(
                    CuratorResourceBookmark.identity_profile_id == identity_profile_id,
                    CuratorResourceBookmark.bookmarked.is_(True),
                )
                .order_by(CuratorResourceBookmark.updated_at.desc())
            ).all()
            return [record.resource_json for record in records]

    def _viewed_resources(self, identity_profile_id: int) -> list[dict[str, Any]]:
        with get_db_session() as session:
            records = session.scalars(
                select(CuratorResourceView)
                .where(CuratorResourceView.identity_profile_id == identity_profile_id)
                .order_by(CuratorResourceView.created_at.desc())
                .limit(30)
            ).all()
            return [
                {
                    "resourceId": record.resource_id,
                    "resource": record.resource_json,
                    "openedUrl": record.opened_url,
                    "createdAt": record.created_at.isoformat(),
                }
                for record in records
            ]

    def _bookmark_map(self, identity_profile_id: int) -> dict[str, bool]:
        with get_db_session() as session:
            records = session.scalars(
                select(CuratorResourceBookmark).where(
                    CuratorResourceBookmark.identity_profile_id == identity_profile_id
                )
            ).all()
            return {record.resource_id: record.bookmarked for record in records}

    def _view_counts(self, identity_profile_id: int) -> dict[str, int]:
        with get_db_session() as session:
            rows = session.execute(
                select(CuratorResourceView.resource_id, func.count())
                .where(CuratorResourceView.identity_profile_id == identity_profile_id)
                .group_by(CuratorResourceView.resource_id)
            ).all()
            return {str(resource_id): int(count) for resource_id, count in rows}

    def _view_count(self, identity_profile_id: int, resource_id: str) -> int:
        return self._view_counts(identity_profile_id).get(resource_id, 0)

    def _ensure_tables(self) -> None:
        for table in (
            CuratorResourceRecommendation.__table__,
            CuratorResourceBookmark.__table__,
            CuratorResourceView.__table__,
            CuratorResourcePreference.__table__,
            CuratorCoachConversation.__table__,
            CuratorCoachMessage.__table__,
        ):
            table.create(bind=engine, checkfirst=True)
