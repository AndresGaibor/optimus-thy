.PHONY: up down check modelos certificado-dev db-test respaldo-prueba comparar-academico tareas comentar help deploy-check deploy-status


ACADEMICO_DIR ?= /home/ubuntu/code/optimus-thy-academico

help:
	@printf '%s\n' 'Targets: up down check deploy-check deploy-status certificado-dev db-test respaldo-prueba comparar-academico tareas comentar'

deploy-check:
	./deploy.sh check

deploy-status:
	./deploy.sh status
ACADEMICO_REF ?= HEAD

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

# Pesos de IA (410 MB) desde la release privada modelos-idi-086-v1: descarga y verifica su SHA-256.
# Fuera de `check`: son binarios que no se versionan y no tienen que pasar por CI.
modelos:
	python3 ia/scripts/descargar_modelos.py --destino var/modelos

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

comparar-academico:
	bash scripts/comparar-academico.sh "$(ACADEMICO_DIR)" "$(ACADEMICO_REF)"

# Tablero de Linear en solo lectura: equipo TESIS, proyecto «OPTIMUS-THY · Backlog de producto».
# Filtra con ARGS="--estado progress|revision|done|todo" o ARGS="--persona daniel".
tareas:
	@bash scripts/tareas.sh $(ARGS)

# Único camino de escritura permitido desde este repo: un comentario de progreso.
# El estado de un issue lo mueve solo el repo académico, su dueño.
comentar:
	@bash scripts/comentar.sh $(ISSUE) $(TEXTO)
