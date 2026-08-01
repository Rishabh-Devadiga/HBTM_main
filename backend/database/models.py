"""SQLAlchemy ORM models used by the current domain persistence layer."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    JSON,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.database.database import Base


class User(Base):
    """Application user who owns learning workflow data."""

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str | None] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    learner_intents: Mapped[list[LearnerIntent]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )
    learning_plans: Mapped[list[LearningPlan]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )
    progress_records: Mapped[list[Progress]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )
    feedback_history: Mapped[list[FeedbackHistory]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )
    nudge_history: Mapped[list[NudgeHistory]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )
    curator_identity_profiles: Mapped[list[CuratorIdentityProfile]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )


class UserCredential(Base):
    """Password credential for an existing application user."""

    __tablename__ = "user_credentials"
    __table_args__ = (
        UniqueConstraint("user_id", name="uq_user_credentials_user"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    password_hash: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )


class UserSession(Base):
    """Persistent bearer session for a logged-in user."""

    __tablename__ = "user_sessions"
    __table_args__ = (
        UniqueConstraint("token", name="uq_user_sessions_token"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    token: Mapped[str] = mapped_column(String(128), index=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )


class LearnerIntent(Base):
    """Captured learner intent extracted from a user request."""

    __tablename__ = "learner_intents"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    learning_goal: Mapped[str] = mapped_column(Text, nullable=False)
    subject: Mapped[str] = mapped_column(String(255), nullable=False)
    current_skill_level: Mapped[str] = mapped_column(String(255), nullable=False)
    available_time: Mapped[str] = mapped_column(String(255), nullable=False)
    target_deadline: Mapped[str] = mapped_column(String(255), nullable=False)
    preferred_learning_style: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    user: Mapped[User] = relationship(back_populates="learner_intents")


class LearningPlan(Base):
    """Generated learning plan stored as structured JSON."""

    __tablename__ = "learning_plans"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    plan_json: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    user: Mapped[User] = relationship(back_populates="learning_plans")


class Progress(Base):
    """Learner progress record for a topic in a learning plan."""

    __tablename__ = "progress"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    topic: Mapped[str] = mapped_column(String(255), nullable=False)
    completion_percentage: Mapped[float] = mapped_column(
        Float,
        default=0.0,
        nullable=False,
    )
    completed: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    user: Mapped[User] = relationship(back_populates="progress_records")


class FeedbackHistory(Base):
    """Stored feedback generated for a learner."""

    __tablename__ = "feedback_history"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    feedback: Mapped[str] = mapped_column(Text, nullable=False)
    strengths: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    improvements: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    user: Mapped[User] = relationship(back_populates="feedback_history")


class NudgeHistory(Base):
    """Stored nudge message generated for a learner."""

    __tablename__ = "nudge_history"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    message: Mapped[str] = mapped_column(Text, nullable=False)
    urgency: Mapped[str] = mapped_column(String(50), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    user: Mapped[User] = relationship(back_populates="nudge_history")


class CuratorIdentityProfile(Base):
    """Generated Curator identity profile stored as structured JSON."""

    __tablename__ = "curator_identity_profiles"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        index=True,
        nullable=True,
    )
    display_name: Mapped[str] = mapped_column(String(255), nullable=False)
    profession: Mapped[str] = mapped_column(String(255), nullable=False)
    profile_json: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
    onboarding_json: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    user: Mapped[User | None] = relationship(back_populates="curator_identity_profiles")


class CuratorGrowthJourney(Base):
    """Persisted Curator growth journey and progress state."""

    __tablename__ = "curator_growth_journeys"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    identity_profile_id: Mapped[int] = mapped_column(
        ForeignKey("curator_identity_profiles.id", ondelete="CASCADE"),
        unique=True,
        index=True,
        nullable=False,
    )
    growth_plan_json: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
    decision_json: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
    journey_json: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
    progress_json: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class CuratorCoachConversation(Base):
    """Persistent Curator Growth Coach conversation."""

    __tablename__ = "curator_coach_conversations"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    identity_profile_id: Mapped[int] = mapped_column(
        ForeignKey("curator_identity_profiles.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class CuratorCoachMessage(Base):
    """One persistent message in a Curator Growth Coach conversation."""

    __tablename__ = "curator_coach_messages"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    conversation_id: Mapped[int] = mapped_column(
        ForeignKey("curator_coach_conversations.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    role: Mapped[str] = mapped_column(String(24), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )


class CuratorResourceRecommendation(Base):
    """Persisted Curator Agent resource recommendation history."""

    __tablename__ = "curator_resource_recommendations"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    identity_profile_id: Mapped[int] = mapped_column(
        ForeignKey("curator_identity_profiles.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    recommendation_json: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
    context_json: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )


class CuratorResourceBookmark(Base):
    """Persisted bookmark state for one Curator resource."""

    __tablename__ = "curator_resource_bookmarks"
    __table_args__ = (
        UniqueConstraint(
            "identity_profile_id",
            "resource_id",
            name="uq_curator_resource_bookmark_identity_resource",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    identity_profile_id: Mapped[int] = mapped_column(
        ForeignKey("curator_identity_profiles.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    resource_id: Mapped[str] = mapped_column(String(160), index=True, nullable=False)
    resource_json: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
    bookmarked: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class CuratorResourceView(Base):
    """Persisted resource open/view event."""

    __tablename__ = "curator_resource_views"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    identity_profile_id: Mapped[int] = mapped_column(
        ForeignKey("curator_identity_profiles.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    resource_id: Mapped[str] = mapped_column(String(160), index=True, nullable=False)
    resource_json: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
    opened_url: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )


class CuratorResourcePreference(Base):
    """Persisted resource preference overrides."""

    __tablename__ = "curator_resource_preferences"
    __table_args__ = (
        UniqueConstraint(
            "identity_profile_id",
            name="uq_curator_resource_preferences_identity",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    identity_profile_id: Mapped[int] = mapped_column(
        ForeignKey("curator_identity_profiles.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    preferences_json: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class CuratorOpportunityRecommendation(Base):
    """Persisted Curator real-world opportunity recommendation cache."""

    __tablename__ = "curator_opportunity_recommendations"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    identity_profile_id: Mapped[int] = mapped_column(
        ForeignKey("curator_identity_profiles.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    recommendation_json: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
    context_json: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
    source_snapshot_json: Mapped[list[dict[str, Any]]] = mapped_column(
        JSON,
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )


class CuratorOpportunityBookmark(Base):
    """Persisted bookmark state for one Curator opportunity."""

    __tablename__ = "curator_opportunity_bookmarks"
    __table_args__ = (
        UniqueConstraint(
            "identity_profile_id",
            "opportunity_id",
            name="uq_curator_opportunity_bookmark_identity_opportunity",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    identity_profile_id: Mapped[int] = mapped_column(
        ForeignKey("curator_identity_profiles.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    opportunity_id: Mapped[str] = mapped_column(String(200), index=True, nullable=False)
    opportunity_json: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
    bookmarked: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class CuratorOpportunityDismissal(Base):
    """Persisted dismissed state for one Curator opportunity."""

    __tablename__ = "curator_opportunity_dismissals"
    __table_args__ = (
        UniqueConstraint(
            "identity_profile_id",
            "opportunity_id",
            name="uq_curator_opportunity_dismissal_identity_opportunity",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    identity_profile_id: Mapped[int] = mapped_column(
        ForeignKey("curator_identity_profiles.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    opportunity_id: Mapped[str] = mapped_column(String(200), index=True, nullable=False)
    opportunity_json: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
    dismissed: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
