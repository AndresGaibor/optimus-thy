#!/usr/bin/env bash
set -Eeuo pipefail

build_release() {
  local sha="$1" release_dir="$RELEASES_DIR/$1" current_head service image image_id
  verify_environment
  [[ -n "$IMAGE_PREFIX" ]] || die "IMAGE_PREFIX vacío: no se puede construir el release $sha"
  mkdir -p "$RELEASES_DIR"
  if [[ -e "$release_dir" ]]; then
    [[ -d "$release_dir/.git" || -f "$release_dir/.git" ]] || die "la ruta de release ya existe y no es un worktree: $release_dir"
    current_head="$(git -C "$release_dir" rev-parse --verify HEAD 2>/dev/null)" || die "no se pudo leer HEAD de release en $release_dir"
    [[ "$current_head" == "$sha" ]] || die "el worktree de release existente tiene otro HEAD"
  else
    git -C "$APP_DIR" worktree add --detach "$release_dir" "$sha" >&2
  fi
  RELEASE="$sha" RELEASE_DIR="$release_dir" COMPOSE_PROJECT_DIR="$release_dir" compose build backend frontend ocr ia >&2
  for service in backend frontend ocr ia; do
    image="${IMAGE_PREFIX}-${service}:${sha}"
    image_id="$(docker image inspect --format '{{.Id}}' "$image")" || die "no se encontró la imagen de $service: $image"
    printf '%s=%s\n' "$service" "$image_id"
  done
}
