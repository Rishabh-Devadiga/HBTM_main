# Agentic AI Starter

Agentic AI Starter is a domain-configurable foundation for building agentic AI
applications with FastAPI, CrewAI, Gemini, PostgreSQL, and React.

The reusable framework is separated from domain-owned prompts, schemas, agents,
workflows, API routers, and frontend presentation. The included Learning domain
is the default reference implementation.

## Architecture

```text
React application shell
  -> frontend active-domain configuration
  -> FastAPI shared router
  -> backend active-domain routers
  -> domain workflows
  -> domain agents
  -> shared CrewAI/Gemini framework
  -> SQLAlchemy persistence
```

The backend selects a registered domain with `ACTIVE_DOMAIN`. The frontend
selects its matching typed configuration with `VITE_ACTIVE_DOMAIN`.

See:

- [Architecture](docs/architecture.md)
- [Create a new domain](docs/create-new-domain.md)
- [Contributing](docs/contributing.md)

## Project Structure

```text
agentic-ai-starter/
|-- backend/
|   |-- api/                    # FastAPI routers and REST envelopes
|   |-- database/               # SQLAlchemy connection, models, and CRUD
|   |-- domains/
|   |   `-- learning/
|   |       |-- config/         # Domain metadata
|   |       |-- prompts/        # Markdown prompt definitions
|   |       |-- schemas/        # Domain Pydantic models
|   |       |-- agents/         # Domain agent factories and execution
|   |       `-- workflows/      # Orchestration and domain services
|   |-- framework/
|   |   |-- agents/             # Shared CrewAI agent helpers
|   |   |-- base/               # Settings, LLM, and API-key rotation
|   |   |-- domains/            # Registry and active-domain loader
|   |   `-- tools/              # Reusable integration utilities
|   |-- schemas/                # Compatibility endpoint schemas
|   |-- scripts/                # Smoke and integration test scripts
|   |-- services/               # Compatibility services
|   `-- main.py                 # FastAPI application
|-- frontend/
|   |-- src/
|   |   |-- domain/             # Typed frontend domain registry/config
|   |   |-- components/
|   |   |-- pages/
|   |   |-- context/
|   |   |-- api/
|   |   |-- services/
|   |   |-- hooks/
|   |   |-- types/
|   |   `-- utils/
|   `-- package.json
|-- docs/
|-- .env.example
|-- requirements.txt
`-- README.md
```

## Requirements

- Python 3.12+
- Node.js 20+
- npm
- PostgreSQL for persistent workflows
- Gemini API key unless `MOCK_MODE=true`
- Optional YouTube Data API keys
- Optional Google OAuth credentials for calendar integration

## Backend Setup

```powershell
Copy-Item .env.example .env
py -3.12 -m venv venv
.\venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
```

Create database tables after configuring `DATABASE_URL`:

```powershell
python -m backend.scripts.create_tables
```

Start the API:

```powershell
uvicorn backend.main:app --reload
```

Swagger UI is available at `http://127.0.0.1:8000/docs`.

## Frontend Setup

```powershell
Set-Location frontend
npm ci
Copy-Item .env.example .env
npm run dev
```

The development server runs at `http://127.0.0.1:5173`.

Keep `ACTIVE_DOMAIN` and `VITE_ACTIVE_DOMAIN` aligned.

## Environment Variables

### Backend `.env`

| Variable | Required | Purpose |
| --- | --- | --- |
| `ACTIVE_DOMAIN` | No | Registered backend domain; defaults to `learning`. |
| `MOCK_MODE` | No | Uses deterministic local agent outputs when `true`. |
| `GEMINI_API_KEY_1` to `_4` | In real mode | Rotating Gemini API keys. |
| `GEMINI_API_KEY` | No | Legacy single-key fallback. |
| `YOUTUBE_API_KEY_1` to `_4` | No | Rotating YouTube Data API keys. |
| `YOUTUBE_API_KEY` | No | Legacy single-key fallback. |
| `DATABASE_URL` | For persistence | SQLAlchemy PostgreSQL connection URL. |
| `REDIS_URL` | No | Reserved cache/service connection URL. |
| `GOOGLE_CLIENT_ID` | For calendar OAuth | Google OAuth client ID. |
| `GOOGLE_CLIENT_SECRET` | For calendar OAuth | Google OAuth client secret. |

Example:

