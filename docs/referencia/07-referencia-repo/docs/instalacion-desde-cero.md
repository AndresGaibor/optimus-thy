# Instalación desde Cero - OPTIMUS-THY

**Fecha:** 2024-09-23
**Perfil:** Desarrollo local

Esta guía documenta los pasos verificados para levantar OPTIMUS-THY desde un clon limpio del repositorio.

## Prerrequisitos

- **Docker Engine** 24.0+
- **Docker Compose** 2.20+
- **Python** 3.11+ (para backend)
- **Bun** 1.0+ (para frontend)
- **Git**

## Paso 1: Clonar el Repositorio

```bash
git clone <repo-url>
cd optimus-thy
```

## Paso 2: Configurar Variables de Entorno

```bash
# Copiar plantilla
cp .env.example .env

# Editar .env y configurar secrets mínimos:
# - POSTGRES_PASSWORD: password para PostgreSQL
# - S3_SECRET_KEY: secret para MinIO
# - JWT_SECRET: secreto para JWT (aunque no se usa activamente)
# - PII_ENCRYPTION_KEY: clave para cifrar PII (32 bytes mínimo)
```

### Variables Críticas para Desarrollo

```bash
# .env (mínimo para desarrollo)
ENVIRONMENT=development
DEBUG=true
LOG_LEVEL=INFO

POSTGRES_USER=optimus
POSTGRES_PASSWORD=optimus_secret
POSTGRES_DB=optimus_thy
DATABASE_URL=postgresql+asyncpg://optimus:optimus_secret@localhost:5432/optimus_thy

S3_ACCESS_KEY=optimus_minio
S3_SECRET_KEY=optimus_minio_secret
S3_BUCKET_NAME=optimus-thy-files
S3_ENDPOINT_URL=http://localhost:9000
S3_REGION=us-east-1
S3_USE_SSL=false

PII_ENCRYPTION_KEY=optimus_pii_dev_secret_key_change_in_prod_32b
JWT_SECRET=dev_secret_key_change_in_production_32bytes_min

CORS_ORIGINS=["http://localhost:3000", "http://localhost:5173"]
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

## Paso 3: Levantar Infraestructura (PostgreSQL + MinIO)

```bash
# Usando docker-compose directamente (sin make)
docker compose up -d postgres s3 s3-init

# Verificar que los servicios estén healthy
docker compose ps
```

**Salida esperada:**
```
NAME                    STATUS          PORTS
optimus-thy-postgres    Up (healthy)    127.0.0.1:5433->5432/tcp
optimus-thy-s3          Up (healthy)    0.0.0.0:9000->9000/tcp, ...
optimus-thy-s3-init     Exit 0          ...
```

**O usando Make:**
```bash
make infra-up
```

## Paso 4: Backend - Instalar Dependencias

```bash
cd backend

# Crear virtual environment e instalar dependencias
uv venv
uv pip install -e ".[dev]"

# Verificar instalación
uv run python --version  # Debería mostrar Python 3.11+
```

## Paso 5: Backend - Ejecutar Migraciones

```bash
cd backend

# Ejecutar todas las migraciones Alembic
uv run alembic upgrade head
```

**Salida esperada:**
```
INFO  [alembic.runtime.migration] Context impl PostgreSQLImpl
INFO  [alembic.runtime.migration] Will assume transactional DDL
INFO  [alembic.runtime.migration] Running upgrade  -> 30637c7e184f, initial canonical schema
INFO  [alembic.runtime.migration] Running upgrade 30637c7e184f -> 7f3a2e1c8d9b, create roles...
[... más migraciones ...]
```

## Paso 6: Backend - Seed de Datos Iniciales

```bash
cd backend

