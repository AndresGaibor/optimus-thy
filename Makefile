.PHONY: up down check certificado-dev db-test

up:
	docker compose up -d --build --wait

down:
	docker compose down

check:
	@if [ -f backend/pyproject.toml ]; then \
		cd backend && ruff format --check . && ruff check . && mypy app && REQUIRE_TEST_DB=1 pytest; \
	fi
	@if [ -f frontend/package.json ]; then \
		cd frontend && bun run lint && bun run ui:check && bun run tamanos && bun run format:check && bun run typecheck && bun run test && bun run catalogo:test && bun run build && bun run catalogo:build; \
	fi

certificado-dev:
	bash infra/scripts/generar-certificado-dev.sh

# Postgres desechable para las pruebas del backend (no toca la base de datos real).
db-test:
	-docker rm -f optimus-test-pg >/dev/null 2>&1
	docker run -d --rm --name optimus-test-pg -e POSTGRES_PASSWORD=test -e POSTGRES_DB=test \
		--tmpfs /var/lib/postgresql/data -p 127.0.0.1:55432:5432 postgres:16-alpine
	@echo "export TEST_DATABASE_URL=postgresql+psycopg://postgres:test@127.0.0.1:55432/test"

# Prueba de punta a punta del respaldo cifrado y su restauración en un Postgres limpio (HT-013).
respaldo-prueba:
	BACKUP_KEY_FILE=$${BACKUP_KEY_FILE:-$$HOME/.optimus-respaldo.key} infra/scripts/probar-respaldo.sh
