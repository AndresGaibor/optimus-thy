#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="${APP_DIR:-$(cd -- "$SCRIPT_DIR/../.." && pwd)}"
ENV_FILE="${ENV_FILE:-$APP_DIR/.env}"
COMPOSE_SERVER="${COMPOSE_SERVER:-$APP_DIR/compose.server.yaml}"
RELEASES_DIR="${RELEASES_DIR:-$APP_DIR/releases}"
DEPLOYMENTS_DIR="${DEPLOYMENTS_DIR:-$APP_DIR/deployments}"
COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-}"
IMAGE_PREFIX="${IMAGE_PREFIX:-}"
COMPOSE_NETWORK="${COMPOSE_NETWORK:-}"
DEPLOY_ENV="${DEPLOY_ENV:-}"
REPO_REMOTE="${REPO_REMOTE:-origin}"
MAIN_REF="${MAIN_REF:-origin/main}"
PUBLIC_URL="${PUBLIC_URL:-}"

log() { printf '[deploy] %s\n' "$*"; }
warn() { printf '[deploy] AVISO: %s\n' "$*" >&2; }
die() { printf '[deploy] ERROR: %s\n' "$*" >&2; exit 1; }
require_cmd() { command -v "$1" >/dev/null 2>&1 || die "falta el comando requerido: $1"; }
require_var() { [[ -n "${!1:-}" ]] || die "falta la variable requerida $1 en $ENV_FILE"; }
require_file() { [[ -f "$1" ]] || die "no existe el archivo requerido: $1"; }

