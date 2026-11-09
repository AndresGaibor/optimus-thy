#!/usr/bin/env bash
# Verifica el borde TLS (HT-012): healthz, cabeceras, redirección y ausencia
# de puertos publicados para el backend.
set -euo pipefail

# Cargar .env si existe (valores del host).
if [[ -f .env ]]; then
    set -a
    # shellcheck disable=SC1091
    . ./.env
    set +a
fi

HTTP_PORT="${HTTP_PORT:-8080}"
HTTPS_PORT="${HTTPS_PORT:-18443}"

fail() { echo "FAIL: $*" >&2; exit 1; }

# 1. healthz por HTTPS responde 200.
code="$(curl -sk -o /dev/null -w '%{http_code}' "https://127.0.0.1:${HTTPS_PORT}/healthz")"
[[ "$code" == "200" ]] || fail "/healthz HTTPS devolvió $code (esperado 200)"

# 2. Cabeceras de seguridad presentes.
headers="$(curl -skI "https://127.0.0.1:${HTTPS_PORT}/healthz")"
for h in \
    strict-transport-security \
    content-security-policy \
    x-content-type-options \
    referrer-policy \
    x-frame-options \
    permissions-policy \
    cross-origin-opener-policy \
    cross-origin-resource-policy; do
    printf '%s\n' "$headers" | grep -iq "^${h}:" || fail "falta la cabecera ${h}"
done

# 3. HTTP redirige a HTTPS.
redir_code="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:${HTTP_PORT}/healthz")"
[[ "$redir_code" == "301" ]] || fail "HTTP /healthz devolvió $redir_code (esperado 301)"
location="$(printf '%s\n' "$(curl -sI "http://127.0.0.1:${HTTP_PORT}/healthz")" | grep -i '^location:' | tr -d '\r')"
printf '%s' "$location" | grep -q ":${HTTPS_PORT}" || fail "Location no usa el puerto ${HTTPS_PORT}: $location"

# 4. El backend NO está publicado en el host.
backend_port="$(docker compose port backend 8000 2>/dev/null || true)"
if [[ -n "$backend_port" && "$backend_port" != ":0" && "$backend_port" != *":0" ]]; then
    fail "el servicio backend publica el puerto en el host: $backend_port"
fi
# Un servicio del host (p. ej. systemd) en el puerto 8000 solo es aceptable si
# escucha en el bucle local: el único camino hacia él es el proxy del host.
expuestos="$(ss -H -ltn 'sport = :8000' 2>/dev/null | awk '{print $4}' | grep -vE '^(127\.0\.0\.1|\[::1\]):8000$' || true)"
if [[ -n "$expuestos" ]]; then
    fail "el puerto 8000 escucha fuera del bucle local: $(echo "$expuestos" | tr '\n' ' ')"
fi

echo "OK: proxy verificado"