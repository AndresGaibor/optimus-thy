# labturingserver: operación de producción

> **Alcance exclusivo:** este runbook aplica solo a `labturingserver`, con Docker Compose, `APP_DIR=/opt/apps/optimus-thy`, HTTPS en `18443` y exposición por Tailscale. Estos valores proceden del encargo y están **pendientes de verificar en servidor**; no se inspeccionó el host por SSH. No usar este procedimiento en tiroides2.

Unidades de respaldo del host nuevo: `infra/systemd/labturingserver/optimus-thy-respaldo.service` y `optimus-thy-respaldo.timer`. Las unidades `infra/systemd/*.service` ubicadas directamente en la raíz corresponden al host tiroides2 y **no deben instalarse tal cual** en labturingserver.

## Referencias

- [Índice y separación de entornos](README.md)
- [Runbook tiroides2](despliegue-tiroides2.md), solo para ese entorno
- [Custodia de respaldos y secretos](custodia-respaldos.md)
- [Recuperación](recuperacion.md) y [diagnóstico](diagnostico.md)
- [Checklist de release](checklist-release.md)
- [Incidente E2E/rollback 2026-11-09](incidente-e2e-rollback-2026-11-09.md)
- [ADR-018: despliegues por releases](../adr/ADR-018-despliegue-por-releases.md), [ADR-019: respaldos cifrados](../adr/ADR-019-respaldos-cifrados.md)

## Primera adopción desde la instalación Compose existente

La adopción prepara la instalación Compose que ya contiene los datos para gestionarla mediante el sistema de releases. No es una instalación desde cero ni una autorización para sustituir servicios o datos.

### Precondiciones

- Aprobación humana, ventana de mantenimiento y acceso administrativo al host.
- Verificar en el host real que `APP_DIR`, proyecto Compose, overlay y `.env` corresponden a la instalación objetivo; registrar nombres y metadata de contenedores, redes, montajes y volúmenes antes de actuar.
- Confirmar compatibilidad del código/overlay con los servicios y recursos existentes; no deducir el estado del host a partir del repositorio.
- La identidad esperada es `DEPLOY_ENV=production`, `COMPOSE_PROJECT_NAME=optimus-thy`, `IMAGE_PREFIX=optimus-thy`, `COMPOSE_NETWORK=optimus-thy-net`. La configuración efectiva es **pendiente de verificar en servidor**.
- Confirmar espacio libre, salud actual, revisión Alembic y rutas públicas/internas. Cualquier discrepancia bloquea la adopción.

### Inspección con `deploy.sh adopt` (solo lectura)

Ejecutar desde `APP_DIR=/opt/apps/optimus-thy` (ajustar si difiere; **pendiente de verificar en servidor**). No toma lock, no pide confirmación y **no muta** Docker/contenedores/redes/volúmenes. Funciona también sin release previo.

```bash
cd /opt/apps/optimus-thy
./deploy.sh adopt           # plan legible
./deploy.sh adopt --json    # salida JSON única (campos: existe_instalacion, proyecto, red, servicios, volumenes, backup, gestionado_por_releases, bloqueos, recomendacion)
```

La salida no incluye credenciales. Revisar que identifica el entorno y los recursos ya existentes y que no propone recrear PostgreSQL/storage ni reemplazar volúmenes. La funcionalidad y salida real deben confirmarse en host (**pendiente de verificar en servidor**).

**Bloqueos que abortan** (sale distinto de 0; no continuar): `.env` ausente o sin modo `600`; `compose.server.yaml` ausente; `BACKUP_KEY_FILE` no definido, inexistente, no legible, con modo distinto de `600/400` o ubicado dentro del repositorio; `BACKUP_DIR` no definido o no creable; `PUBLIC_URL` no definido o sin HTTPS; menos de 5 GiB libres en `APP_DIR`; `compose config -q` no resuelve; volumen `${COMPOSE_PROJECT_NAME}_pgdata`/`_miniodata` o red `${COMPOSE_NETWORK}` existente con etiqueta `com.docker.compose.project` distinta del proyecto esperado. Si `deployments/current.json` existe, el plan informa «ya gestionado por releases» y no propone adopción.

### Procedimiento

