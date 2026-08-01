"""Learning-domain configuration loaded from external metadata files."""

from __future__ import annotations

import json
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path


CONFIG_DIR = Path(__file__).resolve().parent


@dataclass(frozen=True)
class LearningDomainConfig:
    """Configurable learning-domain metadata."""

    domain_name: str
    assistant_display_name: str
    default_user_name: str
    default_learning_plan_title_template: str
    roadmap_title_suffix: str
    default_learning_goal_label: str
    default_subject_label: str
    default_skill_level_label: str
    default_available_time_label: str
    default_target_deadline_label: str
    mentor_not_provided_label: str
    mentor_no_previous_conversation_label: str
    initial_recent_activity: str


@lru_cache
def get_learning_domain_config() -> LearningDomainConfig:
    """Return cached learning-domain configuration metadata."""

    payload = json.loads((CONFIG_DIR / "domain.json").read_text(encoding="utf-8"))
    return LearningDomainConfig(**payload)
