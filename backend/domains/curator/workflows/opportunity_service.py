"""Service layer for Curator real-world opportunity recommendations."""

from __future__ import annotations

import hashlib
import logging
import re
from datetime import UTC, datetime, timedelta
from typing import Any

import requests
from sqlalchemy import select

from backend.database.crud import get_db_session
from backend.database.database import engine
from backend.database.models import (
    CuratorCoachConversation,
    CuratorCoachMessage,
    CuratorOpportunityBookmark,
    CuratorOpportunityDismissal,
    CuratorOpportunityRecommendation,
)
from backend.domains.curator.agents.opportunity_agent import (
    generate_opportunity_recommendations,
)
from backend.domains.curator.schemas.growth_journey import CuratorJourneyAgentOutput
from backend.domains.curator.schemas.opportunities import (
    OpportunitiesResponse,
    OpportunityAgentOutput,
    OpportunityCandidate,
    OpportunityEngagementResponse,
    OpportunityRecommendation,
)
from backend.domains.curator.workflows.growth_journey_service import (
    CuratorGrowthJourneyService,
)
from backend.domains.curator.workflows.identity_profile_persistence_service import (
    IdentityProfilePersistenceService,
    PersistedIdentityProfile,
)


CACHE_TTL = timedelta(hours=12)
logger = logging.getLogger(__name__)


