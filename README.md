# OPTIMUS-THY

Sistema web de trabajo de titulación para la gestión de datos clínicos e integración de un modelo de inteligencia artificial existente del proyecto OPTIMUS-THY.

El repositorio se desarrolla a partir del anteproyecto aprobado y de la arquitectura definida en TES-4. El repositorio de referencia no es una fuente autoritativa de requisitos ni de implementación.

## Arquitectura base

```text
apps/web       React + TypeScript + Vite
apps/api       FastAPI + Clean Architecture modular
services       límite futuro para workers separados
packages       contratos y artefactos compartidos
infra          infraestructura de desarrollo local
docs           arquitectura, ADRs, planes y evidencias
```

Documentación relacionada:

- [Arquitectura objetivo](docs/superpowers/specs/2026-09-15-optimus-thy-architecture-design.md)
- [Diagrama y límites](docs/architecture/README.md)
- [Registro de ADRs](docs/adr/README.md)

## Requisitos de desarrollo

- Git.
- Docker compatible con `docker compose` (OrbStack, Docker Desktop u otro runtime).
- [uv](https://docs.astral.sh/uv/) 0.11.x o compatible.
- Bun 1.4.2.

No hace falta modificar el Python del sistema: `uv` instala y usa Python 3.12 para `apps/api`.

## Arranque desde un clon limpio

```bash
git clone https://github.com/AndresGaibor/optimus-thy.git
cd optimus-thy
cp .env.example .env
```

Edita `.env` y reemplaza todos los valores `<set-local-...>` por credenciales **solo de desarrollo**. `.env` está ignorado por Git. Para `PII_ENCRYPTION_KEY_B64`, genera 32 bytes aleatorios y codifícalos en Base64; nunca reutilices una clave publicada o de CI.

Después instala dependencias y levanta infraestructura:

```bash
make setup
make infra-up
```

El PostgreSQL de desarrollo usa por defecto el puerto host `55432` para evitar conflictos frecuentes con instalaciones locales en `5432`. Dentro del contenedor sigue usando `5432`.

## Migraciones y datos simulados

Aplica la migración actual y, si necesitas datos de demostración, ejecuta el seed reproducible:

```bash
make db-upgrade
make seed-dev
```

`make db-downgrade` revierte una revisión. El seed crea únicamente datos simulados e inactivos y cifra la identidad del paciente con `PII_ENCRYPTION_KEY_B64`.

Los tests de integración de migraciones realizan `upgrade`/`downgrade`; deben apuntar a una base **dedicada de pruebas** mediante `TEST_DATABASE_URL`, nunca a una base con datos que deban conservarse.

## Ejecutar la API

```bash
make api-dev
```

Endpoints iniciales:

- salud: `http://127.0.0.1:8000/health`
- OpenAPI/Swagger: `http://127.0.0.1:8000/docs`

### Autenticación y sesiones

TES-7 implementa autenticación real basada en sesión opaca server-side:

- `POST /auth/login` — recibe `email` y `password`, devuelve únicamente el usuario público y establece la cookie de sesión;
- `GET /auth/me` — resuelve la sesión actual;
- `POST /auth/logout` — revoca la sesión y elimina la cookie.

La contraseña se verifica con Argon2id. El token de sesión se genera aleatoriamente y **no se almacena en claro**: PostgreSQL conserva únicamente su SHA-256. La cookie es `HttpOnly`, `SameSite=Strict`, `Path=/`, sin `Domain`; `Secure` se activa fuera del desarrollo HTTP local.

El backend diferencia:

- `401 Unauthorized`: no existe una sesión válida o las credenciales son inválidas;
- `403 Forbidden`: existe una sesión válida, pero el rol real no autoriza la acción.

`require_roles(...)` usa exclusivamente el rol recuperado desde la sesión del servidor. Headers, body o query parameters enviados por el cliente no conceden permisos.

Los roles base de Ola 1 son `medico`, `investigador` y `administrador`, con un único rol real por usuario. El modo de vista operativa del administrador se mantiene diferido.

### Contrato OpenAPI canónico

FastAPI es la fuente de verdad del contrato HTTP. Para regenerar el artefacto versionado:

```bash
make contracts
```

El resultado es `packages/contracts/openapi.json`. No debe editarse a mano. GitHub Actions regenera el archivo y falla si existe drift entre FastAPI y el contrato comprometido.

TES-8 aplicará el RBAC a endpoints reales de pacientes; TES-17 consumirá el contrato de autenticación para sesión, navegación y guards del frontend.

## Ejecutar el frontend

En otra terminal:

```bash
make web-dev
```

Vite sirve por defecto en `http://localhost:5173`.

## Infraestructura local

- PostgreSQL: `localhost:55432`.
- RustFS S3 API: `http://localhost:9000`.
- RustFS Console: `http://localhost:9001`.

RustFS utiliza la imagen fijada `rustfs/rustfs:1.0.0-rc.6`. La aplicación usa variables genéricas `S3_*`, por lo que el almacenamiento puede cambiarse por otra implementación S3-compatible sin acoplar el dominio al proveedor. RustFS se usa como infraestructura local; el despliegue final seguirá sujeto a validación operativa.

Para detener servicios:

```bash
make infra-down
```

## Calidad

Ejecuta todos los gates locales con:

```bash
make check
```

Ese comando verifica:

- Ruff lint y formato del backend.
- mypy estricto.
- pytest.
- Biome lint y formato del frontend.
- TypeScript.
- Vitest.
- build de Vite.

Regenera además el contrato cuando cambie la API:

```bash
make contracts
```

La CI de GitHub ejecuta los gates sobre cada push a `main` y cada pull request. El job backend usa PostgreSQL 17 efímero, ejecuta la suite de seguridad y valida que `packages/contracts/openapi.json` no tenga drift.

## Variables de entorno

`.env.example` documenta las variables disponibles. Las principales son:

| Variable | Uso |
| --- | --- |
| `DATABASE_URL` | conexión SQLAlchemy/Alembic a PostgreSQL |
| `POSTGRES_*` | inicialización del PostgreSQL local |
| `RUSTFS_*` | proceso RustFS local (credenciales/puertos) |
| `S3_*` | configuración de almacenamiento S3-compatible consumida por la aplicación |
| `PII_ENCRYPTION_KEY_B64` | clave AES-256-GCM local para cifrar PII; nunca se versiona |
| `API_HOST`, `API_PORT` | servidor FastAPI local |
| `VITE_API_URL` | URL de la API consumida por la web |

Nunca se deben versionar credenciales reales, datos clínicos, datasets, pesos de modelos ni certificados.

## Solución de problemas

**Docker no responde:** inicia OrbStack/Docker Desktop y confirma `docker info`.

**Puerto ocupado:** revisa `55432`, `9000`, `9001`, `8000` o `5173` con `lsof -nP -iTCP:<puerto> -sTCP:LISTEN`. Los puertos de infraestructura pueden cambiarse en `.env`.

**`uv` no existe:** instala uv y vuelve a ejecutar `make setup`; Python 3.12 será gestionado por uv.

**`bun` no existe:** instala Bun y confirma `bun --version` antes de `make setup`.

**Dependencias desalineadas:** usa `cd apps/api && uv sync --all-groups --frozen` y `cd apps/web && bun install --frozen-lockfile`.

## Estado del proyecto

TES-5 estableció el baseline técnico y de calidad. TES-6 materializó el modelo mínimo de Ola 1, la primera migración y el cifrado de PII. TES-7 implementa la fundación real de autenticación, sesiones, auditoría de acceso y RBAC que consumen los siguientes flujos verticales.
