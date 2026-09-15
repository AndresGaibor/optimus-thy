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

La CI de GitHub ejecuta los mismos comandos sobre cada push a `main` y cada pull request.

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

TES-5 dejó establecido el baseline técnico y de calidad. TES-6 materializa el modelo mínimo de Ola 1, la primera migración y el cifrado de PII; autenticación/RBAC funcional continúa en TES-7.
