#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
REPO="$(cd -- "$SCRIPT_DIR/../.." && pwd -P)"
COMPOSE_FILE="$REPO/docker-compose.yml"
REPORT_DIR="$REPO/docs/cumplimiento/zap"
ZAP_IMAGENES=("ghcr.io/zaproxy/zap-stable" "zaproxy/zap-stable")

command -v docker >/dev/null 2>&1 || { printf 'ERROR: docker no está instalado\n' >&2; exit 1; }
docker info >/dev/null 2>&1 || { printf 'ERROR: daemon Docker no disponible\n' >&2; exit 1; }
command -v python3 >/dev/null 2>&1 || { printf 'ERROR: se requiere python3 para reservar un puerto libre\n' >&2; exit 1; }

ZAP_IMAGE=""
for candidata in "${ZAP_IMAGENES[@]}"; do
  if docker image inspect "$candidata" >/dev/null 2>&1; then
    ZAP_IMAGE="$candidata"
    break
  fi
  printf 'Descargando imagen ZAP %s…\n' "$candidata" >&2
  if docker pull "$candidata"; then
    ZAP_IMAGE="$candidata"
    break
  fi
done
if [ -z "$ZAP_IMAGE" ]; then
  printf 'No ejecutado: no se pudo obtener la imagen ZAP desde %s; se requiere conectividad con el registro o una imagen disponible localmente. El error real de Docker aparece arriba.\n' "${ZAP_IMAGENES[*]}" >&2
  exit 3
fi

mkdir -p "$REPORT_DIR"
tmpdir="$(mktemp -d "${TMPDIR:-/tmp}/seguridad-zap.XXXXXXXX")"
project="seguridad-$(python3 -c 'import secrets; print(secrets.token_hex(6))')"
network="$project"
reports="$tmpdir/salida"
mkdir -p "$reports" "$tmpdir/postgres" "$tmpdir/minio" "$tmpdir/modelos"
chmod 0777 "$reports"

read -r api_port db_password pii_key s3_secret kms_key < <(python3 - <<'PY'
import base64
import secrets
import socket

with socket.socket() as sock:
    sock.bind(("127.0.0.1", 0))
    port = sock.getsockname()[1]
print(
    port,
    secrets.token_hex(16),
    secrets.token_hex(32),
    secrets.token_urlsafe(32),
    "seguridad:" + base64.b64encode(secrets.token_bytes(32)).decode(),
)
PY
)

env_file="$tmpdir/compose.env"
cat >"$env_file" <<EOF
COMPOSE_NETWORK=$network
API_PORT=$api_port
POSTGRES_USER=seguridad
POSTGRES_PASSWORD=$db_password
POSTGRES_DB=seguridad
POSTGRES_DATA_DIR=$tmpdir/postgres
MINIO_DATA_DIR=$tmpdir/minio
DATABASE_URL=postgresql+psycopg://seguridad:$db_password@postgres:5432/seguridad
S3_ACCESS_KEY=seguridad
S3_SECRET_KEY=$s3_secret
S3_BUCKET=seguridad
MINIO_KMS_SECRET_KEY=$kms_key
PII_ENCRYPTION_KEY=$pii_key
IA_MODELOS_DIR=$tmpdir/modelos
SESSION_COOKIE_SECURE=false
EOF

compose() {
  docker compose -p "$project" --env-file "$env_file" -f "$COMPOSE_FILE" "$@"
}

stack_started=0
cleanup() {
  local exit_status=$?
  trap - EXIT
  if ((stack_started)); then
    if ! compose down; then
      printf 'ERROR: no se pudo detener el proyecto temporal %s\n' "$project" >&2
      exit_status=1
    fi
  fi
  # Los volúmenes de PostgreSQL y MinIO quedan con dueño del contenedor; se borran
  # desde un contenedor con los mismos privilegios para no fallar por permisos.
  if ! rm -rf -- "$tmpdir" 2>/dev/null; then
    docker run --rm --user 0 --entrypoint rm \
      --mount "type=bind,src=$tmpdir,dst=/borrar" \
      "$ZAP_IMAGE" -rf /borrar/minio /borrar/postgres /borrar/salida >/dev/null 2>&1 || true
    rm -rf -- "$tmpdir" 2>/dev/null || printf 'AVISO: quedó el directorio temporal %s\n' "$tmpdir" >&2
  fi
  exit "$exit_status"
}
trap cleanup EXIT

printf 'Proyecto temporal: %s; puerto API: %s\n' "$project" "$api_port"
stack_started=1
compose up -d --build frontend

api_url="http://127.0.0.1:$api_port/health"
ready=0
for _ in $(seq 1 90); do
  if curl -fsS --max-time 3 "$api_url" >/dev/null 2>&1; then
    ready=1
    break
  fi
  sleep 2
done
if ((ready == 0)); then
  printf 'ERROR: el backend temporal no respondió en /health dentro del tiempo esperado\n' >&2
  exit 1
fi
mkdir -p "$REPORT_DIR"
set +e
docker run --rm --network "$network" \
  --mount "type=bind,src=$reports,dst=/zap/wrk" \
  "$ZAP_IMAGE" zap-baseline.py -t http://frontend:8080 -r zap.html -J zap.json
zap_status=$?
set -e

for informe in zap.html zap.json; do
  if [[ ! -s "$reports/$informe" ]]; then
    printf 'ERROR: ZAP no generó %s; estado de salida %s\n' "$informe" "$zap_status" >&2
    exit 1
  fi
  cp -- "$reports/$informe" "$REPORT_DIR/$informe"
done
printf 'Informes ZAP guardados en docs/cumplimiento/zap/ (código ZAP: %s)\n' "$zap_status"
exit "$zap_status"
