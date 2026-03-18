# 🤖 AI Software Engineer

An autonomous, multi-agent coding assistant that converts a plain-English description into a fully scaffolded software project — entirely in your browser.

Built with a **LangGraph agent pipeline**, a **FastAPI** backend, and a **React + Vite** frontend, this project showcases the integration of modern LLM orchestration with production-ready web engineering patterns.

---

## ✨ Demo

> Type a prompt like *"Build a Calculator app using html, css and javascript"* and watch the agent plan, architect, and write every file in real time.

![Screenshot1](assets/Demo.gif)

---

## 🧠 How It Works

The backend runs a **three-stage LangGraph pipeline**:

```
User Prompt
    │
    ▼
┌─────────┐     structured     ┌───────────┐     task list     ┌────────────────────┐
│ PLANNER │ ─────────────────► │ ARCHITECT │ ────────────────► │  CODER  (loop)     │
│         │      Plan JSON     │           │   TaskPlan JSON   │  reads + writes    │
│  Plans  │                    │  Designs  │                   │  files via tools   │
└─────────┘                    └───────────┘                   └────────────────────┘
                                                                         │
                                                                 until all tasks done
                                                                         │
                                                                         ▼
                                                               Generated project files
```

1. **Planner** — turns the user prompt into a structured `Plan` (name, tech stack, feature list, file manifest).
2. **Architect** — converts the plan into an ordered list of `ImplementationTask` objects, each targeting a single file.
3. **Coder** — iterates through every task, calling `read_file` / `write_file` / `list_files` tools to produce the actual source code.

Each LLM call targets the **Groq API** (llama / GPT-compatible models) with automatic retry logic on rate-limit errors via `tenacity`.

Progress is streamed to the browser in real time through **Server-Sent Events (SSE)**.

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| LLM Orchestration | LangGraph, LangChain, Groq |
| Backend API | FastAPI, Pydantic v2, SQLAlchemy 2 |
| Database | SQLite (dev) / PostgreSQL (prod) |
| Frontend | React 19, Vite 7, Tailwind CSS 4 |
| Streaming | Server-Sent Events (SSE) |
| Packaging | uv / pip, pyproject.toml |
| Deployment | Docker, Docker Compose |

---

## 📁 Project Structure

```
.
├── backend/
│   ├── agent/
│   │   ├── graph.py          # LangGraph pipeline (Planner → Architect → Coder)
│   │   ├── prompts.py        # System prompts for each agent
│   │   ├── states.py         # Pydantic models: Plan, TaskPlan, CoderState
│   │   └── tools.py          # File-system tools (read/write/list, sandboxed)
│   ├── api/
│   │   ├── routers/
│   │   │   ├── projects.py   # POST /projects, GET /projects/{id}/download
│   │   │   └── sessions.py   # Session CRUD + SSE progress stream
│   │   └── deps.py           # FastAPI dependency injection (DB session)
│   ├── core/
│   │   ├── config.py         # Pydantic Settings (env-driven)
│   │   ├── exceptions.py     # Typed application errors
│   │   └── logger.py         # Structured logging setup
│   ├── database/
│   │   ├── database.py       # SQLAlchemy engine & session factory
│   │   └── models.py         # ChatSession ORM model
│   ├── schemas/
│   │   └── project.py        # Request/response Pydantic schemas
│   ├── services/
│   │   └── project_service.py # Business logic (session management, ZIP export)
│   ├── MY_PROJECTS/           # Agent-generated projects (git-ignored)
│   ├── pyproject.toml
│   ├── .env.example
│   └── main.py               # FastAPI app factory & lifespan handler
└──  frontend/
    ├── src/
    │   ├── components/       # Header, MessageList, ProgressBar, Sidebar, etc.
    │   ├── hooks/            # useSSE, useHistory custom React hooks
    │   └── App.jsx           # Root component & state orchestration
    ├── package.json
    └── vite.config.js

```

---

## 🚀 Getting Started

### Prerequisites

