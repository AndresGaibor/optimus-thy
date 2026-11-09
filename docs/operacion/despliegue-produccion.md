# Despliegue de producción en el servidor Tailscale

> Runbook para `labturingserver.tail0a220d.ts.net` (`100.107.225.79`), Ubuntu 24.04. No ejecutar en `tiroides2` ni reutilizar sus volúmenes. Los comandos que modifican producción requieren ventana de mantenimiento, respaldo comprobado y confirmación humana.

## Topología y separación

La instalación nueva vive en `/opt/apps/optimus-thy`, expuesta solo en la tailnet por HTTPS `18443`. Compose orquesta PostgreSQL, almacenamiento MinIO, backend, frontend, OCR, IA y edge; el backend no publica puerto al host. El edge publica `TAILSCALE_IP:HTTPS_PORT`, usa certificado montado desde `infra/nginx/certs` y sirve los servicios internos. El volumen PostgreSQL y el volumen de archivos son datos durables; nunca borrar con `down -v`.

La aplicación `tiroides2` actual está en otro host (`100.114.65.117`, puerto `5033`), con sus propios datos. Este despliegue no la detiene, modifica ni comparte datos. El nuevo destino no es un reemplazo de ese host hasta que se apruebe y ejecute una migración independiente.

## Requisitos y preparación

- Ubuntu 24.04, Docker Engine y Docker Compose v2, `git`, `curl`, `python3`, `flock`, Tailscale conectado a la tailnet y espacio libre suficiente para imágenes, releases, base y respaldos. Dimensionar el disco según uso real; revisar `df -h` antes de cada release.
- Tailscale debe asignar `100.107.225.79`; la política/ACL debe permitir a los operadores acceder a TCP `18443`.
- Certificados presentes en `/opt/apps/optimus-thy/infra/nginx/certs/dev.crt` y `dev.key`. No versionar certificados ni claves. Protege la clave privada (solo lectura para quien lo requiera).
- La clave GPG del respaldo se guarda fuera del repositorio, en archivo con modo `600` o `400`. Mantener una copia segura independiente; perderla impide restaurar respaldos.

## Primera instalación

Desde una sesión administrativa del servidor (estos pasos preparan el host; el primer deploy se hace con el CLI):

```bash
sudo mkdir -p /opt/apps/optimus-thy
sudo chown "$USER":"$(id -gn)" /opt/apps/optimus-thy
cd /opt/apps/optimus-thy
git clone <URL_DEL_REPOSITORIO> .
cp .env.example .env
chmod 600 .env
cp compose.server.example.yaml compose.server.yaml
mkdir -p infra/nginx/certs
```

Completa `.env` sin copiar secretos de ejemplo: `TAILSCALE_IP=100.107.225.79`, `HTTPS_PORT=18443`, `PUBLIC_URL=https://100.107.225.79:18443`, `ENVIRONMENT=production`, `SESSION_COOKIE_SECURE=true`, `ALLOWED_ORIGINS=https://100.107.225.79:18443`. Configura credenciales fuertes de PostgreSQL y S3/MinIO, `PII_ENCRYPTION_KEY` real y valores de respaldo. Instala `dev.crt`/`dev.key` desde un canal seguro. No uses datos ficticios de `.env.example` en producción.

Para un stack existente, configura `BACKUP_KEY_FILE` y `BACKUP_DIR` en `.env` (clave fuera del repo, con modo `600` o `400`) antes de ejecutar `./deploy.sh backup`; el CLI carga `.env`, pide confirmación y verifica los checksums. No uses `backup` en la primera instalación antes de crear PostgreSQL: el primer `deploy` inicializa la base vacía y omite el respaldo previo.

Configura los respaldos conforme a [ADR-019](../adr/ADR-019-respaldos-cifrados.md). No habilites copia S3 hasta configurar credenciales de mínimo privilegio. El unit `infra/systemd/optimus-thy-respaldo.service` referencia actualmente la ruta de otro checkout y una clave bajo `$HOME`; **no lo habilites sin adaptarlo** para que `ExecStart` apunte a `/opt/apps/optimus-thy/infra/scripts/respaldo.sh` y definir `BACKUP_KEY_FILE`/`BACKUP_DIR` correctos y protegidos para el usuario del servicio. Verifica luego que el timer apunte a ese unit y que el último servicio terminó correctamente.


## Comprobación y primer despliegue

Ejecuta desde el checkout en el servidor. `check` y `status` son de solo lectura. El CLI soporta `help|status|check|backup|deploy|rollback` y opciones `--ref`, `--yes`; confirma primero la salida de `./deploy.sh help` si cambia la versión:

```bash
cd /opt/apps/optimus-thy
./deploy.sh help
./deploy.sh check
./deploy.sh status
./deploy.sh deploy --ref <SHA_O_TAG>
```

