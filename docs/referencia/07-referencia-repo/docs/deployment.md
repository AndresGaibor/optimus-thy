# OPTIMUS-THY Deployment Guide

This document describes how to deploy OPTIMUS-THY using Docker and Docker Compose.

## Prerequisites

- Docker Engine 24.0+
- Docker Compose 2.20+
- (Production) TLS certificates for HTTPS

## Directory Structure

```
optimus-thy/
├── backend/              # FastAPI application
│   ├── Dockerfile         # Multi-stage build (dev/prod)
│   └── src/              # Application source
├── frontend/             # Bun + React SPA
│   ├── Dockerfile        # Multi-stage build
│   └── src/              # Frontend source
├── infra/
│   ├── nginx.conf        # Reverse proxy configuration
│   ├── nginx.frontend.conf # Frontend static file config
│   ├── postgres/init/     # Database initialization scripts
│   └── backup/           # Backup scripts (TES-132)
├── docs/                 # Documentation
├── docker-compose.yml    # Base compose file
├── docker-compose.production.yml  # Production overrides
├── .env.example          # Environment variables template
├── .env.dev              # Development environment
└── .env.prod             # Production environment (template)
```

## Deployment Modes

### 1. Infrastructure Only (Testing)

Start only PostgreSQL and MinIO (no application containers):

```bash
docker compose --profile infra up -d
```

### 2. Development Mode

Start infrastructure + backend + frontend with hot-reload:

```bash
# Copy environment file
cp .env.example .env

# Start all services
docker compose --profile dev up

# Or run in background
docker compose --profile dev up -d
```

Services:
- API: http://localhost:8000
- Frontend: http://localhost:3000
- MinIO Console: http://localhost:9001
- PostgreSQL: localhost:5433

### 3. Production Mode

Full stack with nginx reverse proxy, TLS, and resource limits:

```bash
# 1. Prepare production environment
cp .env.prod .env
# Edit .env and replace all REPLACE_WITH_* placeholders

# 2. Create required directories for external mounts
sudo mkdir -p /opt/optimus-thy/models
sudo mkdir -p /opt/optimus-thy/uploads
sudo chown -R 1000:1000 /opt/optimus-thy

# 3. (Optional) Generate TLS certificates
# For Let's Encrypt, use certbot:
# certbot certonly --nginx -d your-domain.com

# 4. Start production stack
docker compose -f docker-compose.yml -f docker-compose.production.yml --profile prod up -d
```

## Environment Variables

| Variable | Description | Dev Default | Prod Required |
|----------|-------------|-------------|---------------|
| `POSTGRES_USER` | Database user | optimus | Yes |
| `POSTGRES_PASSWORD` | Database password | optimus_secret | **Yes** |
| `DATABASE_URL` | PostgreSQL connection URL | auto | **Yes** |
| `S3_ACCESS_KEY` | MinIO/S3 access key | optimus_minio | **Yes** |
| `S3_SECRET_KEY` | MinIO/S3 secret key | optimus_minio_secret | **Yes** |
| `S3_BUCKET_NAME` | Primary storage bucket | optimus-thy-files | Yes |
| `JWT_SECRET` | JWT signing secret | dev_secret... | **Yes** |
| `PII_ENCRYPTION_KEY` | PII data encryption key | dev_key... | **Yes** |
| `MODELS_PATH` | Path to DINOv3 model weights | ./models | Yes |
| `UPLOADS_PATH` | Path to uploaded files | ./uploads | Yes |

## External Data Mounts

Production deployments require two host directories mounted as volumes:

### Model Weights (`/opt/optimus-thy/models`)

DINOv3 model files should be placed here. The path should match `MODELS_PATH`.

```
/opt/optimus-thy/models/
└── dinov3/
    ├── config.json
    ├── pytorch_model.bin
    └── ...
```

### Upload Storage (`/opt/optimus-thy/uploads`)

Uploaded medical images are stored here.

