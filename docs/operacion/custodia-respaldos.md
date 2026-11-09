# Custodia de respaldos y secretos

Runbook operativo para la custodia de la clave GPG de respaldos, respaldos MinIO, secretos `.env`, rotación, mínimo privilegio, inventario y simulacros. No incluye secretos.

## Estado actual verificado (2026-11-09)

| Elemento | Estado |
|---|---|
| Clave GPG de respaldo | `/home/ubuntu/.optimus-respaldo.key`, modo `600`, 45 bytes. **Solo hay una copia local**. |
| Respaldos cifrados locales | 4 archivos `.gpg` en `/home/ubuntu/backups/optimus`; último respaldo: `2026-11-09 07:08`. |
| Timer de respaldo | Activo, programa `03:00`, próxima ejecución `03:06` (`infra/systemd/optimus-thy-respaldo.timer`, `RandomizedDelaySec=10min`). |
| Copia fuera del servidor | **No hay evidencia** de copia externa de la clave ni de los respaldos. |
| S3 externo | Variables `BACKUP_S3_*` vacías; **S3 externo no configurado**. |
| Secretos `.env` fuera del host | **No hay evidencia** de copia del `.env` con secretos fuera del host. |

**Limitación crítica:** mientras no exista una copia externa de la clave GPG verificada mediante restauración, los respaldos cifrados dependen de esa única copia local. Si se pierde la clave o el host sin copia externa, los respaldos son irrecuperables. Cualquier operación de producción debe tratar esta limitación como riesgo abierto hasta cerrarla.

## Custodia de la clave GPG

La clave cifra los respaldos (`infra/scripts/respaldo.sh`, AES-256 simétrico vía GPG). El script exige `BACKUP_KEY_FILE` fuera del repositorio y modo `600` o `400`.

### Requisitos

- Mantener **al menos dos copias fuera del servidor**: gestor de secretos institucional + USB cifrado/HSM (o equivalente equivalente aprobado).
- **Nunca** almacenar la clave junto a los respaldos (`/home/ubuntu/backups/optimus`, S3, cintas o copias de respaldos).
- Permisos: `600` en uso operativo; `400` o almacenamiento protegido en custodia externa.
- **Pérdida de clave = respaldos irrecuperables**. No existe recuperación alternativa si no hay copia válida.
- No versionar, no copiar al repositorio, no incluir en tickets, chats, capturas ni artefactos CI.

### Procedimiento accionable

1. **Inventariar la clave actual** (sin exponer su contenido):
   ```bash
   stat -c '%n %a %s %U %G' /home/ubuntu/.optimus-respaldo.key
   sha256sum /home/ubuntu/.optimus-respaldo.key
   ```
   Registrar solo ruta, modo, tamaño, dueño, fecha de verificación y huella en el inventario seguro; nunca el contenido.
2. **Crear copias externas** desde un entorno controlado:
   - Copia A: gestor de secretos con acceso por mínimo privilegio y auditoría.
   - Copia B: USB cifrado/HSM en custodia física separada.
   - Etiquetar cada copia con identificador, fecha, responsable y ubicación lógica/física; no usar nombres que revelen el secreto.
3. **Verificar restauración con la copia externa** (obligatorio antes de dar por cerrada la custodia):
   - Obtener temporalmente la copia externa en un host controlado, con modo `600` y fuera de repositorios.
   - Ejecutar prueba contra un respaldo reciente sin tocar datos reales:
     ```bash
     BACKUP_KEY_FILE=/ruta/temporal/copia-externa \
       infra/scripts/restaurar.sh /ruta/db-AAAAMMDD-HHMMSS.sql.gz.gpg
     ```
   - Confirmar salida `OK: restauración verificada`, migración Alembic y recuentos esperados.
   - Eliminar la copia temporal del host de prueba (`shred -u` o borrado seguro equivalente) y revocar accesos temporales.
4. **Registrar evidencia** en el inventario: fecha, respaldo usado, host de prueba, resultado, responsable. No guardar SQL ni datos clínicos.
5. **Repetir** tras rotación de clave, cambio de custodios, cambio de gestor de secretos o pérdida de confianza en una copia.

### Rotación de clave GPG

1. Planificar ventana: mantener la clave anterior hasta verificar que los respaldos nuevos y la restauración con la clave nueva funcionan.
2. Generar nueva clave fuera del repositorio, modo `600`.
3. Actualizar `BACKUP_KEY_FILE` en la configuración del servicio/timer solo en el host autorizado; no commitear rutas sensibles innecesarias.
4. Ejecutar respaldo manual y prueba E2E (`infra/scripts/probar-respaldo.sh` con la nueva clave en entorno controlado).
5. Crear dos copias externas de la nueva clave y verificar restauración con copia externa.
6. Retirar copias externas antiguas según política institucional, conservando acceso a respaldos antiguos que aún dependan de la clave anterior o re-cifrando si se define un procedimiento aprobado.
7. Documentar la rotación en el inventario sin exponer material criptográfico.

## Respaldos MinIO

