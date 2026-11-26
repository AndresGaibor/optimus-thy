# Proposal

## Why

Los pacientes que ya no requieren atención activa siguen apareciendo junto a los casos vigentes y pueden recibir casos nuevos. Se necesita cerrar su actividad sin borrar el historial clínico, conservar la consulta por identificador y dejar constancia auditable de cada cambio de estado.

## What Changes

- Añadir a `pacientes` `archivado_en` y `archivado_por_id`, con relación al usuario que realizó el archivado.
- Incorporar `paciente.archivar` y asignarlo a los roles que ya tienen `paciente.escribir`.
- Añadir `POST /pacientes/{id}/archivar` y `POST /pacientes/{id}/desarchivar`, con control institucional, errores de transición y auditoría `PATIENT_ARCHIVE` / `PATIENT_UNARCHIVE` sin datos personales.
- Excluir pacientes archivados de `GET /pacientes` por defecto, permitir incluirlos con `incluir_archivados` y devolver `archivado_en` en las respuestas.
- Rechazar con `409 paciente_archivado` la creación de casos para un paciente archivado, manteniendo disponible su consulta por id.
- Actualizar `PacientesPage` con estado visible, filtro de archivados y confirmación accesible para archivar o reactivar.
- Añadir pruebas de API e interfaz para transiciones, permisos, consulta, casos, auditoría y accesibilidad del diálogo.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `pacientes`: archivar y reactivar sin pérdida de datos, filtrar el listado, conservar consulta por id y bloquear casos nuevos.
- `administracion-roles`: incorporar `paciente.archivar` al dominio del rol que ya puede escribir pacientes.

## Impact

- Backend: migración Alembic `0026`, modelo y API de pacientes, catálogo de permisos y catálogo de acciones de auditoría.
- Frontend: cliente API, pantalla y pruebas de pacientes; etiquetas de auditoría para las nuevas acciones.
- OpenSpec: deltas de `pacientes` y `administracion-roles`.
