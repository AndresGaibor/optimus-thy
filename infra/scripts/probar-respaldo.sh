#!/usr/bin/env bash
# Prueba de punta a punta de HT-013: respalda, comprueba la huella y restaura en un entorno limpio.
# Falla si el respaldo no se puede abrir con otra clave (cifrado real) o si la restauración no cuadra.
set -euo pipefail
AQUI="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export BACKUP_DIR="${BACKUP_DIR:-$(mktemp -d)}"
: "${BACKUP_KEY_FILE:?define BACKUP_KEY_FILE}"

"$AQUI/respaldo.sh"
# El respaldo más reciente se identifica por fecha de modificación.
# shellcheck disable=SC2012
DB="$(ls -1t "$BACKUP_DIR"/db-*.gpg | head -1)"
# shellcheck disable=SC2012
( cd "$BACKUP_DIR" && sha256sum -c "$(ls -1t SHA256SUMS-* | head -1)" )

# 1. Cifrado real: el contenido no es legible sin la clave y no trae SQL en claro.
if gunzip -c "$DB" 2>/dev/null | head -c 200 | grep -qi "postgresql database dump"; then
    echo "ERROR: el respaldo parece estar sin cifrar" >&2; exit 1
fi
OTRA="$(mktemp)"; echo "otra-clave" > "$OTRA"; chmod 600 "$OTRA"
if BACKUP_KEY_FILE="$OTRA" "$AQUI/restaurar.sh" "$DB" >/dev/null 2>&1; then
    echo "ERROR: el respaldo se abrió con una clave incorrecta" >&2; rm -f "$OTRA"; exit 1
fi
rm -f "$OTRA"
echo "OK: con otra clave no se abre"

# 2. Restauración con la clave correcta en un Postgres limpio.
"$AQUI/restaurar.sh" "$DB"

# 3. Archivos: restaurar a un directorio temporal y comparar con el listado del tar.
#    Un respaldo sin archivos no cumple HT-013: el volumen debe estar respaldado.
# shellcheck disable=SC2012
ARCHIVOS="$(ls -1t "$BACKUP_DIR"/archivos-*.gpg 2>/dev/null | head -1 || true)"
if [[ -z "$ARCHIVOS" ]]; then
    echo "ERROR: el respaldo no incluye archivos; el volumen de MinIO no se respaldó" >&2
    exit 1
fi

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
BACKUP_KEY_FILE="$BACKUP_KEY_FILE" "$AQUI/restaurar-archivos.sh" "$ARCHIVOS" --extraer "$TMP/extraido"

# Cuenta archivos regulares y suma sus bytes en el tar cifrado y en lo restaurado.
# No imprime rutas ni contenido clínico.
resumen_tar() {
    gpg --batch --quiet --pinentry-mode loopback --passphrase-file "$BACKUP_KEY_FILE" --decrypt "$ARCHIVOS" \
        | tar -tvzf - | awk '$1 ~ /^-/ {n++; b+=$3} END {printf "%d %d\n", n+0, b+0}'
}
resumen_dir() {
    find "$1" -type f -printf '%s\n' | awk '{n++; b+=$1} END {printf "%d %d\n", n+0, b+0}'
}

LEIDO_TAR="$(resumen_tar)"
LEIDO_DIR="$(resumen_dir "$TMP/extraido")"
if [[ "$LEIDO_TAR" != "$LEIDO_DIR" ]]; then
    echo "ERROR: los archivos restaurados no coinciden con el respaldo" >&2
    echo "  en el tar: ${LEIDO_TAR}" >&2
    echo "  restaurado: ${LEIDO_DIR}" >&2
    exit 1
fi
read -r ARCHIVOS_N ARCHIVOS_B < <(printf '%s\n' "$LEIDO_DIR")
echo "OK: archivos restaurados y equivalentes (${ARCHIVOS_N} archivos, ${ARCHIVOS_B} bytes)"
