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
- Las tareas viven en Linear (proyecto «OPTIMUS-THY · Backlog de producto»): desde este repo solo se consultan con `make tareas` y se comentan con `make comentar`, sin mover estados. Un pull request por historia; ver `CLAUDE.md` y la plantilla de PR en `.github/`.
- Usuarios y contraseñas: `make usuarios` abre un menú interactivo contra la base real (crea cuentas, restablece contraseñas, activa o desactiva y asigna o quita roles) y `make usuarios ARGS="--listar"` imprime la tabla de usuarios y sale. La contraseña se pide sin eco y nunca se imprime; hasta que exista un endpoint de restablecimiento, el restablecimiento de contraseñas se hace con esta CLI.
- Sincronización con el repositorio académico: `make sync-plan` clasifica las rutas compartidas, `make sync-aplicar` copia solo las que la política marca como `COPIAR` y `make sync-verificar` es el gate que cierra la sincronización. Procedimiento e interpretación en [docs/operacion/sincronizar-academico.md](docs/operacion/sincronizar-academico.md).
- Requisitos y backlog: `docs/referencia/04-requisitos/` y `docs/referencia/05-backlog/`.

## Producción

Este repositorio (`optimus-thy-operativo`) es el de entrega/producción. El repositorio académico conserva la tesis, los requisitos, el backlog y la evidencia; las correcciones nacidas en producción se preparan como PR separado contra el académico.

- Runbook del nuevo despliegue aislado por Tailscale: [docs/operacion/despliegue-produccion.md](docs/operacion/despliegue-produccion.md)
- Runbook de despliegue y corte de tiroides2 (instalación existente): [docs/operacion/despliegue-tiroides2.md](docs/operacion/despliegue-tiroides2.md)
- Custodia de respaldos y secretos: [docs/operacion/custodia-respaldos.md](docs/operacion/custodia-respaldos.md)
- Incidente E2E/rollback 2026-11-09: [docs/operacion/incidente-e2e-rollback-2026-11-09.md](docs/operacion/incidente-e2e-rollback-2026-11-09.md)
- Decisiones del despliegue: [ADR-018](docs/adr/ADR-018-despliegue-por-releases.md) y [ADR-019](docs/adr/ADR-019-respaldos-cifrados.md)
- Sincronización académico ↔ producción: [docs/operacion/sincronizar-academico.md](docs/operacion/sincronizar-academico.md)
- Registro de decisiones (ADR): [docs/adr/README.md](docs/adr/README.md)