```
/opt/optimus-thy/uploads/
├── studies/
│   └── {study_id}/
│       └── images/
└── temp/
```

## Nginx Reverse Proxy

The nginx container handles:

- **Port 80**: HTTP → redirects to HTTPS (or port 443 directly)
- **Port 443**: HTTPS with TLS termination
  - `/api/*` → Backend (FastAPI on port 8000)
  - `/*` → Frontend (Bun SPA on port 3000)
- **Rate limiting**: API endpoints are rate-limited (30 req/s)
- **Security headers**: CORS, X-Frame-Options, CSP, etc.

### TLS Configuration

For production, mount TLS certificates:

```yaml
# docker-compose.production.yml
web:
  volumes:
    - /path/to/server.crt:/etc/nginx/certs/server.crt:ro
    - /path/to/server.key:/etc/nginx/private/server.key:ro
```

Or use Let's Encrypt with certbot for automatic certificate management.

## Health Checks

All services have health checks configured:

| Service | Endpoint | Interval |
|---------|----------|----------|
| postgres | `pg_isready` | 5s |
| s3 | `mc ready local` | 5s |
| api | `http://localhost:8000/health` | 30s |
| frontend | `http://localhost:3000/health` | 30s |
| web | `http://localhost/health` | 30s |

## Resource Limits (Production)

| Service | CPU Limit | Memory Limit |
|---------|-----------|--------------|
| api | 2.0 cores | 2 GB |
| frontend | 1.0 cores | 512 MB |
| web (nginx) | 1.0 cores | 256 MB |
| postgres | 2.0 cores | 2 GB |
| redis | 1.0 cores | 512 MB |

## Backup and Restore

See [infra/backup/README.md](../infra/backup/README.md) for backup procedures (TES-132).

## Stopping Services

```bash
# Stop all containers
docker compose stop

# Stop and remove containers (preserves volumes)
docker compose down

# Stop and remove everything (including volumes - CAREFUL!)
docker compose down -v
```

## Updating

```bash
# Pull latest images
docker compose pull

# Rebuild application containers
docker compose build api frontend

# Restart with new images
docker compose up -d
```

## OCI Profile (TES-161)

The OCI profile for container registry deployment is tracked separately in TES-161. Once completed:
- Images will be pushed to OCI registry
- Deployment will use `image:` instead of `build:` in compose files

## Troubleshooting

### API not starting

Check logs:
```bash
docker compose logs api
```

Common issues:
- Database not ready: ensure `postgres` healthcheck passes first
- Missing environment variables: verify `.env` file

### Frontend shows "Connection refused"

Ensure API is healthy:
```bash
docker compose ps api
curl http://localhost:8000/health
```

### MinIO bucket not created

Run s3-init manually:
```bash
docker compose up s3-init
```

## Architecture

```
                    ┌─────────────────────────────────────────┐
                    │           optimus-thy-web               │
                    │         (nginx reverse proxy)           │
                    │                                         │
                    │  ┌───────────────┐  ┌────────────────┐  │
                    │  │  /api/* →     │  │  /* →          │  │
                    │  │  api:8000     │  │  frontend:3000 │  │
                    │  └───────────────┘  └────────────────┘  │
                    └──────────────────┬──────────────────────┘
                                       │
               ┌───────────────────────┼───────────────────────┐
               │                       │                       │
               ▼                       ▼                       ▼
    ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
    │  optimus-thy-api │   │optimus-thy-frontend│   │   postgres:5432  │
    │   (FastAPI/uv)   │   │    (Bun SPA)      │   │                 │
    └────────┬─────────┘   └──────────────────┘   └────────┬─────────┘
             │                                             │
             │              ┌──────────────────┐           │
             └─────────────▶│   minio:9000     │◀──────────┘
                            │   (S3 storage)   │
                            └──────────────────┘
                                       ▲
                                       │
                            ┌──────────────────┐
                            │  optimus-thy-redis│
                            │   (Redis 7)      │
                            └──────────────────┘
```
