#!/usr/bin/env bash
# Restaura/verifica un respaldo cifrado de archivos MinIO (HT-013, RI-03, RNF-CON-01, RS-CIF-05).
#
#   BACKUP_KEY_FILE=... infra/scripts/restaurar-archivos.sh <archivos-AAAA...tar.gz.gpg> [--verificar | --extraer DIR | --volumen NOMBRE]
#
# Por defecto --verificar: descifra con gpg (sin xtrace), valida gzip/tar y lista conteo/tamaño;
# no escribe datos ni contenido clínico. --extraer exige DIR inexistente o vacío y rechaza rutas
# absolutas o con '..'. --volumen exige volumen existente y VACÍO + RESTORE_VOLUMEN_CONFIRMADO=si;
# extrae con alpine:3 efímero. No borra nada. No imprime la clave ni el contenido de archivos.
set -euo pipefail

RAIZ="${RAIZ:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"
ARCHIVO="${1:-}"
MODO="${2:---verificar}"
ARG="${3:-}"
CLAVE="${BACKUP_KEY_FILE:-}"

fail() { echo "ERROR: $*" >&2; exit 1; }
uso() { fail "uso: BACKUP_KEY_FILE=... restaurar-archivos.sh <archivos-AAAA...tar.gz.gpg> [--verificar | --extraer DIR | --volumen NOMBRE]"; }

[[ -n "$ARCHIVO" ]] || uso
[[ -f "$ARCHIVO" ]] || fail "no existe el respaldo: $ARCHIVO"

# Clave: no vacía, existente, modo 600/400 y fuera del repositorio (mismo criterio que respaldo.sh).
[[ -n "$CLAVE" ]] || fail "define BACKUP_KEY_FILE con la ruta del archivo de clave (fuera del repositorio)"
[[ -s "$CLAVE" ]] || fail "la clave $CLAVE no existe o está vacía"
[[ "$(stat -c %a "$CLAVE")" =~ ^[46]00$ ]] || fail "la clave debe tener modo 600 o 400"
case "$(realpath "$CLAVE")" in "$RAIZ"/*) fail "la clave no puede estar dentro del repositorio" ;; esac

command -v gpg >/dev/null 2>&1 || fail "gpg no disponible"
command -v gzip >/dev/null 2>&1 || fail "gzip no disponible"
command -v tar >/dev/null 2>&1 || fail "tar no disponible"

export GNUPGHOME
GNUPGHOME="$(mktemp -d)"
trap 'rm -rf "$GNUPGHOME"' EXIT
umask 077

descifrar() {
    gpg --batch --quiet --pinentry-mode loopback --passphrase-file "$CLAVE" --decrypt "$ARCHIVO"
}

listar_tar() {
    descifrar | tar -tzf -
}

# Valida integridad gzip+tar; imprime conteo (sin nombres ni contenido).
verificar_flujo() {
    local stats entradas
    if ! descifrar | gzip -t; then
        fail "respaldo dañado o clave incorrecta (gzip inválido)"
    fi
    stats="$(mktemp)"
    if ! descifrar | tar -tzf - | awk 'END{print NR+0}' >"$stats"; then
        rm -f "$stats"
        fail "respaldo dañado o clave incorrecta (tar inválido)"
    fi
    read -r entradas <"$stats" || true
    rm -f "$stats"
    [[ -n "${entradas:-}" ]] || fail "no se pudo leer el contenido del respaldo"
    echo "OK: respaldo verificado (integridad gzip/tar)"
    echo "  entradas: ${entradas}"
}
# Rechaza entradas absolutas o con '..' (traversal). No imprime rutas: solo conteo.
rechazar_rutas_peligrosas() {
    local listado malos
    listado="$(mktemp)"
    listar_tar >"$listado" || { rm -f "$listado"; fail "no se pudo listar el tar (¿clave incorrecta o respaldo dañado?)"; }
    malos="$(awk 'index($0,"/")==1 || $0 ~ /(^|\/)\.\.(\/|$)/ {n++} END{print n+0}' "$listado")"
    rm -f "$listado"
    [[ "$malos" -eq 0 ]] || fail "el tar contiene $malos ruta(s) absoluta(s) o con '..'; extracción rechazada"
}

contar_dir() {
    # Conteo de entradas (archivos+dirs), sin listar contenido clínico.
    find "$1" -mindepth 1 | wc -l | tr -d ' '
}

case "$MODO" in
    --verificar)
        verificar_flujo
        ;;
    --extraer)
        [[ -n "$ARG" ]] || fail "uso: --extraer DIR (directorio inexistente o vacío)"
        if [[ -e "$ARG" ]]; then
            [[ -d "$ARG" ]] || fail "DIR existe y no es un directorio: $ARG"
            [[ -z "$(ls -A "$ARG")" ]] || fail "DIR debe estar vacío: $ARG"
        else
            mkdir -p "$ARG"
        fi
        rechazar_rutas_peligrosas
        verificar_flujo >/dev/null
        descifrar | tar -xzf - -C "$ARG" --no-same-owner --no-same-permissions \
            || fail "la extracción falló"
        n="$(contar_dir "$ARG")"
        [[ "$n" -ge 1 ]] || fail "la extracción no produjo entradas en DIR"
        echo "OK: extracción verificada"
        echo "  destino: $ARG"
        echo "  entradas: $n"
        ;;
    --volumen)
        [[ -n "$ARG" ]] || fail "uso: --volumen NOMBRE (volumen Docker existente y vacío)"
        [[ "${RESTORE_VOLUMEN_CONFIRMADO:-}" == "si" ]] \
            || fail "define RESTORE_VOLUMEN_CONFIRMADO=si para confirmar la restauración al volumen"
        command -v docker >/dev/null 2>&1 || fail "docker no disponible"
        docker volume inspect "$ARG" >/dev/null 2>&1 || fail "no existe el volumen: $ARG"
        # Considera vacío si no hay entradas; ignora puntos perdidos no listados por -A.
        ocupado="$(docker run --rm -v "$ARG:/v:ro" alpine:3 sh -c 'ls -A /v | wc -l' 2>/dev/null | tr -d ' ' || echo '?')"
        [[ "$ocupado" =~ ^[0-9]+$ ]] || fail "no se pudo comprobar si el volumen está vacío: $ARG"
        [[ "$ocupado" -eq 0 ]] || fail "el volumen no está vacío ($ocupado entradas): $ARG; no se borra nada"
        rechazar_rutas_peligrosas
        verificar_flujo >/dev/null
        descifrar | docker run --rm -i -v "$ARG:/v" alpine:3 sh -c 'tar -xzf - -C /v --no-same-owner --no-same-permissions' \
            || fail "la restauración al volumen falló"
        n="$(docker run --rm -v "$ARG:/v:ro" alpine:3 sh -c 'find /v -mindepth 1 | wc -l' | tr -d ' ')"
        [[ "$n" -ge 1 ]] || fail "la restauración al volumen no produjo entradas"
        echo "OK: volumen restaurado (contenido no mostrado)"
        echo "  volumen: $ARG"
        echo "  entradas: $n"
        ;;
    *)
        uso
        ;;
esac
