#!/usr/bin/env bash
set -Eeuo pipefail

preflight() {
  local requested_ref="${1:-main}" resolved free_kib compose_json
  require_cmd docker; require_cmd git; require_cmd curl; require_cmd python3
  require_cmd flock; require_cmd df; require_cmd stat
  [[ -f "$ENV_FILE" ]] || die "no existe el archivo .env"
  [[ "$(stat -c '%a' "$ENV_FILE")" == 600 ]] || die ".env debe tener permisos 600"
  [[ -f "$COMPOSE_SERVER" ]] || die "no existe el overlay Compose de producción"
  load_env

  local key value
  for key in POSTGRES_USER POSTGRES_PASSWORD POSTGRES_DB DATABASE_URL PII_ENCRYPTION_KEY S3_ACCESS_KEY S3_SECRET_KEY S3_BUCKET ALLOWED_ORIGINS SESSION_COOKIE_SECURE ENVIRONMENT TAILSCALE_IP HTTPS_PORT PUBLIC_URL; do
    value="${!key:-}"
    [[ -n "$value" ]] || die "falta la variable requerida $key en .env"
  done
  [[ "$PII_ENCRYPTION_KEY" != *cambiar-en-local* && "$PII_ENCRYPTION_KEY" != *example* ]] || die "PII_ENCRYPTION_KEY conserva un valor de ejemplo"
  [[ "$SESSION_COOKIE_SECURE" == true ]] || die "SESSION_COOKIE_SECURE debe ser true"
  [[ "$ENVIRONMENT" == production ]] || die "ENVIRONMENT debe ser production"
  [[ "$PUBLIC_URL" == https://* ]] || die "PUBLIC_URL debe usar HTTPS"

  git -C "$APP_DIR" fetch "$REPO_REMOTE" --prune --tags
  [[ "$MAIN_REF" == "$REPO_REMOTE"/* ]] || die "MAIN_REF debe apuntar al remoto configurado"
  git -C "$APP_DIR" rev-parse --verify "$MAIN_REF^{commit}" >/dev/null 2>&1 || die "no se pudo resolver MAIN_REF"
  if [[ "$requested_ref" == main ]]; then requested_ref="$MAIN_REF"; fi
  resolved="$(git -C "$APP_DIR" rev-parse --verify "$requested_ref^{commit}" 2>/dev/null)" || die "no se pudo resolver --ref"
  git -C "$APP_DIR" merge-base --is-ancestor "$resolved" "$MAIN_REF" || die "el commit solicitado no es ancestro de MAIN_REF"
  [[ -z "$(git -C "$APP_DIR" status --porcelain --untracked-files=no)" ]] || die "hay cambios tracked sin commit"
  docker info >/dev/null 2>&1 || die "Docker daemon no está disponible"

  free_kib="$(df -Pk "$APP_DIR" | awk 'NR==2 {print $4}')"
  if [[ ! "$free_kib" =~ ^[0-9]+$ ]] || (( free_kib < 5 * 1024 * 1024 )); then
    die "se requieren al menos 5 GiB libres en APP_DIR"
  fi

  export RELEASE=preflight RELEASE_DIR="$APP_DIR"
  compose_json="$(compose config --format json)" || die "docker compose config falló"
  python3 - "$compose_json" "$TAILSCALE_IP" "$HTTPS_PORT" <<'PY' || die "configuración de puertos inválida"
import json, sys
config = json.loads(sys.argv[1])
edge_ip, edge_port = sys.argv[2:]
services = config.get('services', {})
published = []
for name, service in services.items():
    ports = service.get('ports') or []
    if name in ('backend', 'postgres', 'storage') and ports:
        raise SystemExit(f'{name} no debe publicar puertos')
    for port in ports:
        published.append((name, str(port.get('host_ip', '')), str(port.get('published', ''))))
if len(published) != 1 or published[0] != ('edge', edge_ip, edge_port):
    raise SystemExit('solo edge puede publicar el puerto HTTPS configurado en TAILSCALE_IP')
PY
  if compose ps --status running --services | grep -Fxq postgres; then
    compose exec -T postgres pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null || die "Postgres está corriendo pero no acepta conexiones"
  fi
  printf '%s\n' "$resolved"
}
