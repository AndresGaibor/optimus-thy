#!/usr/bin/env bash
# Genera un certificado autofirmado para desarrollo en infra/nginx/certs/.
# Idempotente: si ya existen dev.crt y dev.key, no regenera.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CERT_DIR="$SCRIPT_DIR/../nginx/certs"
CERT="$CERT_DIR/dev.crt"
KEY="$CERT_DIR/dev.key"

mkdir -p "$CERT_DIR"

if [[ -f "$CERT" && -f "$KEY" ]]; then
    echo "Certificado de desarrollo ya existe en $CERT_DIR; no se regenera."
    exit 0
fi

openssl req -x509 -nodes -newkey rsa:2048 \
    -keyout "$KEY" -out "$CERT" -days 365 \
    -subj "/CN=localhost" \
    -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"

chmod 600 "$KEY"
chmod 644 "$CERT"

echo "Certificado generado: $CERT"