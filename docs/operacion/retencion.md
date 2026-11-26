# Retención operativa

La purga está deshabilitada por defecto. En el entorno previsto, configure `RETENCION_TRABAJOS_DIAS` (90 días), `RETENCION_ALERTAS_DIAS` (365 días) y `PURGA_HABILITADA=true` solo después de revisar la simulación. La tabla `alertas` se incorpora en TES-351; mientras no exista, el comando informa que la omite y no ejecuta SQL sobre ella. Cuando exista, solo elimina alertas revisadas (`revisada_en IS NOT NULL`) cuyo `creado_en` supere el plazo. Los trabajos elegibles son únicamente los estados `completado` y `error`, vencidos según `actualizado_en`.

La bitácora completa se conserva: el trigger de solo escritura de la migración `0005`, `auditoria_ancla` y CA-12 exigen mantener la cadena y su evidencia. La purga no cuenta ni borra auditoría, ni toca pacientes, casos, fichas, documentos, imágenes, inferencias o usuarios. Un archivo externo requeriría exportar una cadena verificada y diseñar un checkpoint confiable y un verificador compatible; queda fuera de esta operación.

## Procedimiento y comprobación

1. Desde el directorio de despliegue, simule primero: `docker compose -p optimus-thy --env-file .env -f docker-compose.yml -f compose.server.yaml run --rm --no-deps backend python -m app.jobs.retencion`. La salida muestra conteos sin borrar datos personales ni filas.
2. Revise los conteos y confirme que corresponden al entorno esperado. `purga deshabilitada` significa que `PURGA_HABILITADA` todavía está en `false`; no cambie ese valor hasta aprobar la ejecución.
3. Con `PURGA_HABILITADA=true` en `.env` y aplicado al backend, autorice explícitamente: `docker compose -p optimus-thy --env-file .env -f docker-compose.yml -f compose.server.yaml run --rm --no-deps backend python -m app.jobs.retencion --si`.
4. Compruebe la salida y el último resultado de systemd: `sudo systemctl status optimus-thy-retencion.timer` y `sudo journalctl -u optimus-thy-retencion.service --since today`. La unidad se programa diariamente a las 04:30; confirma el estado y el conteo, no reemplaza la revisión de la simulación.
5. Para detener futuras purgas, desactive `PURGA_HABILITADA` o el temporizador con `sudo systemctl disable --now optimus-thy-retencion.timer`. Los borrados ya confirmados no se revierten desde la aplicación; restaurarlos requiere un respaldo verificado.
