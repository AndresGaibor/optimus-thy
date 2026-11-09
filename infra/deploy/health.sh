#!/usr/bin/env bash
set -Eeuo pipefail

check_health() {
  local release="$1" code health_json revision
  verify_environment
  export RELEASE="$release"
  # shellcheck disable=SC2153
  export RELEASE_DIR="$RELEASES_DIR/$release"
  [[ -n "$PUBLIC_URL" ]] || die "PUBLIC_URL no está configurada en $ENV_FILE"
  curl -kfsS "$PUBLIC_URL/healthz" >/dev/null || die "falló GET /healthz"
  curl -kfsS "$PUBLIC_URL/api/health" >/dev/null || die "falló GET /api/health"
  code="$(curl -ksS -o /dev/null -w '%{http_code}' -I "$PUBLIC_URL/")"
  [[ "$code" == 200 ]] || die "HEAD / devolvió HTTP $code, se esperaba 200"
  code="$(curl -ksS -o /dev/null -w '%{http_code}' "$PUBLIC_URL/api/auth/me")"
  [[ "$code" == 401 ]] || die "/api/auth/me devolvió HTTP $code, se esperaba 401"

  health_json="$(COMPOSE_PROJECT_DIR="$RELEASE_DIR" compose ps --format json)"
  python3 - "$health_json" <<'PY'
import json, sys
raw = sys.argv[1].strip()
if not raw:
    raise SystemExit('no hay servicios Compose')
try:
    rows = json.loads(raw)
except json.JSONDecodeError:
    rows = [json.loads(line) for line in raw.splitlines() if line.strip()]
for row in rows:
    state = str(row.get('State', row.get('state', ''))).lower()
    health = str(row.get('Health', row.get('health', ''))).lower()
    if state == 'exited' or 'unhealthy' in health:
        raise SystemExit(f"servicio en estado no saludable: {row.get('Service', row.get('Name', 'desconocido'))}")
PY
  revision="$(migration_revision current)"
  [[ -n "$revision" ]] || die "no se pudo leer la revisión Alembic actual"
  printf '%s\n' "$revision"
}
