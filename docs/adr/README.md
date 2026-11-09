# Decisiones de arquitectura y producción (ADR)

Registro de decisiones para el repositorio operativo `AndresGaibor/optimus-thy`. Las decisiones heredadas del trabajo académico (TES-4, snapshot `66e5b8d` del repo `AndresGaibor/optimus`) se conservan aquí indicando estado y evidencia; las decisiones nuevas cubren el corte de producción.

## Contexto

- **Académico:** conserva tesis, requisitos, backlog y evidencia.
- **Operativo/producción:** conserva el software desplegado en `tiroides2.andresgaibor.com` (ADR-012).
- Nada en este registro afirma que un pendiente está verificado; los estados “Aceptada” describen la decisión, no la ejecución del corte salvo evidencia explícita.

## Registro de decisiones heredadas

| ADR original | Estado en producción | Decisión vigente | Evidencia |
| --- | --- | --- | --- |
| ADR-001 Monorepo modular | Adaptada | Monorepo con `frontend/`, `backend/`, `ia/`, `ocr/`, `contracts/`, `infra/`, `docs/`. No se usa `apps/` ni `packages/`. | estructura del snapshot |
| ADR-002 Clean Architecture modular por capacidad | Reemplazada por [ADR-017](ADR-017-estructura-backend.md) | Backend modular por capacidad con capas ligeras (`api`, `auth`, `audit`, `jobs`, `models`, `security`, `storage`), sin `domain/application/infrastructure` estrictos. | `backend/app/` |
| ADR-003 OpenAPI canónico | Adoptada | `contracts/openapi.json` generado por FastAPI; el cliente TS se genera con `gen:api`; CI falla si hay drift. | `backend/scripts/export_openapi.py`, `frontend/package.json`, `.github/workflows/ci.yml` |
| ADR-004 PostgreSQL durable + UUID | Adoptada | PostgreSQL 16, PK UUID con `gen_random_uuid()`, estado durable. | `backend/alembic/`, `docs/arquitectura/modelo-de-datos-v1.md` |
| ADR-005 RustFS local S3 | Reemplazada por [ADR-014](ADR-014-minio-fijado.md) | MinIO S3-compatible fijado por digest; el adaptador sigue siendo neutral. RustFS no se adopta. | `docker-compose.yml`, `backend/app/storage/s3.py` |
| ADR-006 JobExecutor sin Redis | Adoptada | Cola en proceso, estados durables en `trabajos`, worker con manejadores. | `backend/app/jobs/`, `backend/app/models/trabajos.py` |
| ADR-007 Sesiones opacas en PostgreSQL | Adoptada; endurecida por [ADR-015](ADR-015-cookie-strict-origin.md) | Sesión opaca persistida, token no almacenado en claro, Argon2id, cookie `HttpOnly`. | `backend/app/auth/`, `backend/app/models/sesiones.py` |
| ADR-008 Un rol real y vista admin | Reemplazada por [ADR-013](ADR-013-multirol-rol-activo.md) | Multirol con `rol_activo` auditado; el administrador cambia de rol para actuar como médico o investigador. | `usuarios_roles`, `sesiones.rol_activo_id`, `requiere_permiso()` |
| ADR-009 Separación de PII | Adoptada | Identidad cifrada en `identidades_paciente`; datos clínicos sin PII; investigación con proyecciones desidentificadas. | `docs/arquitectura/cifrado-en-reposo.md` |
| ADR-010 OCRRunner y ModelRunner | Adaptada | OCR e IA son servicios HTTP separados (`ocr/`, `ia/`) con contrato versionado; no hay puertos Python. | `ocr/`, `ia/`, `backend/app/jobs/worker.py` |
| ADR-011 Observabilidad ligera y pruebas por capas | Adoptada | Logs, `X-Request-ID`, `/health`, auditoría insert-only, pytest/Vitest/Playwright y CI. | `backend/app/logging.py`, `backend/app/audit/`, `.github/workflows/ci.yml` |

## Decisiones nuevas (producción)

- [ADR-012 — Repo de producción separado del académico](ADR-012-repo-produccion.md)
- [ADR-013 — Multirol con rol activo auditado](ADR-013-multirol-rol-activo.md)
- [ADR-014 — Almacenamiento S3-compatible con MinIO fijado](ADR-014-minio-fijado.md)
- [ADR-015 — Cookie SameSite=Strict y verificación de Origin](ADR-015-cookie-strict-origin.md)
- [ADR-016 — Despliegue de producción en tiroides2](ADR-016-despliegue-tiroides2.md)
- [ADR-017 — Estructura del backend de producción](ADR-017-estructura-backend.md)
- [ADR-018 — Despliegue por releases con migraciones explícitas](ADR-018-despliegue-por-releases.md)
- [ADR-019 — Respaldos cifrados y retención escalonada](ADR-019-respaldos-cifrados.md)

## Verificación del corte (2026-11-09)

- Backend `optimus-thy-backend-1` healthy y migración `0009 (head)`.
- `/` 200, `/login` 200, asset 200 y `/api/auth/me` 401.
- `POST /api/auth/logout`: `Origin` ajeno 403; `Origin` propio 204.
- Edge `optimus-thy-edge` monta `optimus-thy-operativo/frontend/dist`; el contenedor viejo fue retirado.
- Storybook local 200; público 302 por Cloudflare Access.
- MinIO fijado por digest y backend publicado en `127.0.0.1:8000`.
- PII rotada a clave real; la única identidad descifra con la clave nueva.
- PR de backport: https://github.com/AndresGaibor/optimus/pull/20.