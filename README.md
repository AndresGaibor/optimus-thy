# OPTIMUS-THY

Sistema web de gestión de datos clínicos con integración de IA para cáncer de tiroides. Proyecto de tesis ESPOCH (Andrés Gaibor, Daniel Quiguiri; director Diego Ávila Pesántez).

## Estructura

| Carpeta      | Contenido                                             |
| ------------ | ----------------------------------------------------- |
| `frontend/`  | React + TypeScript + Vite                             |
| `backend/`   | FastAPI + SQLAlchemy + Alembic + PostgreSQL           |
| `ia/`        | Servicio de IA (detección y clasificación de nódulos) |
| `ocr/`       | OCR local de fichas (Tesseract + PyMuPDF)             |
| `infra/`     | Docker y despliegue                                   |
| `contracts/` | Contrato OpenAPI de la API                            |
| `docs/`      | Requisitos, decisiones y material de referencia       |

## Arranque rápido

Requisitos: Docker con Compose. No necesita GPU.

```bash
cp .env.example .env   # valores de ejemplo, sin secretos reales
make up                # levanta frontend, API, PostgreSQL, almacenamiento, OCR e IA
make down
```

Cada servicio expone un chequeo de salud; `docker compose ps` muestra su estado.

## Desarrollo

- `make check` ejecuta formato, tipos, pruebas, build frontend y catálogo de componentes (Storybook), además de los checks de backend.
- Catálogo visual: `cd frontend && bun run catalogo`. Las pantallas sintéticas viven en Storybook (puerto 6104); la guía visual está en `DESIGN.md`.
- Trabajo por Kanban, un pull request por historia. Ver `CLAUDE.md` y la plantilla de PR en `.github/`.
- Requisitos y backlog: `docs/referencia/04-requisitos/` y `docs/referencia/05-backlog/`.

## Producción

Este repositorio (`optimus-thy-operativo`) es el de entrega/producción. El repositorio académico conserva la tesis, los requisitos, el backlog y la evidencia; las correcciones nacidas en producción se preparan como PR separado contra el académico.

- Runbook de despliegue y corte: [docs/operacion/despliegue-tiroides2.md](docs/operacion/despliegue-tiroides2.md)
- Registro de decisiones (ADR): [docs/adr/README.md](docs/adr/README.md)
