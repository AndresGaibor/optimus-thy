#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR=/e2e/app
ENV_FILE="$APP_DIR/.env"
PROJECT=optimus-thy-e2e-ci
IMAGE_PREFIX=optimus-thy-e2e-ci
NETWORK=optimus-thy-e2e-ci
PORT=18444

fail() { printf 'E2E ERROR: %s\n' "$*" >&2; exit 1; }
assert_fail_without_containers() {
  local label="$1" before after rc
  shift
  before="$(docker ps -aq --filter "label=com.docker.compose.project=$PROJECT" | sort)"
  set +e
  "$@" >/tmp/e2e-failure.log 2>&1
  rc=$?
  set -e
  after="$(docker ps -aq --filter "label=com.docker.compose.project=$PROJECT" | sort)"
  [[ $rc -ne 0 ]] || fail "$label debía fallar"
  [[ "$before" == "$after" ]] || fail "$label creó o eliminó contenedores"
  printf 'OK fallo esperado: %s (exit=%s)\n' "$label" "$rc"
}

[[ -d /src/.git ]] || fail "/src no contiene el repositorio git"
git config --global --add safe.directory /src
git config --global --add safe.directory /src/.git
[[ -n "${E2E_HEAD_SHA:-}" ]] || fail "E2E_HEAD_SHA requerido"
[[ -n "${E2E_BASE_SHA:-}" ]] || fail "E2E_BASE_SHA requerido"
git -C /src cat-file -e "${E2E_HEAD_SHA}^{commit}" 2>/dev/null || fail "E2E_HEAD_SHA no existe en /src: $E2E_HEAD_SHA"
git -C /src cat-file -e "${E2E_BASE_SHA}^{commit}" 2>/dev/null || fail "E2E_BASE_SHA no existe en /src: $E2E_BASE_SHA"
git init --bare /e2e/origin.git >/dev/null
git -C /e2e/origin.git fetch /src "+${E2E_HEAD_SHA}:refs/heads/dev" "+${E2E_BASE_SHA}:refs/heads/main" >/dev/null
git clone /e2e/origin.git "$APP_DIR" >/dev/null
git -C "$APP_DIR" checkout dev >/dev/null
git -C "$APP_DIR" merge-base --is-ancestor "$E2E_BASE_SHA" "$E2E_HEAD_SHA" || fail "el checkout E2E no desciende de main (HEAD=$E2E_HEAD_SHA BASE=$E2E_BASE_SHA); en CI debe ser el merge commit del PR"
[[ "$(git -C "$APP_DIR" rev-parse HEAD)" == "$E2E_HEAD_SHA" ]] || fail "el clon no está alineado con E2E_HEAD_SHA"
mkdir -p "$APP_DIR/infra/nginx/certs" /e2e/backups
openssl req -x509 -nodes -newkey rsa:2048 -days 2 \
  -subj '/CN=127.0.0.1' -addext 'subjectAltName=IP:127.0.0.1,DNS:localhost' \
  -keyout "$APP_DIR/infra/nginx/certs/dev.key" -out "$APP_DIR/infra/nginx/certs/dev.crt" >/dev/null 2>&1
