ENV_FILE ?= .env
BUN ?= $(shell command -v bun 2>/dev/null || printf "%s" "$(HOME)/.bun/bin/bun")

-include $(ENV_FILE)
export POSTGRES_DB POSTGRES_USER POSTGRES_PASSWORD POSTGRES_PORT DATABASE_URL
export RUSTFS_ACCESS_KEY RUSTFS_SECRET_KEY RUSTFS_API_PORT RUSTFS_CONSOLE_PORT
export S3_ENDPOINT S3_BUCKET S3_ACCESS_KEY S3_SECRET_KEY
export API_HOST API_PORT VITE_API_URL

COMPOSE = docker compose --env-file $(ENV_FILE) -f infra/docker/compose.yaml

.PHONY: setup infra-up infra-down infra-logs api-dev web-dev lint format-check typecheck test build check

setup:
	@test -f .env || cp .env.example .env
	cd apps/api && uv sync --all-groups --frozen
	cd apps/web && $(BUN) install --frozen-lockfile

infra-up:
	$(COMPOSE) up -d

infra-down:
	$(COMPOSE) down

infra-logs:
	$(COMPOSE) logs -f

api-dev:
	cd apps/api && uv run uvicorn optimus_thy.main:app --reload --host $${API_HOST:-127.0.0.1} --port $${API_PORT:-8000}

web-dev:
	cd apps/web && $(BUN) run dev

lint:
	cd apps/api && uv run ruff check .
	cd apps/web && $(BUN) run lint

format-check:
	cd apps/api && uv run ruff format --check .
	cd apps/web && $(BUN) run format:check

typecheck:
	cd apps/api && uv run mypy src tests
	cd apps/web && $(BUN) run typecheck

test:
	cd apps/api && uv run pytest -q -W error
	cd apps/web && $(BUN) run test

build:
	cd apps/web && $(BUN) run build

check: lint format-check typecheck test build
