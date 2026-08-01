# Architecture

Agentic AI Starter separates reusable application infrastructure from
domain-owned behavior.

## Runtime Layers

1. `backend/framework/` provides shared configuration, LLM construction,
   agent factories, retry handling, domain registration, domain loading, and
   reusable tools.
2. `backend/domains/` contains application domains. Each domain owns its
   metadata, prompts, schemas, agents, workflows, and API route modules.
3. `backend/api/` composes framework routes with the API routers declared by
   the active domain.
4. `backend/database/` provides the current SQLAlchemy persistence layer.
5. `frontend/src/domain/` selects frontend branding, navigation, labels,
   feature names, icons, and display copy.
6. `frontend/src/` contains the reusable React shell and existing feature
   pages.

## Domain Selection

The backend reads `ACTIVE_DOMAIN`. `load_active_domain()` resolves the
registered package, loads `config/domain.json`, and exposes its router modules
to the top-level API router.

The frontend reads `VITE_ACTIVE_DOMAIN`. Its registry resolves a typed
`DomainConfig`; unknown or missing values fall back to the Learning domain.

Deployments should set both variables to the same domain name.

## Backend Request Flow

```text
HTTP request
  -> FastAPI application
  -> shared API router
  -> active-domain route
  -> domain workflow/service
  -> domain agents
  -> framework LLM/retry utilities
  -> persistence and response schemas
```

The compatibility `/chat` endpoint remains outside a domain workflow so
existing clients can submit standalone prompts without starting a domain
session.

## Domain Package Contract

The Learning domain demonstrates the expected layout:

```text
backend/domains/<domain>/
|-- __init__.py
|-- config/
|   `-- domain.json
|-- prompts/
|   |-- __init__.py
|   `-- *.md
|-- schemas/
|   `-- *.py
|-- agents/
|   `-- *.py
`-- workflows/
    `-- *.py
```

`backend/domains/__init__.py` is the application-owned catalog. Framework code
does not import a concrete domain directly.

## Prompts

Prompts live under each domain's `prompts/` directory. Markdown files keep
role, goal, backstory, and task instructions outside Python modules. Domain
prompt loaders parse the required blocks, and agents import only the prompt
content they own.

Prompts are domain behavior. Shared framework modules must not contain
domain-specific prompt text.

## Agents And Workflows

Agents are narrow domain units built with the shared factory in
`backend/framework/agents/base_agent.py`. The factory centralizes LLM defaults,
retry behavior, and structured output execution.

Workflows coordinate agents, persistence, and domain services. They belong to
the domain because sequencing and business rules vary by use case.

## Frontend Configuration

`frontend/src/domain/types.ts` defines the configuration contract.
`frontend/src/domain/domains/learning.ts` contains Learning-owned branding and
copy. `frontend/src/domain/index.ts` is the registry and active-domain selector.

Routes and API endpoints are intentionally not generated from this
configuration. Existing paths remain stable while navigation labels, icons,
page titles, cards, empty states, and branding are domain-configurable.

## Stability Boundaries

- API paths and response envelopes are compatibility contracts.
- Database table and column names are persistence contracts.
- Prompt files are domain behavior and should change only intentionally.
- Framework modules must not import concrete domain agents or workflows.
- Domain modules may depend on framework utilities.
- Frontend shell components may depend on `activeDomain`, not a concrete
  domain configuration.
