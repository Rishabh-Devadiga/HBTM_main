"""Lightweight registry for application domains."""

from __future__ import annotations

from dataclasses import dataclass
from importlib import import_module


@dataclass(frozen=True)
class DomainRegistration:
    """Static information needed to locate one application domain."""

    name: str
    package: str
    api_router_modules: tuple[str, ...] = ()


_DOMAINS: dict[str, DomainRegistration] = {}
_DEFAULT_DOMAIN: str | None = None


def _load_domain_catalog() -> None:
    """Import the application-owned catalog that performs registrations."""

    import_module("backend.domains")


def register_domain(
    registration: DomainRegistration,
    *,
    default: bool = False,
) -> None:
    """Register a domain, optionally as the default when none is configured."""

    global _DEFAULT_DOMAIN

    name = registration.name.strip()
    if not name:
        raise ValueError("Domain name cannot be empty.")
    if name != registration.name:
        raise ValueError("Domain name cannot contain leading or trailing whitespace.")
    if not registration.package.strip():
        raise ValueError("Domain package cannot be empty.")

    existing = _DOMAINS.get(name)
    if existing is not None and existing != registration:
        raise ValueError(f"Domain {name!r} is already registered.")
    _DOMAINS[name] = registration

    if default:
        if _DEFAULT_DOMAIN is not None and _DEFAULT_DOMAIN != name:
            raise ValueError(
                f"Default domain is already registered as {_DEFAULT_DOMAIN!r}."
            )
        _DEFAULT_DOMAIN = name


def list_domains() -> tuple[str, ...]:
    """Return registered domain names in deterministic order."""

    _load_domain_catalog()
    return tuple(sorted(_DOMAINS))


def get_registered_domain(name: str) -> DomainRegistration:
    """Return one registered domain or raise a configuration error."""

    _load_domain_catalog()
    try:
        return _DOMAINS[name]
    except KeyError as exc:
        available = ", ".join(list_domains()) or "none"
        raise ValueError(
            f"Unknown domain {name!r}. Available domains: {available}."
        ) from exc


def get_default_domain() -> DomainRegistration:
    """Return the registered default domain."""

    _load_domain_catalog()
    if _DEFAULT_DOMAIN is None:
        raise RuntimeError(
            "No default domain is registered and ACTIVE_DOMAIN is not configured."
        )
    return get_registered_domain(_DEFAULT_DOMAIN)
