# Verificación del entorno de desarrollo

Este documento registra los comandos que deben reproducir el baseline de TES-5 y la evidencia de las validaciones técnicas acumuladas.

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

Desde la raíz, `make check` agrupa los gates de calidad después de instalar dependencias. `make contracts` regenera el contrato OpenAPI canónico desde FastAPI.

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

`alembic current` debe conectar con PostgreSQL y reflejar la revisión aplicada.

## CI

`.github/workflows/ci.yml` ejecuta dos jobs independientes:

- backend: instalación congelada, lint, formato, typecheck, tests PostgreSQL, exportación OpenAPI y verificación de drift del contrato;
- frontend: instalación congelada, lint, formato, typecheck, tests y build.

La CI no requiere datos clínicos reales, modelos de IA ni RustFS. El job backend levanta PostgreSQL 17 efímero para validar migraciones, restricciones, cifrado, seed y flujos de autenticación/RBAC.

## Evidencia de clon limpio — 15/09/2026

**Commit verificado:** `933b9b4ac7e0d6ede2d23639f202eb33e7c2e25b`.

- Clon temporal nuevo desde GitHub: correcto.
- `make setup`: correcto con Python 3.12.13 administrado por uv y Bun 1.4.2 desde lockfiles.
- `make check`: correcto; Ruff, formato, mypy, TypeScript, Biome, pytest, Vitest y build Vite pasaron.
- `git status --short` después de instalación/build: limpio.
- PostgreSQL 17 y RustFS `1.0.0-rc.6`: `healthy` en Compose con puertos aislados para la prueba.
- `uv run alembic current`: conexión PostgreSQL correcta.
- API S3 de RustFS: round-trip real crear bucket → subir → leer → borrar objeto, correcto mediante cliente AWS compatible.
- `make api-dev`: `/health` respondió `200` con `{"status":"ok"}` y OpenAPI fue accesible.
- `make web-dev`: `http://localhost:5173` respondió `200` con el shell OPTIMUS-THY.
- GitHub Actions run `34963269656`: `Backend quality` y `Frontend quality` finalizaron en `success`.

La verificación se ejecutó sin versionar `.env`, credenciales locales, artefactos de build ni dependencias instaladas.

## Evidencia TES-6 — modelo de datos y migraciones — 15/09/2026

**Commit funcional verificado:** `52a043481d503f98ca8b6399984d4bfd7b026e38`.
**Revisión Alembic inicial:** `20260915_01`.

- Modelo materializado: 3 esquemas (`security`, `clinical`, `audit`) y exactamente 7 tablas de Ola 1.
- PII: `first_names` y `last_names` persisten como `BYTEA` cifrado mediante AES-256-GCM; la clave se entrega por `PII_ENCRYPTION_KEY_B64`.
- Base local dedicada `optimus_thy_tes6_test`: `pytest -m integration` finalizó con **2 passed**.
- Ciclo verificado: base vacía → `upgrade head` → restricciones/PII → `downgrade base` → `upgrade head`.
- Restricciones verificadas: unicidad de rol y FK de institución de paciente rechazan datos inválidos.
- Seed de desarrollo ejecutado dos veces: resultado estable **3 roles : 3 usuarios : 1 paciente** (`3:3:1`).
- Los usuarios del seed son simulados, inactivos y usan direcciones reservadas `.example.test`; no existe contraseña utilizable.
- `make check` local: Ruff, formato, mypy, frontend typecheck/lint, tests backend/frontend y build Vite correctos.
- GitHub Actions run `34967909019`: `Backend quality` y `Frontend quality` = `success`.
- Ninguna clave PII real, `.env`, dato clínico real o dato de paciente real fue versionado.

La migración implementa solo autenticación/RBAC base, sesiones, paciente operacional, identidad separada y auditoría mínima. Consentimientos, casos clínicos, documentos/OCR, imágenes, IA e investigación continúan diferidos hasta que un flujo/requisito posterior justifique sus tablas.

## Evidencia TES-7 — autenticación, sesiones y RBAC — 15/09/2026

**Contrato HTTP:** `POST /auth/login`, `GET /auth/me`, `POST /auth/logout`.
**Contrato canónico generado:** `packages/contracts/openapi.json`.
**Migración de contexto de auditoría:** `20260915_02`.

- Contraseñas: Argon2id mediante `pwdlib`; las pruebas crean usuarios con hash y nunca persisten la contraseña en claro.
- Sesiones: token opaco aleatorio de 256 bits; PostgreSQL guarda únicamente SHA-256 del token, con expiración y revocación.
- Cookie: `HttpOnly`, `SameSite=Strict`, `Path=/`, sin `Domain`; `Secure` depende del entorno y es falso únicamente para desarrollo local HTTP.
- Login válido → usuario público + cookie; `/auth/me` resuelve la sesión; logout revoca la sesión, expira la cookie y un `/auth/me` posterior devuelve 401.
- Correo inexistente, contraseña incorrecta y usuario inactivo comparten el mismo 401 genérico para no facilitar enumeración de usuarios.
- Sesión expirada/revocada se rechaza con 401.
- RBAC reusable `require_roles(...)`: usuario sin sesión → 401; rol autenticado no permitido → 403; rol permitido continúa. Un header cliente `X-Role` no puede escalar privilegios.
- Auditoría mínima verificada: `auth.login.success`, `auth.login.failed`, `auth.logout` y `auth.access.denied`, con `request_id`, actor/rol cuando aplica y sin contraseña/token crudo.
- `audit.events` conserva `actor_role` y `active_view`; `active_view` permanece nulo hasta la implementación posterior del modo de vista administrativa.
- El seed de desarrollo se reforzó para hacer upsert de roles por la clave natural `code`, por lo que es idempotente incluso si una base válida ya contiene `medico`, `investigador` o `administrador` con UUID distintos.
- OpenAPI declara `SessionCookie` como `apiKey` en cookie y documenta 401 reales para las rutas de autenticación. No se documenta un 403 ficticio en `/auth/me` o `/auth/logout`.
- GitHub Actions run `34992627375`: backend y frontend = `success` tras corregir la convivencia RBAC/seed.
- GitHub Actions run `34995417811`: backend y frontend = `success`; incluye tests, exportación OpenAPI, `Check OpenAPI contract drift` y artifact generado desde FastAPI.

### Límite de integración

TES-7 entrega la **fundación de seguridad reusable**. No crea endpoints clínicos ficticios ni navegación frontend artificial solo para demostrar RBAC:

- TES-8 aplicará `require_roles(...)` a los endpoints reales del primer flujo vertical de pacientes y verificará permisos sobre esos recursos.
- TES-17 consumirá `/auth/login`, `/auth/me`, `/auth/logout` y el rol real para navegación/guards frontend.

Esta separación evita una dependencia circular: TES-7 desbloquea los mecanismos de seguridad; TES-8 y TES-17 demuestran su aplicación en consumidores reales.
