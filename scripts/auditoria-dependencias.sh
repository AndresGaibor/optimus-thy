#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd -P)"
EXCEPTIONS_FILE="${AUDITORIA_EXCEPCIONES_FILE:-$ROOT/.github/auditoria-excepciones.txt}"
mode="${1:-}"

case "$mode" in
  bun|pip|--comprobar-excepciones) ;;
  *) printf 'Uso: %s {bun|pip|--comprobar-excepciones}\n' "$0" >&2; exit 2 ;;
esac

[[ -f "$EXCEPTIONS_FILE" ]] || { printf 'ERROR: no existe %s\n' "$EXCEPTIONS_FILE" >&2; exit 1; }
today="$(date +%F)"
ids=()
count=0
while IFS= read -r line || [[ -n "$line" ]]; do
  [[ "$line" =~ ^[[:space:]]*(#|$) ]] && continue
  if [[ ! "$line" =~ ^([A-Za-z0-9][A-Za-z0-9._:-]*)\|([0-9]{4}-[0-9]{2}-[0-9]{2})\|(.+)$ ]]; then
    printf 'ERROR: excepción inválida en %s: se requiere ID|AAAA-MM-DD|motivo\n' "$EXCEPTIONS_FILE" >&2
    exit 1
  fi
  id="${BASH_REMATCH[1]}"
  expiry="${BASH_REMATCH[2]}"
  reason="${BASH_REMATCH[3]}"
  parsed_expiry="$(date -d "$expiry" +%F 2>/dev/null)" || {
    printf 'ERROR: fecha inválida para %s: %s\n' "$id" "$expiry" >&2
    exit 1
  }
  [[ "$parsed_expiry" == "$expiry" ]] || {
    printf 'ERROR: fecha inválida para %s: %s\n' "$id" "$expiry" >&2
    exit 1
  }
  if [[ "$expiry" < "$today" ]]; then
    printf 'ERROR: excepción caducada: %s (caducó %s)\n' "$id" "$expiry" >&2
    exit 1
  fi
  [[ -n "${reason//[[:space:]]/}" ]] || {
    printf 'ERROR: motivo vacío para %s\n' "$id" >&2
    exit 1
  }
  ids+=("$id")
  ((count += 1))
  printf 'Excepción vigente: %s (hasta %s)\n' "$id" "$expiry"
done < "$EXCEPTIONS_FILE"

[[ "$mode" == --comprobar-excepciones ]] && exit 0

case "$mode" in
  bun)
    audit_args=(audit --audit-level=high)
    for id in "${ids[@]}"; do audit_args+=("--ignore=$id"); done
    bun "${audit_args[@]}"
    ;;
  pip)
    command -v pip-audit >/dev/null 2>&1 || { printf 'ERROR: pip-audit no está instalado\n' >&2; exit 1; }
    audit_args=()
    for id in "${ids[@]}"; do audit_args+=(--ignore-vuln "$id"); done
    pip-audit "${audit_args[@]}"
    ;;
esac

printf 'Auditoría completada; excepciones aplicadas: %s\n' "$count"