# Poblar con datos de desarrollo (usuarios, instituciones, pacientes de prueba)
uv run python -m app.infrastructure.db.seed
```

**Salida esperada:**
```
✅ Seed completado exitosamente con datos ficticios.
```

### Usuarios Creador por el Seed

| Email | Password | Rol |
|-------|----------|-----|
| admin@optimus-thy.local | AdminPassword123! | admin |
| doctor@optimus-thy.local | DoctorPassword123! | doctor |
| investigador@optimus-thy.local | ResearcherPassword123! | researcher |

## Paso 7: Backend - Iniciar Servidor

```bash
cd backend

# Iniciar servidor de desarrollo con hot-reload
uv run uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**O usando Make:**
```bash
make dev-backend
```

**Verificar que está corriendo:**
```bash
curl http://localhost:8000/health
# {"status":"ok"}
```

## Paso 8: Frontend - Instalar Dependencias

```bash
cd frontend

# Instalar con Bun
bun install --frozen-lockfile
```

## Paso 9: Frontend - Iniciar Servidor de Desarrollo

```bash
cd frontend

# Iniciar con hot-reload
bun dev
```

**O usando Make:**
```bash
make dev-frontend
```

**Verificar que está corriendo:**
```bash
curl http://localhost:3000
# Debería devolver HTML de la SPA
```

## Paso 10: Verificar Stack Completo

```bash
# API health
curl http://localhost:8000/health
# {"status":"ok"}

# API docs
curl http://localhost:8000/docs
# Swagger UI HTML

# Login básico
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"doctor@optimus-thy.local","password":"DoctorPassword123!"}' \
  -c cookies.txt
# {"id":"...","email":"...","name":"...","role":"doctor",...}
```

## Comandos Útiles

### make setup
Instala todas las dependencias (backend + frontend).

```bash
make setup
```

### make infra-up / infra-down
Levanta o detiene solo la infraestructura (PostgreSQL, MinIO, Redis).

```bash
make infra-up    # Levanta infra
make infra-down  # Detiene infra
```

### make check
Ejecuta linters, tipos, builds y tests.

```bash
make check
```

### make dev-backend / make dev-frontend
Inicia servidores de desarrollo.

```bash
make dev-backend
make dev-frontend
```

## Estructura de Puertos

| Servicio | URL | Descripción |
|----------|-----|-------------|
| Frontend | http://localhost:3000 | SPA React |
| API | http://localhost:8000 | FastAPI |
| API Docs | http://localhost:8000/docs | Swagger/OpenAPI |
| MinIO API | http://localhost:9000 | Object storage |
| MinIO Console | http://localhost:9001 | Admin UI |
| PostgreSQL | localhost:5433 | Database (host port) |

## Troubleshooting

### "Connection refused" al conectar a PostgreSQL

1. Verificar que PostgreSQL esté corriendo:
   ```bash
   docker compose ps postgres
   ```

2. Verificar logs:
   ```bash
   docker compose logs postgres
   ```

3. Revisar que el puerto 5433 no esté ocupado:
   ```bash
   lsof -i :5433
   ```

### "Bucket not found" en S3

1. Verificar que s3-init corrió:
   ```bash
   docker compose ps s3-init
   ```

2. Recrear buckets manualmente:
   ```bash
   docker compose up s3-init
   ```

### Migration failed

1. Verificar conexión a PostgreSQL
2. Limpiar y recrear DB:
   ```bash
   docker compose down -v  # CUIDADO: borra datos
   docker compose up -d postgres
   sleep 5
   cd backend && uv run alembic upgrade head
   ```

### Module not found: app

```bash
cd backend
export PYTHONPATH="${PWD}/src:$PYTHONPATH"
uv run python -m app.infrastructure.db.seed
```

## Producción (Resumen)

Para despliegue en producción, ver [deployment.md](./deployment.md).

Pasos adicionales requeridos:
1. Configurar `.env.prod` con secrets reales
2. Generar certificados TLS
3. Montar volúmenes para modelos y uploads
4. Usar `docker compose -f docker-compose.yml -f docker-compose.production.yml --profile prod up`
