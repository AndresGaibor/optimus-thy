# Recuperación

> Objetivos propuestos, pendientes de aprobación: **RTO 4 horas** y **RPO 24 horas**, suponiendo un respaldo diario programado para las 03:00 con jitter de hasta 10 minutos. No son compromisos aprobados ni resultados medidos.

Este procedimiento describe una recuperación controlada. Ejecutar solo con autorización, respaldo verificado y un destino identificado; nunca improvisar sobre volúmenes activos.

## Requisitos previos

- Identificar el entorno y confirmar sus variables de identidad; para labturingserver, seguir [labturingserver.md](labturingserver.md).
- Obtener autorización humana, ventana y destino de restauración.
- Elegir el respaldo cifrado más reciente cuya huella SHA-256 y descifrado se hayan verificado.
- Recuperar por canal autorizado el archivo de clave GPG, comprobar su custodia y usarlo fuera del repositorio. La pérdida de la clave impide descifrar respaldos.
- Mantener disponibles los secretos originales de `.env` mediante custodia autorizada; no reconstruirlos desde `.env.example` ni versionarlos.

## Restaurar PostgreSQL

1. Verificar `SHA256SUMS-*` con `sha256sum -c` y validar la legibilidad del respaldo cifrado con el procedimiento de prueba controlado documentado en [custodia-respaldos.md](custodia-respaldos.md).
2. Restaurar primero en una instancia PostgreSQL limpia, aislada y desechable, usando el mecanismo probado (`infra/scripts/restaurar.sh`) y la clave recuperada.
3. Confirmar revisión Alembic y tablas esperadas sin extraer ni registrar datos clínicos. Si las huellas o la restauración fallan, abortar: no cargar en el destino operativo.
4. Para la recuperación autorizada, seguir el flujo de restauración aprobado hacia el destino. Evitar sobrescribir una base existente sin respaldo previo, ventana y revisión del destino.

## Restaurar MinIO

Usar `infra/scripts/restaurar-archivos.sh` para respaldos `archivos-AAAA...tar.gz.gpg`, solo tras comprobar integridad, clave correcta, entorno y volumen destino. No imprime la clave ni contenido de archivos.

**Comprobaciones previas (obligatorias)**

- Verificar huellas: `sha256sum -c SHA256SUMS-AAAAMMDD-HHMMSS`.
- Recuperar por canal autorizado `BACKUP_KEY_FILE`, custodiarlo fuera del repositorio y con modo `600`/`400`.
- Para `--volumen`, el volumen destino debe ser **nuevo o vacío** y estar identificado; el nombre debe corresponder a `${COMPOSE_PROJECT_NAME}_miniodata` del entorno verificado. Obtener autorización, ventana y copia previa si aplica. No extraer directamente en un volumen activo.

**Modos (comandos exactos)**

```bash
# 1) Verificar (por defecto): descifra, valida gzip/tar y lista conteo/tamaño; no escribe datos
BACKUP_KEY_FILE=~/.optimus-respaldo.key \
  infra/scripts/restaurar-archivos.sh archivos-AAAAMMDD-HHMMSS.tar.gz.gpg --verificar

# 2) Extraer a directorio inexistente o vacío (rechaza rutas absolutas o con .. en el tar)
BACKUP_KEY_FILE=~/.optimus-respaldo.key \
  infra/scripts/restaurar-archivos.sh archivos-AAAAMMDD-HHMMSS.tar.gz.gpg --extraer /ruta/destino-vacia

# 3) Restaurar dentro de un volumen Docker vacío (confirmación explícita; usa alpine:3 efímero)
BACKUP_KEY_FILE=~/.optimus-respaldo.key RESTORE_VOLUMEN_CONFIRMADO=si \
  infra/scripts/restaurar-archivos.sh archivos-AAAAMMDD-HHMMSS.tar.gz.gpg --volumen optimus-thy_miniodata
```

**Límites**

- **Sin probar en el servidor real.** El procedimiento debe revisarse en el host destino antes de ejecutarse.
- **No garantiza integridad objeto a objeto** dentro de MinIO; tras la restauración, verificar objetos mediante comprobaciones no clínicas y acceso de aplicación autorizado.
- Requiere **ventana y aprobación**. `--volumen` rechaza volumen inexistente, no vacío o sin confirmación y no borra nada.

## Reconstrucción en servidor limpio

Orden de recuperación para labturingserver:

1. **Host:** preparar sistema operativo, acceso administrativo y almacenamiento; valores reales pendientes de verificar en servidor.
2. **Docker:** instalar/validar Docker Engine y Compose; versiones compatibles pendientes de verificar en servidor.
3. **Repositorio:** obtener la revisión aprobada y comprobar su identidad.
4. **`.env`:** recuperar la configuración secreta desde custodia autorizada, preservar sus valores y permisos; nunca sustituirla por un ejemplo.
5. **Overlay:** recuperar/recrear el overlay de Compose con identidad de producción y rutas reales revisadas; no usar ejemplos sin adaptación.
6. **Volúmenes:** identificar y crear únicamente recursos de destino; no borrar ni reutilizar accidentalmente volúmenes de otro entorno.
7. **Restauración:** restaurar PostgreSQL y MinIO desde copias verificadas.
8. **Migraciones:** aplicar explícitamente migraciones compatibles con el código aprobado, con respaldo y estado previo registrados.
9. **Salud:** comprobar contenedores, base, MinIO, rutas HTTP y funciones críticas antes de abrir acceso.

## Evidencia y límites

Registrar fecha, responsable, entorno, revisión desplegada, identificadores y huellas de respaldo, resultado de restauración, revisión Alembic y verificaciones de salud. No registrar secretos, SQL, contenido de objetos ni datos clínicos.

La ruta `/opt/apps/optimus-thy`, HTTPS `18443`, exposición por Tailscale y arquitectura aquí descritas son valores del encargo y **pendientes de verificar en servidor**. No se ha ejecutado una restauración integral ni una reconstrucción de host; RTO/RPO son propuestas, no mediciones. Custodia externa de respaldos y clave, conectividad, certificados y servicios reales también quedan pendientes de comprobar.
