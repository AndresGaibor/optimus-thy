#!/usr/bin/env bash
set -Eeuo pipefail

rollback_release() {
  # shellcheck disable=SC2153
  local current_file="$DEPLOYMENTS_DIR/current.json" target="${1:-}" current_release recorded_revision current_revision images image_ids deployed_at
  [[ -f "$current_file" ]] || die "no hay metadatos de despliegue actual"
  current_release="$(json_get "$current_file" release)" || die "current.json no contiene release"
  [[ -n "$target" ]] || target="$(json_get "$current_file" previous 2>/dev/null || true)"
  [[ -n "$target" && "$target" != null ]] || die "no hay release anterior para rollback"
  [[ "$target" =~ ^[0-9a-f]{40}$ ]] || die "release objetivo inválido"
  # shellcheck disable=SC2153
  [[ -d "$RELEASES_DIR/$target" ]] || die "no existe el worktree del release objetivo"
  # shellcheck disable=SC2153
  [[ "$(git -C "$RELEASES_DIR/$target" rev-parse HEAD)" == "$target" ]] || die "HEAD del worktree no coincide con release"
  [[ -f "$DEPLOYMENTS_DIR/$target.json" ]] || die "no hay metadata del release objetivo"
  images="$(json_get "$DEPLOYMENTS_DIR/$target.json" images)" || die "metadata de release sin imágenes"
  image_ids="$(json_get "$DEPLOYMENTS_DIR/$target.json" image_ids)" || die "metadata de release sin IDs de imágenes"
  python3 - "$images" "$image_ids" "$target" <<'PY'
import json, subprocess, sys
images, image_ids = (json.loads(value) for value in sys.argv[1:3])
services = {'backend', 'frontend', 'ocr', 'ia'}
if set(images) != services or set(image_ids) != services:
    raise SystemExit('metadata de imágenes incompleta')
for service in services:
    name = f'optimus-thy-{service}:{sys.argv[3]}'
    if images.get(service) != name:
        raise SystemExit(f'etiqueta de imagen inválida para {service}')
    actual = subprocess.run(['docker', 'image', 'inspect', '--format', '{{.Id}}', name], check=True, capture_output=True, text=True).stdout.strip()
    if actual != image_ids.get(service):
        raise SystemExit(f'la imagen registrada no coincide con {service}')
PY
  recorded_revision="$(json_get "$DEPLOYMENTS_DIR/$target.json" db_revision_after)"
  [[ -n "$recorded_revision" && "$recorded_revision" != null ]] || die "release objetivo sin revisión DB registrada"
  export RELEASE="$current_release"
  # shellcheck disable=SC2153
  export RELEASE_DIR="$RELEASES_DIR/$current_release"
  current_revision="$(migration_revision current)"
  [[ "$current_revision" == "$recorded_revision" ]] || die "revisión DB diferente; rollback de app rechazado (restauración de backup manual)"
  export RELEASE="$target"
  # shellcheck disable=SC2153
  export RELEASE_DIR="$RELEASES_DIR/$target"
  COMPOSE_PROJECT_DIR="$RELEASE_DIR" compose up -d --no-build --wait --wait-timeout 180 backend frontend ocr ia edge
  check_health "$target" >/dev/null
  deployed_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  json_write "$current_file" "$(python3 - "$target" "$current_release" "$deployed_at" "$images" "$image_ids" "$recorded_revision" <<'PY'
import json, sys
release, previous, deployed_at, images, image_ids, revision = sys.argv[1:]
print(json.dumps({'release': release, 'previous': previous, 'deployed_at': deployed_at, 'images': json.loads(images), 'image_ids': json.loads(image_ids), 'db_revision_before': revision, 'db_revision_after': revision, 'backup': None, 'result': 'rollback'}))
PY
)"
  cp "$current_file" "$DEPLOYMENTS_DIR/rollback-$deployed_at-$target.json"
  log "rollback a $target completado"
}
