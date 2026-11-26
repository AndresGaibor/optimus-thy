#!/usr/bin/env bash
set -euo pipefail

RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$RAIZ"

FECHA="$(date +%F)"
PROYECTO="rend-$(date +%s)-${RANDOM}${RANDOM}"
URL=""
DIR_TEMP="$(mktemp -d)"
OVERLAY="$DIR_TEMP/compose.yml"
ENV_FILE="$DIR_TEMP/entorno.env"
INFORME="docs/operacion/rendimiento-${FECHA}.md"
INICIADO=0

fallar() {
    echo "ERROR: $*" >&2
    exit 3
}

limpiar() {
    local resultado=$?
    trap - EXIT
    if [[ "$INICIADO" == 1 ]]; then
        dc down --remove-orphans >/dev/null 2>&1 || true
        for volumen in "${PROYECTO}_pgdata" "${PROYECTO}_miniodata"; do
            if [[ "$(docker volume inspect -f '{{ index .Labels "com.docker.compose.project" }}' "$volumen" 2>/dev/null || true)" == "$PROYECTO" ]]; then
                docker volume rm "$volumen" >/dev/null 2>&1 || true
            fi
        done
    fi
    rm -rf "$DIR_TEMP"
    exit "$resultado"
}
trap limpiar EXIT

command -v docker >/dev/null 2>&1 || fallar "Docker no está disponible en PATH."
docker compose version >/dev/null 2>&1 || fallar "Docker Compose no está disponible."

read -r HTTP_PORT HTTPS_PORT BACKEND_PORT < <(python3 - <<'PY'
import socket
ports = []
for _ in range(3):
    with socket.socket() as sock:
        sock.bind(("0.0.0.0", 0))
        ports.append(sock.getsockname()[1])
print(*ports)
PY
) || fallar "No se pudieron reservar puertos HTTP/HTTPS/backend libres."

mkdir -p "$DIR_TEMP/modelos-ia"
cat >"$ENV_FILE" <<EOF
HTTP_PORT=$HTTP_PORT
HTTPS_PORT=$HTTPS_PORT
BACKEND_PORT=$BACKEND_PORT
COMPOSE_NETWORK=${PROYECTO}-net
POSTGRES_USER=rendimiento
POSTGRES_PASSWORD=rendimiento-sintetico
POSTGRES_DB=rendimiento
DATABASE_URL=postgresql+psycopg://rendimiento:rendimiento-sintetico@postgres:5432/rendimiento
S3_ACCESS_KEY=rendimiento
S3_SECRET_KEY=rendimiento-sintetico
S3_BUCKET=rendimiento
MINIO_KMS_SECRET_KEY=optimus:b3B0aW11cy1kZXYta21zLWtleS0zMi1ieXRlcyEhISE=
PII_ENCRYPTION_KEY=clave-sintetica-de-medicion-no-productiva
IA_MODELOS_DIR=$DIR_TEMP/modelos-ia
IA_INSTALAR_MODELOS=false
INFERENCIA_POR_MINUTO=100
EOF

cat >"$OVERLAY" <<EOF
services:
  backend:
    environment:
      INFERENCIA_POR_MINUTO: "100"
      RATE_LIMIT_POR_MINUTO: "500"
    ports: !override
      - "127.0.0.1:${BACKEND_PORT}:8000"
networks:
  default:
    name: ${PROYECTO}-net
EOF

dc() {
    docker compose --project-name "$PROYECTO" \
        --file "$RAIZ/docker-compose.yml" --file "$OVERLAY" \
        --env-file "$ENV_FILE" "$@"
}

INICIO_ARRANQUE="$(python3 -c 'import time; print(time.time())')"
INICIADO=1
if ! dc up -d --build postgres storage backend frontend edge ia; then
    dc ps >&2 || true
    fallar "Docker Compose no pudo iniciar los servicios necesarios (proyecto $PROYECTO)."
fi

URL="http://127.0.0.1:${BACKEND_PORT}"
segundos=0
until curl --silent --show-error --fail --max-time 2 "$URL/health" -o /dev/null 2>/dev/null; do
    if (( segundos >= 300 )); then
        dc ps >&2 || true
        dc logs --no-color --tail 80 >&2 || true
        fallar "el stack no respondió 200 en $URL/health después de 300 s."
    fi
    sleep 2
    segundos=$((segundos + 2))
done
ARRANQUE_MS="$(python3 - "$INICIO_ARRANQUE" <<'PY'
import sys, time
print(f"{(time.time() - float(sys.argv[1])) * 1000:.1f}")
PY
)"

