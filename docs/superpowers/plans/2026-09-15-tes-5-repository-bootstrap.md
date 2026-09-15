# TES-5 Repository Bootstrap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Leave `AndresGaibor/optimus-thy` ready for incremental development with reproducible backend/frontend setup, local PostgreSQL/RustFS, quality gates, CI, and clone-clean documentation.

**Architecture:** Implement the modular monorepo approved in TES-4 without building thesis features early. `apps/api` is a FastAPI package managed by uv; `apps/web` is React/TypeScript with Vite managed by Bun; local infrastructure lives under `infra/docker`; root commands orchestrate the same checks used by CI.

**Tech Stack:** Python 3.12, uv, FastAPI, Pydantic Settings, SQLAlchemy, Alembic, Ruff, mypy, pytest, React 19, TypeScript, Vite 8, Bun, Biome, Vitest, PostgreSQL 17, RustFS `1.0.0-rc.6`, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-09-15-optimus-thy-architecture-design.md`

## Global Constraints

- Work directly on `main` because Andrés explicitly approved direct work on his Mac.
- Do not copy implementation code from `optimus-thy-referencia`.
- Keep Redis/RQ out of this task; asynchronous execution is not implemented in TES-5.
- PostgreSQL is durable state; RustFS is the local S3-compatible object store, while application configuration remains vendor-neutral through `S3_*`.
- No real credentials, clinical data, model weights, datasets, or binary artifacts in Git.
- OpenAPI from FastAPI is the future canonical HTTP contract; TES-5 only establishes the base app and health endpoint.
- Use TDD for production behavior. Pure configuration/scaffolding may be created directly, then verified by commands.
- CMS projects/publications remain outside thesis scope.

---

### Task 1: Root workspace and local infrastructure

**Files:**
- Create: `.gitignore`
- Create: `.editorconfig`
- Create: `.env.example`
- Create: `Makefile`
- Create: `infra/docker/compose.yaml`
- Create: `services/worker/README.md`
- Create: `packages/contracts/README.md`

**Interfaces:**
- Produces root commands `setup`, `infra-up`, `infra-down`, `lint`, `typecheck`, `test`, `build`, `check`.
- Produces environment variable names consumed by API and Compose.

- [x] Create repository directories matching TES-4 without placeholder application code.
- [x] Add `.gitignore` for Python, Bun/Node, env files, IDE/system files, coverage, build output, model/data artifacts.
- [x] Add `.env.example` with development-only placeholders for PostgreSQL, RustFS/S3, API, and Vite URL.
- [x] Add Compose with PostgreSQL 17 and pinned RustFS local service, health checks, named volumes, and no application containers yet.
- [x] Add root Makefile commands that delegate to uv/Bun and Compose.
- [x] Run `docker compose --env-file .env -f infra/docker/compose.yaml config` after creating local `.env`; expect valid config.
- [x] Commit root/infrastructure scaffold.

### Task 2: Backend baseline with a tested health endpoint

**Files:**
- Create: `apps/api/pyproject.toml`
- Create: `apps/api/.python-version`
- Create: `apps/api/src/optimus_thy/__init__.py`
- Create: `apps/api/src/optimus_thy/main.py`
- Create: `apps/api/src/optimus_thy/config/settings.py`
- Create: `apps/api/src/optimus_thy/shared/health/router.py`
- Create: `apps/api/tests/test_health.py`
- Create: `apps/api/alembic.ini`
- Create: `apps/api/alembic/env.py`
- Create: `apps/api/alembic/script.py.mako`
- Create: `apps/api/alembic/versions/.gitkeep`

**Interfaces:**
- Produces `optimus_thy.main:create_app() -> FastAPI` and module-level `app`.
- Produces `GET /health -> {"status": "ok"}`.
- Produces settings loaded from root `.env` or process environment.

- [x] Initialize uv project metadata for Python 3.12 with runtime and development dependencies.
- [x] Write `tests/test_health.py` importing `create_app` and asserting `GET /health` returns HTTP 200 and `{"status":"ok"}`.
- [x] Run `uv run pytest tests/test_health.py -q`; expected RED because `optimus_thy.main`/endpoint does not exist.
- [x] Implement minimal settings, APIRouter, application factory and `app` to make the test pass.
- [x] Run targeted health test; expected GREEN.
- [x] Configure Ruff, mypy and pytest in `pyproject.toml`; run `uv run ruff check .`, `uv run ruff format --check .`, `uv run mypy src tests`, and full `uv run pytest -q`.
- [x] Initialize Alembic against SQLAlchemy metadata without creating thesis tables; verify `uv run alembic --help` succeeds.
- [x] Commit backend baseline.

### Task 3: Frontend baseline with a tested application shell

**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/bun.lock`
- Create: `apps/web/index.html`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/vite.config.ts`
- Create: `apps/web/vitest.config.ts`
- Create: `apps/web/biome.json`
- Create: `apps/web/src/main.tsx`
- Create: `apps/web/src/app/App.tsx`
- Create: `apps/web/src/app/App.test.tsx`
- Create: `apps/web/src/test/setup.ts`
- Create: `apps/web/src/vite-env.d.ts`

**Interfaces:**
- Produces scripts `dev`, `build`, `lint`, `format:check`, `typecheck`, `test`.
- Produces a minimal application shell only; no simulated clinical data or role behavior.

- [x] Install Bun in the user environment if absent and record the installed version.
- [x] Create package metadata and install React/Vite/TypeScript/Biome/Vitest/Testing Library dependencies with Bun, generating `bun.lock`.
- [x] Configure strict TypeScript, `@/` alias, Vite, Vitest/jsdom, and Biome.
- [x] Write `App.test.tsx` asserting the shell renders `OPTIMUS-THY`; run `bun test`/Vitest command and verify RED because `App` is absent.
- [x] Implement minimal `App.tsx` and `main.tsx`; re-run the test and verify GREEN.
- [x] Run `bun run lint`, `bun run format:check`, `bun run typecheck`, `bun run test`, and `bun run build`.
- [x] Commit frontend baseline.

### Task 4: CI and developer documentation

**Files:**
- Create: `.github/workflows/ci.yml`
- Modify: `README.md`
- Create: `docs/development/verification.md`

**Interfaces:**
- CI uses the same backend/frontend commands documented locally.
- README is sufficient for a fresh clone to install tools, create `.env`, start dependencies, start API/web, and run checks.

- [x] Add GitHub Actions jobs for backend and frontend quality checks with dependency caching/lockfiles.
- [x] Document prerequisites: Git, Docker, uv, Bun; note Python 3.12 is managed by uv and system Python is irrelevant.
- [x] Document `.env.example -> .env`, `make infra-up`, backend/frontend dev commands, `make check`, and shutdown.
- [x] Document RustFS pinned release and vendor-neutral `S3_*` application configuration; deployment storage must still be revalidated.
- [x] Add troubleshooting for occupied ports, Docker not running, missing Bun/uv, and stale dependencies.
- [x] Run YAML/basic syntax checks available locally and `git diff --check`.
- [x] Commit CI/documentation.

### Task 5: Clean-clone verification and TES-5 evidence

**Files:**
- Modify: `docs/development/verification.md`
- Modify: Linear TES-5 evidence/checklist after successful verification.

**Interfaces:**
- Produces evidence that acceptance criteria work from a clean checkout, not only the developer working tree.

- [x] Push `main` and clone repository into a fresh temporary directory outside the project.
- [x] Copy `.env.example` to `.env` and replace placeholders with local development-only values.
- [x] Run `uv sync --project apps/api --all-groups` and `bun install --cwd apps/web --frozen-lockfile` (or exact equivalent supported by installed Bun).
- [x] Start PostgreSQL and RustFS from the clone and verify health.
- [x] Run backend lint/format/typecheck/tests and frontend lint/format/typecheck/tests/build from the clone.
- [x] Start API and web long enough to confirm `/health` and the web root respond, then stop them.
- [x] Run `git status --short` in both canonical checkout and verification clone; ensure no generated files that should be tracked are missing and no secrets are tracked.
- [x] Record command summary/results in `docs/development/verification.md`, commit/push evidence, and update TES-5 only after fresh verification passes.