1. Capturar evidencia de solo lectura de Compose, contenedores, mounts, volúmenes, salud HTTP, revisión Alembic y configuración activa. No incluir secretos en evidencia.
2. Crear respaldo cifrado reciente de PostgreSQL y MinIO. Verificar manifiesto SHA-256 y restaurabilidad en destino desechable con clave custodiada. Si no puede verificarse, abortar.
3. Preparar el repositorio y overlay del host preservando `.env`, certificados, rutas y valores existentes. No copiar un ejemplo sobre la configuración activa.
4. Ejecutar `./deploy.sh adopt` (y opcionalmente `--json`) y revisar el plan: sin bloqueos, identidad correcta, recursos existentes identificados y sin propuesta de recrear PostgreSQL/storage ni reemplazar volúmenes.
5. Ante plan inesperado, bloqueos, cambios de identidad, volúmenes/red con etiqueta de otro proyecto, backup dudoso o degradación de salud: **abortar sin desplegar**; conservar evidencia y escalar.
6. Tras aprobar el plan, ejecutar `./deploy.sh deploy`. El flujo debe aplicar el release con guards y ejecutar migraciones explícitas tras el respaldo.
7. Comprobar contenedores y healthchecks, HTTPS en la ruta autorizada, revisión Alembic, y que los volúmenes PostgreSQL/MinIO y sus datos persistentes son los mismos que antes de la adopción. Registrar release, respaldo, migración y resultado.

No ejecutar `docker compose down -v`; no recrear ni sustituir `postgres` o `storage`; no cambiar ni reemplazar `.env`. No tocar datos ni borrar contenedores ante errores. Si cualquier guard o verificación falla, detenerse y seguir el procedimiento aprobado de recuperación.

### Respaldo diario en labturingserver (systemd)

Unidades de referencia en `infra/systemd/labturingserver/` (servicio `Type=oneshot` + timer diario 03:00, `RandomizedDelaySec=10min`, `Persistent=true`, `After/Requires=docker.service`). **No prometen estar instaladas**; la instalación y el estado real son **pendientes de verificar en servidor**.

1. Instalar como unidades de **sistema** en `/etc/systemd/system/` (no unidades de usuario):
   ```bash
   sudo install -m 0644 infra/systemd/labturingserver/optimus-thy-respaldo.service /etc/systemd/system/
   sudo install -m 0644 infra/systemd/labturingserver/optimus-thy-respaldo.timer /etc/systemd/system/
   sudo systemctl daemon-reload
   sudo systemctl enable --now optimus-thy-respaldo.timer
   ```
2. Clave de cifrado **fuera del repo**: `/etc/optimus-thy/backup.key`, modo `600`/`400`, custodia separada (ver [custodia](custodia-respaldos.md)). Directorio: `/var/backups/optimus-thy`.
3. Credenciales externas de copia S3 (`BACKUP_S3_*`) **solo** en `/etc/optimus-thy/respaldo.env`, modo `600`, **nunca** en el unit (el unit usa `EnvironmentFile=-/etc/optimus-thy/respaldo.env`):
   ```bash
   sudo install -d -m 0700 /etc/optimus-thy
   sudo install -m 0600 /dev/null /etc/optimus-thy/respaldo.env   # editar valores reales
   ```
4. Dependencias: `gpg` instalado y acceso a Docker. Verificar ejecución manual (`systemctl start optimus-thy-respaldo.service`) y `journalctl`/timer antes de dar por operativo (**pendiente de verificar en servidor**).

## Identidad obligatoria de entorno

Toda operación administrada por el flujo de releases debe definir explícitamente las variables siguientes. La ausencia o inconsistencia debe bloquearla antes de tocar contenedores, redes o volúmenes.

| Variable | Producción | E2E | Propósito |
|---|---|---|---|
| `DEPLOY_ENV` | `production` | entorno aislado, p. ej. `e2e` | Identidad lógica. |
| `COMPOSE_PROJECT_NAME` | `optimus-thy` | prefijo único `optimus-thy-e2e-...` | Aislamiento Compose. |
| `IMAGE_PREFIX` | `optimus-thy` | prefijo único `optimus-thy-e2e-...` | Identidad de imágenes. |
| `COMPOSE_NETWORK` | `optimus-thy-net` | red única del E2E | Aislamiento de red. |

