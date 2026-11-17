# Despliegue de producción: contrato operativo

Documento de contrato para despliegues de producción y entornos aislados (E2E) de OPTIMUS-THY. Complementa el runbook de corte actual en [despliegue-tiroides2.md](despliegue-tiroides2.md). No contiene secretos.

## Referencias

- Runbook de corte/operación tiroides2: [despliegue-tiroides2.md](despliegue-tiroides2.md)
- Incidente E2E/rollback 2026-11-09: [incidente-e2e-rollback-2026-11-09.md](incidente-e2e-rollback-2026-11-09.md)
- Custodia de respaldos y secretos: [custodia-respaldos.md](custodia-respaldos.md)

## Identidad obligatoria de entorno

Todo despliegue gestionado por el flujo con el nuevo contrato debe definir explícitamente estas variables. Son obligatorias; la ausencia o inconsistencia debe bloquear la operación antes de tocar contenedores, redes o volúmenes.

| Variable | Producción (valor exacto esperado) | E2E | Propósito |
|---|---|---|---|
| `DEPLOY_ENV` | `production` | valor de entorno aislado, p. ej. `e2e` | Identidad lógica del entorno. |
| `COMPOSE_PROJECT_NAME` | `optimus-thy` | prefijo único `optimus-thy-e2e-...` | Aísla proyecto Compose, contenedores y nombres derivados. |
| `IMAGE_PREFIX` | `optimus-thy` | prefijo único `optimus-thy-e2e-...` | Identidad de imágenes/etiquetas usadas por el overlay. |
| `COMPOSE_NETWORK` | `optimus-thy-net` | red única del entorno E2E | Evita colisiones de red con producción u otros entornos. |

Reglas:

- Producción usa los valores exactos: `DEPLOY_ENV=production`, `COMPOSE_PROJECT_NAME=optimus-thy`, `IMAGE_PREFIX=optimus-thy`, `COMPOSE_NETWORK=optimus-thy-net`.
- E2E usa prefijo `optimus-thy-e2e-` para identidad derivada (proyecto, imágenes, redes/volúmenes/directorios según aplique), garantizando unicidad por ejecución.
- El overlay de Compose usa `IMAGE_PREFIX` y `COMPOSE_NETWORK`; no hardcodear valores de producción en el overlay.
- Antes de ejecutar, validar que `.env`, overlay y contexto operativo correspondan al mismo entorno. No asumir identidad por directorio o por defecto implícito.

## E2E aislado en DinD

Los entornos E2E deben correr aislados, preferentemente en Docker-in-Docker (DinD) o contexto equivalente sin acceso destructivo a producción.

- Proyecto, red, volúmenes y directorios únicos por ejecución, con prefijo `optimus-thy-e2e-`.
- No reutilizar `COMPOSE_PROJECT_NAME`, `COMPOSE_NETWORK`, volúmenes ni bind mounts de producción.
- No publicar puertos/hosts que entren en conflicto con producción.
- No usar secretos reales de producción; usar datos sintéticos o fixtures controlados.
- Al terminar, limpiar solo los recursos identificados del entorno E2E, tras verificar su metadata/contexto.

## Guards obligatorios

Antes de cualquier acción mutante (deploy, rollback, limpieza):

1. Cargar y validar variables de identidad (`DEPLOY_ENV`, `COMPOSE_PROJECT_NAME`, `IMAGE_PREFIX`, `COMPOSE_NETWORK`).
2. Confirmar que el entorno objetivo coincide con la intención operativa (producción vs E2E).
3. Verificar metadata/contexto de Docker Compose, contenedores, red y volúmenes involucrados.
4. Si hay inconsistencia, detenerse con error explícito; no “corregir” silenciosamente valores de producción.

## Operaciones prohibidas

- **No ejecutar `docker compose down -v`** en producción ni en contextos donde pueda afectar volúmenes de PostgreSQL/MinIO u otros datos persistentes.
- No recrear o reemplazar PostgreSQL/storage durante upgrades normales.
- No reemplazar `.env` ni `compose.server.yaml`/overlay con valores de ejemplo.
- No ejecutar rollback o limpieza sin validación previa de metadata/contexto.
- No usar imágenes de MinIO no fijadas por digest; mantener la política de [ADR-014](../adr/ADR-014-minio-fijado.md).

## Rollback

El rollback debe ser conservador y estar acotado al entorno validado.

