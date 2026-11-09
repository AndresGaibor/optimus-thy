#!/usr/bin/env bash
set -Eeuo pipefail

# Plan de adopción (solo lectura). Requiere load_env y verify_environment ya ejecutados.
# Jamás muta Docker, contenedores, redes ni volúmenes.
adopt_plan() {
  local json_output=false
  while (($#)); do
    case "$1" in
      --json) json_output=true; shift ;;
      *) die "argumento desconocido para adopt: $1" ;;
    esac
  done

  export RELEASE="adopt" RELEASE_DIR="$APP_DIR"

  local proyecto="$COMPOSE_PROJECT_NAME" red="$COMPOSE_NETWORK"
  local bloqueos=()
  local advertencias=()
  local gestionado_por_releases=false
  local existe_instalacion=false
  local servicios_json='[]'
  local volumenes_json='[]'

  # --- Precondiciones de archivo/entorno ---
  require_file "$ENV_FILE"
  [[ "$(stat -c '%a' "$ENV_FILE")" == 600 ]] || bloqueos+=(".env debe tener modo 600: $ENV_FILE")
  require_file "$COMPOSE_SERVER"

  # BACKUP_KEY_FILE: existe, modo 600/400, legible, fuera del repo
  if [[ -z "${BACKUP_KEY_FILE:-}" ]]; then
    bloqueos+=("BACKUP_KEY_FILE no está definido en $ENV_FILE")
  elif [[ ! -e "$BACKUP_KEY_FILE" ]]; then
    bloqueos+=("BACKUP_KEY_FILE no existe: $BACKUP_KEY_FILE")
  elif [[ ! -f "$BACKUP_KEY_FILE" ]]; then
    bloqueos+=("BACKUP_KEY_FILE no es un archivo regular: $BACKUP_KEY_FILE")
  elif [[ ! -r "$BACKUP_KEY_FILE" ]]; then
    bloqueos+=("BACKUP_KEY_FILE no es legible: $BACKUP_KEY_FILE")
  else
    local key_mode app_dir_real backup_key_real
    key_mode="$(stat -c '%a' "$BACKUP_KEY_FILE" 2>/dev/null || true)"
    if [[ ! "$key_mode" =~ ^[46]00$ ]]; then
      bloqueos+=("BACKUP_KEY_FILE debe tener modo 600 o 400 (actual: $key_mode)")
    fi
    app_dir_real="$(realpath "$APP_DIR" 2>/dev/null || printf '%s' "$APP_DIR")"
    backup_key_real="$(realpath "$BACKUP_KEY_FILE" 2>/dev/null || printf '%s' "$BACKUP_KEY_FILE")"
    case "$backup_key_real" in
      "$app_dir_real"/*) bloqueos+=("BACKUP_KEY_FILE no puede estar dentro del repositorio: $BACKUP_KEY_FILE") ;;
    esac
  fi

  # BACKUP_DIR: existe o es creable por el operador (solo lectura: NO crear)
  if [[ -z "${BACKUP_DIR:-}" ]]; then
    bloqueos+=("BACKUP_DIR no está definido en $ENV_FILE")
  elif [[ -d "$BACKUP_DIR" ]]; then
    : # ok
  elif [[ -e "$BACKUP_DIR" ]]; then
    bloqueos+=("BACKUP_DIR existe pero no es un directorio: $BACKUP_DIR")
  else
    local backup_parent
    backup_parent="$(dirname "$BACKUP_DIR")"
    if [[ -d "$backup_parent" && -w "$backup_parent" ]]; then
      advertencias+=("BACKUP_DIR no existe pero su directorio padre es escribible; el operador debe crearlo antes del respaldo: $BACKUP_DIR")
    else
      bloqueos+=("BACKUP_DIR no existe y su directorio padre no existe o no es escribible (no se crea en modo solo lectura): $BACKUP_DIR")
    fi
  fi

  # PUBLIC_URL https
  if [[ -z "${PUBLIC_URL:-}" ]]; then
    bloqueos+=("PUBLIC_URL no está definido en $ENV_FILE")
  elif [[ "$PUBLIC_URL" != https://* ]]; then
    bloqueos+=("PUBLIC_URL debe usar HTTPS (actual: valor no HTTPS)")
  fi

  # Espacio libre >= 5 GiB en APP_DIR
  local free_kib
  free_kib="$(df -Pk "$APP_DIR" 2>/dev/null | awk 'NR==2 {print $4}')" || free_kib=""
  if [[ ! "$free_kib" =~ ^[0-9]+$ ]] || (( free_kib < 5 * 1024 * 1024 )); then
    bloqueos+=("se requieren al menos 5 GiB libres en APP_DIR")
  fi

  # deployments/current.json
  if [[ -f "$DEPLOYMENTS_DIR/current.json" ]]; then
    gestionado_por_releases=true
    advertencias+=("ya gestionado por releases: existe $DEPLOYMENTS_DIR/current.json; no se propone adopción")
  fi

  # compose config -q y validación del target efectivo
  if ! compose config -q >/dev/null 2>&1; then
    bloqueos+=("la configuración Compose no resuelve (compose config -q falló)")
  fi
  local target_error
  if ! target_error="$( (verify_compose_target) 2>&1)"; then
    bloqueos+=("el target Compose no es seguro: $target_error")
  fi

  # --- Inspección de instalación existente (solo lectura) ---
  local ps_json="[]"
  local ps_output
  if ps_output="$(compose ps -a --format json 2>&1)"; then
    ps_json="$ps_output"
  else
    bloqueos+=("no se pudo inspeccionar el estado de Compose: $ps_output")
  fi
  if ! docker info >/dev/null 2>&1; then
    bloqueos+=("el daemon Docker no responde (docker info falló)")
  fi
  # compose ps --format json puede ser un objeto por línea o un array según versión; normalizar a array
  servicios_json="$(python3 - "$ps_json" <<'PY'
import json, sys
raw = sys.argv[1].strip()
if not raw:
    print('[]'); sys.exit(0)
try:
    data = json.loads(raw)
    if isinstance(data, dict):
        data = [data]
    if not isinstance(data, list):
        data = []
except Exception:
    data = []
    for line in raw.splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            data.append(json.loads(line))
        except Exception:
            pass
out = []
for s in data:
    if not isinstance(s, dict):
        continue
    out.append({
        'service': s.get('Service') or s.get('Name') or '',
        'name': s.get('Name') or '',
        'state': s.get('State') or s.get('Status') or '',
        'status': s.get('Status') or '',
    })
print(json.dumps(out, ensure_ascii=False))
PY
)"

  local service_count
  service_count="$(python3 -c 'import json,sys; print(len(json.loads(sys.argv[1])))' "$servicios_json" 2>/dev/null || echo 0)"

  # Volúmenes pgdata y miniodata
  local vol_names=("${proyecto}_pgdata" "${proyecto}_miniodata")
  local vol_entries=()
  local vol_count=0
  for vn in "${vol_names[@]}"; do
    local inspect_output inspect_error
    if inspect_output="$(docker volume inspect "$vn" 2>&1)"; then
      vol_count=$((vol_count + 1))
      local vlabel vcreated vmount
      vlabel="$(docker volume inspect "$vn" --format '{{index .Labels "com.docker.compose.project"}}' 2>/dev/null || true)"
      vcreated="$(docker volume inspect "$vn" --format '{{.CreatedAt}}' 2>/dev/null || true)"
      vmount="$(docker volume inspect "$vn" --format '{{.Mountpoint}}' 2>/dev/null || true)"
      if [[ -n "$vlabel" && "$vlabel" != "$proyecto" ]]; then
        bloqueos+=("volumen $vn existe con proyecto Compose distinto (etiqueta: $vlabel, esperado: $proyecto)")
      elif [[ -z "$vlabel" ]]; then
        advertencias+=("volumen $vn existe sin etiqueta com.docker.compose.project; verificar que pertenece al proyecto $proyecto")
      fi
      vol_entries+=("$(python3 - "$vn" "$vlabel" "$vcreated" "$vmount" <<'PY'
import json, sys
print(json.dumps({
  'name': sys.argv[1],
  'project_label': sys.argv[2] or None,
  'created_at': sys.argv[3] or None,
  'mountpoint': sys.argv[4] or None,
  'exists': True,
}, ensure_ascii=False))
PY
)")
    else
      inspect_error="$inspect_output"
      case "$inspect_error" in
        *[Nn]o\ such\ volume*|*[Nn]ot\ found*)
          vol_entries+=("$(python3 - "$vn" <<'PY'
import json, sys
print(json.dumps({'name': sys.argv[1], 'exists': False}, ensure_ascii=False))
PY
)")
          ;;
        *)
          bloqueos+=("no se pudo inspeccionar el volumen $vn: $inspect_error")
          vol_entries+=("$(python3 - "$vn" "$inspect_error" <<'PY'
import json, sys
print(json.dumps({'name': sys.argv[1], 'exists': None, 'error': sys.argv[2]}, ensure_ascii=False))
PY
)")
          ;;
      esac
    fi
  done
  volumenes_json="$(python3 - "${vol_entries[@]}" <<'PY'
import json, sys
print(json.dumps([json.loads(x) for x in sys.argv[1:]], ensure_ascii=False))
PY
)"

  # Red
  local red_info_json='{"name":"'"$red"'","exists":false}'
  local network_output
  if network_output="$(docker network inspect "$red" 2>&1)"; then
    local nlabel
    nlabel="$(docker network inspect "$red" --format '{{index .Labels "com.docker.compose.project"}}' 2>/dev/null || true)"
    if [[ -n "$nlabel" && "$nlabel" != "$proyecto" ]]; then
      bloqueos+=("red $red existe con proyecto Compose distinto (etiqueta: $nlabel, esperado: $proyecto)")
    elif [[ -z "$nlabel" ]]; then
      advertencias+=("red $red existe sin etiqueta com.docker.compose.project; verificar que pertenece al proyecto $proyecto")
    fi
    red_info_json="$(python3 - "$red" "$nlabel" <<'PY'
import json, sys
print(json.dumps({'name': sys.argv[1], 'project_label': sys.argv[2] or None, 'exists': True}, ensure_ascii=False))
PY
)"
  else
    case "$network_output" in
      *[Nn]o\ such\ network*|*[Nn]ot\ found*) ;;
      *)
        bloqueos+=("no se pudo inspeccionar la red $red: $network_output")
        red_info_json="$(python3 - "$red" "$network_output" <<'PY'
import json, sys
print(json.dumps({'name': sys.argv[1], 'exists': None, 'error': sys.argv[2]}, ensure_ascii=False))
PY
)"
        ;;
    esac
  fi

  # Clasificación
  if (( service_count == 0 && vol_count == 0 )); then
    existe_instalacion=false
  else
    existe_instalacion=true
  fi

  # Comprobación de que deploy.sh deploy no recreará postgres/storage
  local deploy_no_recrea_db="false (no se ha confirmado postgres en ejecución)"
  local pg_exists=false pg_running=false storage_exists=false
  read -r pg_exists pg_running storage_exists < <(python3 - "$servicios_json" <<'PY'
import json, sys
rows = json.loads(sys.argv[1])
postgres = [row for row in rows if row.get('service') == 'postgres']
storage = any(row.get('service') == 'storage' for row in rows)
print(str(bool(postgres)).lower(), str(any(str(row.get('state', '')).lower() == 'running' for row in postgres)).lower(), str(storage).lower())
PY
)
  if [[ "$pg_exists" == true ]]; then
    if [[ "$pg_running" == true ]]; then
      deploy_no_recrea_db="true (postgres está en ejecución; deploy.sh deploy no recrea postgres/storage ni borra volúmenes)"
    else
      bloqueos+=("postgres existe pero no está corriendo; deploy se detendrá")
      deploy_no_recrea_db="false (postgres existe pero no está corriendo)"
    fi
  elif [[ "$storage_exists" == true || "$vol_count" -gt 0 ]]; then
    advertencias+=("pila parcial sin postgres: deploy la tratará como primera instalación y podría omitir el respaldo")
    deploy_no_recrea_db="false (pila parcial sin postgres; deploy la tratará como primera instalación)"
  else
    deploy_no_recrea_db="false (no existe contenedor postgres; deploy la tratará como primera instalación)"
  fi

  # Recomendación
  local recomendacion
  if ((${#bloqueos[@]} > 0)); then
    recomendacion="corregir bloqueos antes de adoptar o desplegar"
  elif [[ "$gestionado_por_releases" == true ]]; then
    recomendacion="ya gestionado por releases; usar deploy.sh deploy/status según corresponda, no adoptar de nuevo"
  elif [[ "$existe_instalacion" == false ]]; then
    recomendacion="primera instalación: usar ./deploy.sh deploy"
  else
    recomendacion="instalación existente detectada: revisar bloqueos y advertencias antes de usar ./deploy.sh deploy; el estado de postgres/storage está indicado arriba"
  fi

  # Backup info (sin credenciales)
  local backup_info_json
  backup_info_json="$(python3 - "${BACKUP_KEY_FILE:-}" "${BACKUP_DIR:-}" "$APP_DIR" <<'PY'
import json, os, sys
key = sys.argv[1]
bdir = sys.argv[2]
repo = os.path.realpath(sys.argv[3])
key_outside_repo = None
if key and os.path.exists(key):
    key_real = os.path.realpath(key)
    key_outside_repo = not (key_real == repo or key_real.startswith(repo.rstrip(os.sep) + os.sep))
info = {'key_configured': bool(key), 'key_outside_repo': key_outside_repo, 'key_mode_ok': None, 'dir_configured': bool(bdir), 'dir_exists': os.path.isdir(bdir) if bdir else False}
if key and os.path.exists(key):
    try:
        mode = oct(os.stat(key).st_mode)[-3:]
        info['key_mode_ok'] = mode in ('600', '400')
    except Exception:
        info['key_mode_ok'] = False
print(json.dumps(info, ensure_ascii=False))
PY
)"

  local bloqueos_json advertencias_json
  bloqueos_json="$(python3 - "${bloqueos[@]+"${bloqueos[@]}"}" <<'PY'
import json, sys
print(json.dumps(list(sys.argv[1:]), ensure_ascii=False))
PY
)"
  advertencias_json="$(python3 - "${advertencias[@]+"${advertencias[@]}"}" <<'PY'
import json, sys
print(json.dumps(list(sys.argv[1:]), ensure_ascii=False))
PY
)"

  local result_json
  result_json="$(python3 - \
    "$([[ "$existe_instalacion" == true ]] && echo true || echo false)" \
    "$proyecto" "$red" "$servicios_json" "$volumenes_json" "$red_info_json" \
    "$backup_info_json" \
    "$([[ "$gestionado_por_releases" == true ]] && echo true || echo false)" \
    "$bloqueos_json" "$advertencias_json" "$deploy_no_recrea_db" "$recomendacion" <<'PY'
import json, sys
existe = sys.argv[1] == 'true'
print(json.dumps({
  'existe_instalacion': existe,
  'proyecto': sys.argv[2],
  'red': sys.argv[3],
  'servicios': json.loads(sys.argv[4]),
  'volumenes': json.loads(sys.argv[5]),
  'red_info': json.loads(sys.argv[6]),
  'backup': json.loads(sys.argv[7]),
  'gestionado_por_releases': sys.argv[8] == 'true',
  'bloqueos': json.loads(sys.argv[9]),
  'advertencias': json.loads(sys.argv[10]),
  'deploy_no_recrea_postgres_storage': sys.argv[11],
  'recomendacion': sys.argv[12],
}, ensure_ascii=False, indent=2))
PY
)"

  if [[ "$json_output" == true ]]; then
    printf '%s\n' "$result_json"
  else
    log "Plan de adopción (solo lectura, sin mutaciones Docker)"
    log "Proyecto: $proyecto | Red: $red"
    if [[ "$existe_instalacion" == true ]]; then
      log "Instalación existente: SÍ ($service_count servicio(s) detectado(s), $vol_count volumen(es) de datos encontrado(s))"
    else
      log "Instalación existente: NO (sin contenedores ni volúmenes del proyecto)"
    fi
    if [[ "$gestionado_por_releases" == true ]]; then
      warn "ya gestionado por releases: existe $DEPLOYMENTS_DIR/current.json; no se propone adopción"
    fi
    log "Servicios (compose ps -a):"
    python3 - "$servicios_json" <<'PY'
import json, sys
items = json.loads(sys.argv[1])
for s in items:
    svc = s.get('service') or s.get('name') or '?'
    print(f"  - {svc}: state={s.get('state')}, status={s.get('status')}")
if not items:
    print("  (ninguno)")
PY
    log "Volúmenes de datos:"
    python3 - "$volumenes_json" <<'PY'
import json, sys
for v in json.loads(sys.argv[1]):
    if v.get('exists') is True:
        print(f"  - {v['name']}: existe, etiqueta proyecto={v.get('project_label')}, creado={v.get('created_at')}")
    elif v.get('exists') is None:
        print(f"  - {v['name']}: inspección fallida: {v.get('error')}")
    else:
        print(f"  - {v['name']}: no existe")
PY
    log "Red: $red (existe=$(python3 -c "import json,sys; print(json.loads(sys.argv[1]).get('exists'))" "$red_info_json"), etiqueta=$(python3 -c "import json,sys; print(json.loads(sys.argv[1]).get('project_label'))" "$red_info_json"))"
    log "deploy.sh deploy no recreará postgres/storage: $deploy_no_recrea_db"
    if ((${#advertencias[@]} > 0)); then
      for a in "${advertencias[@]}"; do warn "$a"; done
    fi
    if ((${#bloqueos[@]} > 0)); then
      for b in "${bloqueos[@]}"; do printf '[deploy] BLOQUEO: %s\n' "$b" >&2; done
    fi
    log "Recomendación: $recomendacion"
  fi

  if ((${#bloqueos[@]} > 0)); then
    return 1
  fi
  return 0
}
