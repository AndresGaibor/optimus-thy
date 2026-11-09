# OPTIMUS-THY frontend

Esqueleto de la interfaz (React + Vite + TypeScript, Bun).

## Comandos

```bash
bun install         # dependencias
bun run dev         # desarrollo, proxy /api -> http://localhost:8000
bun run build       # dist/
bun run preview     # servir dist/
bun run catalogo     # catálogo (Storybook) en http://localhost:6104 (escucha en 0.0.0.0: accesible desde la red)
bun run catalogo:build # build del catálogo a catalogo-static/
bun run catalogo:preview # servir catalogo-static/ en http://localhost:6105 (escucha en 0.0.0.0)
bun run lint
bun run format:check
bun run format
bun run typecheck
bun run test
bun run gen:api     # regenera src/api/schema.d.ts desde ../contracts/openapi.json
```

## Estado actual

- `src/styles/tokens.css` define tokens semánticos claro/oscuro; los componentes compartidos están en `src/design-system/`.
- `src/screens/` contiene pantallas presentacionales del catálogo; sus datos y métricas son sintéticos, no funcionalidades conectadas al backend.
- La sesión (`src/session/SessionContext.tsx`) se mantiene en memoria; falta conectarla a la API de autenticación.
- Variables de entorno: ver `.env.example` (`VITE_API_URL`, por defecto `/api`).

## Docker

```bash
docker build -t optimus-thy-frontend .
docker run -p 8080:8080 optimus-thy-frontend
```

`nginx.conf` da servicio SPA en 8080, `GET /healthz` y proxy `/api/` al backend.
