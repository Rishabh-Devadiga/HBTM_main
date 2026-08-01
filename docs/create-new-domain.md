# Create A New Domain

This guide uses `healthcare` as an example. A domain owns its prompts, schemas,
agents, workflows, API routers, metadata, and frontend display configuration.
Shared framework code should not need domain-specific edits.

## 1. Create The Backend Package

Create this structure:

```text
backend/domains/healthcare/
|-- __init__.py
|-- config/
|   |-- __init__.py
|   `-- domain.json
|-- prompts/
|   |-- __init__.py
|   `-- *.md
|-- schemas/
|   |-- __init__.py
|   `-- *.py
|-- agents/
|   |-- __init__.py
|   `-- *.py
`-- workflows/
    |-- __init__.py
    `-- *.py
```

The metadata file must be a JSON object. Its `domain_name`, when present, must
match the registered name:

```json
{
  "domain_name": "healthcare",
  "assistant_display_name": "Care Guide"
}
```

Additional metadata keys are domain-defined. Access them through the loaded
domain rather than adding domain constants to framework modules.

## 2. Organize Prompts

Store prompts in `backend/domains/healthcare/prompts/`. Keep one file per
agent or focused capability. The Learning domain uses Markdown sections for
role, goal, backstory, and task instructions; following that convention keeps
agent modules small and reviewable.

Prompt loaders belong in the domain's `prompts/__init__.py`. Validate missing
files and sections with clear errors. Do not place healthcare prompt text in
`backend/framework/`.

## 3. Create Schemas

Put Pydantic request, structured-output, and workflow schemas under
`schemas/`. Domain agents and workflows should import these schemas directly.
Use `backend/api/schemas/common.py` for shared REST envelopes instead of
duplicating success and error wrappers.

## 4. Create Agents

Put agent factories and execution helpers under `agents/`. Build CrewAI agents
with `create_base_agent()` and run structured tasks with
`run_structured_agent()` from `backend/framework/agents/base_agent.py`.

Each agent should have one clear responsibility. It may depend on domain
prompts and schemas plus framework utilities; it should not own API routing or
database transaction orchestration.

## 5. Create Workflows

Put sequencing, persistence coordination, and domain services under
`workflows/`. Workflows compose agents and translate their outputs into the
domain's API/persistence behavior.

Keep API endpoints thin. Validation and HTTP error mapping belong in route
modules; agent sequencing belongs in workflows.

## 6. Add API Routes

Create the required route module under `backend/api/routes/`. Existing API
modules are currently stored there for compatibility. Each module must export
an `APIRouter` named `router`.

Do not import the new router from `backend/api/router.py`. The domain registry
loads it dynamically.

## 7. Register The Backend Domain

Add one registration to `backend/domains/__init__.py`:

```python
register_domain(
    DomainRegistration(
        name="healthcare",
        package="backend.domains.healthcare",
        api_router_modules=(
            "backend.api.routes.healthcare",
        ),
    )
)
```

Only one registration should use `default=True`.

Select the domain at runtime:

```dotenv
ACTIVE_DOMAIN=healthcare
```

An unknown name fails with the available registered domains.

## 8. Create Frontend Configuration

Create `frontend/src/domain/domains/healthcare.ts` and implement
`DomainConfig` from `frontend/src/domain/types.ts`.

The configuration owns:

- application and assistant names
- document title and workspace label
- sidebar navigation labels, paths, and icons
- feature names
- dashboard and page titles
- empty, loading, validation, and accessible copy
- landing-page content
- calendar display metadata

Register it in `frontend/src/domain/index.ts`:

```ts
import { healthcareDomain } from "@/domain/domains/healthcare";

const domainRegistry: Record<string, DomainConfig> = {
  [learningDomain.id]: learningDomain,
  [healthcareDomain.id]: healthcareDomain,
};
```

Select it at build/runtime:

```dotenv
VITE_ACTIVE_DOMAIN=healthcare
```

Keep route paths stable unless a separately approved API/UI migration requires
otherwise. Configuration changes labels and metadata; it does not silently
rewrite API contracts.

## 9. Verify The Domain

```powershell
$env:ACTIVE_DOMAIN = "healthcare"
$env:MOCK_MODE = "true"
.\venv\Scripts\python.exe -c "from backend.framework.domains.loader import load_active_domain; print(load_active_domain().name)"

Set-Location frontend
$env:VITE_ACTIVE_DOMAIN = "healthcare"
npm run build
npm run lint
```

Also exercise every registered router and domain workflow in mock mode before
using paid model credentials.

## Domain Checklist

- Backend package and `domain.json` exist.
- Domain name matches registration and environment values.
- Prompts contain no framework-owned copy.
- Agents use shared framework factories.
- Workflows own sequencing and business rules.
- Router modules export `router`.
- Backend registration lists every domain router.
- Frontend configuration implements `DomainConfig`.
- Frontend registry includes the new configuration.
- Backend and frontend select the same domain.
- Builds, linting, imports, and mock workflow tests pass.
