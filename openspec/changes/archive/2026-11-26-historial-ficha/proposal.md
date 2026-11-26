# Proposal

## Why

Las correcciones de una ficha clínica no dejan un registro consultable que permita atribuir cada cambio y comparar el estado previo con el posterior. Se necesita trazabilidad por versión para la revisión clínica y el cumplimiento de CA-12.

## What Changes

- Registrar una versión por cada guardado efectivo de la ficha, con autor, fecha, campos modificados y valores anteriores y posteriores.
- Exponer el historial de versiones por caso, protegido por permisos y alcance institucional, y auditar las lecturas y escrituras.
- Mostrar en la pantalla del caso el historial con la comparación antes/después.

## Capabilities

### New Capabilities
- `historial-ficha`: versionado, consulta y comparación de cambios de la ficha clínica.

### Modified Capabilities

## Impact

Afecta el modelo y la API de fichas, la bitácora de auditoría y la pantalla de caso en `frontend/`. No añade dependencias ni altera la ficha de paciente ni la inferencia.
