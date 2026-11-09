# ADR-001: Arquitectura General del Sistema

**Fecha:** 2024-09-23
**Status:** Aceptado
**Decisor:** Equipo OPTIMUS-THY

## Contexto y Problemática

OPTIMUS-THY es una plataforma médica para la evaluación de nódulos tiroideos que requiere:
- Procesamiento de imágenes médicas con modelos de IA (DINOv3)
- Gestión de datos clínicos con información sensible (PII)
- Flujos de trabajo colaborativos entre médicos, investigadores y administradores
- Cumplimiento de normativas de protección de datos-health

## Decisión

Arquitectura FastAPI + React (Bun) con almacenamiento object storage compatible con S3.

## Componentes Principales

```
┌─────────────────────────────────────────────────────────────────┐
│                     optimus-thy-web (nginx)                      │
│              Reverse proxy + TLS + static files                   │
│         /api/* → api:8000     /* → frontend:3000               │
└─────────────────────────────┬───────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   frontend    │    │     api      │    │   postgres   │
│ (Bun + React) │    │(FastAPI/uv)  │    │   (PostgreSQL │
│   Port 3000   │    │   Port 8000  │    │    Port 5432) │
└──────────────┘    └───────┬───────┘    └──────────────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼             ▼
       ┌──────────┐ ┌──────────┐ ┌──────────┐
       │   minio  │ │   redis  │ │  ia-     │
       │  (S3)    │ │ (Cache)  │ │ tiroides │
       │  Port    │ │ Port     │ │ (Model)  │
       │  9000    │ │  6379    │ │          │
       └──────────┘ └──────────┘ └──────────┘
```

### Frontend (Bun + React SPA)

- **Runtime:** Bun (JavaScript runtime con mejor performance)
- **Framework:** React 18+ con TypeScript
- **Puerto:** 3000 (desarrollo), serve estático en producción
- **Comunicación:** API REST via fetch/axios hacia FastAPI
- **Estado:** React hooks + Context (sin Redux)
- **Build:** Vite

### Backend (FastAPI + Uvicorn)

- **Framework:** FastAPI (Python 3.11+)
- **Server:** Uvicorn ASGI
- **Puerto:** 8000
- **ORM:** SQLAlchemy 2.0 (async)
- **Validadores:** Pydantic v2

### Base de Datos (PostgreSQL 16)

- **Motor:** PostgreSQL con soporte JSON
- **ORM:** SQLAlchemy 2.0 con migraciones Alembic
- **Puerto:** 5432
- **Pool:** asyncpg para conexiones async
- **Tablas principales:** Users, Patients, ClinicalCase, MedicalImage, InferenceJob

### Object Storage (MinIO / S3-compatible)

- **Proveedor:** MinIO (auto-hospedado) o AWS S3 / OCI Object Storage
- **Puerto API:** 9000
- **Puerto Console:** 9001
- **Bucket principal:** `optimus-thy-files`
- **Bucket tests:** `optimus-thy-test`

### Cache/Workers (Redis 7)

- **Puerto:** 6379
- **Uso:** Rate limiting, cache de sesión, cola de trabajos

## Patrón de Autenticación

**Sesiones con HttpOnly Cookies + RBAC**

Ver [ADR-002: Autenticación y RBAC](./ADR-002-autenticacion-y-rbac.md) para detalles completos.

## Límites de Módulos (Qué Llama a Qué)

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                             │
│  (Bun/React - No accede a BD directamente)                 │
│         │                                                    │
│         │ HTTPS (REST API)                                   │
│         ▼                                                    │
├─────────────────────────────────────────────────────────────┤
│                         API                                  │
│  ┌─────────┐ ┌──────────┐ ┌───────────┐ ┌─────────────┐   │
│  │ routes/ │→│ services/│→│ repositories│→│ DB (SQLAlch)│   │
│  │ auth    │ │           │ │            │  │             │   │
│  │ patients│ │ inference │ │ patient    │  │ PostgreSQL  │   │
│  │ clinical│ │ ocr       │ │ clinical   │  │             │   │
│  │ jobs    │ │           │ │ job        │  │             │   │
│  └─────────┘ └───────────┘ └────────────┘  └──────┬──────┘   │
│         │                    │                     │          │
│         │                    │                     ▼          │
│         │             ┌──────┴──────┐         ┌────────┐      │
│         │             │  storage/   │         │Object  │      │
│         └────────────→│  s3.py     │────────→│Storage │      │
│                       └────────────┘         │ (S3)   │      │
│                                              └────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Frontend → Backend (API REST)

- Solo accede a endpoints HTTP expuesta por FastAPI
- Nunca accede directamente a PostgreSQL ni S3
- Usa presigned URLs para descarga de archivos

### Backend → Infraestructura

- **DB:** Solo a través de SQLAlchemy (no queries SQL directas)
- **S3:** A través de `S3ObjectStorage` (boto3)
- **Redis:** Para rate limiting y cache

## Environment Variables Principales

| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| `DATABASE_URL` | PostgreSQL connection | `postgresql+asyncpg://...` |
| `S3_ENDPOINT_URL` | Endpoint S3/MinIO | `http://s3:9000` |
| `S3_BUCKET_NAME` | Bucket principal | `optimus-thy-files` |
| `PII_ENCRYPTION_KEY` | Clave encriptación PII | 32 bytes min |
| `JWT_SECRET` | Secreto JWT (unused) | - |
| `LOG_LEVEL` | Nivel de logging | `INFO` |

## Seguridad Implementada

Ver [ADR-002](./ADR-002-autenticacion-y-rbac.md) y [ADR-003](./ADR-003-pii-y-datos-sensibles.md) para detalles completos.

- OWASP Top 10 mitigations implementadas
- Headers de seguridad (X-Frame-Options, CSP, etc.)
- Rate limiting en endpoints críticos
- CORS restringido a orígenes conocidos
- CSRF protection via Origin/Referer validation

## Consequences

### Positivos

- Arquitectura probada y escalable
- Separación clara de concerns
- FastAPI permite documentación automática OpenAPI
- TypeScript en frontend reduce errores runtime
- Async throughout mejora performance I/O-bound

### Negativos

- Más complejo que un monolito
- Requiere mantener múltiples servicios
- Debug distributed tracing es más difícil

## Referencias

- [FastAPI](https://fastapi.tiangolo.com/)
- [SQLAlchemy 2.0](https://docs.sqlalchemy.org/en/20/)
- [MinIO](https://min.io/)
- [Bun](https://bun.sh/)