El primer deploy debe señalar un SHA o tag revisado y aprobado. En una instalación nueva sin PostgreSQL existente, `deploy` inicializa `postgres` y `storage` y omite el backup previo porque todavía no hay datos; si existe una base, el CLI crea y valida el backup antes de migrar. No ejecutes `backup` en el host vacío antes de inicializar PostgreSQL. `deploy` requiere confirmación; no usar `--yes` en operación interactiva. Antes de aceptar, comprobar salud del edge y del backend, y que la versión de base es compatible. El CLI crea un worktree bajo `RELEASES_DIR/<sha>`, construye imágenes con etiquetas `optimus-thy-<servicio>:<sha>` y registra metadatos en `DEPLOYMENTS_DIR/current.json`.

## Actualizaciones y migraciones

Para fijar un commit/tag usa `--ref`; sin `--ref`, el CLI resuelve `MAIN_REF` (por defecto `origin/main`). Antes de cada cambio: leer notas/cambios, revisar espacio, comprobar la salud y tomar un respaldo cifrado. `check` valida que el SHA resuelto sea ancestro de `MAIN_REF`; no desplegar un ref que no pase esa comprobación.

El backend arranca Uvicorn y **no ejecuta migraciones automáticamente**. El CLI ejecuta explícitamente `alembic upgrade head`, comprueba que la imagen tenga exactamente una `head` y valida el camino desde la revisión actual. El despliegue exige al menos 5 GiB libres. Si una migración falla, conserva logs y respaldo; el CLI no realiza downgrade ni restauración automática. No ejecutar `alembic downgrade`.

El CLI valida `GET /healthz`, `GET /api/health` (200), `HEAD /` (200), `/api/auth/me` (401 sin sesión), que ningún servicio esté detenido/`unhealthy`, y la revisión Alembic activa. Después del despliegue comprueba:

```bash
cd /opt/apps/optimus-thy
./deploy.sh status
curl -k -sS -o /dev/null -w '%{http_code}\n' https://100.107.225.79:18443/healthz
curl -k -sS -o /dev/null -w '%{http_code}\n' https://100.107.225.79:18443/api/health
curl -k -sS -o /dev/null -w '%{http_code}\n' https://100.107.225.79:18443/api/auth/me
```

Para inspeccionar Compose, usa los archivos y entorno del SHA activo (sustituye `<SHA>` por `release` de `./deploy.sh status`):

```bash
APP_DIR=/opt/apps/optimus-thy
RELEASE=<SHA>
RELEASE_DIR="$APP_DIR/releases/$RELEASE"
export APP_DIR RELEASE RELEASE_DIR
docker compose -p optimus-thy --project-directory "$RELEASE_DIR" --env-file "$APP_DIR/.env" \
  -f "$RELEASE_DIR/docker-compose.yml" -f "$APP_DIR/compose.server.yaml" ps
docker compose -p optimus-thy --project-directory "$RELEASE_DIR" --env-file "$APP_DIR/.env" \
  -f "$RELEASE_DIR/docker-compose.yml" -f "$APP_DIR/compose.server.yaml" logs --tail=200 edge backend postgres storage ocr ia
```


## Respaldo, retención y restauración

Respaldos generados por `infra/scripts/respaldo.sh` contienen dump de PostgreSQL, archivos MinIO y `SHA256SUMS-*`; el contenido se cifra con GPG AES-256. La política conserva 14 diarios, 8 semanales y 6 mensuales, y siempre mantiene el set recién generado. La copia externa S3 es opcional; comprobar presencia y checksum en destino. Mantener también fuera del host una copia segura de la clave.

El timer systemd debe ejecutar el respaldo automáticamente. Verifica su programación con `systemctl list-timers --all | grep optimus-thy-respaldo` y el último resultado con `journalctl -u optimus-thy-respaldo.service`. El unit actualmente referencia otro checkout; antes de habilitarlo en este host, cambia `ExecStart` para apuntar a `/opt/apps/optimus-thy/infra/scripts/respaldo.sh` y define `BACKUP_KEY_FILE`/`BACKUP_DIR` protegidos para el usuario del servicio.

Para respaldo manual de un stack existente, configura `BACKUP_KEY_FILE` y `BACKUP_DIR` en `.env` (clave fuera del repo, modo `600` o `400`) y ejecuta `./deploy.sh backup` desde `/opt/apps/optimus-thy`; el CLI carga `.env`, pide confirmación y verifica checksums. No ejecutes `backup` en el host vacío antes de crear PostgreSQL: el primer `deploy` inicializa la base vacía y omite el respaldo previo.

