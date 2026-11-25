#!/usr/bin/env bash
# Despliegue automático de producción (tiroides2.andresgaibor.com).
# Lo ejecuta optimus-thy-deploy.timer cada pocos minutos; también sirve a mano.
# Solo despliega `origin/main`, nunca ramas: el merge es la autorización.
set -Eeuo pipefail

APP_DIR="${APP_DIR:-/home/ubuntu/code/optimus-thy-operativo}"
PUBLIC_URL="${PUBLIC_URL:-https://tiroides2.andresgaibor.com}"
COMPOSE_NETWORK="${COMPOSE_NETWORK:-optimus-thy-net}"
EDGE="${EDGE:-optimus-thy-edge}"
BUN="${BUN:-$HOME/.bun/bin/bun}"
ESTADO="$APP_DIR/.deploy/desplegado"

log() { printf '[deploy-automatico] %s\n' "$*"; }
die() { printf '[deploy-automatico] ERROR: %s\n' "$*" >&2; exit 1; }

cd "$APP_DIR"
git fetch --quiet origin main
target="$(git rev-parse origin/main)"

# El estado lo marca el despliegue terminado, no el checkout: un merge hecho a
# mano en este directorio deja HEAD en el commit nuevo sin haber desplegado.
if [[ -f "$ESTADO" && "$(cat "$ESTADO")" == "$target" ]]; then
  log "sin cambios en $target"
  exit 0
fi

# No pisar trabajo local: cualquier archivo modificado debe coincidir ya con main.
while IFS= read -r archivo; do
  [[ -n "$archivo" ]] || continue
  git diff --quiet "$target" -- "$archivo" ||
    die "hay cambios locales distintos de $target en $archivo; no se despliega"
done < <(git status --porcelain --untracked-files=no | cut -c4-)

# Qué reconstruir se mide contra el último commit desplegado, no contra HEAD:
# un merge hecho a mano en este directorio deja HEAD en el commit nuevo.
anterior="$(cat "$ESTADO" 2>/dev/null || true)"
if [[ -n "$anterior" ]] && git cat-file -e "$anterior^{commit}" 2>/dev/null; then
  cambiados="$(git diff --name-only "$anterior" "$target")"
else
  cambiados="$(git ls-files)"
fi
log "desplegando $target"
git reset --hard --quiet "$target"

if printf '%s\n' "$cambiados" | grep -qE '^(frontend/|bun\.lock|package\.json)'; then
  log "reconstruyendo el frontend"
  [[ -x "$BUN" ]] || die "no encuentro bun en $BUN"
  (cd frontend && "$BUN" install --frozen-lockfile && "$BUN" run build)
  # El sitio lo sirve el borde, que monta frontend/dist: hay que recargarlo para
  # que suelte los archivos anteriores y vea los nuevos.
  docker exec "$EDGE" nginx -s reload
fi

if printf '%s\n' "$cambiados" | grep -qE '^(backend/|docker-compose\.yml|ai/|ia/)'; then
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

# Lo servido debe ser el dist recién construido, no una caché ni un archivo viejo.
bundle_dist="$(grep -m1 -oE 'assets/index-[A-Za-z0-9_-]+\.js' frontend/dist/index.html | cut -d/ -f2 || true)"
[[ -n "$bundle_dist" ]] || die "no hay bundle en frontend/dist"
bundle_publico=""
for _ in $(seq 1 10); do
  bundle_publico="$(curl -fsS "$PUBLIC_URL/" | grep -m1 -oE 'assets/index-[A-Za-z0-9_-]+\.js' | cut -d/ -f2 || true)"
  [[ "$bundle_publico" == "$bundle_dist" ]] && break
  sleep 3
done
[[ "$bundle_publico" == "$bundle_dist" ]] ||
  die "el sitio sirve $bundle_publico y el dist construido tiene $bundle_dist"

mkdir -p "$(dirname "$ESTADO")"
printf '%s\n' "$target" > "$ESTADO"
log "desplegado $target (bundle $bundle_dist)"
