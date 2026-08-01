# Curator

Curator is an AI Growth Companion that helps individuals transform passive content consumption into intentional personal growth.

Instead of recommending content based on engagement, Curator understands a user's aspirations, habits, interests, and evolving identity to continuously curate the most relevant knowledge, media, and experiences.

## Features

- Identity-based onboarding
- AI-generated growth plans
- Personalized content curation
- Adaptive recommendations
- Progress tracking
- Reflection and habit support
- Multi-agent architecture

## Architecture

```
Frontend (React)

        │

        ▼

Backend (FastAPI)

        │

        ▼

Identity Agent
        │
Planner Agent
        │
Curator Agent
        │
Coach Agent

        ▼

Gemini

        ▼

PostgreSQL
```

## Tech Stack

**Frontend**
- React
- TypeScript
- Vite
- Tailwind CSS

**Backend**
- FastAPI
- Python
- SQLAlchemy
- PostgreSQL

**AI**
- Google Gemini
- Agentic AI Starter Framework

## Project Structure

```
backend/
    framework/
    database/
    domains/
        curator/

frontend/
    src/
```

## Getting Started

### Backend

```bash
python -m venv venv

venv\Scripts\activate

pip install -r requirements.txt

python -m uvicorn backend.main:app --reload
```

### Frontend

```bash
npm install

npm run dev
```

## Environment Variables

```env
ACTIVE_DOMAIN=curator

VITE_ACTIVE_DOMAIN=curator

DATABASE_URL=...

GEMINI_API_KEY_1=...

GEMINI_API_KEY_2=...

GEMINI_API_KEY_3=...

GEMINI_API_KEY_4=...
```

## Current Status

- Identity Agent
- Planner Agent
- Curator onboarding
- Identity profile persistence
- Growth plan generation
- Multi-domain architecture
- Shared agent framework

## Vision

Curator is built on top of the Agentic AI Starter framework, allowing new AI domains to be developed by adding domain-specific agents, workflows, prompts, and schemas while reusing the same underlying infrastructure.
