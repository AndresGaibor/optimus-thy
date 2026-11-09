# OPTIMUS-THY — infraestructura local

Entorno de desarrollo de un solo comando (`make up`) para laptop sin GPU.

## Servicios

| Servicio   | Imagen / build        | Puerto host            | Puerto interno | Red              | Notas |
|------------|-----------------------|------------------------|----------------|------------------|-------|
| `postgres` | `postgres:16-alpine`  | —                      | 5432           | interna          | Datos en volumen `pgdata` |
| `storage`  | `minio/minio`         | —                      | 9000 (API) / 9001 (consola) | interna | Compatible S3; datos en volumen `miniodata` |
| `backend`  | `./backend`           | —                      | 8000           | interna          | FastAPI + Alembic (migraciones al arrancar) |
| `frontend` | `./frontend`          | —                      | 8080           | interna          | Nginx con proxy `/api/ → backend:8000` |
| `edge`     | `nginx:1.27-alpine`   | `${HTTP_PORT:-8080}` (HTTP) / `${HTTPS_PORT:-18443}` (HTTPS) | 8080 / 8443 | interna | Borde TLS: redirige HTTP→HTTPS y añade cabeceras de seguridad |
| `ocr`      | `./ocr`               | —                      | 8001           | interna          | FastAPI, sin OCR real todavía |
| `ia`       | `./ia`                | —                      | 8002           | interna          | FastAPI, sin modelos todavía |

OCR, IA y la base de datos no exponen puertos al host: solo son accesibles dentro de la red `optimus-thy-net`.

## Arranque

```bash
cp .env.example .env       # copia los valores de ejemplo (sin secretos reales)
make up                    # construye imágenes, levanta y espera los healthchecks
docker compose ps          # estado de cada servicio
```

Para parar:

```bash
make down                  # detiene los servicios (conserva volúmenes)
docker compose down -v     # además borra volúmenes (datos de PostgreSQL y MinIO)
```

## Comprobar la salud de cada servicio

| Servicio   | Comando desde el host |
|------------|-----------------------|
| `postgres` | `docker compose exec postgres pg_isready -U $POSTGRES_USER` |
| `storage`  | `docker compose exec storage curl -f http://localhost:9000/minio/health/live` |
| `backend`  | `docker compose exec backend curl -fsS http://localhost:8000/health` |
| `frontend` | `docker compose exec frontend wget -qO- http://127.0.0.1:8080/healthz` |
| `edge`     | `curl -kfsS https://localhost:${HTTPS_PORT:-18443}/healthz` |
| `ocr`      | `docker compose exec ocr curl -fsS http://localhost:8001/health` |
| `ia`       | `docker compose exec ia curl -fsS http://localhost:8002/health` |

`docker compose ps` muestra la columna `STATUS` con `(healthy)` cuando cada healthcheck pasa.

## Cambiar puertos del host

Edita `.env`:

```
HTTP_PORT=8081
HTTPS_PORT=8444
```

y vuelve a ejecutar `make up`.

## Instancia de desarrollo en la tailnet

`infra/dev/optimus-thy-dev.service` arranca Vite con HMR en `0.0.0.0:5175` y FastAPI con recarga en `127.0.0.1:8000` (si otro proceso ya sirve `/health` en 8000, se reutiliza). Sablier la escala a cero a los 30 min sin uso.

```bash
ln -sf "$PWD/infra/dev/optimus-thy-dev.service" ~/.config/systemd/user/
mkdir -p ~/.config/systemd/user/default.target.wants
ln -sf ~/.config/systemd/user/optimus-thy-dev.service ~/.config/systemd/user/default.target.wants/
systemctl --user daemon-reload
# URL solo tailnet: https://oracle.tail4a8b59.ts.net:15177
```

No uses `systemctl enable` ni `disable`: borran el enlace al fichero del repo. El enlace en `default.target.wants` mantiene la unidad cargada; si systemd la descarga al pararla, Sablier la quita del grupo y el siguiente acceso responde 404. Al iniciar sesión arranca y Sablier la apaga a los 5 min sin uso. Debe estar en `--provider.systemd.unit-patterns` de `sablier-systemd.service`.

## Servicio de API en el host

`infra/systemd/optimus-thy-backend.service` sirve FastAPI solo en `127.0.0.1:8000` para el despliegue de `tiroides2.andresgaibor.com`: lo publica el contenedor `optimus-thy-edge` (nginx, red del host) en `127.0.0.1:5033` y lo enruta el túnel de Cloudflare. El unit está enlazado en `~/.config/systemd/user/` y limitado a 8 reintentos por minuto para no entrar en bucle.