if ! dc exec -T backend alembic upgrade head; then
    dc logs --no-color --tail 80 backend >&2 || true
    fallar "fallaron las migraciones de la base efímera."
fi
if ! dc cp "$RAIZ/backend/scripts/seed_sintetico.py" backend:/tmp/seed_sintetico.py; then
    fallar "no se pudo transferir el seed sintético existente al contenedor backend."
fi
if ! dc exec -T backend sh -c 'PYTHONPATH=/srv python /tmp/seed_sintetico.py --pacientes 5 --semilla 352'; then
    fallar "falló el seed de pacientes y casos sintéticos."
fi

if ! dc exec -T backend python -c 'from app.db import get_session_factory; from app.models import Institucion, Rol, Usuario, UsuarioRol; from app.security.passwords import hash_password; db=get_session_factory()(); i=db.query(Institucion).filter_by(codigo="dev-sintetica").one(); r=db.query(Rol).filter_by(nombre="doctor").one(); u=db.query(Usuario).filter_by(email="rendimiento@ejemplo.invalid").first(); u=u or Usuario(institucion_id=i.id,email="rendimiento@ejemplo.invalid",password_hash=hash_password("rendimiento@ejemplo.invalid","medicion-sintetica-2026!"),nombre="Usuario sintético",activo=True); db.add(u); db.flush(); db.query(UsuarioRol).filter_by(usuario_id=u.id,rol_id=r.id).first() or db.add(UsuarioRol(usuario_id=u.id,rol_id=r.id)); db.commit(); db.close()'; then
    fallar "no se pudo preparar el usuario sintético para la medición."
fi

CASO_ID="$(dc exec -T backend python -c 'from app.db import get_session_factory; from app.models import Caso; db=get_session_factory()(); c=db.query(Caso).filter_by(codigo_caso="CASO-0001").one(); print(c.id); db.close()' | tr -d '\r')"
[[ -n "$CASO_ID" ]] || fallar "el seed no produjo el caso sintético esperado."
COOKIE="$DIR_TEMP/cookies.txt"
RESULTADOS="$DIR_TEMP/medidas.csv"
: >"$RESULTADOS"

medir() {
    local etiqueta="$1" metodo="$2" ruta="$3" cuerpo="${4:-}" usa_cookie="${5:-no}" esperado="${6:-200}"
    local muestra respuesta codigo indice
    for ((indice = 1; indice <= 50; indice++)); do
        local args=(--silent --show-error --fail --max-time 20 -o /dev/null -w '%{time_total} %{http_code}' -X "$metodo")
        if [[ "$usa_cookie" == "si" ]]; then args+=(-b "$COOKIE" -c "$COOKIE"); fi
        if [[ -n "$cuerpo" ]]; then args+=(-H 'Content-Type: application/json' --data "$cuerpo"); fi
        respuesta="$(curl "${args[@]}" "$URL$ruta")" || fallar "falló $metodo $ruta en la muestra $indice."
        read -r muestra codigo <<<"$respuesta"
        [[ "$codigo" == "$esperado" ]] || fallar "$metodo $ruta respondió HTTP $codigo (esperado $esperado)."
        printf '%s,%s\n' "$etiqueta" "$(python3 -c 'import sys; print(float(sys.argv[1]) * 1000)' "$muestra")" >>"$RESULTADOS"
    done
}

medir health GET /health '' no 200
medir login POST /auth/login '{"correo":"rendimiento@ejemplo.invalid","password":"medicion-sintetica-2026!"}' si 200
medir pacientes GET /pacientes '' si 200
medir caso GET "/casos/$CASO_ID" '' si 200
medir trabajo POST /trabajos "{\"tipo\":\"inferencia\",\"payload\":{\"caso_id\":\"$CASO_ID\"}}" si 202

METRICAS="$(python3 - "$RESULTADOS" <<'PY'
import csv, math, sys
medidas = {}
with open(sys.argv[1], encoding="utf-8", newline="") as archivo:
    for operacion, milisegundos in csv.reader(archivo):
        medidas.setdefault(operacion, []).append(float(milisegundos))
for operacion, valores in medidas.items():
    assert len(valores) == 50, (operacion, len(valores))
    valores.sort()
    p = lambda q: valores[math.ceil(q * len(valores)) - 1]
    print(f"| {operacion} | {len(valores)} | {p(.50):.2f} ms | {p(.95):.2f} ms | {p(.99):.2f} ms |")
