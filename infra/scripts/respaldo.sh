#!/usr/bin/env bash
# Respaldo cifrado de la base de datos y de los archivos (HT-013, RI-03, RNF-CON-01, RS-CIF-05).
#
# Genera en $BACKUP_DIR, cifrados con AES-256 (gpg simétrico, con comprobación de integridad):
#   db-AAAAMMDD-HHMMSS.sql.gz.gpg        pg_dump de la base (sin owner/ACL; restaurable en
#                                         Postgres limpio; roles/ACL globales: pg_dumpall --globals-only)
#   archivos-AAAAMMDD-HHMMSS.tar.gz.gpg  volumen de MinIO (imágenes y documentos)
#   SHA256SUMS-AAAAMMDD-HHMMSS           huellas de lo anterior
# La clave está en un archivo FUERA del repositorio ($BACKUP_KEY_FILE, modo 600): sin ella
# el respaldo no se abre, y sin respaldo la clave no sirve de nada. Guárdala por separado.
#
# RAIZ=<app_dir> permite invocarlo desde el directorio de la app (deploy); por defecto
# es el directorio padre de infra/scripts/.
# Retención configurable: BACKUP_RETENER_DIAS (14), BACKUP_RETENER_SEMANAS (8),
# BACKUP_RETENER_MESES (6). Siempre conserva el set recién creado.
# Copia externa opcional: subir-respaldo.sh si BACKUP_S3_* está configurado.
# No imprime secretos ni usa set -x.
set -euo pipefail

RAIZ="${RAIZ:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"
SCRIPTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROYECTO="${COMPOSE_PROJECT_NAME:?define COMPOSE_PROJECT_NAME}"
PG_CONTAINER="${PG_CONTAINER:-${PROYECTO}-postgres-1}"
VOLUMEN_ARCHIVOS="${VOLUMEN_ARCHIVOS:-${PROYECTO}_miniodata}"
DESTINO="${BACKUP_DIR:-$HOME/backups/optimus}"
CLAVE="${BACKUP_KEY_FILE:-}"
BACKUP_RETENER_DIAS="${BACKUP_RETENER_DIAS:-14}"
BACKUP_RETENER_SEMANAS="${BACKUP_RETENER_SEMANAS:-8}"
BACKUP_RETENER_MESES="${BACKUP_RETENER_MESES:-6}"

fail() { echo "ERROR: $*" >&2; exit 1; }

[[ -n "$CLAVE" ]] || fail "define BACKUP_KEY_FILE con la ruta del archivo de clave (fuera del repositorio)"
[[ -s "$CLAVE" ]] || fail "la clave $CLAVE no existe o está vacía"
[[ "$(stat -c %a "$CLAVE")" =~ ^[46]00$ ]] || fail "la clave debe tener modo 600 o 400"
case "$(realpath "$CLAVE")" in "$RAIZ"/*) fail "la clave no puede estar dentro del repositorio" ;; esac
docker inspect "$PG_CONTAINER" >/dev/null 2>&1 || fail "no existe el contenedor $PG_CONTAINER"
command -v gpg >/dev/null 2>&1 || fail "gpg no disponible"

export GNUPGHOME
GNUPGHOME="$(mktemp -d)"
trap 'rm -rf "$GNUPGHOME"' EXIT
cifrar() {
    gpg --batch --yes --quiet --pinentry-mode loopback --passphrase-file "$CLAVE" \
        --symmetric --cipher-algo AES256 -o "$1"
}

umask 077
mkdir -p "$DESTINO"
SELLO="$(date +%Y%m%d-%H%M%S)"
DB="$DESTINO/db-$SELLO.sql.gz.gpg"
ARCHIVOS="$DESTINO/archivos-$SELLO.tar.gz.gpg"
ARCHIVOS_CREADO=0

docker exec "$PG_CONTAINER" sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-owner --no-privileges' \
    | gzip | cifrar "$DB"
echo "base de datos: $DB"

if docker volume inspect "$VOLUMEN_ARCHIVOS" >/dev/null 2>&1; then
    docker run --rm -v "$VOLUMEN_ARCHIVOS":/datos:ro alpine:3 tar -C /datos -czf - . \
        | cifrar "$ARCHIVOS"
    ARCHIVOS_CREADO=1
    echo "archivos:      $ARCHIVOS"
else
    echo "Aviso: no existe el volumen $VOLUMEN_ARCHIVOS; solo se respalda la base." >&2
fi

SHA256SUMS="$DESTINO/SHA256SUMS-$SELLO"
if [[ "$ARCHIVOS_CREADO" -eq 1 ]]; then
    ( cd "$DESTINO" && sha256sum "$(basename "$DB")" "$(basename "$ARCHIVOS")" > "$(basename "$SHA256SUMS")" )
else
    ( cd "$DESTINO" && sha256sum "$(basename "$DB")" > "$(basename "$SHA256SUMS")" )
fi

# Retención configurable (conserva siempre el set recién creado).
if [[ -x "$SCRIPTS_DIR/retener_respaldos.py" ]]; then
    python3 "$SCRIPTS_DIR/retener_respaldos.py" \
        --dir "$DESTINO" \
        --days "$BACKUP_RETENER_DIAS" \
        --weeks "$BACKUP_RETENER_SEMANAS" \
        --months "$BACKUP_RETENER_MESES" \
        --keep-stamp "$SELLO"
else
    fail "no se encontró $SCRIPTS_DIR/retener_respaldos.py"
fi

# Copia externa opcional después de la retención (sube el set nuevo; el script
# decide si está configurado y falla si la subida falla).
ARCHIVOS_ARG="-"
if [[ "$ARCHIVOS_CREADO" -eq 1 ]]; then
    ARCHIVOS_ARG="$ARCHIVOS"
fi
"$SCRIPTS_DIR/subir-respaldo.sh" "$DB" "$ARCHIVOS_ARG" "$SHA256SUMS"

echo "OK: respaldo $SELLO"
# Líneas estables para consumo automático (deploy). No añadir nada después.
echo "BACKUP_DB=$DB"
if [[ "$ARCHIVOS_CREADO" -eq 1 ]]; then
    echo "BACKUP_FILES=$ARCHIVOS"
else
    echo "BACKUP_FILES="
fi
echo "BACKUP_SHA256SUMS=$SHA256SUMS"
