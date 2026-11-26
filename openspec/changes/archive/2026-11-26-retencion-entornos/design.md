# Design

## Context

Ver propuesta en `proposal.md`. La cola conserva `Trabajo` en `trabajos`, con estados terminales `completado` y `error`, y `actualizado_en` representa su última transición. La tabla de alertas todavía no existe; TES-351 la incorporará con `creado_en` y `revisada_en`. Las verificaciones de entorno viven en `Settings`.

La bitácora usa la tabla `auditoria`, el ancla `auditoria_ancla` y el verificador de `/auditoria/integridad`. No hay un proceso de archivo externo configurado.

## Goals / Non-Goals

**Goals:**
- Eliminar en transacciones de trabajo acotadas solo filas operativas terminales y revisadas vencidas.
- Hacer que una simulación sea segura por defecto y que la purga requiera tanto una opción explícita como configuración habilitante.
- Fallar el arranque de producción ante una clave PII de ejemplo, cookie insegura o URL de base local.

**Non-Goals:**
- Purga, anonimización o modificación de auditoría, usuarios, pacientes o datos clínicos.
- Crear la tabla de alertas o una migración para TES-351.
- Archivar o compactar la bitácora.

## Decisions

### Datos retenidos y límites de purga

- Los trabajos elegibles son solo los estados `completado` y `error` cuyo `actualizado_en` sea anterior a `ahora - RETENCION_TRABAJOS_DIAS`. Se elimina la fila de cola, no una inferencia ni otro objeto de dominio.
- Las alertas elegibles deben tener `revisada_en IS NOT NULL` y `creado_en` anterior a `ahora - RETENCION_ALERTAS_DIAS`. Las alertas sin revisar se conservan aunque sean antiguas.
- Se consulta la existencia de `alertas` antes de reflejarla o ejecutar SQL. Mientras falte, el conteo es cero y se informa `omitido.alertas: tabla ausente`; la retención de alertas se aplica cuando TES-351 cree la tabla. No se añade una migración aquí.
- Las eliminaciones se seleccionan y ejecutan en lotes de hasta 1000 IDs. No se recorren ni modifican tablas de pacientes, casos, fichas, documentos, imágenes, inferencias o usuarios.

### Por qué la bitácora no se purga

La migración `0005_auditoria_solo_escritura` instala un trigger `BEFORE UPDATE OR DELETE` que rechaza borrar eventos. Además, `AuditoriaAncla` conserva el recuento y hash final, y `/auditoria/integridad` vuelve a recorrer la cadena desde su primer evento y contrasta todas las filas con esa ancla. Eliminar un prefijo rompería tanto la cadena verificable como el ancla; CA-12 requiere conservar la bitácora como evidencia de cada acción. Por ello no hay plazo de auditoría en la configuración ni se cuenta o elimina ningún evento; el CLI informa `auditoria: no se purga (append-only con cadena y ancla)`.

Archivar la bitácora externamente requeriría otro diseño aprobado: exportación cifrada e inmutable de un prefijo previamente verificado, manifiesto/checkpoint confiable y un verificador capaz de validar el sufijo contra ese checkpoint. Ese cambio de modelo de integridad queda fuera de esta historia.

### Activación y salida

`PURGA_HABILITADA` es la barrera operativa y comienza en `false`; `--si` es una segunda confirmación para la ejecución. Sin `--si`, el comando cuenta candidatos y no ejecuta `DELETE`. Con `--si` pero purga deshabilitada, informa `purga deshabilitada`, sin borrar. Los mensajes contienen conteos y estados únicamente, no datos de las filas.

### Guardas de entorno

La configuración de producción exige clave PII propia, cookie segura y URL no local. La evaluación de URL se limita a esquema/host/base de datos; nunca se incluye la URL completa ni sus credenciales en errores. En desarrollo solo se advierte cuando el host o nombre de base contiene un marcador de producción; no se bloquea el arranque.

### Ejecución programada

El servicio systemd ejecuta `python -m app.jobs.retencion --si` dentro del servicio `backend` existente de Docker Compose, con el proyecto de operación como directorio de trabajo. El temporizador corre a las 04:30 cada día. La configuración del proceso conserva la barrera `PURGA_HABILITADA`; programar la unidad no la activa por sí solo.

## Risks / Trade-offs

- **La tabla `alertas` puede estar ausente en despliegues actuales** → la ejecución no hace SQL sobre ella, reporta la omisión y aplica su política cuando exista.
- **Los datos de auditoría siguen creciendo** → se priorizan la inmutabilidad y la evidencia CA-12; cualquier archivo externo requiere checkpoint y revisión de integridad en una historia posterior.
- **Una purga autorizada es irreversible desde la aplicación** → simular primero, revisar conteos y mantener respaldos operativos verificados antes de activar `PURGA_HABILITADA`.
- **Un nombre de host puede ser ambiguo** → las guardas bloquean únicamente conexiones localmente identificables en producción y usan advertencias genéricas en desarrollo.

## Migration Plan

No se requiere migración de base de datos. Desplegar el código y las unidades, simular con `python -m app.jobs.retencion`, verificar los conteos y el servicio, y solo entonces habilitar `PURGA_HABILITADA=true` en el entorno previsto. Para detener futuras purgas, deshabilitar la variable o el temporizador; las filas ya eliminadas requieren restauración desde un respaldo.

## Open Questions

Ninguna.
