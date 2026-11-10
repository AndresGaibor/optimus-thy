#!/usr/bin/env bash
# tareas.sh — tablero completo del backlog en Linear (proyecto «OPTIMUS-THY · Backlog de producto»).
#
# Uso:
#   scripts/tareas.sh                          Tabla de todos los issues y resumen por estado.
#   scripts/tareas.sh --estado progress          Filtra por estado; basta una palabra: todo, progress,
#                                                revision o done. También acepta enproceso, enrevision,
#                                                hecho, finalizado y los nombres exactos («In Progress»,
#                                                «En revisión»), que sí necesitan comillas por el espacio.
#   scripts/tareas.sh --persona daniel         Filtra por persona asignada (parcial, sin mayúsculas).
#   scripts/tareas.sh --json                   Emite el JSON consolidado (una lista de issues).
#   scripts/tareas.sh --help                   Muestra esta ayuda.
#
# El listado por defecto de `linearis` oculta las completadas y pagina de 50 en 50; aquí se piden
# 250 por página en dos llamadas (abiertas y completadas), se descartan archivadas y se unifica por id.
set -euo pipefail

PROYECTO="OPTIMUS-THY · Backlog de producto"
LIMITE=250

ayuda() {
  awk 'NR == 1 { next } /^#/ { sub(/^# ?/, ""); print; next } { exit }' "$0"
}

estado=""
persona=""
salida_json=0

while [ "$#" -gt 0 ]; do
  case "$1" in
    --estado=*) estado="${1#*=}" ;;
    --estado)
      shift
      if [ "$#" -eq 0 ]; then
        echo "Falta el valor de --estado." >&2
        exit 2
      fi
      estado="$1"
      ;;
    --persona=*) persona="${1#*=}" ;;
    --persona)
      shift
      if [ "$#" -eq 0 ]; then
        echo "Falta el valor de --persona." >&2
        exit 2
      fi
      persona="$1"
      ;;
    --json) salida_json=1 ;;
    -h | --help)
      ayuda
      exit 0
      ;;
    *)
      echo "Opción desconocida: $1" >&2
      echo "Ejecuta «bash scripts/tareas.sh --help» para ver el uso." >&2
      exit 2
      ;;
  esac
  shift
done

# Traduce --estado a su valor canónico para que baste una palabra sin comillas: «progress» en vez de
# «In Progress». Los valores desconocidos se usan tal cual, así que «--estado "In Progress"» sigue igual.
if [ -n "$estado" ]; then
  estado_normalizado="$(printf '%s' "$estado" \
    | tr '[:upper:]' '[:lower:]' \
    | sed -e 's/á/a/g' -e 's/é/e/g' -e 's/í/i/g' -e 's/ó/o/g' -e 's/ú/u/g' -e 's/ü/u/g' \
      -e 's/[[:space:]_-]//g')"
  case "$estado_normalizado" in
    todo) estado="Todo" ;;
    progress | inprogress | enproceso) estado="In Progress" ;;
    revision | revisar | enrevision) estado="En revisión" ;;
    done | hecho | finalizado) estado="Done" ;;
  esac
fi

faltan=""
for bin in linearis jq; do
  command -v "$bin" >/dev/null 2>&1 || faltan="$faltan $bin"
done
if [ -n "$faltan" ]; then
  echo "Falta en el PATH:$faltan. Sin ellos no se puede consultar el backlog de Linear (linearis y jq son necesarios)." >&2
  exit 1
fi

trabajo="$(mktemp -d "${TMPDIR:-/tmp}/tareas.XXXXXX")"
trap 'rm -rf "$trabajo"' EXIT

consultar() {
  local destino="$1"
  shift
  if ! linearis issues list --project "$PROYECTO" --limit "$LIMITE" "$@" >"$destino" 2>"$trabajo/error.txt"; then
    echo "No se pudo consultar Linear con «linearis». Revisa la conexión y el token de ~/.config/linearis/token." >&2
    exit 1
  fi
  if ! jq -e 'has("nodes")' "$destino" >/dev/null 2>&1; then
    echo "La respuesta de «linearis» no trae la lista de issues esperada." >&2
    exit 1
  fi
}

