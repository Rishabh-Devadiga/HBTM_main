# Contributing

## Principles

- Keep framework code reusable and domain code explicit.
- Preserve API paths, response envelopes, database contracts, and established
  workflows unless a change is intentionally versioned.
- Keep prompts in domain prompt files.
- Keep UI copy and branding in frontend domain configuration.
- Prefer focused changes over unrelated refactors.
- Never commit secrets, local databases, generated logs, caches, or build
  output.

## Development Setup

```powershell
Copy-Item .env.example .env
py -3.12 -m venv venv
.\venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt

Set-Location frontend
npm ci
Copy-Item .env.example .env
```

Use `MOCK_MODE=true` for deterministic workflow development without Gemini
requests.

## Change Placement

Use `backend/framework/` for capabilities that apply to every domain:
configuration, LLM construction, retries, registries, loaders, and generic
tools.

Use `backend/domains/<name>/` for prompts, schemas, agents, workflows, and
domain metadata.

Use `backend/api/` for HTTP routing and shared REST envelopes. Domain routers
must be declared by their registration.

Use `frontend/src/domain/` for application branding, navigation metadata,
feature labels, page copy, and icons. Shared React components should import
`activeDomain`, not a concrete domain configuration.

## Code Quality

Before opening a pull request:

```powershell
.\venv\Scripts\python.exe -m compileall -q backend

Set-Location frontend
npm run build
npm run lint
```

Run the relevant scripts under `backend/scripts/`. Tests that call Gemini or
external services require configured credentials and may consume quota.

## Pull Request Checklist

- The change has one clear purpose.
- No secrets or generated artifacts are included.
- API and database compatibility is documented.
- New domain behavior is isolated to a domain package.
- New frontend copy is placed in domain configuration.
- Prompt changes are called out explicitly.
- Backend compilation passes.
- Frontend build and lint pass.
- Relevant mock/integration tests pass.
- README or `docs/` is updated when architecture or setup changes.

## Commit Guidance

Use short, imperative commit subjects. Include context in the body when a
change affects compatibility, domain registration, deployment configuration,
or external services.

Do not mix generated formatting churn with behavioral changes. Do not rewrite
another contributor's unrelated work.

## Reporting Issues

Include:

- operating system and Python/Node versions
- active backend and frontend domain values
- mock versus real model mode
- command used
- complete error message and stack trace
- expected and actual behavior

Redact API keys, OAuth credentials, database URLs, tokens, and user data.
