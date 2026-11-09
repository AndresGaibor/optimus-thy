#!/usr/bin/env bash
set -Eeuo pipefail

rollback_release() {
  # shellcheck disable=SC2153
  local current_file="$DEPLOYMENTS_DIR/current.json" target="${1:-}" current_release current_meta target_meta recorded_revision current_revision deployed_at metadata
  load_env
  verify_environment
  [[ -f "$current_file" ]] || die "no hay metadatos de despliegue actual en $current_file"
  current_release="$(json_get "$current_file" release)" || die "current.json no contiene release"
  current_meta="$(python3 - "$current_file" "$DEPLOY_ENV" "$COMPOSE_PROJECT_NAME" "$IMAGE_PREFIX" "$COMPOSE_NETWORK" <<'PY'
import json, sys
path, env, project, prefix, network = sys.argv[1:]
meta = json.load(open(path, encoding='utf-8'))
for field in ('release', 'environment', 'project', 'image_prefix', 'network'):
    if field not in meta or not meta[field]:
        raise SystemExit(f'current.json sin campo requerido: {field}')
values = {'environment': env, 'project': project, 'image_prefix': prefix, 'network': network}
for field, expected in values.items():
    if meta[field] != expected:
        raise SystemExit(f'current.json {field}={meta[field]!r} no coincide con entorno actual {expected!r}')
print('ok')
PY
)" || die "metadatos actuales no coinciden con el entorno verificado"
  [[ "$current_meta" == ok ]] || die "metadatos actuales no coinciden con el entorno verificado"

  [[ -n "$target" ]] || target="$(json_get "$current_file" previous 2>/dev/null || true)"
  [[ -n "$target" && "$target" != null ]] || die "no hay release anterior para rollback en $current_file"
  [[ "$target" =~ ^[0-9a-f]{40}$ ]] || die "release objetivo inválido: $target"
  # shellcheck disable=SC2153
  [[ -d "$RELEASES_DIR/$target" ]] || die "no existe el worktree del release objetivo: $RELEASES_DIR/$target"
  # shellcheck disable=SC2153
  [[ "$(git -C "$RELEASES_DIR/$target" rev-parse HEAD)" == "$target" ]] || die "HEAD del worktree no coincide con release objetivo $target"
  [[ -f "$DEPLOYMENTS_DIR/$target.json" ]] || die "no hay metadata del release objetivo en $DEPLOYMENTS_DIR/$target.json"

  target_meta="$(python3 - "$DEPLOYMENTS_DIR/$target.json" "$target" "$DEPLOY_ENV" "$COMPOSE_PROJECT_NAME" "$IMAGE_PREFIX" "$COMPOSE_NETWORK" <<'PY'
import json, subprocess, sys
path, target, env, project, prefix, network = sys.argv[1:]
meta = json.load(open(path, encoding='utf-8'))
for field in ('release', 'environment', 'project', 'image_prefix', 'network', 'images', 'image_ids', 'db_revision_after'):
    if field not in meta or meta[field] in ('', None):
        raise SystemExit(f'metadata objetivo sin campo requerido: {field}')
if meta['release'] != target:
    raise SystemExit(f'metadata objetivo release={meta["release"]!r} no coincide con {target!r}')
for field, expected in (('environment', env), ('project', project), ('image_prefix', prefix), ('network', network)):
    if meta[field] != expected:
        raise SystemExit(f'metadata objetivo {field}={meta[field]!r} no coincide con entorno actual {expected!r}')
services = ('backend', 'frontend', 'ocr', 'ia')
images = meta['images']
image_ids = meta['image_ids']
if set(images) != set(services) or set(image_ids) != set(services):
    raise SystemExit('metadata de imágenes incompleta')
for service in services:
    name = f"{prefix}-{service}:{target}"
    if images.get(service) != name:
        raise SystemExit(f'etiqueta de imagen inválida para {service}: {images.get(service)!r}, se esperaba {name!r}')
    actual = subprocess.run(['docker', 'image', 'inspect', '--format', '{{.Id}}', name], check=True, capture_output=True, text=True).stdout.strip()
    if actual != image_ids.get(service):
        raise SystemExit(f'la imagen registrada no coincide con {service}: {actual!r} != {image_ids.get(service)!r}')
print(meta['db_revision_after'])
PY
)" || die "metadata/entorno/imágenes del release objetivo no coinciden"
  recorded_revision="$target_meta"
  [[ -n "$recorded_revision" && "$recorded_revision" != null ]] || die "release objetivo sin revisión DB registrada"

  export RELEASE="$current_release"
  # shellcheck disable=SC2153
  export RELEASE_DIR="$RELEASES_DIR/$current_release"
  [[ -d "$RELEASE_DIR" ]] || die "no existe el worktree actual para consultar la revisión DB: $RELEASE_DIR"
  current_revision="$(migration_revision current)"
  [[ "$current_revision" == "$recorded_revision" ]] || die "revisión DB diferente ($current_revision != $recorded_revision); rollback de app rechazado (restauración de backup manual)"

  export RELEASE="$target"
  # shellcheck disable=SC2153
  export RELEASE_DIR="$RELEASES_DIR/$target"
  verify_compose_target
  COMPOSE_PROJECT_DIR="$RELEASE_DIR" compose up -d --no-build --wait --wait-timeout 180 backend frontend ocr ia edge
  check_health "$target" >/dev/null
  deployed_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  metadata="$(python3 - "$target" "$current_release" "$deployed_at" "$DEPLOY_ENV" "$COMPOSE_PROJECT_NAME" "$IMAGE_PREFIX" "$COMPOSE_NETWORK" "$DEPLOYMENTS_DIR/$target.json" "$recorded_revision" <<'PY'
import json, sys
release, previous, deployed_at, env, project, prefix, network, target_meta, revision = sys.argv[1:]
meta = json.load(open(target_meta, encoding='utf-8'))
print(json.dumps({
  'release': release,
  'previous': previous,
  'deployed_at': deployed_at,
  'environment': env,
  'project': project,
  'image_prefix': prefix,
  'network': network,
  'images': meta['images'],
  'image_ids': meta['image_ids'],
  'db_revision_before': revision,
  'db_revision_after': revision,
  'backup': meta.get('backup'),
  'result': 'rollback',
}))
PY
)"
  json_write "$current_file" "$metadata"
  cp "$current_file" "$DEPLOYMENTS_DIR/rollback-$deployed_at-$target.json"
  log "rollback a $target completado (env=$DEPLOY_ENV project=$COMPOSE_PROJECT_NAME)"
}
