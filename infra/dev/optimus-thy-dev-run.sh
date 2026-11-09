#!/usr/bin/env bash
# Instancia de desarrollo de OPTIMUS-THY para la tailnet:
# Vite con HMR en 0.0.0.0:<web> y FastAPI con recarga en 127.0.0.1:<api>
# (si ya hay una API sirviendo /health, se reutiliza). Sablier escala la unidad.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PUERTO_WEB="${OPTIMUS_DEV_WEB_PORT:-5175}"
# vite.config.ts proxya /api a localhost:8000; otro puerto exige cambiar la configuración.
PUERTO_API="${OPTIMUS_DEV_API_PORT:-8000}"

if [[ ! -x "$ROOT/backend/.venv/bin/uvicorn" ]]; then
  echo "[optimus-thy-dev] falta backend/.venv; ejecuta 'uv sync' en backend" >&2
  exit 69
fi

pids=()
limpiar() {
  trap - EXIT INT TERM
  if ((${#pids[@]})); then
    kill -TERM "${pids[@]}" 2>/dev/null || true
    wait "${pids[@]}" 2>/dev/null || true
  fi
}
trap limpiar EXIT INT TERM

echo "[optimus-thy-dev] web=0.0.0.0:${PUERTO_WEB} api=127.0.0.1:${PUERTO_API}"
if curl -sf -m 1 "http://127.0.0.1:${PUERTO_API}/health" >/dev/null 2>&1; then
  # Otra unidad (p. ej. optimus-thy-backend) ya sirve la API: se reutiliza.
  echo "[optimus-thy-dev] API ya activa en 127.0.0.1:${PUERTO_API}; no se arranca otra"
else
  (
    cd "$ROOT/backend"
    exec .venv/bin/uvicorn app.main:app --host 127.0.0.1 --port "$PUERTO_API" --reload
  ) &
  pids+=("$!")
fi
(
  cd "$ROOT/frontend"
  exec bun run dev -- --host 0.0.0.0 --port "$PUERTO_WEB" --strictPort
) &
pids+=("$!")

set +e
wait -n "${pids[@]}"
codigo=$?
set -e

echo "[optimus-thy-dev] un proceso terminó (código=$codigo); systemd reiniciará el stack" >&2
exit "$codigo"