1. Cargar variables de identidad y verificar que apuntan al entorno correcto.
2. Capturar metadata y contexto antes de tocar contenedores: proyecto Compose, contenedores objetivo, imágenes, red, volúmenes montados y estado de salud.
3. Confirmar que los recursos a modificar pertenecen al mismo `DEPLOY_ENV`/`COMPOSE_PROJECT_NAME`/`COMPOSE_NETWORK` esperado.
4. Solo después de validar metadata+contexto, aplicar el rollback a los contenedores/servicios acordados.
5. No usar `down -v`. No tocar volúmenes de datos salvo procedimiento de restauración aprobado con respaldo verificado.
6. Verificar salud, rutas críticas y ausencia de impacto en datos. Registrar evidencia.

Referencia de incidente y lecciones: [incidente-e2e-rollback-2026-11-09.md](incidente-e2e-rollback-2026-11-09.md).

## Upgrade desde 69feaf6 con código local bb693c0

Este procedimiento aplica al upgrade desde el estado asociado a `69feaf6` hacia el código local `bb693c0`, bajo el nuevo contrato de identidad/aislamiento. **El servidor destino no se inspeccionó por SSH en esta preparación documental**; antes de ejecutar en un host real, confirmar estado actual, rutas, Compose activo, volúmenes, respaldos y variables efectivas.

### Principios

- No reemplazar `.env`.
- No reemplazar `compose.server.yaml` ni el overlay activo con ejemplos.
- No reemplazar ni borrar volúmenes.
- No recrear PostgreSQL ni storage.
- No ejecutar `down -v`.
- Hacer backup antes de cambios.

### Pasos seguros

1. **Preparación local/remota controlada**:
   - Confirmar que el código a desplegar corresponde a `bb693c0` o al artefacto aprobado derivado de ese estado.
   - Revisar diferencias relevantes entre `69feaf6` y `bb693c0` sin asumir que el servidor tiene la misma estructura local.
2. **Respaldo**:
   - Ejecutar/validar respaldo cifrado reciente de base y archivos MinIO.
   - Verificar huellas (`SHA256SUMS-*`) y registrar el identificador del respaldo.
   - Confirmar la limitación de custodia de clave: la copia externa no está verificada según [custodia-respaldos.md](custodia-respaldos.md).
3. **`.env` (sin sobrescribir secretos)**:
   - Añadir las cuatro variables de identidad requeridas: `DEPLOY_ENV`, `COMPOSE_PROJECT_NAME`, `IMAGE_PREFIX`, `COMPOSE_NETWORK`.
   - En producción, usar los valores exactos: `production`, `optimus-thy`, `optimus-thy`, `optimus-thy-net`.
   - Preservar todos los secretos y valores reales existentes (PII/DB/S3/sesión/orígenes/cookies, etc.).
   - No copiar `.env.production.example` sobre `.env`.
4. **Overlay `compose.server.yaml`**:
   - Actualizar el overlay tomando el ejemplo como referencia, pero preservando valores reales, certificados, mounts, rutas y ajustes del host.
   - Asegurar que el overlay use `IMAGE_PREFIX` y `COMPOSE_NETWORK`.
   - No reemplazar ciegamente el archivo activo.
5. **Deploy**:
   - Ejecutar el flujo de deploy con guards de identidad/metadata.
   - El deploy debe detectar PostgreSQL existente y **no recrear `postgres` ni `storage`**.
   - Aplicar cambios solo a servicios previstos por el upgrade.
6. **Migraciones**:
   - Correr migraciones explícitamente (`alembic upgrade head` o el comando aprobado por el entorno) tras confirmar respaldo y salud previa.
   - No ejecutar migraciones como efecto colateral no controlado.
7. **Validación**:
   - Verificar salud de servicios (`/health` o checks equivalentes).
   - Verificar rutas críticas y datos: login/sesión según aplique, consultas básicas, acceso a archivos, y ausencia de errores 502 inesperados.
   - Revisar logs de backend/migraciones/compose ante anomalías.
8. **Evidencia**:
   - Registrar commit/artefacto desplegado, respaldo usado, migración aplicada, resultado de salud/datos y cualquier desviación.

### Nota sobre inspección del destino

El servidor destino no se inspeccionó por SSH durante la elaboración de este documento. Por tanto, los comandos concretos de sistema, rutas reales, nombres efectivos de contenedores, estado de migraciones y configuración activa deben confirmarse en el host antes de ejecutar el upgrade.