verify_environment() {
  require_file "$ENV_FILE"
  [[ "$(stat -c '%a' "$ENV_FILE")" == 600 ]] || die ".env debe tener modo 600: $ENV_FILE"
  require_file "$COMPOSE_SERVER"
  require_var DEPLOY_ENV
  require_var COMPOSE_PROJECT_NAME
  require_var IMAGE_PREFIX
  require_var COMPOSE_NETWORK

  case "$DEPLOY_ENV" in
    production)
      [[ "${E2E_MODE:-}" != 1 && "${E2E_MODE:-}" != true ]] || die "DEPLOY_ENV=production no permite E2E_MODE=1"
      [[ "$COMPOSE_PROJECT_NAME" == optimus-thy ]] || die "DEPLOY_ENV=production exige COMPOSE_PROJECT_NAME=optimus-thy"
      [[ "$IMAGE_PREFIX" == optimus-thy ]] || die "DEPLOY_ENV=production exige IMAGE_PREFIX=optimus-thy"
      [[ "$COMPOSE_NETWORK" == optimus-thy-net ]] || die "DEPLOY_ENV=production exige COMPOSE_NETWORK=optimus-thy-net"
      ;;
    e2e)
      [[ "${E2E_MODE:-}" == 1 || "${E2E_MODE:-}" == true ]] || die "DEPLOY_ENV=e2e exige E2E_MODE=1"
      require_var E2E_ROOT
      [[ -d "$E2E_ROOT" ]] || die "DEPLOY_ENV=e2e exige E2E_ROOT existente: $E2E_ROOT"
      local app_real root_real
      app_real="$(cd -- "$APP_DIR" && pwd -P)"
      root_real="$(cd -- "$E2E_ROOT" && pwd -P)"
      case "$app_real" in "$root_real"/*) ;; *) die "DEPLOY_ENV=e2e exige APP_DIR dentro de E2E_ROOT ($app_real no está dentro de $root_real)" ;; esac
      [[ "$COMPOSE_PROJECT_NAME" == optimus-thy-e2e-* ]] || die "DEPLOY_ENV=e2e exige COMPOSE_PROJECT_NAME con prefijo optimus-thy-e2e-"
      [[ "$IMAGE_PREFIX" == optimus-thy-e2e-* ]] || die "DEPLOY_ENV=e2e exige IMAGE_PREFIX con prefijo optimus-thy-e2e-"
      [[ "$COMPOSE_NETWORK" == optimus-thy-e2e-* ]] || die "DEPLOY_ENV=e2e exige COMPOSE_NETWORK con prefijo optimus-thy-e2e-"
      ;;
    *)
      die "DEPLOY_ENV inválido: ${DEPLOY_ENV} (usa production|e2e)"
      ;;
  esac
}

load_env() {
  require_file "$ENV_FILE"
  set -a
  # .env es un archivo confiable del operador y puede contener secretos; nunca habilitar xtrace.
# shellcheck source=/dev/null
  source "$ENV_FILE"
  set +a
  verify_environment
}

lock_deploy() {
  mkdir -p "$APP_DIR"
  exec 9>"$APP_DIR/.deploy.lock"
  flock -n 9 || die "ya hay otra operación de despliegue en curso"
}

compose() {
  [[ -n "$COMPOSE_PROJECT_NAME" ]] || die "COMPOSE_PROJECT_NAME vacío: carga/verifica el entorno antes de usar docker compose"
  local project_dir="${COMPOSE_PROJECT_DIR:-${RELEASE_DIR:-$APP_DIR}}"
  local project_compose_server="$COMPOSE_SERVER"
  APP_DIR="$APP_DIR" RELEASE_DIR="$project_dir" RELEASE="${RELEASE:-}" \
    docker compose -p "$COMPOSE_PROJECT_NAME" --project-directory "$project_dir" --env-file "$ENV_FILE" \
      -f "$project_dir/docker-compose.yml" -f "$project_compose_server" "$@"
}

verify_compose_target() {
  verify_environment
  require_var TAILSCALE_IP
  local compose_json
  export RELEASE="${RELEASE:-preflight}"
  export RELEASE_DIR="${RELEASE_DIR:-$APP_DIR}"
  compose_json="$(compose config --format json)" || die "docker compose config falló al verificar el target"
  python3 - "$compose_json" "$COMPOSE_PROJECT_NAME" "$COMPOSE_NETWORK" "$IMAGE_PREFIX" "$TAILSCALE_IP" "${HTTPS_PORT:-18443}" <<'PY'
import json, sys
config = json.loads(sys.argv[1])
project, network, prefix, edge_ip, edge_port = sys.argv[2:]
if config.get('name') != project:
    raise SystemExit(f"compose name={config.get('name')!r} no coincide con COMPOSE_PROJECT_NAME={project!r}")
networks = config.get('networks') or {}
default = networks.get('default') or {}
if default.get('name') != network:
    raise SystemExit(f"network default.name={default.get('name')!r} no coincide con COMPOSE_NETWORK={network!r}")
services = config.get('services') or {}
for service in ('backend', 'frontend', 'ocr', 'ia'):
    image = (services.get(service) or {}).get('image') or ''
    expected = f"{prefix}-{service}:"
    if not image.startswith(expected):
        raise SystemExit(f"imagen de {service}={image!r} no empieza por {expected!r}")
published = []
for name, service in services.items():
    for port in (service.get('ports') or []):
        host_ip = str(port.get('host_ip') or port.get('hostIp') or '')
        pub = str(port.get('published') or port.get('target') or '')
        published.append((name, host_ip, pub))
if len(published) != 1 or published[0] != ('edge', edge_ip, edge_port):
    raise SystemExit(f"solo edge puede publicar {edge_ip}:{edge_port}; publicado={published!r}")
PY
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
  [[ -n "$IMAGE_PREFIX" ]] || die "IMAGE_PREFIX vacío: no se pueden calcular etiquetas de imagen"
  printf '{"backend":"%s-backend:%s","frontend":"%s-frontend:%s","ocr":"%s-ocr:%s","ia":"%s-ia:%s"}' \
    "$IMAGE_PREFIX" "$release" "$IMAGE_PREFIX" "$release" "$IMAGE_PREFIX" "$release" "$IMAGE_PREFIX" "$release"
}