class CuratorOpportunityService:
    """Fetch, rank, cache, and persist Curator opportunities."""

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

    def get_opportunities(
        self,
        *,
        refresh: bool = False,
    ) -> OpportunitiesResponse | None:
        """Return cached recommendations or refresh from public sources."""

        identity_record = self.identity_service.get_latest_identity_profile()
        if identity_record is None:
            return None

        journey_response = self.journey_service.get_growth_journey()
        if journey_response is None:
            return None

        if not refresh:
            latest = self._get_latest_recommendation(identity_record.id)
            if latest is not None and not self._is_stale(latest.created_at):
                return self._to_response(identity_record.id, latest)

        context = self._build_context(identity_record, journey_response)
        candidates = self._fetch_candidates(context)
        if candidates:
            try:
                recommendation = generate_opportunity_recommendations(
                    **context["agent_context"],
                    candidate_opportunities_json=self._candidate_payload(candidates),
                )
            except ValueError as exc:
                logger.warning(
                    "Opportunity Agent returned invalid structured output; "
                    "using source-backed fallback ranking. Reason: %s",
                    exc,
                )
                recommendation = self._fallback_rank(candidates, context)
        else:
            recommendation = OpportunityAgentOutput(
                recommendationSummary=(
                    "No source-backed opportunities were available from the public "
                    "sources checked for this profile."
                ),
                selectionReasons=["No verified source results available"],
                opportunities=[],
            )
        recommendation = self._validate_and_hydrate(
            identity_record.id,
            recommendation,
            candidates,
        )

        with get_db_session() as session:
            record = CuratorOpportunityRecommendation(
                identity_profile_id=identity_record.id,
                recommendation_json=recommendation.model_dump(mode="json"),
                context_json=context["persisted_context"],
                source_snapshot_json=[
                    candidate.model_dump(mode="json") for candidate in candidates
                ],
            )
            session.add(record)
            session.flush()
            session.refresh(record)
            return self._to_response(identity_record.id, record)

    def set_bookmark(
        self,
        *,
        opportunity: OpportunityRecommendation,
        bookmarked: bool,
    ) -> OpportunityEngagementResponse | None:
        """Persist bookmark state for one opportunity."""

        identity_record = self.identity_service.get_latest_identity_profile()
        if identity_record is None:
            return None

        with get_db_session() as session:
            record = session.scalars(
                select(CuratorOpportunityBookmark).where(
                    CuratorOpportunityBookmark.identity_profile_id == identity_record.id,
                    CuratorOpportunityBookmark.opportunity_id == opportunity.id,
                )
            ).first()
            if record is None:
                record = CuratorOpportunityBookmark(
                    identity_profile_id=identity_record.id,
                    opportunity_id=opportunity.id,
                    opportunity_json=opportunity.model_dump(mode="json"),
                    bookmarked=bookmarked,
                )
                session.add(record)
            else:
                record.opportunity_json = opportunity.model_dump(mode="json")
                record.bookmarked = bookmarked
                record.updated_at = datetime.now(UTC)
            session.flush()

        return OpportunityEngagementResponse(
            opportunityId=opportunity.id,
            isBookmarked=bookmarked,
            isDismissed=self._dismissal_map(identity_record.id).get(opportunity.id, False),
        )

    def set_dismissed(
        self,
        *,
        opportunity: OpportunityRecommendation,
        dismissed: bool,
    ) -> OpportunityEngagementResponse | None:
        """Persist dismissed state for one opportunity."""

        identity_record = self.identity_service.get_latest_identity_profile()
        if identity_record is None:
            return None

        with get_db_session() as session:
            record = session.scalars(
                select(CuratorOpportunityDismissal).where(
                    CuratorOpportunityDismissal.identity_profile_id
                    == identity_record.id,
                    CuratorOpportunityDismissal.opportunity_id == opportunity.id,
                )
            ).first()
            if record is None:
                record = CuratorOpportunityDismissal(
                    identity_profile_id=identity_record.id,
                    opportunity_id=opportunity.id,
                    opportunity_json=opportunity.model_dump(mode="json"),
                    dismissed=dismissed,
                )
                session.add(record)
            else:
                record.opportunity_json = opportunity.model_dump(mode="json")
                record.dismissed = dismissed
                record.updated_at = datetime.now(UTC)
            session.flush()

        return OpportunityEngagementResponse(
            opportunityId=opportunity.id,
            isBookmarked=self._bookmark_map(identity_record.id).get(opportunity.id, False),
            isDismissed=dismissed,
        )

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
        completed_activities = [
            activity.model_dump(mode="json")
            for phase in journey.phases
            for activity in phase.activities
            if activity.status == "completed"
        ]
        reflections = self._recent_reflections(identity_record.id)
        profile_text = " ".join(
            [
                identity_record.profile.current_identity,
                identity_record.profile.desired_future_identity,
                *identity_record.profile.core_interests,
                *identity_record.profile.growth_themes,
                identity_record.onboarding_json.get("identity", {}).get(
                    "profession",
                    "",
                ),
            ]
        )
        persisted_context = {
            "identityProfileId": identity_record.id,
            "profession": identity_record.onboarding_json.get("identity", {}).get(
                "profession",
                "",
            ),
            "skills": self._extract_skills(profile_text),
            "interests": identity_record.profile.core_interests,
            "weeklyAvailability": identity_record.onboarding_json.get(
                "availability",
                {},
            ).get("weeklyHours"),
            "location": self._extract_location(identity_record.onboarding_json),
            "currentPhase": journey.currentPhase.model_dump(mode="json"),
            "decision": decision.model_dump(mode="json"),
            "completedActivities": completed_activities,
            "reflections": reflections,
        }
        return {
            "agent_context": {
                "identity_profile": identity_record.profile,
                "growth_plan": growth_plan,
                "decision": decision,
                "growth_journey": journey,
                "onboarding_json": identity_record.onboarding_json,
                "completed_activities_json": completed_activities,
                "reflections_json": reflections,
            },
            "persisted_context": persisted_context,
        }

    def _fetch_candidates(self, context: dict[str, Any]) -> list[OpportunityCandidate]:
        persisted = context["persisted_context"]
        keywords = self._keywords(persisted)
        candidates: list[OpportunityCandidate] = []
        fetch_sources = [
            ("GitHub", lambda: self._fetch_github_open_source(keywords)),
            ("Arbeitnow", lambda: self._fetch_arbeitnow_jobs(keywords, persisted)),
            ("Remote OK", lambda: self._fetch_remoteok_jobs(keywords, persisted)),
            ("Devpost", lambda: self._fetch_devpost_hackathons(keywords)),
            ("Reddit", lambda: self._fetch_reddit_communities(keywords)),
            ("Verified directories", lambda: self._static_verified_directories(keywords)),
        ]
        for source_name, fetcher in fetch_sources:
            try:
                candidates.extend(fetcher())
            except Exception as exc:
                logger.warning(
                    "Skipping %s opportunity source after fetch/validation error: %s",
                    source_name,
                    exc,
                )
        unique: dict[str, OpportunityCandidate] = {}
        for candidate in candidates:
            unique.setdefault(candidate.id, candidate)
        return list(unique.values())[:30]

    def _fetch_github_open_source(
        self,
        keywords: list[str],
    ) -> list[OpportunityCandidate]:
        query = "+".join(keywords[:3] or ["good-first-issues"])
        url = (
            "https://api.github.com/search/repositories"
            f"?q={query}+good-first-issues&sort=updated&order=desc&per_page=10"
        )
        data = self._get_json(url)
        items = data.get("items", []) if isinstance(data, dict) else []
        now = datetime.utcnow()
        candidates: list[OpportunityCandidate] = []
        for item in items:
            html_url = item.get("html_url")
            if not html_url:
                continue
            candidates.append(
                OpportunityCandidate(
                    id=self._stable_id("github", html_url),
                    title=self._clean_text(
                        item.get("full_name"),
                        "GitHub project",
                        min_length=2,
                        max_length=240,
                    ),
                    category="Open Source",
                    organizer=item.get("owner", {}).get("login", "GitHub"),
                    location="Online",
                    mode="Online",
                    date=f"Updated {item.get('updated_at', '')[:10]}",
                    description=self._clean_text(
                        item.get("description"),
                        "Open source repository.",
                        min_length=10,
                    ),
                    url=html_url,
                    tags=[
                        tag
                        for tag in [
                            item.get("language"),
                            "open source",
                            "good first issues",
                        ]
                        if tag
                    ],
                    source="GitHub Search API",
                    sourceFetchedAt=now,
                )
            )
        return candidates

    def _fetch_arbeitnow_jobs(
        self,
        keywords: list[str],
        context: dict[str, Any],
    ) -> list[OpportunityCandidate]:
        data = self._get_json("https://www.arbeitnow.com/api/job-board-api")
        items = data.get("data", []) if isinstance(data, dict) else []
        terms = [term.lower() for term in keywords]
        now = datetime.utcnow()
        candidates: list[OpportunityCandidate] = []
        for item in items:
            title = str(item.get("title", ""))
            description = self._strip_html(str(item.get("description", "")))
            haystack = f"{title} {description}".lower()
            if terms and not any(term in haystack for term in terms):
                continue
            url = item.get("url")
            if not url:
                continue
            tags = item.get("tags") if isinstance(item.get("tags"), list) else []
            candidates.append(
                OpportunityCandidate(
                    id=self._stable_id("arbeitnow", url),
                    title=self._clean_text(
                        title,
                        "Professional opportunity",
                        min_length=2,
                        max_length=240,
                    ),
                    category=self._job_category(title, context),
                    organizer=item.get("company_name") or "Arbeitnow employer",
                    location=self._clean_text(
                        item.get("location"),
                        "Online",
                        min_length=2,
                        max_length=180,
                    ),
                    mode="Online" if item.get("remote") else "Offline",
                    date=self._unix_date(item.get("created_at")),
                    description=self._clean_text(
                        description[:420],
                        title,
                        min_length=10,
                    ),
                    url=url,
                    tags=[str(tag) for tag in tags[:8]],
                    source="Arbeitnow Job Board API",
                    sourceFetchedAt=now,
                )
            )
            if len(candidates) >= 12:
                break
        return candidates

    def _fetch_remoteok_jobs(
        self,
        keywords: list[str],
        context: dict[str, Any],
    ) -> list[OpportunityCandidate]:
        data = self._get_json("https://remoteok.com/api")
        items = data if isinstance(data, list) else []
        terms = [term.lower() for term in keywords]
        now = datetime.utcnow()
        candidates: list[OpportunityCandidate] = []
        for item in items[1:]:
            title = str(item.get("position", ""))
            description = self._strip_html(str(item.get("description", "")))
            haystack = f"{title} {description} {' '.join(item.get('tags', []))}".lower()
            if terms and not any(term in haystack for term in terms):
                continue
            url = item.get("url")
            if not url:
                continue
            candidates.append(
                OpportunityCandidate(
                    id=self._stable_id("remoteok", url),
                    title=self._clean_text(
                        title,
                        "Professional opportunity",
                        min_length=2,
                        max_length=240,
                    ),
                    category=self._job_category(title, context),
                    organizer=item.get("company") or "Remote OK employer",
                    location="Online",
                    mode="Online",
                    date=str(item.get("date", "Active")),
                    description=self._clean_text(
                        description[:420],
                        title,
                        min_length=10,
                    ),
                    url=url,
                    tags=[str(tag) for tag in item.get("tags", [])[:8]],
                    source="Remote OK API",
                    sourceFetchedAt=now,
                )
            )
            if len(candidates) >= 12:
                break
        return candidates

    def _fetch_devpost_hackathons(
        self,
        keywords: list[str],
    ) -> list[OpportunityCandidate]:
        url = "https://devpost.com/hackathons"
        html = self._get_text(url)
        now = datetime.utcnow()
        candidates: list[OpportunityCandidate] = []
        for match in re.finditer(
            r'<a[^>]+href="(?P<url>https://[^"]+?\.devpost\.com/[^"]*)"[^>]*>\s*(?P<title>[^<]{4,120})',
            html,
            re.IGNORECASE,
        ):
            title = self._strip_html(match.group("title")).strip()
            link = match.group("url")
            if not title or "hackathon" not in f"{title} {link}".lower():
                continue
            candidates.append(
                OpportunityCandidate(
                    id=self._stable_id("devpost", link),
                    title=title,
                    category="Hackathon",
                    organizer="Devpost",
                    location="Online",
                    mode="Online",
                    date="See listing",
                    description=f"Public Devpost hackathon listing for {title}.",
                    url=link,
                    tags=[*keywords[:4], "hackathon", "devpost"],
                    source="Devpost",
                    sourceFetchedAt=now,
                )
            )
            if len(candidates) >= 10:
                break
        return candidates

    def _fetch_reddit_communities(
        self,
        keywords: list[str],
    ) -> list[OpportunityCandidate]:
        query = "+".join(keywords[:2] or ["technology"])
        data = self._get_json(
            f"https://www.reddit.com/subreddits/search.json?q={query}&limit=8"
        )
        children = data.get("data", {}).get("children", []) if isinstance(data, dict) else []
        now = datetime.utcnow()
        candidates: list[OpportunityCandidate] = []
        for child in children:
            item = child.get("data", {})
            display = item.get("display_name_prefixed") or item.get("display_name")
            permalink = item.get("url")
            if not display or not permalink:
                continue
            candidates.append(
                OpportunityCandidate(
                    id=self._stable_id("reddit", display),
                    title=self._clean_text(
                        display,
                        "Community",
                        min_length=2,
                        max_length=240,
                    ),
                    category="Community",
                    organizer="Reddit",
                    location="Online",
                    mode="Online",
                    date="Active community",
                    description=self._clean_text(
                        item.get("public_description"),
                        f"{display} community.",
                        min_length=10,
                    ),
                    url=f"https://www.reddit.com{permalink}",
                    tags=[*keywords[:4], "community", "reddit"],
                    source="Reddit public search",
                    sourceFetchedAt=now,
                )
            )
        return candidates

    def _static_verified_directories(
        self,
        keywords: list[str],
    ) -> list[OpportunityCandidate]:
        now = datetime.utcnow()
        rows = [
            (
                "Kaggle Competitions",
                "Competition",
                "Kaggle",
                "https://www.kaggle.com/competitions",
                "Active data science and machine learning competitions.",
                ["kaggle", "competition", "data science"],
            ),
            (
                "Unstop Competitions",
                "Competition",
                "Unstop",
                "https://unstop.com/competitions",
                "Student and professional competitions listed on Unstop.",
                ["competition", "unstop"],
            ),
            (
                "LeetCode Contests",
                "Competition",
                "LeetCode",
                "https://leetcode.com/contest/",
                "Recurring programming contests and practice competitions.",
                ["coding", "leetcode", "competition"],
            ),
            (
                "Codeforces Contests",
                "Competition",
                "Codeforces",
                "https://codeforces.com/contests",
                "Upcoming competitive programming contests.",
                ["coding", "codeforces", "competition"],
            ),
            (
                "Google Developer Groups",
                "Meetup",
                "Google Developers",
                "https://gdg.community.dev/",
                "Local and online Google Developer Group events.",
                ["gdg", "meetup", "community"],
            ),
            (
                "AWS User Groups",
                "Meetup",
                "AWS",
                "https://aws.amazon.com/developer/community/usergroups/",
                "AWS community user groups and local events.",
                ["aws", "meetup", "cloud"],
            ),
            (
                "freeCodeCamp Discord",
                "Community",
                "freeCodeCamp",
                "https://discord.gg/freecodecamp",
                "Large programming community for peer help and accountability.",
                ["discord", "community", "programming"],
            ),
            (
                "Google Cloud Certifications",
                "Certification",
                "Google Cloud",
                "https://cloud.google.com/learn/certification",
                "Official Google Cloud certification paths.",
                ["certification", "cloud"],
            ),
            (
                "AWS Certifications",
                "Certification",
                "AWS",
                "https://aws.amazon.com/certification/",
                "Official AWS certification paths.",
                ["certification", "cloud"],
            ),
        ]
        return [
            OpportunityCandidate(
                id=self._stable_id("verified-directory", url),
                title=title,
                category=category,  # type: ignore[arg-type]
                organizer=organizer,
                location="Online",
                mode="Online",
                date="Ongoing",
                description=description,
                url=url,
                tags=list(dict.fromkeys([*tags, *keywords[:3]])),
                source="Verified public directory",
                sourceFetchedAt=now,
            )
            for title, category, organizer, url, description, tags in rows
        ]

    def _validate_and_hydrate(
        self,
        identity_profile_id: int,
        output: OpportunityAgentOutput,
        candidates: list[OpportunityCandidate],
    ) -> OpportunityAgentOutput:
        candidate_map = {candidate.id: candidate for candidate in candidates}
        bookmarks = self._bookmark_map(identity_profile_id)
        dismissals = self._dismissal_map(identity_profile_id)
        hydrated: list[OpportunityRecommendation] = []
        for opportunity in output.opportunities:
            candidate = candidate_map.get(opportunity.id)
            if candidate is None:
                continue
            hydrated.append(
                opportunity.model_copy(
                    update={
                        "title": candidate.title,
                        "category": candidate.category,
                        "organizer": candidate.organizer,
                        "location": candidate.location,
                        "mode": candidate.mode,
                        "date": candidate.date,
                        "description": candidate.description,
                        "url": candidate.url,
                        "tags": list(dict.fromkeys([*candidate.tags, *opportunity.tags]))[:12],
                        "source": candidate.source,
                        "isBookmarked": bookmarks.get(candidate.id, False),
                        "isDismissed": dismissals.get(candidate.id, False),
                    }
                )
            )
        hydrated.sort(key=lambda item: (-item.relevanceScore, item.date))
        return output.model_copy(update={"opportunities": hydrated})

    def _fallback_rank(
        self,
        candidates: list[OpportunityCandidate],
        context: dict[str, Any],
    ) -> OpportunityAgentOutput:
        keywords = self._keywords(context["persisted_context"])
        interests = [
            str(item).lower()
            for item in context["persisted_context"].get("interests", [])
        ]
        decision_focus = str(
            context["persisted_context"].get("decision", {}).get("currentFocus", "")
        ).lower()
        ranked: list[OpportunityRecommendation] = []
        for candidate in candidates:
            haystack = " ".join(
                [
                    candidate.title,
                    candidate.organizer,
                    candidate.description,
                    candidate.category,
                    *candidate.tags,
                ]
            ).lower()
            keyword_hits = sum(1 for keyword in keywords if keyword in haystack)
            interest_hits = sum(1 for interest in interests if interest in haystack)
            focus_hit = 1 if decision_focus and decision_focus[:24] in haystack else 0
            score = min(100, 52 + keyword_hits * 8 + interest_hits * 6 + focus_hit * 10)
            if candidate.mode == "Online":
                score += 4
            ranked.append(
                OpportunityRecommendation(
                    id=candidate.id,
                    title=candidate.title,
                    category=candidate.category,
                    organizer=candidate.organizer,
                    location=candidate.location,
                    mode=candidate.mode,
                    date=candidate.date,
                    description=candidate.description,
                    relevanceScore=min(100, score),
                    aiExplanation=(
                        "This source-backed opportunity matches your profile through "
                        f"{', '.join(keywords[:3]) or 'your current growth focus'} "
                        "and can fit around the availability captured in your journey."
                    ),
                    url=candidate.url,
                    tags=candidate.tags,
                    source=candidate.source,
                )
            )
        ranked.sort(key=lambda item: (-item.relevanceScore, item.date))
        return OpportunityAgentOutput(
            recommendationSummary=(
                "These real opportunities were fetched from public sources and "
                "ranked against your profile, current phase, interests, and availability."
            ),
            selectionReasons=[
                "Matched to your Curator identity profile",
                "Filtered to source-backed public listings",
                "Sorted by relevance and timing",
            ],
            opportunities=ranked[:10],
        )

    def _candidate_payload(
        self,
        candidates: list[OpportunityCandidate],
    ) -> list[dict[str, Any]]:
        return [
            {
                "id": candidate.id,
                "title": candidate.title,
                "category": candidate.category,
                "organizer": candidate.organizer,
                "location": candidate.location,
                "mode": candidate.mode,
                "date": candidate.date,
                "description": candidate.description[:360],
                "url": str(candidate.url),
                "tags": candidate.tags[:8],
                "source": candidate.source,
            }
            for candidate in candidates
        ]

    def _to_response(
        self,
        identity_profile_id: int,
        record: CuratorOpportunityRecommendation,
    ) -> OpportunitiesResponse:
        recommendation = OpportunityAgentOutput.model_validate(
            record.recommendation_json
        )
        candidates = [
            OpportunityCandidate.model_validate(candidate)
            for candidate in record.source_snapshot_json
        ]
        recommendation = self._validate_and_hydrate(
            identity_profile_id,
            recommendation,
            candidates,
        )
        return OpportunitiesResponse(
            identityProfileId=identity_profile_id,
            recommendationId=record.id,
            generatedAt=record.created_at,
            staleAfter=record.created_at + CACHE_TTL,
            recommendationSummary=recommendation.recommendationSummary,
            selectionReasons=recommendation.selectionReasons,
            opportunities=[
                opportunity
                for opportunity in recommendation.opportunities
                if not opportunity.isDismissed
            ],
        )

    def _get_latest_recommendation(
        self,
        identity_profile_id: int,
    ) -> CuratorOpportunityRecommendation | None:
        with get_db_session() as session:
            return session.scalars(
                select(CuratorOpportunityRecommendation)
                .where(
                    CuratorOpportunityRecommendation.identity_profile_id
                    == identity_profile_id
                )
                .order_by(
                    CuratorOpportunityRecommendation.created_at.desc(),
                    CuratorOpportunityRecommendation.id.desc(),
                )
            ).first()

    def _recent_reflections(self, identity_profile_id: int) -> list[dict[str, Any]]:
        with get_db_session() as session:
            conversations = session.scalars(
                select(CuratorCoachConversation)
                .where(CuratorCoachConversation.identity_profile_id == identity_profile_id)
                .order_by(CuratorCoachConversation.updated_at.desc())
                .limit(5)
            ).all()
            ids = [conversation.id for conversation in conversations]
            if not ids:
                return []
            messages = session.scalars(
                select(CuratorCoachMessage)
                .where(CuratorCoachMessage.conversation_id.in_(ids))
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

    def _bookmark_map(self, identity_profile_id: int) -> dict[str, bool]:
        with get_db_session() as session:
            records = session.scalars(
                select(CuratorOpportunityBookmark).where(
                    CuratorOpportunityBookmark.identity_profile_id == identity_profile_id
                )
            ).all()
            return {record.opportunity_id: record.bookmarked for record in records}

    def _dismissal_map(self, identity_profile_id: int) -> dict[str, bool]:
        with get_db_session() as session:
            records = session.scalars(
                select(CuratorOpportunityDismissal).where(
                    CuratorOpportunityDismissal.identity_profile_id == identity_profile_id
                )
            ).all()
            return {record.opportunity_id: record.dismissed for record in records}

    def _ensure_tables(self) -> None:
        for table in (
            CuratorOpportunityRecommendation.__table__,
            CuratorOpportunityBookmark.__table__,
            CuratorOpportunityDismissal.__table__,
            CuratorCoachConversation.__table__,
            CuratorCoachMessage.__table__,
        ):
            table.create(bind=engine, checkfirst=True)

    def _is_stale(self, created_at: datetime) -> bool:
        return datetime.utcnow() - created_at.replace(tzinfo=None) > CACHE_TTL

    def _keywords(self, context: dict[str, Any]) -> list[str]:
        values = [
            context.get("profession", ""),
            *context.get("skills", []),
            *context.get("interests", []),
            context.get("decision", {}).get("currentFocus", ""),
        ]
        words: list[str] = []
        for value in values:
            words.extend(re.findall(r"[A-Za-z][A-Za-z0-9+#.-]{1,30}", str(value)))
        blocked = {"the", "and", "for", "with", "into", "from", "that", "this"}
        unique = []
        for word in words:
            cleaned = word.lower()
            if cleaned not in blocked and cleaned not in unique:
                unique.append(cleaned)
        return unique[:8] or ["technology"]

    def _extract_skills(self, text: str) -> list[str]:
        known = [
            "python",
            "javascript",
            "typescript",
            "react",
            "node",
            "ai",
            "machine learning",
            "data science",
            "cloud",
            "aws",
            "google cloud",
            "devops",
            "design",
            "product",
            "marketing",
        ]
        lower = text.lower()
        return [skill for skill in known if skill in lower]

    def _extract_location(self, onboarding_json: dict[str, Any]) -> str:
        text = str(onboarding_json)
        match = re.search(
            r"\b(?:in|from|near)\s+([A-Z][A-Za-z .-]+,\s*[A-Z][A-Za-z .-]+)",
            text,
        )
        return match.group(1) if match else ""

    def _job_category(self, title: str, context: dict[str, Any]) -> str:
        lowered = title.lower()
        if "intern" in lowered or "trainee" in lowered:
            return "Internship"
        return "Job"

    def _get_json(self, url: str) -> Any:
        try:
            response = requests.get(
                url,
                headers={"User-Agent": "saarthi-ai-opportunity-agent/0.1"},
                timeout=12,
            )
            response.raise_for_status()
            return response.json()
        except requests.RequestException:
            return {}
        except ValueError:
            return {}

    def _get_text(self, url: str) -> str:
        try:
            response = requests.get(
                url,
                headers={"User-Agent": "saarthi-ai-opportunity-agent/0.1"},
                timeout=12,
            )
            response.raise_for_status()
            return response.text
        except requests.RequestException:
            return ""

    def _strip_html(self, value: str) -> str:
        return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", value)).strip()

    def _clean_text(
        self,
        value: Any,
        fallback: str,
        *,
        min_length: int,
        max_length: int = 1200,
    ) -> str:
        text = str(value or "").strip()
        if len(text) < min_length:
            text = str(fallback or "").strip()
        if len(text) < min_length:
            text = "Opportunity matched to your growth profile."
        return text[:max_length]

    def _unix_date(self, value: Any) -> str:
        try:
            return datetime.utcfromtimestamp(int(value)).date().isoformat()
        except (TypeError, ValueError, OSError):
            return "Active"

    def _stable_id(self, prefix: str, value: str) -> str:
        digest = hashlib.sha1(value.encode("utf-8")).hexdigest()[:16]
        return f"{prefix}-{digest}"
