# Tasks

## 1. Bitácora: ancla de la cadena

- [x] 1.1 Añadir el modelo `AuditoriaAncla` y la migración `0021` con su `downgrade`; sembrar el ancla desde los eventos existentes.
- [x] 1.2 Actualizar el ancla en `AuditService.record` dentro de la misma transacción, incluida la ruta sin conexión de las pruebas unitarias.
- [x] 1.3 Comparar recuento y hash final con el ancla en `GET /auditoria/integridad` y tipar su respuesta en OpenAPI.
- [x] 1.4 Pruebas: evento nuevo actualiza el ancla; cola eliminada devuelve `valida: false`; cadena íntegra sigue verde.

## 2. Pacientes: documento canónico y serializado

- [x] 2.1 Normalizar el documento (mayúsculas, sin espacios, guiones ni puntos) al comparar en alta y corrección.
- [x] 2.2 Serializar comprobación e inserción con `pg_advisory_xact_lock` por institución y documento canónico.
- [x] 2.3 Quitar `paciente_id` del 409 y tipar el cuerpo con `ErrorDuplicado` (`code`, `message`, `request_id`); regenerar `contracts/openapi.json` y `schema.d.ts`.
- [x] 2.4 Pruebas: `ab-12345` detecta `AB12345`; dos altas simultáneas producen un `201` y un `409`; el 409 no contiene el UUID.

## 3. Datasets: k efectivo agregado

- [x] 3.1 Calcular `k_efectivo` del listado con una agregación `jsonb` agrupada por la clave de once campos, sin cargar filas.
- [x] 3.2 Pruebas: el listado devuelve el mismo `k_efectivo` que la creación y no ejecuta carga de filas.

## 4. Frontend

- [x] 4.1 Limpiar `duplicado` y el error al cambiar el documento en `useAltaPaciente`.
- [x] 4.2 Marcar `confirmar_duplicado` como opcional en el tipo generado y regenerarlo desde OpenAPI.
- [x] 4.3 Pruebas: cambiar el documento tras el aviso envía sin confirmación.

## 5. Cierre

- [x] 5.1 Documentar el riesgo residual del ancla en `docs/cumplimiento/riesgo-reidentificacion.md`.
- [ ] 5.2 `make check` verde y archivar el change.