- A [Groq API key](https://console.groq.com/)

### 🐳 Quick Start with Docker (recommended)

```bash
git clone https://github.com/DComasBaz/AI-Software-Engineer.git
cd ai-software-engineer

# Configure environment variables
cp backend/.env.example backend/.env
# Edit backend/.env — set GROQ_API_KEY and POSTGRES_PASSWORD

# Build and start all services
docker compose up --build
```

Open **http://localhost** in your browser.

To stop all services:

```bash
docker compose down
```

> Generated projects are persisted in `./backend/MY_PROJECTS` on your host machine via a bind mount.

---

### 🛠️ Manual Setup (alternative)

#### Prerequisites

- Python 3.11+
- Node.js 20+

#### 1. Clone the repo

```bash
git clone https://github.com/DComasBaz/AI-Software-Engineer.git
cd ai-software-engineer
```

#### 2. Backend setup

```bash
cd backend

uv sync

# Configure environment variables
cp .env.example .env
# Edit .env — set GROQ_API_KEY and DATABASE_URL

# Start the API server
uv run main.py
```

#### 3. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## ⚙️ Environment Variables

Create a `backend/.env` file (see `backend/.env.example`):

| Variable | Required | Default | Description |
|---|---|---|---|
| `GROQ_API_KEY` | ✅ | — | Your Groq API key |
| `DATABASE_URL` | ✅ | — | e.g. `postgresql://postgres:password@db:5432/chat_history` |
| `POSTGRES_PASSWORD` | ✅ | — | PostgreSQL password (Docker only) |
| `GROQ_MODEL` | ❌ | `openai/gpt-oss-120b` | Model name passed to Groq |
| `DEBUG` | ❌ | `false` | Enables debug logging & hot reload |
| `PROJECTS_BASE` | ❌ | `./MY_PROJECTS` | Where agent-generated projects are saved |
| `MIN_DELAY_SECONDS` | ❌ | `120` | Max back-off on Groq rate-limit retries |
| `DEFAULT_RECURSION_LIMIT` | ❌ | `100` | Default LangGraph recursion limit |

For Docker deployments you can also set `VITE_API_BASE` in the root environment to override the frontend API URL (default: `http://localhost:8000/api/v1`).

---

## 🔌 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/projects` | Start a new project generation job |
| `GET` | `/api/v1/projects/{id}/download` | Download the generated project as a `.zip` |
| `GET` | `/api/v1/sessions` | List all sessions (newest first) |
| `GET` | `/api/v1/sessions/{id}` | Get a single session |
| `DELETE` | `/api/v1/sessions/{id}` | Delete a session |
| `PATCH` | `/api/v1/sessions/{id}/messages` | Persist the chat message array |
| `GET` | `/api/v1/sessions/{id}/progress` | SSE stream of agent progress |
| `GET` | `/health` | Health check |

---

## 🔑 Key Engineering Decisions

**Isolated project roots via `ContextVar`** — each concurrent request gets its own `pathlib.Path` root, preventing file-system collisions across simultaneous jobs without the overhead of separate processes.

**Structured LLM outputs** — `Plan`, `TaskPlan`, and `CoderState` are Pydantic models used with LangChain's `.with_structured_output()`, making agent responses type-safe and eliminating prompt-parsing fragility.

**In-place session mutation for modifications** — when a user iterates on an existing project, the same `ChatSession` row is reset rather than creating a new one, keeping history clean and avoiding orphaned project folders.

**Tenacity retry with exponential back-off** — all Groq calls are wrapped in a retry decorator that specifically catches `RateLimitError`, holding the agent in a back-off loop rather than propagating a failure to the user.

---

## 🧪 Testing

The backend has a full test suite covering all critical layers of the application.

### Test setup

Tests require a PostgreSQL test database. Add it to `backend/.env`:

```
TEST_DATABASE_URL=postgresql://user:pass@localhost:5432/myapp_test
```

Run all tests from the repo root:

```bash
cd backend
uv run pytest tests/ -v
```

### Test structure

| File | What it covers |
|---|---|
| `tests/test_routes.py` | HTTP endpoints — status codes, request validation, error handling |
| `tests/test_project_service.py` | Business logic — session lifecycle, ZIP export, agent task execution |
| `tests/test_tools.py` | File-system tools — read/write/list, path traversal prevention |
| `tests/test_states.py` | Pydantic models — validation, required fields, defaults |
| `tests/test_prompts.py` | Prompt generation — correct variables, modification vs new-project mode |

---

## 🛣️ Roadmap

- [x] Docker Compose setup for one-command deployment
- [ ] Support for additional LLM providers (OpenAI, Anthropic)
- [ ] File browser UI to inspect generated code before download

---

## 📄 License

MIT

