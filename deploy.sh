#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
source "$ROOT/infra/deploy/lib.sh"
source "$ROOT/infra/deploy/preflight.sh"
source "$ROOT/infra/deploy/release.sh"
source "$ROOT/infra/deploy/migrate.sh"
source "$ROOT/infra/deploy/health.sh"
source "$ROOT/infra/deploy/rollback.sh"

usage() {
  cat <<'EOF'
Uso: ./deploy.sh <comando> [--ref REF] [--yes]

Comandos:
  help       muestra esta ayuda (no requiere root ni .env)
  status     release actual, imágenes, revisión DB, salud y último backup
  check      valida prerequisitos de host, Git, .env y Compose
  backup     crea y valida un respaldo
  deploy     construye y despliega un release por commit
  rollback   vuelve a la aplicación del release anterior compatible con la DB

Configuración por entorno: APP_DIR, ENV_FILE, COMPOSE_SERVER, RELEASES_DIR,
DEPLOYMENTS_DIR, COMPOSE_PROJECT_NAME, REPO_REMOTE, MAIN_REF, PUBLIC_URL.
APP_DIR puede contener .env y compose.server.yaml. El overlay de producción
requiere RELEASE, TAILSCALE_IP, APP_DIR y RELEASE_DIR.
EOF
}

confirm() {
  [[ "${YES:-false}" == true ]] && return 0
  [[ -t 0 ]] || die "operación interactiva requerida; usa --yes para confirmar explícitamente"
  local answer
  read -r -p "¿Continuar? [y/N] " answer
  [[ "$answer" == y || "$answer" == Y || "$answer" == yes || "$answer" == YES ]] || die "operación cancelada"
}

run_backup() {
  local output line db='' files='' sums=''
  output="$(RAIZ="$APP_DIR" COMPOSE_PROJECT_NAME="$COMPOSE_PROJECT_NAME" "$APP_DIR/infra/scripts/respaldo.sh")" || die "falló el respaldo"
  while IFS= read -r line; do
    case "$line" in
      BACKUP_DB=*) db="${line#BACKUP_DB=}" ;;
      BACKUP_FILES=*) files="${line#BACKUP_FILES=}" ;;
      BACKUP_SHA256SUMS=*) sums="${line#BACKUP_SHA256SUMS=}" ;;
    esac
  done <<<"$output"
  [[ -n "$db" && -f "$db" ]] || die "respaldo no reportó BACKUP_DB existente"
  [[ -n "$files" && -f "$files" ]] || die "respaldo no reportó BACKUP_FILES existente"
  [[ -n "$sums" && -f "$sums" ]] || die "respaldo no reportó BACKUP_SHA256SUMS existente"
  (cd "$(dirname "$sums")" && sha256sum -c "$(basename "$sums")") >/dev/null || die "falló la verificación de checksums del respaldo"
  python3 - "$db" "$files" "$sums" <<'PY'
import json, sys
print(json.dumps({'db': sys.argv[1], 'files': sys.argv[2], 'sha256sums': sys.argv[3]}))
PY
}

stack_has_postgres() {
  local rows
  rows="$(compose ps -a --format json)"
  python3 - "$rows" <<'PY'
import json, sys
raw = sys.argv[1].strip()
if raw:
    try: rows = json.loads(raw)
    except json.JSONDecodeError: rows = [json.loads(line) for line in raw.splitlines() if line.strip()]
else: rows = []
raise SystemExit(0 if any(row.get('Service', row.get('service')) == 'postgres' for row in rows) else 1)
PY
}

show_status() {
  if [[ ! -f "$DEPLOYMENTS_DIR/current.json" ]]; then
    log "no hay un release desplegado (current.json no existe)"
    return 0
  fi
  load_env
  local release images rev last_backup
  release="$(json_get "$DEPLOYMENTS_DIR/current.json" release)"
  images="$(json_get "$DEPLOYMENTS_DIR/current.json" images)"
  last_backup="$(json_get "$DEPLOYMENTS_DIR/current.json" backup 2>/dev/null || true)"
  log "release: $release"
  log "imágenes: $images"
  RELEASE="$release"
  RELEASE_DIR="$RELEASES_DIR/$release"
  rev="$(migration_revision current)"
  log "revisión DB: ${rev:-desconocida}"
  log "último backup: ${last_backup:-ninguno registrado}"
  if check_health "$release" >/dev/null; then log "salud: OK"; else warn "salud: fallo en una o más comprobaciones"; fi
  COMPOSE_PROJECT_DIR="$RELEASE_DIR" compose ps
}

