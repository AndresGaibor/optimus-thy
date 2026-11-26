# Tasks

## 1. Versionado y consulta de la ficha

- [ ] 1.1 Añadir pruebas de API para guardados con y sin cambios, comparación anterior/posterior, autoría, permisos, alcance institucional y bitácora en `backend/tests/test_ficha_historial.py`.
- [ ] 1.2 Extender `FichaVersion` con el estado anterior y crear una migración; implementar guardado versionado e historial en `backend/app/api/fichas.py`, registrar el router, actualizar el contrato OpenAPI y auditar sin valores clínicos.

## 2. Presentación del historial

- [ ] 2.1 Añadir el cliente del historial en `frontend/src/api/` con los tipos de versión y comparación.
- [ ] 2.2 Mostrar el historial, incluidos los campos antes/después y estados de carga, vacío y error, en el caso con componentes existentes; agregar prueba focalizada de UI.
