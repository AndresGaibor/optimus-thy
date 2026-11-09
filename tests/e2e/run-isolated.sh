#!/usr/bin/env bash
set -Eeuo pipefail

E2E_TESTS="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
REPO="${E2E_REPO:-$(cd -- "$E2E_TESTS/../.." && pwd -P)}"
[[ -e "$REPO/.git" ]] || { printf 'ERROR: no existe repositorio fuente %s\n' "$REPO" >&2; exit 1; }
command -v docker >/dev/null 2>&1 || { printf 'ERROR: docker no está instalado\n' >&2; exit 1; }
docker info >/dev/null || { printf 'ERROR: daemon Docker exterior no disponible\n' >&2; exit 1; }

E2E_HEAD_SHA="$(git -C "$REPO" rev-parse HEAD)" || { printf 'ERROR: no se pudo resolver HEAD en %s\n' "$REPO" >&2; exit 1; }
E2E_BASE_SHA="$(git -C "$REPO" rev-parse origin/main)" || { printf 'ERROR: no se pudo resolver origin/main en %s (ejecuta git fetch origin main)\n' "$REPO" >&2; exit 1; }
common_dir="$(git -C "$REPO" rev-parse --git-common-dir)" || { printf 'ERROR: no se pudo resolver git-common-dir en %s\n' "$REPO" >&2; exit 1; }
case "$common_dir" in /*) ;; *) common_dir="$REPO/$common_dir" ;; esac
common_abs="$(cd -- "$common_dir" && pwd -P)"
repo_abs="$(cd -- "$REPO" && pwd -P)"
git_mounts=()
case "$common_abs" in "$repo_abs"|"$repo_abs"/*) ;; *) git_mounts+=(--mount "type=bind,src=$common_abs,dst=$common_abs,readonly") ;; esac
base="${E2E_TMPDIR:-${TMPDIR:-/tmp}}"
[[ -d "$base" ]] || { printf 'ERROR: el directorio temporal no existe: %s\n' "$base" >&2; exit 1; }
df_output="$(df -Pk "$base")" || { printf 'ERROR: no se pudo medir el espacio libre en %s\n' "$base" >&2; exit 1; }
{ read -r _; read -r _ _ _ available_kib _; } <<<"$df_output"
if [[ ! "$available_kib" =~ ^[0-9]+$ ]] || (( available_kib < 6 * 1024 * 1024 )); then
  printf 'ERROR: se requieren al menos 6 GiB libres en el filesystem temporal %s; prueba TMPDIR=/var/tmp o E2E_TMPDIR=<fs con espacio>\n' "$base" >&2
  exit 1
fi
snapshot() {
  {
    docker ps -aq --filter label=com.docker.compose.project=optimus-thy | sort
    printf '%s\n' '--volumes--'
    for volume in optimus-thy_pgdata optimus-thy_miniodata; do
      docker volume inspect --format '{{.Name}} {{.Driver}} {{.Scope}}' "$volume" 2>/dev/null || true
    done | sort
  }
}

before="$(snapshot)"
e2e_dir="$(mktemp -d "$base/optimus-thy-e2e.XXXXXX")"
name="optimus-thy-e2e-dind-$$"
cleanup() {
  local status=$?
  docker rm -f "$name" >/dev/null 2>&1 || true
  local after
  after="$(snapshot)" || { printf 'ERROR: no se pudo capturar snapshot final\n' >&2; exit 1; }
  if [[ "$before" != "$after" ]]; then
    printf 'ERROR: cambió el snapshot exterior del proyecto optimus-thy\nAntes:\n%s\nDespués:\n%s\n' "$before" "$after" >&2
    status=1
  else
    printf 'OK: snapshot exterior optimus-thy idéntico (contenedores y volúmenes)\n'
  fi
  # DinD writes as root into the bind mount; clear it with a root container first.
  docker run --rm --mount "type=bind,src=$e2e_dir,dst=/e2e" alpine:3 \
    sh -c 'rm -rf /e2e/* /e2e/.[!.]* /e2e/..?*' >/dev/null 2>&1 || true
  rm -rf "$e2e_dir"
  exit "$status"
}
trap cleanup EXIT INT TERM

docker run --detach --privileged --name "$name" \
  --mount "type=bind,src=$REPO,dst=/src,readonly" \
  --mount "type=bind,src=$E2E_TESTS,dst=/tests,readonly" \
  --mount "type=bind,src=$e2e_dir,dst=/e2e" \
  "${git_mounts[@]}" \
  docker:dind >/dev/null
for attempt in $(seq 1 60); do
  if docker exec "$name" docker info >/dev/null 2>&1; then break; fi
  if [[ "$attempt" == 60 ]]; then printf 'ERROR: Docker-in-Docker no inició\n' >&2; exit 1; fi
  sleep 2
done
docker exec "$name" sh -ec 'apk add --no-cache git bash curl python3 openssl util-linux coreutils gnupg'
docker exec -e "E2E_HEAD_SHA=$E2E_HEAD_SHA" -e "E2E_BASE_SHA=$E2E_BASE_SHA" "$name" bash /tests/inside.sh
