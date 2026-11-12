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
acad = sys.argv[1].rstrip("/")
oper = sys.argv[2].rstrip("/")

def lado(directorio):
    """Devuelve la etiqueta del lado al que pertenece el directorio de diff."""
    if directorio == acad or directorio.startswith(acad + "/"):
        return "SOLO_ACADEMIICO"
    if directorio == oper or directorio.startswith(oper + "/"):
        return "SOLO_OPERATIVO"
    return "SIN_CLASIFICAR"

def ruta_relativa(path):
    """Quita el prefijo temporal de cualquiera de los dos lados."""
    if path == acad or path == oper:
        return ""
    for base in (acad, oper):
        if path.startswith(base + "/"):
            return path[len(base) + 1:]
    return path.lstrip("./")

seen = set()
for raw in sys.stdin:
    line = raw.rstrip("\n")
    if not line:
        continue
    etiqueta = None
    ruta = None
    m = re.match(r"Files (.+) and (.+) differ$", line)
    if m:
        etiqueta = "DIFERENTE"
        ruta = ruta_relativa(m.group(1).strip())
    else:
        m = re.match(r"Only in (.+): (.+)$", line)
        if m:
            etiqueta = lado(m.group(1).strip())
            base = ruta_relativa(m.group(1).strip())
            nombre = m.group(2).strip()
            ruta = (base + "/" + nombre).lstrip("/") if base else nombre
    if etiqueta is None:
        etiqueta = "SIN_CLASIFICAR"
        ruta = ruta_relativa(line)
    salida = etiqueta + " " + ruta
    if salida not in seen:
        seen.add(salida)
        print(salida)
' "$TMP/academico" "$TMP/operativo" | python3 -c '
import sys
ORDEN = ("SOLO_ACADEMIICO", "SOLO_OPERATIVO", "DIFERENTE", "SIN_CLASIFICAR")
lineas = [line.rstrip("\n") for line in sys.stdin if line.strip()]
def clave(line):
    etiqueta = line.split(None, 1)[0]
    return (ORDEN.index(etiqueta) if etiqueta in ORDEN else len(ORDEN), line)
for line in sorted(lineas, key=clave):
    print(line)
')"

COUNT="$(printf '%s\n' "$NORMALIZED" | grep -c . || true)"
echo "DIFERENCIAS: $COUNT (rutas normalizadas desde diff -rq; un directorio nuevo puede contar como una sola línea, no es el número exacto de archivos)"
printf '%s\n' "$NORMALIZED" | sed -n '1,300p'
if [ "$COUNT" -gt 300 ]; then
  echo "... ($((COUNT - 300)) líneas omitidas)"
fi

echo "resumen-por-prefijo:"
printf '%s\n' "$NORMALIZED" | python3 -c '
import collections, sys
ETIQUETAS = ("SOLO_ACADEMIICO", "SOLO_OPERATIVO", "DIFERENTE", "SIN_CLASIFICAR")
counts = collections.Counter()
for raw in sys.stdin:
    line = raw.strip()
    if not line:
        continue
    parts = line.split(None, 1)
    path = parts[1] if len(parts) == 2 and parts[0] in ETIQUETAS else line
    prefix = path.split("/", 1)[0] + "/" if "/" in path else "(raíz)"
    counts[prefix] += 1
for k in sorted(counts):
    print(f"  {k} {counts[k]}")
'

exit 0
