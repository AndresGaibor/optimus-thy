# Tasks

## 1. Datos y auditoría

- [x] 1.1 Crear la migración `0026` con los campos de archivado, la FK `ON DELETE SET NULL` y la siembra idempotente del permiso para roles con `paciente.escribir`.
- [x] 1.2 Añadir los campos y la relación al modelo, y actualizar el catálogo y los dominios de permisos.
- [x] 1.3 Añadir las acciones de auditoría `PATIENT_ARCHIVE` y `PATIENT_UNARCHIVE`, sin detalles personales, y sus etiquetas legibles.

## 2. API y pruebas backend

- [ ] 2.1 Implementar archivar y reactivar con aislamiento institucional, errores de estado y auditoría de transiciones efectivas.
- [ ] 2.2 Excluir archivados del listado por defecto, admitir `incluir_archivados`, devolver `archivado_en` y bloquear la creación de casos archivados.
- [ ] 2.3 Crear `backend/tests/test_archivado_pacientes.py` para migración, permisos, transiciones, consulta, listado, casos y bitácora.

## 3. Interfaz y pruebas frontend

- [ ] 3.1 Extender el contrato OpenAPI y el cliente API de pacientes para archivado, reactivación y filtro.
- [ ] 3.2 Mostrar estado y filtro, agregar la confirmación accesible y recargar la lista tras la transición.
- [ ] 3.3 Crear `frontend/src/test/pacientes-archivado.test.tsx` para el filtro, ambas acciones y teclado del diálogo.

## 4. Verificación y coherencia

- [ ] 4.1 Ejecutar `pytest -q tests/test_pacientes.py tests/test_archivado_pacientes.py` en `backend/`.
- [ ] 4.2 Ejecutar `bunx vitest run src/test/pacientes.test.tsx src/test/pacientes-archivado.test.tsx` en `frontend/`.
- [ ] 4.3 Ejecutar `bun run ui:check` y `bun run tamanos` en `frontend/`.
- [ ] 4.4 Validar `2026-11-26-archivado-pacientes` con OpenSpec.