Restauración de prueba verificada: el script `infra/scripts/restaurar.sh <db-*.sql.gz.gpg>` descarga/descifra en un PostgreSQL desechable, comprueba `alembic_version` y tablas, y no toca la base real. El resultado reportado fue `OK: restauración verificada`, migración `0009`, 24 tablas. El dump se genera con `--no-owner --no-privileges`: **no restaura roles ni ACL** (incluido el rol `defensor`); si la recuperación los necesita, obtenerlos aparte con `pg_dumpall --globals-only` antes de considerar la restauración completa. Para emitir SQL descifrado sin cargarlo en el contenedor de prueba, `BACKUP_KEY_FILE=... infra/scripts/restaurar.sh <db-*.sql.gz.gpg> --sql`; redirige ese resultado solo a un destino protegido. Restaurar archivos MinIO desde el artefacto `archivos-*.tar.gz.gpg` requiere recuperación coordinada aparte. No ejecutes sobre los datos de `tiroides2`.

## Rollback de aplicación

El rollback del CLI solo es seguro si la revisión de esquema de la release destino es compatible con la base ya migrada. Las migraciones no se deshacen automáticamente ni se ejecutan downgrades. Si no hay compatibilidad documentada, mantener el servicio aislado y recuperar según el procedimiento específico de la migración y un respaldo validado. Antes de operar:

```bash
cd /opt/apps/optimus-thy
./deploy.sh status
./deploy.sh rollback
```

Revisar el SHA/revisión que propone el CLI y confirmar; no usar `--yes` sin aprobación explícita. Después, validar healthchecks, logs y versión de esquema.

## Diagnóstico y recuperación

- Servicios/logs: `./deploy.sh status` y los comandos `docker compose ps`/`logs` con los archivos y variables del release activo descritos arriba.
- Salud externa: `curl -k -i https://100.107.225.79:18443/healthz` y `curl -k -i https://100.107.225.79:18443/api/health`; auth sin sesión: `/api/auth/me` debe dar 401.
- Disco: `df -h`; liberar solo artefactos/release obsoletos verificados, nunca volúmenes de datos ni el release actual.
- Fallo antes de migrar: no cambiar el esquema; volver a la release previa mediante CLI solo tras validar su identidad y compatibilidad.
- Fallo después de migrar: no hacer downgrade. Aislar tráfico si procede, conservar estado/logs y decidir entre rollback compatible de aplicación o restauración coordinada de DB y archivos desde copia verificada.
- Pérdida de volumen: no recrear ni limpiar más datos; detener escrituras, inventariar volúmenes y restaurar dump/archivos emparejados y checksums.
- Certificado: confirmar que `dev.crt` corresponde a `dev.key`, que existen en el mount del edge y son legibles. Reemplazar desde fuente segura y reiniciar solo el servicio edge si el procedimiento Compose lo permite; no generar claves de prueba para producción.
- Tailscale: verificar que el host está conectado y conserva su IP, y que ACL/firewall permite `18443`. No publicar el edge en una interfaz pública como alternativa.

## Migración desde la instalación existente

La instancia actual en OCI (`100.114.65.117:5033`, revisión `69feaf6`, servicio conocido como tiroides2) permanece intacta durante preparación y pruebas. No ejecutar allí `down`, `down -v`, migraciones, rotaciones, ni cambios de edge. El corte requerirá plan y ventana aprobados, respaldo/restauración de prueba, transferencia de datos coherente, verificación de esquema y decisión explícita del endpoint. Hasta completar ese plan, ambas instalaciones son separadas y no se afirma que la nueva contenga los datos antiguos.

## Seguridad operativa

- Solo Tailscale debe alcanzar HTTPS `18443`; configurar firewall del host y ACL de tailnet, sin exponer PostgreSQL, MinIO o backend.
- `.env` modo `600`; no guardar secretos, claves privadas, claves GPG ni respaldos sin cifrar en Git.
- No imprimir valores secretos en comandos, logs, capturas ni tickets. Restringir logs y acceso al host.
- Rotar credenciales expuestas y guardar `BACKUP_KEY_FILE` fuera del repo y separada de los respaldos.
- Antes de comandos destructivos, comprobar host, directorio, proyecto Compose y volúmenes.


## Evidencia y límites

Verificado localmente: `shellcheck` y `bash -n` de los scripts; `docker compose config` del overlay de servidor; `deploy.sh check` positivo y negativo (rechaza publicación de puertos no permitida); `infra/scripts/probar-retencion.sh`; y `infra/scripts/probar-respaldo.sh`, que informó `OK: restauración verificada`, migración `0009`, 24 tablas. La subida S3 sin configuración opcional termina con código 0. El script de respaldo excluye owner y privilegios (`--no-owner --no-privileges`), por lo que no recupera roles/ACL, incluido `defensor`; para restaurarlos se necesita un `pg_dumpall --globals-only` independiente.

Verificado para el destino únicamente: probes por Tailscale a `/healthz` y `/api/health` respondieron 200. No se accedió por SSH al destino ni se inspeccionaron sus contenedores, discos, certificados, ACL, timer, archivos o datos. No se instaló ni desplegó, ni se ejecutaron allí migraciones, backup o restauración. Esto no afirma que el despliegue nuevo esté instalado o validado. Para la instalación anterior, consultar [runbook de tiroides2](despliegue-tiroides2.md).