La configuración de ese nginx vive en `~/.config/optimus-thy/nginx.conf` (montada de solo lectura). `location /api/` y `/auth/` usan `proxy_pass` con barra final para quitar el prefijo, igual que `frontend/nginx.conf`.

La instancia de desarrollo reutiliza esta API si `/health` responde; no levanta una segunda.

## Borde TLS (HT-012)

El servicio `edge` (nginx) es el único que publica puertos al host. Termina TLS en desarrollo
con un certificado autofirmado y añade las cabeceras de seguridad (HSTS, CSP, etc.).

### Generar el certificado de desarrollo

```bash
make certificado-dev
# o directamente:
bash infra/scripts/generar-certificado-dev.sh
```

Genera `infra/nginx/certs/dev.crt` y `infra/nginx/certs/dev.key` (este directorio está en
`.gitignore`; no se commitean). El script es idempotente.

### Verificar el borde

```bash
docker compose up -d edge
bash infra/scripts/verificar-proxy.sh
```

Comprueba que `/healthz` responde 200 por HTTPS, que las cabeceras de seguridad están
presentes, que HTTP redirige a HTTPS y que el backend no está publicado en el host.

### Producción

En producción el borde escucha en el puerto 443 con la misma plantilla (el valor
de `HTTPS_PORT` se ajusta a 443). El TLS lo termina el proxy (o el túnel) con las
**mismas cabeceras de seguridad**. El contenedor `edge` se puede reutilizar cambiando
el certificado por uno válido; si el TLS se termina aguas arriba, conserva las
cabeceras reenviadas.

## Respaldo y restauración (HT-013)

`infra/scripts/respaldo.sh` guarda en `$BACKUP_DIR` (por defecto `~/backups/optimus`) un `pg_dump` de la base y el volumen de MinIO, cada uno cifrado con AES-256 (`gpg` simétrico, con comprobación de integridad), más un `SHA256SUMS-*` con las huellas. Conserva los últimos 14 juegos (`BACKUP_RETENER`).

La clave es un archivo **fuera del repositorio** (`BACKUP_KEY_FILE`, modo 600; el script se niega si está dentro del repo o con otros permisos). Guarda una copia aparte: sin ella el respaldo no se abre.

```bash
# primera vez
( umask 077; head -c 32 /dev/urandom | base64 > ~/.optimus-respaldo.key )

BACKUP_KEY_FILE=~/.optimus-respaldo.key infra/scripts/respaldo.sh
BACKUP_KEY_FILE=~/.optimus-respaldo.key infra/scripts/restaurar.sh ~/backups/optimus/db-AAAAMMDD-HHMMSS.sql.gz.gpg
BACKUP_KEY_FILE=~/.optimus-respaldo.key infra/scripts/probar-respaldo.sh   # prueba completa
```

`restaurar.sh` carga el respaldo en un Postgres **limpio y desechable** (nunca en la base real), comprueba la versión de migración y las tablas, imprime solo recuentos y lo borra. Para recuperar de verdad: `restaurar.sh <archivo> --sql | psql ...` hacia la base destino. `probar-respaldo.sh` comprueba además que el respaldo no se abre con otra clave. La evidencia está en `docs/pruebas/evidencia-respaldo.md`.

Para programarlo, enlaza las dos unidades de `infra/systemd/` en `~/.config/systemd/user/` y activa el temporizador (`systemctl --user enable --now optimus-thy-respaldo.timer`). **Falta** una copia fuera de este equipo (RS-CIF-05): el script solo escribe en disco local.

## Despliegue en tiroides2

El dominio `tiroides2.andresgaibor.com` se sirve por el túnel de Cloudflare hacia el contenedor `optimus-thy-edge` (nginx con `--network host`, escucha `127.0.0.1:5033`). El bind mount de `/srv` apunta a `frontend/dist` de este repo, por lo que `bun run build` publica al instante. La API corre como servicio de usuario en `127.0.0.1:8000` y se expone por `/api/` y `/auth/`; Storybook corre en `127.0.0.1:6104` bajo `/storybook/`, protegido por Cloudflare Access y escalado a cero por Sablier.

Detalle operativo, diagnóstico y checklist: [../docs/operacion/despliegue-tiroides2.md](../docs/operacion/despliegue-tiroides2.md).
