## Why

La base de producción tiene dos instituciones para la misma entidad: `espoch` (con 3 usuarios) y `ESPOCH` (sin usuarios). La unicidad actual es sensible a mayúsculas, y la API guardaba el código en mayúsculas mientras la comparación de duplicados ignoraba la caja. Eso permite que vuelva a aparecer el mismo código con otra capitalización.

## What Changes

- El código de institución se guarda siempre en minúsculas (alta y edición).
- La unicidad pasa a ser una restricción de base de datos sobre `lower(codigo)`, no una comprobación solo en la aplicación.
- Una migración consolida los duplicados existentes: se conserva el registro con más referencias (usuarios, pacientes, casos, auditoría) y, a igualdad, el más antiguo; se reasignan sus dependencias y se elimina el resto.
- Los códigos existentes se normalizan a minúsculas.

## Impact

- Esquema: sustituye la restricción `uq_instituciones_codigo` por el índice único `uq_instituciones_codigo_lower`.
- Datos: se elimina el registro duplicado vacío de ESPOCH; no se pierde ninguna referencia.
- API: `POST /instituciones` y `PATCH /instituciones/{id}` devuelven el código en minúsculas. El contrato no cambia de forma.
- Riesgo: una institución creada por otra vía con distinta caja de un código existente ya no es posible; a cambio, el alta responde `409`.
