# Registro de decisiones arquitectónicas — OPTIMUS-THY

Estado de estas decisiones: **aceptadas durante TES-4 (15/09/2026)**. Las decisiones aplazadas no deben interpretarse como requisitos aprobados.

## ADR-001 — Monorepo modular

**Decisión:** usar un único repositorio con `apps/web`, `apps/api`, `services/worker` como límite futuro, `packages/contracts`, `infra` y `docs`.

**Alternativas:** repositorios separados; monorepo plano.

**Motivo:** simplifica coordinación entre dos tesistas, CI y trazabilidad, sin mezclar responsabilidades.

## ADR-002 — Clean Architecture modular por capacidad

**Decisión:** organizar backend por capacidades (`auth`, `patients`, `documents`, `imaging`, `inference`, `research`, `audit`) con límites `domain`, `application`, `infrastructure` y `api` cuando correspondan.

**Alternativa:** una única jerarquía global de capas para todo el backend.

**Motivo:** reduce acoplamiento y evita la implementación parcial/ambigua observada en el repositorio de referencia.

## ADR-003 — OpenAPI como contrato canónico

**Decisión:** FastAPI/OpenAPI es la fuente del contrato HTTP; TypeScript genera tipos/cliente desde ese esquema.

**Alternativa:** DTO equivalentes mantenidos manualmente en Python y TypeScript.

**Motivo:** evita discrepancias de IDs, campos y nombres entre frontend/backend.

## ADR-004 — PostgreSQL durable + UUID

**Decisión:** PostgreSQL será la fuente durable de verdad y las entidades principales usarán UUID.

**Alternativas:** estado crítico solo en memoria; mezcla de `int` y UUID.

**Motivo:** consistencia transversal y recuperación confiable de datos y trabajos.

## ADR-005 — RustFS local mediante interfaz S3-compatible

**Decisión:** documentos e imágenes se almacenan inicialmente en RustFS local detrás de `ObjectStorage`.

**Alternativas:** MinIO; blobs pesados en PostgreSQL; rutas de filesystem acopladas al dominio.

**Motivo:** coincide con el anteproyecto (almacenamiento local/S3-compatible), RustFS mantiene desarrollo activo y una API S3 estándar, y el puerto permite sustituir la implementación.

## ADR-006 — Ejecutor de trabajos simple, sin Redis inicialmente

**Decisión:** primera versión con `InMemoryJobExecutor`; PostgreSQL conserva estado durable (`queued`, `running`, `succeeded`, `failed`, `cancelled`).

**Alternativa:** introducir Redis/RQ desde el inicio.

**Motivo:** OCR/IA necesitan trabajo fuera del request, pero el alcance actual no justifica un broker adicional. Si la carga real lo exige, el puerto `JobExecutor` permite sustituir la implementación.

## ADR-007 — Sesiones opacas en PostgreSQL

**Decisión:** sesiones opacas persistidas y cookie `HttpOnly`, `Secure`, `SameSite`; contraseñas con Argon2id.

**Alternativa:** JWT persistido en `localStorage`.

**Motivo:** revocación y auditoría simples para una aplicación web centralizada.

## ADR-008 — Un rol real y vista operativa del administrador

**Decisión:** cada usuario tiene un solo rol real: médico, investigador o administrador. El administrador puede seleccionar vista de médico/investigador sin cambiar su identidad administrativa.

**Alternativa:** multirol general para todos los usuarios.

**Motivo:** refleja la decisión funcional explícita y conserva trazabilidad del actor real.

## ADR-009 — Separación de PII

**Decisión:** separar identidad sensible del paciente de la información clínica operacional. Investigación consume proyecciones desidentificadas.

**Alternativa:** mantener identificación personal mezclada con todo el registro clínico.

**Motivo:** privacidad por diseño y soporte al módulo de investigación aprobado.

## ADR-010 — OCRRunner y ModelRunner reemplazables

**Decisión:** OCR y modelo tiroideo se integran mediante puertos separados.

**Alternativa:** acoplar casos de uso directamente a PaddleOCR/Tesseract/PyTorch/modelo demo.

**Motivo:** el OCR definitivo y el modelo oficial aún no están cerrados; la arquitectura debe permitir sustitución sin reescribir dominio/API.

## ADR-011 — Observabilidad ligera y pruebas por capas

**Decisión:** logs estructurados, `request_id`, `job_id`, `/health`, duración/estado de trabajos; pruebas unitarias, integración, API, frontend, E2E críticos y benchmarks OCR/IA separados.

**Alternativa:** stack completo de métricas/tracing desde el inicio.

**Motivo:** mantener evidencia y diagnósticos suficientes sin sobrecargar la primera ola.
