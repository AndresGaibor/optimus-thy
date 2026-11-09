#!/usr/bin/env bash
# Prueba de punta a punta de HT-013: respalda, comprueba la huella y restaura en un entorno limpio.
# Falla si el respaldo no se puede abrir con otra clave (cifrado real) o si la restauración no cuadra.
set -euo pipefail
AQUI="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export BACKUP_DIR="${BACKUP_DIR:-$(mktemp -d)}"
: "${BACKUP_KEY_FILE:?define BACKUP_KEY_FILE}"

"$AQUI/respaldo.sh"
DB="$(ls -1t "$BACKUP_DIR"/db-*.gpg | head -1)"
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
