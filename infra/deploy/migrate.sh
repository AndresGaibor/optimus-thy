#!/usr/bin/env bash
set -Eeuo pipefail

migration_output() {
  local mode="$1"; shift
  COMPOSE_PROJECT_DIR="$RELEASE_DIR" compose run --rm --no-deps backend alembic "$mode" "$@"
}

migration_revision() {
  local mode="$1" output
  output="$(migration_output "$mode")"
  if [[ "$mode" == heads ]]; then
    python3 -c 'import re,sys; print("\n".join(m.group(1) for line in sys.stdin for m in [re.match(r"^\s*([0-9a-f]+)(?:\s|$)", line, re.I)] if m))' <<<"$output"
  else
    python3 -c 'import re,sys; print(next((m.group(1) for line in sys.stdin for m in [re.match(r"^\s*([0-9a-f]+)(?:\s|$)", line, re.I)] if m), ""))' <<<"$output"
  fi
}

migrate_release() {
  local heads before after history
  heads="$(migration_revision heads)"
  [[ -n "$heads" && "$(printf '%s\n' "$heads" | wc -l)" -eq 1 ]] || die "la imagen debe declarar exactamente un head Alembic"
  before="$(migration_revision current)"
  if [[ -n "$before" && "$before" != "$heads" ]]; then
    history="$(migration_output history -r "${before}:head")" || die "la revisión actual no pertenece a la línea del head del release; se rechaza la migración"
    [[ -n "$history" ]] || die "la revisión actual no es ancestro del head del release; se rechaza la migración"
  fi
  COMPOSE_PROJECT_DIR="$RELEASE_DIR" compose run --rm --no-deps backend alembic upgrade head
  after="$(migration_revision current)"
  [[ "$after" == "$heads" ]] || die "la revisión final de base no coincide con head"
  printf '%s\n' "$before" "$after"
}
