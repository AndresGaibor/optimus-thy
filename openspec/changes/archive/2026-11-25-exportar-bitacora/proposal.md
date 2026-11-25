## Why

La bitácora se puede consultar y filtrar, pero no se puede entregar como evidencia fuera de la aplicación. Además, una exportación sin registro permitiría sacar datos de auditoría sin dejar rastro, justo lo que RF-AUD-10 exige evitar.

## What Changes

- Nuevo `GET /auditoria/exportar` que devuelve `text/csv; charset=utf-8` con las mismas columnas del listado menos la dirección IP, que es dato personal.
- La exportación acepta los mismos filtros combinables que el listado: usuario, acción, rango de fechas y recurso.
- Tope documentado de 5000 filas, con los eventos más recientes primero.
- `Content-Disposition: attachment` con nombre fechado `bitacora-AAAAMMDD-HHMMSS.csv`.
- Cada exportación registra un evento `EXPORT.EXPORT` con el número de filas exportadas, nunca con su contenido.
- Botón «Exportar CSV» en la pantalla de auditoría, con los filtros activos y aviso de error si la descarga falla.

## Impact

- Backend: `app/api/auditoria.py` y sus pruebas.
- Frontend: `api/auditoria.ts`, `pages/admin/AuditoriaPage.tsx` y una prueba de pantalla.
- No hay cambios de esquema ni migraciones.
- El contrato OpenAPI cambia al añadir la ruta; se regenera con el flujo habitual del repositorio.