Producción usa exactamente los valores indicados. E2E usa identidad derivada única para proyecto, imágenes, redes, volúmenes y directorios. El overlay debe consumir las variables; no asumir entorno por directorio ni usar valores implícitos. La identidad efectiva del host es **pendiente de verificar en servidor**.

## E2E aislado en DinD

E2E corre aislado, preferentemente en Docker-in-Docker (DinD) o equivalente sin acceso destructivo a producción.

- Proyecto, red, volúmenes y directorios únicos por ejecución, con prefijo `optimus-thy-e2e-`.
- No reutilizar recursos ni bind mounts de producción.
- No publicar puertos/hosts en conflicto con producción.
- No usar secretos reales; usar datos sintéticos o fixtures controlados.
- Limpiar solo recursos identificados del E2E, tras validar metadata y contexto.

## Guards y operaciones prohibidas

Antes de deploy, rollback o limpieza:

1. Cargar y validar `DEPLOY_ENV`, `COMPOSE_PROJECT_NAME`, `IMAGE_PREFIX` y `COMPOSE_NETWORK`.
2. Confirmar que el entorno coincide con la intención operativa.
3. Verificar metadata/contexto de Compose, contenedores, red y volúmenes.
4. Ante inconsistencia, detenerse; no corregir silenciosamente identidad o valores de producción.

Está prohibido ejecutar `docker compose down -v`, recrear o sustituir PostgreSQL/storage en upgrades normales, reemplazar `.env` o el overlay activo con ejemplos, o limpiar recursos sin validar metadata. MinIO debe mantenerse fijado por digest según [ADR-014](../adr/ADR-014-minio-fijado.md).

## Rollback

El rollback se limita al entorno identificado y exige revisión Alembic compatible.

1. Verificar identidad, contexto y autorización.
2. Capturar metadata de proyecto, contenedores, imágenes, red, volúmenes montados y salud.
3. Confirmar que los recursos corresponden al mismo entorno esperado.
4. Aplicar rollback solo a los servicios de aplicación previstos, mediante el flujo aprobado.
5. No usar `down -v` ni tocar volúmenes de datos salvo restauración aprobada desde respaldo verificado.
6. Verificar salud, rutas críticas y persistencia; registrar evidencia.

Si el código anterior no es compatible con la revisión Alembic actual, no forzar rollback: detenerse y activar recuperación aprobada. Referencia: [incidente E2E/rollback](incidente-e2e-rollback-2026-11-09.md).

## Upgrade 69feaf6 → bb693c0

Este caso documenta la transición del estado asociado a `69feaf6` al código local `bb693c0` bajo identidad y aislamiento nuevos. El servidor no se inspeccionó por SSH al preparar este runbook; estado, rutas, Compose activo, volúmenes, backups y variables son **pendientes de verificar en servidor**.

- Confirmar en host el release aprobado derivado de `bb693c0` y revisar diferencias con `69feaf6`.
- Verificar respaldo cifrado reciente de PostgreSQL y MinIO, sus huellas y restauración en entorno desechable; registrar ID del respaldo.
- Añadir las cuatro variables de identidad a la configuración existente conservando secretos y valores. No reemplazar `.env` ni copiar `.env.production.example` encima.
- Adaptar el overlay activo preservando rutas, mounts, certificados y ajustes del host; asegurar uso de `IMAGE_PREFIX` y `COMPOSE_NETWORK`.
- Ejecutar `./deploy.sh adopt` y revisar el plan; luego `./deploy.sh deploy` tras aprobación. No recrear PostgreSQL/storage ni reemplazar volúmenes.
- `deploy.sh` aplica Alembic explícitamente después del respaldo; no hacer migraciones implícitas durante el arranque de backend.
- Verificar salud, rutas críticas, login/sesión según aplique, acceso a archivos y ausencia de 502 inesperados.
- Registrar revisión/artefacto, respaldo, revisión de migración, salud y desviaciones sin datos clínicos.

Confirmar en el host real todos los comandos concretos, rutas, servicios, revisiones de migración, exposición por Tailscale, HTTPS/certificados y estado de respaldo antes de ejecutar. Todo lo anterior está pendiente de verificar en servidor.
