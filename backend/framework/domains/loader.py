"""Configuration-driven loading for registered application domains."""

from __future__ import annotations

import json
from dataclasses import dataclass
from functools import lru_cache
from importlib import import_module
from pathlib import Path
from types import MappingProxyType
from typing import Any, Mapping

from backend.framework.base.config import get_settings
from backend.framework.domains.registry import (
    DomainRegistration,
    get_default_domain,
    get_registered_domain,
)


@dataclass(frozen=True)
class LoadedDomain:
    """Resolved package locations and metadata for one domain."""

    registration: DomainRegistration
    package_path: Path
    metadata: Mapping[str, Any]

    @property
    def name(self) -> str:
        return self.registration.name

    @property
    def package(self) -> str:
        return self.registration.package

    @property
    def config_path(self) -> Path:
        return self.package_path / "config"

    @property
    def prompts_path(self) -> Path:
        return self.package_path / "prompts"

    @property
    def agents_path(self) -> Path:
        return self.package_path / "agents"

    @property
    def workflows_path(self) -> Path:
        return self.package_path / "workflows"

    @property
    def schemas_path(self) -> Path:
        return self.package_path / "schemas"

    @property
    def agents_module(self) -> str:
        return f"{self.package}.agents"

    @property
    def workflows_module(self) -> str:
        return f"{self.package}.workflows"

    @property
    def schemas_module(self) -> str:
        return f"{self.package}.schemas"

    @property
    def api_router_modules(self) -> tuple[str, ...]:
        return self.registration.api_router_modules


@lru_cache
def load_domain(name: str) -> LoadedDomain:
    """Load a registered domain package and its JSON metadata."""

    registration = get_registered_domain(name)
    package_module = import_module(registration.package)
    package_file = getattr(package_module, "__file__", None)
    if package_file is None:
        raise RuntimeError(
            f"Domain package {registration.package!r} has no filesystem location."
        )

    package_path = Path(package_file).resolve().parent
    metadata_path = package_path / "config" / "domain.json"
    if not metadata_path.is_file():
        raise RuntimeError(
            f"Domain {name!r} is missing metadata at {metadata_path}."
        )

    metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
    if not isinstance(metadata, dict):
        raise RuntimeError(f"Domain metadata for {name!r} must be a JSON object.")
    metadata_name = metadata.get("domain_name")
    if metadata_name is not None and metadata_name != name:
        raise RuntimeError(
            f"Domain metadata name {metadata_name!r} does not match {name!r}."
        )

    return LoadedDomain(
        registration=registration,
        package_path=package_path,
        metadata=MappingProxyType(metadata),
    )


def load_active_domain() -> LoadedDomain:
    """Load the configured domain or the registry default."""

    configured_name = get_settings().active_domain
    registration = (
        get_registered_domain(configured_name)
        if configured_name is not None
        else get_default_domain()
    )
    return load_domain(registration.name)