```dotenv
ACTIVE_DOMAIN=learning
MOCK_MODE=true
DATABASE_URL=postgresql+psycopg2://user:password@localhost:5432/agentic_ai
GEMINI_API_KEY_1=
YOUTUBE_API_KEY_1=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
REDIS_URL=
```

### Frontend `frontend/.env`

| Variable | Required | Purpose |
| --- | --- | --- |
| `VITE_API_BASE_URL` | Yes | FastAPI base URL. |
| `VITE_ACTIVE_DOMAIN` | No | Frontend domain config; defaults to `learning`. |
| `YOUTUBE_API_KEY_1` to `_4` | No | YouTube keys loaded by Vite. |
| `VITE_GOOGLE_CLIENT_ID` | For calendar OAuth | Browser Google OAuth client ID. |

## Domain Development

Backend domains are registered in `backend/domains/__init__.py`. Each
registration declares:

- stable domain name
- Python package
- domain API router modules
- whether it is the default domain

Frontend domains implement `DomainConfig` in `frontend/src/domain/domains/`
and are registered in `frontend/src/domain/index.ts`.

The frontend configuration controls branding, navigation, icons, feature names,
page titles, dashboard labels, empty/loading/error states, accessible copy, and
landing content. It does not rename routes or backend endpoints.

Follow [Create a new domain](docs/create-new-domain.md) for the complete
workflow.

## Prompts And Agents

Prompts are Markdown files under
`backend/domains/<domain>/prompts/`. Domain prompt loaders validate and expose
the required blocks.

Agents live under `backend/domains/<domain>/agents/` and use the shared
factories in `backend/framework/agents/base_agent.py`. Workflows live under
`backend/domains/<domain>/workflows/` and coordinate agents, persistence, and
domain services.

Framework modules should never contain domain prompt text.

## Verification

Backend syntax and import verification:

```powershell
.\venv\Scripts\python.exe -m compileall -q backend
$env:MOCK_MODE = "true"
.\venv\Scripts\python.exe -c "from fastapi.testclient import TestClient; from backend.main import app; print(TestClient(app).get('/').status_code)"
```

Frontend verification:

```powershell
Set-Location frontend
npm run build
npm run lint
```

Useful backend scripts include:

```powershell
python -m backend.scripts.test_gemini
python -m backend.scripts.test_crewai
python -m backend.scripts.test_intent_agent
python -m backend.scripts.test_planner_agent
python -m backend.scripts.test_learning_crew
python -m backend.scripts.test_api
```

External-service tests require their respective credentials. Prefer mock mode
for deterministic local checks.

## Deployment

This repository does not prescribe a container or cloud provider. Deploy the
backend and frontend as separate services.

### Backend

1. Provision Python 3.12 and PostgreSQL.
2. Install `requirements.txt`.
3. configure production environment variables and secrets.
4. Run `python -m backend.scripts.create_tables`.
5. Start FastAPI with a production process manager, for example:

```bash
uvicorn backend.main:app --host 0.0.0.0 --port 8000
```

6. Terminate TLS at the platform/load balancer.
7. Restrict CORS origins before exposing a non-local frontend.

### Frontend

1. Set `VITE_API_BASE_URL` and `VITE_ACTIVE_DOMAIN` at build time.
2. Run `npm ci`.
3. Run `npm run build`.
4. Serve `frontend/dist/` from a static host with SPA fallback to
   `index.html`.
5. Configure the Google OAuth client for the deployed origin if calendar
   integration is enabled.

### Production Checks

- Backend and frontend use the same domain.
- Database connectivity and tables are ready.
- Secrets are stored in the deployment platform, not source control.
- `/health` and `/docs` are reachable as intended.
- CORS allows only approved frontend origins.
- Frontend routes use SPA fallback.
- External API quotas and OAuth redirect/origin settings are configured.
- Logs and error monitoring are enabled.

## Release Checklist

- [ ] Version and release notes are prepared.
- [ ] `ACTIVE_DOMAIN` and `VITE_ACTIVE_DOMAIN` match.
- [ ] Backend compilation passes.
- [ ] Backend mock workflow/API tests pass.
- [ ] Frontend build passes.
- [ ] Frontend lint passes.
- [ ] No secrets, logs, caches, or build output are tracked.
- [ ] Domain branding appears only in domain-owned files.
- [ ] API paths and response envelopes are unchanged or versioned.
- [ ] Database migrations/table setup are complete.
- [ ] Production CORS and frontend API URL are configured.
- [ ] OAuth origins and credentials are configured when enabled.
- [ ] Health checks, logging, and rollback procedures are ready.
