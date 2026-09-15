# Verificación del entorno de desarrollo

Este documento registra los comandos que deben reproducir el baseline de TES-5 y la evidencia de la validación desde un clon limpio.

## Gates locales

Backend:

```bash
cd apps/api
uv sync --all-groups --frozen
uv run ruff check .
uv run ruff format --check .
uv run mypy src tests
uv run pytest -q -W error
```

Frontend:

```bash
cd apps/web
bun install --frozen-lockfile
bun run lint
bun run format:check
bun run typecheck
bun run test
bun run build
```

Desde la raíz, `make check` agrupa los gates de calidad después de instalar dependencias.

## Infraestructura

```bash
cp .env.example .env
# reemplazar los placeholders por valores locales
make infra-up
```

Validaciones esperadas:

```bash
curl -fsS http://localhost:9000/health/ready
cd apps/api && uv run alembic current
```

`alembic current` debe conectar con PostgreSQL aunque todavía no exista una primera migración de dominio; esa migración pertenece a TES-6.

## CI

`.github/workflows/ci.yml` ejecuta dos jobs independientes:

- backend: instalación congelada, lint, formato, typecheck y tests;
- frontend: instalación congelada, lint, formato, typecheck, tests y build.

La CI no requiere datos clínicos, modelos de IA, RustFS ni PostgreSQL porque los tests base de TES-5 no dependen de infraestructura externa.

## Evidencia de clon limpio

**Estado:** pendiente hasta ejecutar Task 5 de TES-5.

No debe marcarse esta sección como aprobada hasta verificar instalación, infraestructura, gates, API y web desde un checkout temporal recién clonado.
