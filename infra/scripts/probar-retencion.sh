#!/usr/bin/env bash
# Prueba la retención de respaldos con sets falsos en mktemp -d (HT-013, RI-03).
# No toca backups reales ni requiere root.
set -euo pipefail

AQUI="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RETENER="$AQUI/retener_respaldos.py"
fail() { echo "ERROR: $*" >&2; exit 1; }
pass() { echo "OK: $*"; }

command -v python3 >/dev/null 2>&1 || fail "python3 no disponible"
[[ -f "$RETENER" ]] || fail "no existe $RETENER"

DIR="$(mktemp -d)"
trap 'rm -rf "$DIR"' EXIT

mkset() {
    local dir="$1" stamp="$2"
    touch "$dir/db-${stamp}.sql.gz.gpg"
    touch "$dir/archivos-${stamp}.tar.gz.gpg"
    touch "$dir/SHA256SUMS-${stamp}"
}

exists_set() {
    local dir="$1" stamp="$2"
    [[ -f "$dir/db-${stamp}.sql.gz.gpg" && -f "$dir/archivos-${stamp}.tar.gz.gpg" && -f "$dir/SHA256SUMS-${stamp}" ]]
}
missing_set() {
    local dir="$1" stamp="$2"
    [[ ! -e "$dir/db-${stamp}.sql.gz.gpg" && ! -e "$dir/archivos-${stamp}.tar.gz.gpg" && ! -e "$dir/SHA256SUMS-${stamp}" ]]
}

# Conjunto de sellos relativos a "hoy" real (la herramienta usa date.today()).
# Elegimos sellos suficientemente espaciados: hoy, ayer, hace 20 días, semana anterior,
# 2 semanas, 40 días, 3 meses, 8 meses. El set recién creado se conserva siempre.
TODAY="$(date +%Y%m%d)-120000"
YESTERDAY="$(date -d 'yesterday' +%Y%m%d)-120000"
DAY20="$(date -d '20 days ago' +%Y%m%d)-120000"
WEEK1="$(date -d '8 days ago' +%Y%m%d)-120000"    # semana ISO distinta/probable
WEEK2="$(date -d '15 days ago' +%Y%m%d)-120000"
DAY40="$(date -d '40 days ago' +%Y%m%d)-120000"
MONTH3="$(date -d '95 days ago' +%Y%m%d)-120000"
MONTH8="$(date -d '245 days ago' +%Y%m%d)-120000"

for s in "$TODAY" "$YESTERDAY" "$DAY20" "$WEEK1" "$WEEK2" "$DAY40" "$MONTH3" "$MONTH8"; do
    mkset "$DIR" "$s"
done

# 1) dry-run no debe borrar nada.
python3 "$RETENER" --dir "$DIR" --days 1 --weeks 1 --months 1 --keep-stamp "$TODAY" --dry-run >/dev/null
for s in "$TODAY" "$YESTERDAY" "$DAY20" "$WEEK1" "$WEEK2" "$DAY40" "$MONTH3" "$MONTH8"; do
    exists_set "$DIR" "$s" || fail "dry-run borró indebidamente $s"
done
pass "dry-run no borra"

# 2) política: días=1 conserva hoy+yesterday; semanas/meses conservan representantes;
# keep-stamp conserva TODAY. MONTH8 debería quedar fuera con meses=1.
python3 "$RETENER" --dir "$DIR" --days 1 --weeks 2 --months 2 --keep-stamp "$TODAY" >/dev/null

exists_set "$DIR" "$TODAY" || fail "se borró el set recién creado (keep-stamp)"
exists_set "$DIR" "$YESTERDAY" || fail "se borró set dentro de días"
# No forzamos semanas/meses exactas por bordes de calendario ISO; verificamos que
# MONTH8 (muy antiguo, fuera de meses=2) se borre y que el conteo no vacíe todo.
missing_set "$DIR" "$MONTH8" || fail "set de 8 meses debería borrarse con meses=2"
# Al menos el nuevo + ayer + algún representante deben quedar.
remaining=$(find "$DIR" -name 'SHA256SUMS-*' | wc -l)
[[ "$remaining" -ge 2 ]] || fail "retención borró demasiado: quedan $remaining sets"
[[ "$remaining" -lt 8 ]] || fail "retención no borró nada fuera de política: quedan $remaining sets"
pass "política días/semanas/meses y keep-stamp"

# 3) idempotencia.
before=$(find "$DIR" -name 'SHA256SUMS-*' | sort)
python3 "$RETENER" --dir "$DIR" --days 1 --weeks 2 --months 2 --keep-stamp "$TODAY" >/dev/null
after=$(find "$DIR" -name 'SHA256SUMS-*' | sort)
[[ "$before" == "$after" ]] || fail "no es idempotente"
pass "idempotente"

# 4) borra los tres artefactos del set.
DIR2="$(mktemp -d)"
trap 'rm -rf "$DIR" "$DIR2"' EXIT
mkset "$DIR2" "20200101-000000"
mkset "$DIR2" "20200102-000000"
python3 "$RETENER" --dir "$DIR2" --days 0 --weeks 0 --months 0 --keep-stamp "20200102-000000" >/dev/null
missing_set "$DIR2" "20200101-000000" || fail "no borró los tres artefactos del set antiguo"
exists_set "$DIR2" "20200102-000000" || fail "borró el set keep-stamp"
pass "borra db/archivos/SHA256SUMS del set"

echo "OK: probar-retencion.sh pasó"
