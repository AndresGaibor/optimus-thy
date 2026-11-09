#!/usr/bin/env bash
# Restaura un respaldo de la base en un Postgres LIMPIO y desechable y lo verifica (HT-013).
#
#   BACKUP_KEY_FILE=~/.optimus-respaldo.key infra/scripts/restaurar.sh db-AAAAMMDD-HHMMSS.sql.gz.gpg
#
# Nunca toca la base real: levanta un contenedor aparte, carga el respaldo, comprueba que la
# versión de migración y las tablas están y lo borra. Imprime solo recuentos, sin datos.
# Para recuperar de verdad, descifra con `--sql` y carga el resultado donde corresponda.
set -euo pipefail

ARCHIVO="${1:-}"
MODO="${2:-}"
CLAVE="${BACKUP_KEY_FILE:-}"
fail() { echo "ERROR: $*" >&2; exit 1; }

[[ -f "$ARCHIVO" ]] || fail "uso: restaurar.sh <db-*.sql.gz.gpg> [--sql]"
[[ -s "$CLAVE" ]] || fail "define BACKUP_KEY_FILE con la clave del respaldo"

export GNUPGHOME="$(mktemp -d)"
descifrar() {
    gpg --batch --quiet --pinentry-mode loopback --passphrase-file "$CLAVE" --decrypt "$ARCHIVO" \
        | gunzip
}
if [[ "$MODO" == "--sql" ]]; then
    trap 'rm -rf "$GNUPGHOME"' EXIT
    descifrar
    exit 0
fi

NOMBRE="optimus-restauracion-$$"
trap 'rm -rf "$GNUPGHOME"; docker rm -f "$NOMBRE" >/dev/null 2>&1 || true' EXIT
docker run -d --name "$NOMBRE" -e POSTGRES_PASSWORD=restaurar -e POSTGRES_DB=restaurado \
    --tmpfs /var/lib/postgresql/data postgres:16-alpine >/dev/null
# La imagen arranca un servidor temporal para inicializar y luego lo reinicia: el definitivo
# es el segundo «listo para aceptar conexiones» del registro.
for _ in $(seq 1 60); do
    listos="$(docker logs "$NOMBRE" 2>&1 | grep -c 'database system is ready to accept connections' || true)"
    [[ "$listos" -ge 2 ]] && docker exec "$NOMBRE" pg_isready -U postgres -d restaurado >/dev/null 2>&1 && break
    sleep 1
done
docker exec "$NOMBRE" pg_isready -U postgres -d restaurado >/dev/null 2>&1 || fail "el Postgres limpio no arrancó"

descifrar | docker exec -i "$NOMBRE" psql -q -v ON_ERROR_STOP=1 -U postgres -d restaurado >/dev/null \
    || fail "la restauración falló (¿clave incorrecta o respaldo dañado?)"

q() { docker exec "$NOMBRE" psql -At -U postgres -d restaurado -c "$1"; }
VERSION="$(q 'select version_num from alembic_version')"
TABLAS="$(q "select count(*) from information_schema.tables where table_schema='public'")"
[[ -n "$VERSION" ]] || fail "falta alembic_version"
[[ "$TABLAS" -ge 20 ]] || fail "solo $TABLAS tablas"
echo "OK: restauración verificada"
echo "  migración: $VERSION"
echo "  tablas:    $TABLAS"
for t in usuarios roles permisos roles_permisos pacientes casos auditoria; do
    echo "  $t: $(q "select count(*) from $t")"
done