chmod 600 "$APP_DIR/infra/nginx/certs/dev.key"
cp "$APP_DIR/compose.server.example.yaml" "$APP_DIR/compose.server.yaml"
openssl rand -hex 32 > /e2e/backup.key
chmod 600 /e2e/backup.key
cat >"$ENV_FILE" <<EOF
DEPLOY_ENV=e2e
E2E_MODE=1
E2E_ROOT=/e2e
COMPOSE_PROJECT_NAME=$PROJECT
IMAGE_PREFIX=$IMAGE_PREFIX
COMPOSE_NETWORK=$NETWORK
APP_DIR=$APP_DIR
ENV_FILE=$ENV_FILE
COMPOSE_SERVER=$APP_DIR/compose.server.yaml
RELEASES_DIR=/e2e/releases
DEPLOYMENTS_DIR=/e2e/deployments
TAILSCALE_IP=127.0.0.1
HTTPS_PORT=$PORT
HTTP_PORT=18080
PUBLIC_URL=https://127.0.0.1:$PORT
MAIN_REF=origin/dev
REPO_REMOTE=origin
POSTGRES_USER=optimus
POSTGRES_PASSWORD=e2e-only-password
POSTGRES_DB=optimus
DATABASE_URL=postgresql+psycopg://optimus:e2e-only-password@postgres:5432/optimus
PII_ENCRYPTION_KEY=$(openssl rand -hex 32)
S3_ENDPOINT=http://storage:9000
S3_ACCESS_KEY=e2eaccess
S3_SECRET_KEY=e2esecret123
S3_BUCKET=optimus
S3_REGION=us-east-1
S3_PRESIGNED_SECONDS=3600
ALLOWED_ORIGINS=https://127.0.0.1:$PORT
SESSION_COOKIE_SECURE=true
ENVIRONMENT=production
BACKUP_KEY_FILE=/e2e/backup.key
BACKUP_DIR=/e2e/backups
EOF
chmod 600 "$ENV_FILE"

# Guard failures must not mutate the disposable daemon's Compose project.
cp "$ENV_FILE" /e2e/env.valid
rm "$ENV_FILE"
assert_fail_without_containers 'sin .env' "$APP_DIR/deploy.sh" check
cp /e2e/env.valid "$ENV_FILE"
sed -i 's/^COMPOSE_PROJECT_NAME=.*/COMPOSE_PROJECT_NAME=/' "$ENV_FILE"
assert_fail_without_containers 'COMPOSE_PROJECT_NAME vacío' "$APP_DIR/deploy.sh" check
cp /e2e/env.valid "$ENV_FILE"
sed -i 's/^COMPOSE_PROJECT_NAME=.*/COMPOSE_PROJECT_NAME=optimus-thy/' "$ENV_FILE"
assert_fail_without_containers 'proyecto de producción en e2e' "$APP_DIR/deploy.sh" check
cp /e2e/env.valid "$ENV_FILE"
mv "$APP_DIR/compose.server.yaml" /e2e/compose.server.yaml
assert_fail_without_containers 'sin compose.server.yaml' "$APP_DIR/deploy.sh" check
mv /e2e/compose.server.yaml "$APP_DIR/compose.server.yaml"
sed -i 's|^APP_DIR=.*|APP_DIR=/|' "$ENV_FILE"
(
  cd /
  assert_fail_without_containers 'ejecución desde / con APP_DIR fuera de E2E_ROOT' "$APP_DIR/deploy.sh" check
)
cp /e2e/env.valid "$ENV_FILE"

# Create metadata fixtures for rollback guard cases without deploying anything.
mkdir -p /e2e/deployments
cat > /e2e/deployments/current.json <<'EOF'
{"release":"0000000000000000000000000000000000000000","previous":"1111111111111111111111111111111111111111","environment":"wrong","project":"wrong","image_prefix":"wrong","network":"wrong"}
EOF
assert_fail_without_containers 'rollback con metadata inválida' "$APP_DIR/deploy.sh" rollback --yes
cat > /e2e/deployments/current.json <<'EOF'
{"release":"0000000000000000000000000000000000000000","previous":"../invalid","environment":"e2e","project":"optimus-thy-e2e-ci","image_prefix":"optimus-thy-e2e-ci","network":"optimus-thy-e2e-ci"}
EOF
assert_fail_without_containers 'rollback con target inválido' "$APP_DIR/deploy.sh" rollback --yes
rm -rf /e2e/deployments
cp /e2e/env.valid "$ENV_FILE"

if grep -R -nE 'docker[[:space:]]+compose[^\n]*down[[:space:]]+-v|compose[^\n]*down[[:space:]]+-v' "$APP_DIR"/deploy.sh "$APP_DIR"/infra/deploy "$APP_DIR"/infra/scripts; then
  fail 'se encontró down -v en scripts de despliegue'
fi
printf 'OK no hay down -v en scripts de despliegue\n'

