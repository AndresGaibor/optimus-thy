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

`alembic current` debe conectar con PostgreSQL y reflejar la revisión aplicada. Desde TES-6, la revisión inicial es `20260915_01`.

## CI

`.github/workflows/ci.yml` ejecuta dos jobs independientes:

- backend: instalación congelada, lint, formato, typecheck y tests;
- frontend: instalación congelada, lint, formato, typecheck, tests y build.

La CI no requiere datos clínicos, modelos de IA ni RustFS. Desde TES-6, el job backend levanta PostgreSQL 17 efímero para validar migraciones, restricciones, cifrado y seed.

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

## Evidencia TES-6 — modelo de datos y migraciones — 15/09/2026

**Commit funcional verificado:** `52a043481d503f98ca8b6399984d4bfd7b026e38`.
**Revisión Alembic:** `20260915_01`.

- Modelo materializado: 3 esquemas (`security`, `clinical`, `audit`) y exactamente 7 tablas de Ola 1.
- PII: `first_names` y `last_names` persisten como `BYTEA` cifrado mediante AES-256-GCM; la clave se entrega por `PII_ENCRYPTION_KEY_B64`.
- Base local dedicada `optimus_thy_tes6_test`: `pytest -m integration` finalizó con **2 passed**.
- Ciclo verificado: base vacía → `upgrade head` → restricciones/PII → `downgrade base` → `upgrade head`.
- Restricciones verificadas: unicidad de rol y FK de institución de paciente rechazan datos inválidos.
- Seed de desarrollo ejecutado dos veces: resultado estable **3 roles : 3 usuarios : 1 paciente** (`3:3:1`).
- Los usuarios del seed son simulados, inactivos y usan direcciones reservadas `.example.test`; no existe contraseña utilizable.
- `make check` local: Ruff, formato, mypy, frontend typecheck/lint, 8 tests backend no-integración, 1 test frontend y build Vite correctos.
- GitHub Actions run `34967909019`: `Backend quality` y `Frontend quality` = `success`.
- Backend CI con PostgreSQL 17 ejecutó **10 tests y 10 passed**, incluyendo migración y seed.
- Ninguna clave PII real, `.env`, dato clínico real o dato de paciente real fue versionado.

La migración implementa solo autenticación/RBAC base, sesiones, paciente operacional, identidad separada y auditoría mínima. Consentimientos, casos clínicos, documentos/OCR, imágenes, IA e investigación continúan diferidos hasta que un flujo/requisito posterior justifique sus tablas.
