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

## Evidencia de clon limpio — 15/09/2026

**Commit verificado:** `933b9b4ac7e0d6ede2d23639f202eb33e7c2e25b`.

- Clon temporal nuevo desde GitHub: correcto.
- `make setup`: correcto con Python 3.12.13 administrado por uv y Bun 1.4.2 desde lockfiles.
- `make check`: correcto; Ruff, formato, mypy, TypeScript, Biome, pytest (2 tests), Vitest (1 test) y build Vite pasaron.
- `git status --short` después de instalación/build: limpio.
- PostgreSQL 17 y RustFS `1.0.0-rc.6`: `healthy` en Compose con puertos aislados para la prueba.
- `uv run alembic current`: conexión PostgreSQL correcta sin migraciones de dominio adelantadas.
- API S3 de RustFS: round-trip real crear bucket → subir → leer → borrar objeto, correcto mediante cliente AWS compatible.
- `make api-dev`: `/health` respondió `200` con `{"status":"ok"}` y OpenAPI fue accesible.
- `make web-dev`: `http://localhost:5173` respondió `200` con el shell OPTIMUS-THY.
- GitHub Actions run `34963269656`: `Backend quality` y `Frontend quality` finalizaron en `success`.

La verificación se ejecutó sin versionar `.env`, credenciales locales, artefactos de build ni dependencias instaladas.