SCRIPT_DIR="$ROOT/infra/deploy"
command_name="${1:-help}"
[[ "$command_name" == help || "$command_name" == -h || "$command_name" == --help ]] && { usage; exit 0; }
shift || true
REF="main"
REF_GIVEN=false
YES=false
while (($#)); do
  case "$1" in
    --ref) (($# >= 2)) || die "--ref requiere un valor"; REF="$2"; REF_GIVEN=true; shift 2 ;;
    --yes|-y) YES=true; shift ;;
    *) [[ "$command_name" == rollback && -z "${ROLLBACK_TARGET:-}" ]] || die "argumento desconocido: $1"; ROLLBACK_TARGET="$1"; shift ;;
  esac
done

case "$command_name" in
  check)
    resolved="$(preflight "$REF")"
    log "prerequisitos válidos; commit: $resolved"
    ;;
  status)
    show_status
    ;;
  backup)
    lock_deploy; load_env; confirm
    backup_json="$(run_backup)"
    log "backup y checksums verificados: $backup_json"
    ;;
  deploy)
    lock_deploy; confirm
    declare -g MIGRATION_STARTED=false
    recovery_notice() {
      local status=$?
      if (( status != 0 )) && [[ "$MIGRATION_STARTED" == true ]]; then
        printf '[deploy] ERROR: migración iniciada; no se hizo downgrade ni restore automático.\n' >&2
        printf '[deploy] Comprueba: ./deploy.sh status\n' >&2
        printf '[deploy] Recuperación manual: restaurar el backup registrado o desplegar un release compatible con la revisión DB actual.\n' >&2
      fi
    }
    trap recovery_notice EXIT
    sha="$(preflight "$REF")"
    export RELEASE="$sha"
    export RELEASE_DIR="$RELEASES_DIR/$sha"
    build_output="$(build_release "$sha")"
    [[ "$(printf '%s\n' "$build_output" | wc -l)" -eq 4 ]] || die "build no devolvió exactamente cuatro imágenes"
    image_ids='{}'
    while IFS='=' read -r service image_id; do
      case "$service" in backend|frontend|ocr|ia) ;; *) continue ;; esac
      image_ids="$(python3 - "$image_ids" "$service" "$image_id" <<'PY'
import json, sys
value = json.loads(sys.argv[1]); value[sys.argv[2]] = sys.argv[3]; print(json.dumps(value, separators=(',', ':')))
PY
)"
    done <<<"$build_output"
    images="$(python3 - "$sha" <<'PY'
import json, sys
sha = sys.argv[1]
print(json.dumps({name: f'optimus-thy-{name}:{sha}' for name in ('backend', 'frontend', 'ocr', 'ia')}, separators=(',', ':')))
PY
)"
    [[ "$(python3 -c 'import json,sys; print(len(json.load(sys.stdin)))' <<<"$images")" -eq 4 ]] || die "no se registraron todas las etiquetas de imagen"
    [[ "$(python3 -c 'import json,sys; print(len(json.load(sys.stdin)))' <<<"$image_ids")" -eq 4 ]] || die "no se registraron todos los IDs de imagen"
    previous=''
    [[ -f "$DEPLOYMENTS_DIR/current.json" ]] && previous="$(json_get "$DEPLOYMENTS_DIR/current.json" release)"
    if stack_has_postgres; then
      running_services="$(compose ps --status running --services)" || die "no se pudo consultar el estado del stack"
      grep -Fxq postgres <<<"$running_services" || die "Postgres existe pero no está corriendo; no se migrará una base detenida"
      backup_json="$(run_backup)"
      log "respaldo previo verificado"
    else
      log "primer despliegue: inicializando postgres y storage antes de migrar; se omite el backup"
      compose up -d --no-build --wait --wait-timeout 180 postgres storage
    fi
    MIGRATION_STARTED=true
    revision_output="$(migrate_release)" || die "falló la migración"
    mapfile -t revisions <<<"$revision_output"
    (( ${#revisions[@]} == 2 )) || die "no se pudieron registrar revisiones Alembic"
    db_before="${revisions[0]}"; db_after="${revisions[1]}"
    compose up -d --no-build --wait --wait-timeout 180 backend frontend ocr ia edge
    check_health "$sha" >/dev/null
    deployed_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
    result='success'
    metadata="$(python3 - "$sha" "$previous" "$deployed_at" "$images" "$image_ids" "$db_before" "$db_after" "${backup_json:-null}" "$result" <<'PY'
import json, sys
release, previous, deployed_at, images, image_ids, before, after, backup, result = sys.argv[1:]
print(json.dumps({'release': release, 'previous': previous or None, 'deployed_at': deployed_at, 'images': json.loads(images), 'image_ids': json.loads(image_ids), 'db_revision_before': before or None, 'db_revision_after': after, 'backup': json.loads(backup) if backup != 'null' else None, 'result': result}))
PY
)"
    json_write "$DEPLOYMENTS_DIR/current.json" "$metadata"
    cp "$DEPLOYMENTS_DIR/current.json" "$DEPLOYMENTS_DIR/$sha.json"
    cp "$DEPLOYMENTS_DIR/current.json" "$DEPLOYMENTS_DIR/deploy-$deployed_at-$sha.json"
    log "release $sha desplegado correctamente"
    ;;
  rollback)
    rollback_target="${ROLLBACK_TARGET:-}"
    if [[ -z "$rollback_target" && "$REF_GIVEN" == true ]]; then rollback_target="$REF"; fi
    rollback_release "$rollback_target"
    ;;
  *) die "comando desconocido: $command_name (usa help)" ;;
esac
