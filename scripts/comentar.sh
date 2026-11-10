#!/usr/bin/env bash
# comentar.sh — añade un comentario de progreso a un issue de Linear y nada más.
#
# Uso:
#   scripts/comentar.sh <TES-nnn> <texto…>            Comentario escrito en línea.
#   scripts/comentar.sh <TES-nnn> --archivo <ruta>    Comentario leído de un archivo.
#   scripts/comentar.sh --help                        Muestra esta ayuda.
#
# Ejemplos:
#   scripts/comentar.sh TES-214 "Runbook de respaldo actualizado; falta la prueba de restauración."
#   scripts/comentar.sh TES-214 --archivo notas.txt
#   make comentar ISSUE=TES-214 TEXTO="Integración en verde en el operativo."
#
# Único camino de escritura permitido en este repositorio: un comentario. Este
# script ejecuta solamente «linearis issues discuss <id> --body <texto>». Nunca
# invoca «issues update», «issues batch», «archive», «delete» ni «snooze», y nunca
# pasa «--status»: el estado de un issue lo mueve únicamente el repo
# optimus-thy-academico, su dueño. Para mirar el tablero está scripts/tareas.sh.
#
# La salida de «linearis» se filtra con el token de ~/.config/linearis/token: si el
# token aparece en un mensaje de error, se sustituye por «redactado».
set -euo pipefail

ayuda() {
  awk 'NR == 1 { next } /^#/ { sub(/^# ?/, ""); print; next } { exit }' "$0"
}

error_uso() {
  printf '%s\n' "$1" >&2
  printf '%s\n' 'Ejecuta «bash scripts/comentar.sh --help» para ver el uso.' >&2
  exit "${2:-2}"
}

TOKEN_ARCHIVO="${LINEARIS_TOKEN_FILE:-${HOME}/.config/linearis/token}"
TOKEN=""
if [ -r "$TOKEN_ARCHIVO" ]; then
  TOKEN="$(tr -d '\r\n' <"$TOKEN_ARCHIVO")"
fi

# Imprime un archivo sustituyendo cualquier aparición del token por «redactado».
redactar() {
  local origen="$1" linea resto salida
  while IFS= read -r linea || [ -n "$linea" ]; do
    if [ -z "$TOKEN" ]; then
      printf '%s\n' "$linea"
      continue
    fi
    resto="$linea"
    salida=""
    while [ "${resto#*"$TOKEN"}" != "$resto" ]; do
      salida="$salida${resto%%"$TOKEN"*}«redactado»"
      resto="${resto#*"$TOKEN"}"
    done
    printf '%s\n' "$salida$resto"
  done <"$origen"
}

if [ "$#" -eq 0 ]; then
  error_uso 'Falta el identificador del issue (por ejemplo TES-214).'
fi

case "$1" in
  -h | --help)
    ayuda
    exit 0
    ;;
  -*)
    error_uso "El flag «$1» no está permitido: desde este repo solo se añaden comentarios. El estado de un issue lo cambia únicamente el repo optimus-thy-academico, su dueño."
    ;;
esac

identificador="$1"
shift

archivo=""
texto=""
hay_texto=0

while [ "$#" -gt 0 ]; do
  case "$1" in
    --archivo)
      shift
      [ "$#" -gt 0 ] || error_uso 'Falta la ruta después de --archivo.'
      archivo="$1"
      ;;
    --archivo=*)
      archivo="${1#*=}"
      ;;
    -h | --help)
      ayuda
      exit 0
      ;;
    -*)
      error_uso "El flag «$1» no está permitido: desde este repo solo se añaden comentarios. El estado de un issue lo cambia únicamente el repo optimus-thy-academico, su dueño."
      ;;
    *)
      if [ "$hay_texto" -eq 1 ]; then
        texto="$texto $1"
      else
        texto="$1"
        hay_texto=1
      fi
      ;;
  esac
  shift
done

if ! [[ "$identificador" =~ ^[A-Z]+-[0-9]+$ ]]; then
  error_uso "Identificador inválido: «$identificador». Se espera un issue de Linear como TES-214 (equipo en mayúsculas, guion y número)." 1
fi

if [ -n "$archivo" ]; then
  if [ "$hay_texto" -eq 1 ]; then
    error_uso 'Indica el comentario en línea o con --archivo, no de las dos formas.'
  fi
  [ -f "$archivo" ] || error_uso "No existe el archivo «$archivo»." 1
  [ -r "$archivo" ] || error_uso "No se puede leer el archivo «$archivo»." 1
  texto="$(<"$archivo")"
fi

case "$texto" in
  *[![:space:]]*) ;;
  *)
    error_uso "El comentario está vacío: escribe el texto del progreso de $identificador." 1
    ;;
esac

if ! command -v linearis >/dev/null 2>&1; then
  printf '%s\n' 'Falta «linearis» en el PATH: sin él no se puede comentar en Linear. Instálalo y configura el token en ~/.config/linearis/token.' >&2
  exit 1
fi

salida="$(mktemp "${TMPDIR:-/tmp}/comentar.XXXXXX")"
trap 'rm -f "$salida"' EXIT

if linearis issues discuss "$identificador" --body "$texto" >"$salida" 2>&1; then
  printf 'Comentario añadido a %s. No se tocó el estado ni ningún otro campo del issue.\n' "$identificador"
else
  codigo=$?
  redactar "$salida" >&2
  printf 'Linear no aceptó el comentario en %s (código %s). No se cambió ningún estado del issue.\n' "$identificador" "$codigo" >&2
  exit 1
fi
