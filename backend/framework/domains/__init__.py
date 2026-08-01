"""Domain registration and loading infrastructure."""

from backend.framework.domains.loader import LoadedDomain, load_active_domain, load_domain
from backend.framework.domains.registry import (
    DomainRegistration,
    get_registered_domain,
    list_domains,
    register_domain,
)

__all__ = [
    "DomainRegistration",
    "LoadedDomain",
    "get_registered_domain",
    "list_domains",
    "load_active_domain",
    "load_domain",
    "register_domain",
]
