#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="${APP_DIR:-$(cd -- "$SCRIPT_DIR/../.." && pwd)}"
ENV_FILE="${ENV_FILE:-$APP_DIR/.env}"
COMPOSE_SERVER="${COMPOSE_SERVER:-$APP_DIR/compose.server.yaml}"
RELEASES_DIR="${RELEASES_DIR:-$APP_DIR/releases}"
DEPLOYMENTS_DIR="${DEPLOYMENTS_DIR:-$APP_DIR/deployments}"
COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-optimus-thy}"
REPO_REMOTE="${REPO_REMOTE:-origin}"
MAIN_REF="${MAIN_REF:-origin/main}"
PUBLIC_URL="${PUBLIC_URL:-}"

log() { printf '[deploy] %s\n' "$*"; }
warn() { printf '[deploy] AVISO: %s\n' "$*" >&2; }
die() { printf '[deploy] ERROR: %s\n' "$*" >&2; exit 1; }
require_cmd() { command -v "$1" >/dev/null 2>&1 || die "falta el comando requerido: $1"; }

load_env() {
  [[ -f "$ENV_FILE" ]] || die "no existe el archivo de entorno"
  set -a
  # .env es un archivo confiable del operador y puede contener secretos; nunca habilitar xtrace.
# shellcheck source=/dev/null
  source "$ENV_FILE"
  set +a
}

lock_deploy() {
  mkdir -p "$APP_DIR"
  exec 9>"$APP_DIR/.deploy.lock"
  flock -n 9 || die "ya hay otra operación de despliegue en curso"
}

compose() {
  local project_dir="${COMPOSE_PROJECT_DIR:-${RELEASE_DIR:-$APP_DIR}}"
  local project_compose_server="$COMPOSE_SERVER"
  APP_DIR="$APP_DIR" RELEASE_DIR="$project_dir" RELEASE="${RELEASE:-}" \
    docker compose -p "$COMPOSE_PROJECT_NAME" --project-directory "$project_dir" --env-file "$ENV_FILE" \
      -f "$project_dir/docker-compose.yml" -f "$project_compose_server" "$@"
}

json_write() {
  python3 - "$1" "$2" <<'PY'
import json, os, sys, tempfile
path, payload = sys.argv[1:]
os.makedirs(os.path.dirname(path), exist_ok=True)
fd, tmp = tempfile.mkstemp(prefix='.metadata-', dir=os.path.dirname(path), text=True)
try:
    with os.fdopen(fd, 'w', encoding='utf-8') as stream:
        json.dump(json.loads(payload), stream, indent=2)
        stream.write('\n')
    os.chmod(tmp, 0o600)
    os.replace(tmp, path)
finally:
    if os.path.exists(tmp):
        os.unlink(tmp)
PY
}
json_get() {
  python3 - "$1" "$2" <<'PY'
import json, sys
with open(sys.argv[1], encoding='utf-8') as stream:
    value = json.load(stream)
for key in sys.argv[2].split('.'):
    value = value[key]
if isinstance(value, (dict, list)):
    print(json.dumps(value, separators=(',', ':')))
elif value is not None:
    print(value)
PY
}
image_ids() {
  local release="$1"
  printf '{"backend":"optimus-thy-backend:%s","frontend":"optimus-thy-frontend:%s","ocr":"optimus-thy-ocr:%s","ia":"optimus-thy-ia:%s"}' "$release" "$release" "$release" "$release"
}