consultar "$trabajo/abiertas.json"
consultar "$trabajo/completadas.json" --state-type completed

jq -s '[.[].nodes[]] | unique_by(.id) | map(select(.archivedAt == null and .trashed == null))' \
  "$trabajo/abiertas.json" "$trabajo/completadas.json" >"$trabajo/issues.json"

if [ "$(jq 'length' "$trabajo/issues.json")" -eq 0 ]; then
  echo "El proyecto «$PROYECTO» no devolvió ningún issue: revisa que el nombre sea exacto y que el token de ~/.config/linearis/token siga siendo válido." >&2
  exit 1
fi

definiciones='
def norm: ascii_downcase
  | gsub("á"; "a") | gsub("é"; "e") | gsub("í"; "i") | gsub("ó"; "o") | gsub("ú"; "u") | gsub("ü"; "u")
  | gsub("\\s+"; " ") | sub("^ "; "") | sub(" $"; "");
def etiquetas: [.labels.nodes[]?.name];
def en_revision: any(etiquetas[]; norm == "en revision");
def orden_estado: if . == "In Progress" then 0 elif . == "Todo" then 1 elif . == "Done" then 2 else 3 end;
def numero: (.identifier | split("-") | last | tonumber?) // 0;
def pad($n): . + (" " * ([ $n - length, 0 ] | max));
'

filtro="$definiciones
."

if [ -n "$estado" ]; then
  filtro+='| map(select(
      (.state.name | norm) == ($estado | norm)
      or ([etiquetas[] | norm] | index(($estado | norm))) != null
    ))'
fi

if [ -n "$persona" ]; then
  filtro+='| map(select(((.assignee.name // "") | norm) | contains(($persona | norm))))'
fi

filtro+='| sort_by([(.state.name | orden_estado), numero])'

jq --arg estado "$estado" --arg persona "$persona" "$filtro" "$trabajo/issues.json" >"$trabajo/seleccion.json"

if [ "$(jq 'length' "$trabajo/seleccion.json")" -eq 0 ]; then
  echo "Ningún issue coincide con los filtros indicados." >&2
  exit 1
fi

if [ "$salida_json" -eq 1 ]; then
  cat "$trabajo/seleccion.json"
  exit 0
fi

formato="$definiciones"'
[ .[] | [ .state.name, .identifier, (.assignee.name // "—"), (etiquetas | join(", ")), .title ] ] as $cuerpo
| ([ [ "ESTADO", "ID", "ASIGNADO", "ETIQUETAS", "TÍTULO" ] ] + $cuerpo) as $lineas
| [ range(0; 5) as $c | [ $lineas[] | .[$c] | length ] | max ] as $anchos
| [ $lineas[] | . as $c
    | [ range(0; 5) as $i | if $i == 4 then $c[$i] else ($c[$i] | pad($anchos[$i])) end ]
    | join("  ") ] as $filas
| ([ range(0; 5) as $i | "-" * $anchos[$i] ] | join("  ")) as $separador
| ([ .[] | .state.name ] | group_by(.) | map({ key: .[0], value: length }) | from_entries) as $conteos
| ([ .[] | select(en_revision) ] | length) as $revision
| ([ "In Progress", "Todo", "Done" ] as $canon
   | [ $canon[] | select($conteos[.] != null) ] + ((($conteos | keys) - $canon) | sort)) as $orden
| ([ $orden[] | length ] | max) as $ancho_estado
| ([ "Resumen: \(length) issues" ]
   + [ $orden[] as $e | "  \($e | pad($ancho_estado))  \($conteos[$e] // 0)" ]
   + if $revision > 0 then [ "", "\($revision) de ellos con la etiqueta «En revisión»." ] else [] end) as $resumen
| [ $filas[0], $separador ] + $filas[1:] + [ "" ] + $resumen
| join("\n")
'

jq -r "$formato" "$trabajo/seleccion.json"