- `respaldo.sh` cifra la base (`db-*.sql.gz.gpg`) y el volumen MinIO (`archivos-*.tar.gz.gpg`) con la misma clave simétrica.
- Los respaldos locales son cifrados; la confidencialidad depende de la custodia de la clave.
- **Restauración de archivos MinIO:** el runbook actual verifica restauración de base en PostgreSQL limpio (`restaurar.sh`); la restauración de archivos requiere procedimiento controlado: descifrar el tarball con la clave autorizada en un entorno aislado, validar contenido/huellas (`SHA256SUMS-*`), restaurar al volumen MinIO correcto del entorno destino y verificar acceso por la aplicación. No ejecutar restauraciones destructivas sobre volúmenes activos sin respaldo previo y ventana aprobada.
- **S3 externo no configurado** (`BACKUP_S3_*` vacío). Antes de habilitarlo: definir bucket dedicado, cifrado en tránsito/reposo, credenciales de mínimo privilegio, política de retención, prueba de restauración desde S3 y prohibición de claves/secretos en el bucket.
- Las copias externas de respaldos deben mantenerse separadas de las copias externas de la clave.

## Secretos `.env`

Incluye PII/configuración sensible, credenciales de base de datos, configuración S3, secreto de sesión y cualquier valor equivalente.

- No commitear `.env` ni valores reales.
- No copiar `.env` fuera del host sin control: gestor de secretos aprobado, canal cifrado, acceso auditado y mínimo privilegio.
- Estado actual: **no hay evidencia** de secreto `.env` fuera del host; esto no equivale a prueba negativa absoluta, por lo que debe mantenerse inventario y control de accesos.
- Rotar secretos ante exposición sospechada, cambio de personal autorizado, o fin de uso.
- Para despliegues/upgrades, no reemplazar `.env`; añadir variables nuevas sin sobrescribir secretos existentes.

## Rotación

| Elemento | Disparadores | Acción mínima |
|---|---|---|
| Clave GPG | Sospecha de exposición, cambio de custodios, ejercicio programado | Nueva clave, dos copias externas, restauración verificada, retiro controlado de copias antiguas. |
| Credenciales DB/MinIO/S3 | Exposición, rotación programada, cambio de infraestructura | Cambiar en gestor de secretos/host, reinicio controlado, verificar salud y respaldos. |
| Secreto de sesión | Exposición o rotación programada | Rotar valor, planificar invalidación de sesiones, verificar login/CSRF/cookies. |
| Accesos humanos/técnicos | Alta/baja/cambio de rol | Revisar mínimo privilegio y revocar accesos innecesarios. |

## Mínimo privilegio

- Clave GPG: acceso solo a responsables de respaldo/restauración autorizados.
- Backups: lectura/escritura limitada al servicio de respaldo y operadores autorizados; copias externas con permisos separados de la clave.
- `.env` y secretos: solo procesos/operadores necesarios; evitar compartir cuentas.
- S3 futuro: credenciales separadas por función (escritura de backup, lectura de restauración, administración), sin permisos amplios `*`.
- Registrar accesos y revisarlos periódicamente.

## Inventario

Mantener un inventario seguro (fuera del repositorio y sin secretos) con:

- Activos: clave GPG, respaldos locales, copias externas, `.env`/secretos por entorno, buckets/configuración S3 si aplica.
- Para cada activo: ubicación, custodio, fecha de alta, última verificación, mecanismo de protección, dependencias.
- Evidencia de simulacros: fecha, tipo, respaldo/copia usada, resultado, hallazgos, acciones.
- Estado de limitaciones: copia externa de clave no verificada, S3 no configurado, servidor destino no inspeccionado por SSH cuando aplique.

## Simulacro

Frecuencia recomendada: al menos trimestral y tras cambios relevantes (clave, infraestructura, scripts, almacenamiento).

1. Seleccionar un respaldo reciente (`db-*` y, cuando aplique, `archivos-*`).
2. Verificar huellas:
   ```bash
   cd /home/ubuntu/backups/optimus
   sha256sum -c SHA256SUMS-AAAAMMDD-HHMMSS
   ```
3. Probar restauración de base con clave local operativa en PostgreSQL limpio.
4. Probar restauración con **copia externa** de la clave en host controlado; registrar resultado.
5. Validar procedimiento de archivos MinIO en entorno aislado si el alcance del simulacro lo incluye.
6. Documentar tiempos, hallazgos y acciones correctivas. No extraer datos clínicos.

## Referencias

- Runbook de despliegue/producción: [despliegue-produccion.md](despliegue-produccion.md)
- Runbook de corte tiroides2: [despliegue-tiroides2.md](despliegue-tiroides2.md)
- Incidente E2E/rollback 2026-11-09: [incidente-e2e-rollback-2026-11-09.md](incidente-e2e-rollback-2026-11-09.md)
- Scripts: [`infra/scripts/respaldo.sh`](../../infra/scripts/respaldo.sh), [`infra/scripts/restaurar.sh`](../../infra/scripts/restaurar.sh), [`infra/scripts/probar-respaldo.sh`](../../infra/scripts/probar-respaldo.sh)
- Unidades systemd: [`infra/systemd/optimus-thy-respaldo.service`](../../infra/systemd/optimus-thy-respaldo.service), [`infra/systemd/optimus-thy-respaldo.timer`](../../infra/systemd/optimus-thy-respaldo.timer)
