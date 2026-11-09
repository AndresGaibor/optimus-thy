#!/usr/bin/env bash
# Respaldo cifrado de la base de datos y de los archivos (HT-013, RI-03, RNF-CON-01, RS-CIF-05).
#
# Genera en $BACKUP_DIR, cifrados con AES-256 (gpg simétrico, con comprobación de integridad):
#   db-AAAAMMDD-HHMMSS.sql.gz.gpg      pg_dump de la base
#   archivos-AAAAMMDD-HHMMSS.tar.gz.gpg  volumen de MinIO (imágenes y documentos)
#   SHA256SUMS-AAAAMMDD-HHMMSS         huellas de lo anterior
# La clave está en un archivo FUERA del repositorio ($BACKUP_KEY_FILE, modo 600): sin ella
# el respaldo no se abre, y sin respaldo la clave no sirve de nada. Guárdala por separado.
set -euo pipefail

RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PROYECTO="${COMPOSE_PROJECT_NAME:-optimus-thy}"
PG_CONTAINER="${PG_CONTAINER:-${PROYECTO}-postgres-1}"
VOLUMEN_ARCHIVOS="${VOLUMEN_ARCHIVOS:-${PROYECTO}_miniodata}"
DESTINO="${BACKUP_DIR:-$HOME/backups/optimus}"
CLAVE="${BACKUP_KEY_FILE:-}"
RETENER="${BACKUP_RETENER:-14}"

fail() { echo "ERROR: $*" >&2; exit 1; }

[[ -n "$CLAVE" ]] || fail "define BACKUP_KEY_FILE con la ruta del archivo de clave (fuera del repositorio)"
[[ -s "$CLAVE" ]] || fail "la clave $CLAVE no existe o está vacía"
[[ "$(stat -c %a "$CLAVE")" =~ ^[46]00$ ]] || fail "la clave debe tener modo 600 o 400"
case "$(realpath "$CLAVE")" in "$RAIZ"/*) fail "la clave no puede estar dentro del repositorio" ;; esac
docker inspect "$PG_CONTAINER" >/dev/null 2>&1 || fail "no existe el contenedor $PG_CONTAINER"

export GNUPGHOME="$(mktemp -d)"
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

docker exec "$PG_CONTAINER" sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-owner' \
    | gzip | cifrar "$DB"
echo "base de datos: $DB"

if docker volume inspect "$VOLUMEN_ARCHIVOS" >/dev/null 2>&1; then
    docker run --rm -v "$VOLUMEN_ARCHIVOS":/datos:ro alpine:3 tar -C /datos -czf - . \
        | cifrar "$ARCHIVOS"
    echo "archivos:      $ARCHIVOS"
else
    echo "Aviso: no existe el volumen $VOLUMEN_ARCHIVOS; solo se respalda la base." >&2
fi

( cd "$DESTINO" && sha256sum "$(basename "$DB")" $( [[ -f "$ARCHIVOS" ]] && basename "$ARCHIVOS") > "SHA256SUMS-$SELLO" )

# Rotación: conserva los últimos $RETENER juegos.
ls -1t "$DESTINO"/SHA256SUMS-* 2>/dev/null | tail -n +"$((RETENER + 1))" | while read -r viejo; do
    s="${viejo##*SHA256SUMS-}"
    rm -f "$DESTINO/db-$s.sql.gz.gpg" "$DESTINO/archivos-$s.tar.gz.gpg" "$viejo"
done
echo "OK: respaldo $SELLO"
