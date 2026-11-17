#!/usr/bin/env bash
# Despliegue automático de producción (tiroides2.andresgaibor.com).
# Lo ejecuta optimus-thy-deploy.timer cada pocos minutos; también sirve a mano.
# Solo despliega `origin/main`, nunca ramas: el merge es la autorización.
set -Eeuo pipefail

APP_DIR="${APP_DIR:-/home/ubuntu/code/optimus-thy-operativo}"
PUBLIC_URL="${PUBLIC_URL:-https://tiroides2.andresgaibor.com}"
COMPOSE_NETWORK="${COMPOSE_NETWORK:-optimus-thy-net}"
BUN="${BUN:-/home/ubuntu/.bun/bin/bun}"

log() { printf '[deploy-automatico] %s\n' "$*"; }
die() { printf '[deploy-automatico] ERROR: %s\n' "$*" >&2; exit 1; }

cd "$APP_DIR"
git fetch --quiet origin main
target="$(git rev-parse origin/main)"

if [[ "$(git rev-parse HEAD)" == "$target" && -f frontend/dist/index.html ]]; then
  log "sin cambios en $target"
  exit 0
fi

# No pisar trabajo local: cualquier archivo modificado debe coincidir ya con main.
while IFS= read -r archivo; do
  [[ -n "$archivo" ]] || continue
  git diff --quiet "$target" -- "$archivo" ||
    die "hay cambios locales distintos de $target en $archivo; no se despliega"
done < <(git status --porcelain --untracked-files=no | cut -c4-)

cambiados="$(git diff --name-only HEAD "$target")"
log "desplegando $target"
git reset --hard --quiet "$target"

if printf '%s\n' "$cambiados" | grep -qE '^(frontend/|bun\.lock|package\.json)'; then
  log "reconstruyendo el frontend"
  (cd frontend && "$BUN" install --frozen-lockfile && "$BUN" run build)
fi

if printf '%s\n' "$cambiados" | grep -qE '^(backend/|docker-compose\.yml)'; then
  log "reconstruyendo el backend"
  COMPOSE_NETWORK="$COMPOSE_NETWORK" docker compose build backend
  log "aplicando migraciones"
  COMPOSE_NETWORK="$COMPOSE_NETWORK" docker compose run --rm --no-deps backend alembic upgrade head
  COMPOSE_NETWORK="$COMPOSE_NETWORK" docker compose up -d --no-deps backend
fi

for _ in $(seq 1 30); do
  curl -fsS -o /dev/null http://127.0.0.1:8000/health && break
  sleep 2
done
curl -fsS -o /dev/null http://127.0.0.1:8000/health || die "el backend no responde /health"
[[ "$(curl -sS -o /dev/null -w '%{http_code}' "$PUBLIC_URL/")" == 200 ]] ||
  die "el sitio no responde 200"
[[ "$(curl -sS -o /dev/null -w '%{http_code}' "$PUBLIC_URL/api/auth/me")" == 401 ]] ||
  die "la API no responde 401"

log "desplegado $target"
