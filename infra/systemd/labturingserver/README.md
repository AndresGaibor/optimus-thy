# Unidades systemd de respaldo — labturingserver

Unidades **de sistema** (`/etc/systemd/system/`), no de usuario. Corresponden al host `labturingserver` (`APP_DIR=/opt/apps/optimus-thy`, proyecto `optimus-thy`). **No instalan ni habilitan nada por sí mismas**; su presencia en el repo no implica que estén instaladas en el servidor.

## Archivos

- `optimus-thy-respaldo.service`: `Type=oneshot`, ejecuta `/opt/apps/optimus-thy/infra/scripts/respaldo.sh` tras `docker.service` (`After=`/`Requires=`).
- `optimus-thy-respaldo.timer`: diario 03:00, `RandomizedDelaySec=10min`, `Persistent=true`.

## Instalación (pendiente de verificar en servidor)

```bash
sudo install -m 0644 infra/systemd/labturingserver/optimus-thy-respaldo.service /etc/systemd/system/
sudo install -m 0644 infra/systemd/labturingserver/optimus-thy-respaldo.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now optimus-thy-respaldo.timer
systemctl list-timers optimus-thy-respaldo.timer
```

## Clave y secretos

- Clave de cifrado **fuera del repositorio**: `/etc/optimus-thy/backup.key`, modo `600` o `400`, legible por el servicio. Custodia separada del respaldo (ver `docs/operacion/custodia-respaldos.md`).
- Credenciales externas (`BACKUP_S3_*` para copia externa) **solo** en `/etc/optimus-thy/respaldo.env`, **nunca** en el unit:
  ```bash
  sudo install -d -m 0700 /etc/optimus-thy
  sudo install -m 0600 /dev/null /etc/optimus-thy/respaldo.env   # editar con valores reales
  ```
  `respaldo.env` debe quedar con modo `600`. El unit lo carga con `EnvironmentFile=-/etc/optimus-thy/respaldo.env` (opcional si no hay S3).
- Directorio de respaldos: `/var/backups/optimus-thy` (crearlo con permisos restrictivos antes de habilitar el timer).

## Dependencias

- `docker.service` activo y acceso al daemon Docker (el servicio corre como root).
- `gpg` instalado.
- Stack `optimus-thy` y rutas `/opt/apps/optimus-thy` existentes en el host.

## Notas

- Las unidades `infra/systemd/*.service` de la **raíz** corresponden a tiroides2; no instalarlas tal cual en labturingserver.
- Verificar en servidor: nombres de contenedores/volúmenes, rutas, usuario de ejecución y que la copia S3 externa (si se configura) funciona sin exponer secretos.
