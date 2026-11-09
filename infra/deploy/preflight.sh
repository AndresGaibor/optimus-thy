#!/usr/bin/env bash
set -Eeuo pipefail

preflight() {
  local requested_ref="${1:-main}" resolved free_kib
  require_cmd docker; require_cmd git; require_cmd curl; require_cmd python3
  require_cmd flock; require_cmd df; require_cmd stat
  require_file "$ENV_FILE"
  [[ "$(stat -c '%a' "$ENV_FILE")" == 600 ]] || die ".env debe tener permisos 600 en $ENV_FILE"
  require_file "$COMPOSE_SERVER"
  load_env
  verify_environment

  local key value
  for key in DEPLOY_ENV COMPOSE_PROJECT_NAME IMAGE_PREFIX COMPOSE_NETWORK POSTGRES_USER POSTGRES_PASSWORD POSTGRES_DB DATABASE_URL PII_ENCRYPTION_KEY S3_ACCESS_KEY S3_SECRET_KEY S3_BUCKET ALLOWED_ORIGINS SESSION_COOKIE_SECURE ENVIRONMENT TAILSCALE_IP HTTPS_PORT PUBLIC_URL; do
    value="${!key:-}"
    [[ -n "$value" ]] || die "falta la variable requerida $key en $ENV_FILE"
  done
  [[ "$PII_ENCRYPTION_KEY" != *cambiar-en-local* && "$PII_ENCRYPTION_KEY" != *example* ]] || die "PII_ENCRYPTION_KEY conserva un valor de ejemplo"
  if [[ "$DEPLOY_ENV" == production ]]; then
    [[ "$SESSION_COOKIE_SECURE" == true ]] || die "SESSION_COOKIE_SECURE debe ser true en production"
    [[ "$ENVIRONMENT" == production ]] || die "ENVIRONMENT debe ser production"
  fi
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

  export RELEASE="${RELEASE:-preflight}" RELEASE_DIR="${RELEASE_DIR:-$APP_DIR}"
  verify_compose_target
  if compose ps --status running --services 2>/dev/null | grep -Fxq postgres; then
    compose exec -T postgres pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null || die "Postgres está corriendo pero no acepta conexiones"
  fi
  printf '%s\n' "$resolved"
}
