# Proposal

## Why

La bitácora registra fallos de autenticación, accesos denegados y exportaciones, pero revisarlos evento por evento dificulta identificar rápidamente patrones de uso inusuales. La consulta de alertas permite que el personal autorizado detecte posibles ataques de acceso o extracciones atípicas sin exponer datos personales.

## What Changes

- Añadir una detección pura de ráfagas de fallos de acceso, descargas masivas y exportaciones fuera del horario permitido.
- Exponer las alertas recientes mediante una ruta protegida por el permiso existente `auditoria.leer`.
- Restringir cada consulta a la institución del usuario autenticado y a los eventos de las últimas 24 horas.
- Registrar la consulta como `AUDIT_READ` sin incluir IP ni detalle de alerta en el evento.

## Capabilities

### Modified Capabilities

- `auditoria`: incorpora la detección y consulta institucional de alertas por patrones raros de uso.

## Impact

- Backend: nuevo detector sin acceso a base de datos, endpoint, registro del router y pruebas focalizadas.
- Documentación: ADR-022 y delta OpenSpec de auditoría.
- Sin cambios de esquema, migraciones, tareas en segundo plano ni dependencias nuevas.