cd "$APP_DIR"
# Escenario de adopción: stack «heredado» existente antes del primer deploy gestionado.
COMPOSE_PROJECT_NAME="$PROJECT" docker compose -p "$PROJECT" --env-file "$ENV_FILE" -f docker-compose.yml up -d --wait postgres storage
PG_E2E="${PROJECT}-postgres-1"
docker exec "$PG_E2E" sh -c 'psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"' <<'SQL'
CREATE TABLE IF NOT EXISTS e2e_adopcion (id integer primary key, marca text not null);
INSERT INTO e2e_adopcion (id, marca) VALUES (1, 'persistir') ON CONFLICT (id) DO NOTHING;
SQL
CREATED_AT_BEFORE="$(docker volume inspect "${PROJECT}_pgdata" --format '{{.CreatedAt}}')"
[[ -n "$CREATED_AT_BEFORE" ]] || fail "no se pudo registrar CreatedAt de ${PROJECT}_pgdata"
ADOPT_OUT="$(./deploy.sh adopt 2>&1)"
ADOPT_RC=$?
printf '%s\n' "$ADOPT_OUT"
[[ "$ADOPT_RC" -eq 0 ]] || fail "deploy.sh adopt falló (rc=$ADOPT_RC)"
echo "$ADOPT_OUT" | grep -qi 'Instalación existente: SÍ\|existe_instalacion' || fail "deploy.sh adopt no reporta instalación existente"
echo "$ADOPT_OUT" | grep -q "$PROJECT" || fail "deploy.sh adopt no reporta el proyecto $PROJECT"
printf 'OK adopt detecta instalación heredada existente\n'

./deploy.sh check --ref origin/dev
./deploy.sh deploy --ref origin/dev --yes
SYNTHETIC="$(docker exec "$PG_E2E" sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc "SELECT marca FROM e2e_adopcion WHERE id = 1;"')"
[[ "$SYNTHETIC" == "persistir" ]] || fail "registro sintético e2e_adopcion no persiste tras deploy ($SYNTHETIC)"
CREATED_AT_AFTER="$(docker volume inspect "${PROJECT}_pgdata" --format '{{.CreatedAt}}')"
[[ "$CREATED_AT_AFTER" == "$CREATED_AT_BEFORE" ]] || fail "CreatedAt de ${PROJECT}_pgdata cambió tras deploy (antes=$CREATED_AT_BEFORE después=$CREATED_AT_AFTER)"
printf 'OK datos sintéticos y volumen pgdata preservados tras adopción+deploy\n'

RELEASE_SHA="$(git -C "$APP_DIR" rev-parse origin/dev)"
STATUS_OUT="$(./deploy.sh status 2>&1 || true)"
echo "$STATUS_OUT" | grep -q "$RELEASE_SHA" || fail "status no muestra el release desplegado ($RELEASE_SHA)"
echo "$STATUS_OUT" | grep -q "salud: OK" || fail "status no reporta salud: OK tras primer deploy"
./deploy.sh status
assert_http() {
  local path="$1" expected="$2" actual
  actual="$(curl -ksS -o /dev/null -w '%{http_code}' "https://127.0.0.1:$PORT$path")"
  [[ "$actual" == "$expected" ]] || fail "$path respondió HTTP $actual, esperado $expected"
  printf 'OK HTTPS %s = %s\n' "$path" "$actual"
}
assert_http /healthz 200
assert_http /api/health 200
assert_http /api/auth/me 401
./deploy.sh deploy --ref origin/dev --yes
./deploy.sh rollback --yes
ROLLBACK_STATUS="$(./deploy.sh status 2>&1 || true)"
echo "$ROLLBACK_STATUS" | grep -q "salud: OK" || fail "status no reporta salud: OK tras rollback"
assert_http /healthz 200
printf 'Residuos E2E (contenedores):\n'
docker ps -a --filter "label=com.docker.compose.project=$PROJECT" --format '{{.ID}} {{.Names}} {{.Status}}'
printf 'Residuos E2E (volúmenes):\n'
docker volume ls --filter "label=com.docker.compose.project=$PROJECT" --format '{{.Name}}'
