#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "Uso: bash scripts/comparar-academico.sh [ACADEMICO_DIR] [REF]" >&2
  echo "  ACADEMICO_DIR: ruta al repo académico (default: /home/ubuntu/code/optimus-thy-academico)" >&2
  echo "  REF: commit/ref académico a comparar (default: HEAD)" >&2
  exit 2
}

ACADEMICO_DIR="${1:-/home/ubuntu/code/optimus-thy-academico}"
REF="${2:-HEAD}"

if [ ! -d "$ACADEMICO_DIR" ]; then
  echo "Error: el directorio académico no existe: $ACADEMICO_DIR" >&2
  usage
fi

if ! git -C "$ACADEMICO_DIR" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Error: no es un repositorio git (académico): $ACADEMICO_DIR" >&2
  exit 2
fi

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Error: este directorio no es un repositorio git (operativo). Ejecute desde el repo de producción." >&2
  exit 2
fi

if ! git -C "$ACADEMICO_DIR" rev-parse --verify --quiet "${REF}^{commit}" >/dev/null 2>&1; then
  echo "Error: ref académico inválido: $REF" >&2
  exit 2
fi

ACADEMICO_COMMIT="$(git -C "$ACADEMICO_DIR" rev-parse "${REF}^{commit}")"
ACADEMICO_TREE="$(git -C "$ACADEMICO_DIR" rev-parse "${REF}^{tree}")"
OPERATIVO_HEAD="$(git rev-parse HEAD)"
OPERATIVO_TREE="$(git rev-parse HEAD^{tree})"

echo "académico.ref=$REF"
echo "académico.commit=$ACADEMICO_COMMIT"
echo "académico.tree=$ACADEMICO_TREE"
echo "operativo.head=$OPERATIVO_HEAD"
echo "operativo.tree=$OPERATIVO_TREE"

STATUS="$(git -C "$ACADEMICO_DIR" status --porcelain)"
if [ -n "$STATUS" ]; then
  echo "académico.working-tree=SUCIO (advertencia: la comparación usa el commit/ref, no el working tree)"
  printf '%s\n' "$STATUS" | sed 's/^/  /'
else
  echo "académico.working-tree=limpio"
fi

LOCK="docs/operacion/academico-snapshot.json"
if [ -f "$LOCK" ]; then
  SNAPSHOT_BASE="$(python3 - "$LOCK" "$ACADEMICO_TREE" <<'PY'
import json, sys
lock_path, academico_tree = sys.argv[1], sys.argv[2]
with open(lock_path, encoding='utf-8') as f:
    lock = json.load(f)
print(lock.get('tree_academico', ''))
print(lock.get('commit_snapshot_produccion', ''))
PY
)"
  LOCK_TREE="$(printf '%s\n' "$SNAPSHOT_BASE" | sed -n '1p')"
  LOCK_SNAP="$(printf '%s\n' "$SNAPSHOT_BASE" | sed -n '2p')"
  if [ -n "$LOCK_SNAP" ] && git rev-parse --verify --quiet "${LOCK_SNAP}^{commit}" >/dev/null 2>&1; then
    SNAP_TREE="$(git rev-parse "${LOCK_SNAP}^{tree}")"
  else
    SNAP_TREE=""
  fi
  if [ -n "$LOCK_TREE" ] && [ "$LOCK_TREE" = "$SNAP_TREE" ]; then
    echo "snapshot-base=OK (commit_snapshot_produccion tiene el mismo tree que tree_academico del lock)"
  else
    echo "snapshot-base=DIFIERE (lock.tree_academico=$LOCK_TREE snapshot_produccion.tree=${SNAP_TREE:-no-disponible})"
  fi
else
  echo "snapshot-base=sin-lock ($LOCK no existe)"
fi

TMP="$(mktemp -d)"
cleanup() { rm -rf "$TMP"; }
trap cleanup EXIT

mkdir -p "$TMP/academico" "$TMP/operativo"
git -C "$ACADEMICO_DIR" archive --format=tar "$REF" | tar -xf - -C "$TMP/academico"
git archive --format=tar HEAD | tar -xf - -C "$TMP/operativo"

set +e
DIFF_OUT="$(diff -rq "$TMP/academico" "$TMP/operativo" 2>&1)"
DIFF_STATUS=$?
set -e

if [ "$DIFF_STATUS" -eq 0 ]; then
  echo "IDENTICOS"
  exit 0
fi

if [ "$DIFF_STATUS" -ne 1 ]; then
  echo "Error: diff falló (código $DIFF_STATUS)" >&2
  printf '%s\n' "$DIFF_OUT" >&2
  exit 2
fi

NORMALIZED="$(printf '%s\n' "$DIFF_OUT" | python3 -c '
import re, sys
acad = sys.argv[1].rstrip("/") + "/"
oper = sys.argv[2].rstrip("/") + "/"

def strip_prefix(path):
    path = path.replace(acad, "").replace(oper, "")
    return path.lstrip("./")

seen = set()
for raw in sys.stdin:
    line = raw.rstrip("\n")
    if not line:
        continue
    out = None
    m = re.match(r"Files (.+) and (.+) differ$", line)
    if m:
        out = "M " + strip_prefix(m.group(1).strip())
    else:
        m = re.match(r"Only in (.+): (.+)$", line)
        if m:
            d = strip_prefix(m.group(1).strip())
            n = m.group(2).strip()
            out = "A " + ((d + "/" + n).lstrip("/") if d else n)
    if out is None:
        out = strip_prefix(line)
    if out not in seen:
        seen.add(out)
        print(out)
' "$TMP/academico" "$TMP/operativo" | sort)"

COUNT="$(printf '%s\n' "$NORMALIZED" | grep -c . || true)"
echo "DIFERENCIAS: $COUNT (rutas normalizadas desde diff -rq; un directorio nuevo puede contar como una sola línea, no es el número exacto de archivos)"
printf '%s\n' "$NORMALIZED" | sed -n '1,80p'
if [ "$COUNT" -gt 80 ]; then
  echo "... ($((COUNT - 80)) líneas omitidas)"
fi

echo "resumen-por-prefijo:"
printf '%s\n' "$NORMALIZED" | python3 -c '
import collections, sys
counts = collections.Counter()
for raw in sys.stdin:
    line = raw.strip()
    if not line:
        continue
    parts = line.split(None, 1)
    path = parts[1] if len(parts) == 2 and parts[0] in ("M", "A") else line
    prefix = path.split("/", 1)[0] + "/" if "/" in path else "(raíz)"
    counts[prefix] += 1
for k in sorted(counts):
    print(f"  {k} {counts[k]}")
'

exit 0