PY
)" || fallar "no se pudieron calcular los percentiles."

if command -v lscpu >/dev/null 2>&1; then
    CPU="$(lscpu | awk -F: '/Model name/{sub(/^[[:space:]]+/, "", $2); print $2; exit}')"
    ARQUITECTURA="$(lscpu | awk -F: '/^Architecture:/{sub(/^[[:space:]]+/, "", $2); print $2; exit}')"
    RAM="$(free -h 2>/dev/null | awk '/^Mem:/{print $2 " total, " $3 " usada, " $4 " disponible"}')"
else
    # macOS: lscpu y free no existen; sysctl da el modelo y la RAM en bytes.
    CPU="$(sysctl -n machdep.cpu.brand_string 2>/dev/null || uname -m)"
    ARQUITECTURA="$(uname -m)"
    RAM="$(sysctl -n hw.memsize 2>/dev/null | awk '{printf "%.0fGi total", $1 / 1073741824}')"
fi
DOCKER="$(docker version --format '{{.Client.Version}}' 2>/dev/null || docker --version)"
COMMIT="$(git rev-parse HEAD)"
IDS="$(dc ps -q)"
# xargs de macOS no admite -r; sin ids no se consulta docker stats.
if [[ -n "$IDS" ]]; then
    CONTENEDORES="$(xargs docker stats --no-stream --format '{{.Name}} | {{.MemUsage}} | {{.MemPerc}}' <<<"$IDS" 2>/dev/null || true)"
else
    CONTENEDORES=""
fi
[[ -n "$CONTENEDORES" ]] || CONTENEDORES="No disponible (docker stats no devolvió datos)."

if [[ "${LAPTOP_DEMO:-0}" == "1" ]]; then
    ADVERTENCIA="Medición ejecutada en la laptop de demostración, con el stack completo por Docker Compose en ese equipo."
    LAPTOP_TEXTO="Sí"
else
    ADVERTENCIA="Esta medición no se ejecutó en la laptop de demostración; el número no sustituye la medición en la laptop, la prefigura."
    LAPTOP_TEXTO="No confirmada; asumir no"
fi
TABLA="| Operación | Muestras | p50 | p95 | p99 |\n|---|---:|---:|---:|---:|\n$METRICAS"

{
    printf '%s\n\n' "$ADVERTENCIA"
    printf '# Medición de rendimiento — %s\n\n' "$FECHA"
    printf '| Dato | Valor |\n|---|---|\n'
    printf '| Máquina | %s (%s) |\n' "$(hostname)" "$(uname -s)"
    printf '| Laptop de demostración | %s |\n' "$LAPTOP_TEXTO"
    printf '| CPU | %s |\n| Arquitectura | %s |\n| RAM del host | %s |\n' "${CPU:-No disponible}" "${ARQUITECTURA:-No disponible}" "${RAM:-No disponible}"
    printf '| Docker | %s |\n| Commit medido | `%s` |\n| Arranque frío hasta `/health` | %s ms |\n' "$DOCKER" "$COMMIT" "$ARRANQUE_MS"
    printf '| Proyecto aislado | `%s` |\n| URL medida | `%s` |\n| Límite global sintético | 500 por minuto |\n| Límite de inferencias sintético | 100 por minuto |\n\n' "$PROYECTO" "$URL"
    printf '## Latencias\n\n%b\n\n' "$TABLA"
    printf '## Memoria de contenedores\n\n| Contenedor | Uso de memoria | Porcentaje |\n|---|---:|---:|\n'
    if [[ "$CONTENEDORES" == "No disponible*" ]]; then
        printf '| %s | — | — |\n' "$CONTENEDORES"
    else
        while IFS='|' read -r contenedor memoria porcentaje; do
            printf '| %s | %s | %s |\n' "${contenedor// /}" "${memoria// /}" "${porcentaje// /}"
        done <<<"$CONTENEDORES"
    fi
    printf '\nPara obtener 50 muestras consecutivas, el límite global se elevó a 500/min y el de inferencias a 100/min en el contenedor de medición. Las latencias no representan los límites operativos predeterminados. `POST /trabajos` mide únicamente validación y encolado; no se cargaron pesos ni se midió inferencia real. El stack medido incluye PostgreSQL, almacenamiento, backend, frontend, edge e IA sin pesos.\n'
} >"$INFORME"

printf 'Informe generado: %s\n' "$INFORME"
cat "$INFORME"
