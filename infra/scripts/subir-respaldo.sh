#!/usr/bin/env bash
# Copia externa opcional de un set de respaldo a S3-compatible.
#
#   subir-respaldo.sh <db> <archivos|-> <sha256sums>
#
# Si BACKUP_S3_BUCKET, BACKUP_S3_ENDPOINT, BACKUP_S3_ACCESS_KEY y
# BACKUP_S3_SECRET_KEY no están configurados, sale 0 indicando "no configurado".
# Si están parcialmente configurados, falla con mensaje claro.
# Si la subida falla, falla (para que respaldo.sh pueda fallar el respaldo).
# No imprime credenciales ni usa set -x.
set -euo pipefail

DB="${1:-}"
ARCHIVOS="${2:-}"
SHA256SUMS="${3:-}"

fail() { echo "ERROR: $*" >&2; exit 1; }
info() { echo "subir-respaldo: $*"; }

BUCKET="${BACKUP_S3_BUCKET:-}"
ENDPOINT="${BACKUP_S3_ENDPOINT:-}"
ACCESS_KEY="${BACKUP_S3_ACCESS_KEY:-}"
SECRET_KEY="${BACKUP_S3_SECRET_KEY:-}"
PREFIX="${BACKUP_S3_PREFIX:-optimus-thy/respaldos}"
IMAGE="${BACKUP_S3_AWSCLI_IMAGE:-amazon/aws-cli:2.15.17}"

configured=0
for v in "$BUCKET" "$ENDPOINT" "$ACCESS_KEY" "$SECRET_KEY"; do
    [[ -n "$v" ]] && configured=$((configured + 1))
done

if [[ "$configured" -eq 0 ]]; then
    info "no configurado: omitiendo copia externa (define BACKUP_S3_BUCKET, BACKUP_S3_ENDPOINT, BACKUP_S3_ACCESS_KEY, BACKUP_S3_SECRET_KEY)"
    exit 0
fi
if [[ "$configured" -lt 4 ]]; then
    fail "configuración S3 incompleta: se requieren BACKUP_S3_BUCKET, BACKUP_S3_ENDPOINT, BACKUP_S3_ACCESS_KEY y BACKUP_S3_SECRET_KEY (definidas: $configured/4)"
fi

[[ -n "$DB" && -f "$DB" ]] || fail "uso: subir-respaldo.sh <db.gpg> <archivos.tar.gz.gpg|-> <SHA256SUMS-*>"
[[ -n "$SHA256SUMS" && -f "$SHA256SUMS" ]] || fail "no existe SHA256SUMS: $SHA256SUMS"
if [[ "$ARCHIVOS" != "-" && -n "$ARCHIVOS" && ! -f "$ARCHIVOS" ]]; then
    fail "no existe archivo de respaldo: $ARCHIVOS"
fi

command -v docker >/dev/null 2>&1 || fail "docker no disponible para subida S3 (imagen $IMAGE)"

# Directorio temporal con montajes; los nombres son estables para aws s3 cp.
tmp="$(mktemp -d)"
cleanup() { rm -rf "$tmp"; }
trap cleanup EXIT

cp "$DB" "$tmp/"
cp "$SHA256SUMS" "$tmp/"
if [[ "$ARCHIVOS" != "-" && -n "$ARCHIVOS" ]]; then
    cp "$ARCHIVOS" "$tmp/"
fi

# Credenciales solo por entorno del contenedor efímero, nunca por stdout.
aws_cp() {
    local src_name="$1"
    local dest="s3://${BUCKET}/${PREFIX}/${src_name}"
    docker run --rm --network host \
        -e AWS_ACCESS_KEY_ID="$ACCESS_KEY" \
        -e AWS_SECRET_ACCESS_KEY="$SECRET_KEY" \
        -e AWS_DEFAULT_REGION="${BACKUP_S3_REGION:-us-east-1}" \
        -v "$tmp:/data:ro" \
        "$IMAGE" \
        s3 cp "/data/$src_name" "$dest" \
        --endpoint-url "$ENDPOINT" \
        --no-progress >/dev/null
    info "subido: ${PREFIX}/${src_name}"
}

aws_cp "$(basename "$DB")"
if [[ "$ARCHIVOS" != "-" && -n "$ARCHIVOS" ]]; then
    aws_cp "$(basename "$ARCHIVOS")"
fi
aws_cp "$(basename "$SHA256SUMS")"
info "OK: copia externa completada en s3://${BUCKET}/${PREFIX}/"
