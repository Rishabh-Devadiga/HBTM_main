"""Application-owned domain registrations."""

from backend.framework.domains.registry import DomainRegistration, register_domain


register_domain(
    DomainRegistration(
        name="learning",
        package="backend.domains.learning",
        api_router_modules=(
            "backend.api.routes.learning",
            "backend.api.routes.calendar",
            "backend.api.routes.quiz",
            "backend.api.routes.mentor",
            "backend.api.routes.interview",
        ),
    ),
    default=True,
)

register_domain(
    DomainRegistration(
        name="curator",
        package="backend.domains.curator",
        api_router_modules=(
            "backend.domains.curator.api.auth",
            "backend.domains.curator.api.onboarding",
            "backend.domains.curator.api.coach",
            "backend.domains.curator.api.resources",
            "backend.domains.curator.api.opportunities",
            "backend.domains.curator.api.community",
        ),
    ),
)
