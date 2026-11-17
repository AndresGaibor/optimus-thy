# Tasks

## 1. Backend

- [x] 1.1 Acciones `INSTITUTION_CREATE` y `INSTITUTION_UPDATE` y objeto `INSTITUTION` en `app/audit/actions.py`.
- [x] 1.2 `POST /instituciones` con código normalizado y 409 por duplicado.
- [x] 1.3 `PATCH /instituciones/{id}` con nombre, código y estado; 422 sin cambios; 409 por duplicado.
- [x] 1.4 Desactivación bloqueada con 409 si hay usuarios activos.
- [x] 1.5 `GET /instituciones` con `incluir_inactivas` y `usuarios_activos`.
- [x] 1.6 Pruebas `tests/test_instituciones.py`: alta, duplicado, desactivación bloqueada, desactivación y 403.

## 2. Contrato

- [x] 2.1 Regenerar `contracts/openapi.json` con `scripts/export_openapi.py`.
- [x] 2.2 Regenerar `frontend/src/api/schema.d.ts` con `bun run gen:api`.

## 3. Frontend

- [x] 3.1 Cliente `src/api/instituciones.ts`.
- [x] 3.2 Página `InstitucionesPage` con tabla, alta, edición, activación y desactivación.
- [x] 3.3 Ruta `/administrador/instituciones` e ítem «Instituciones» en la navegación.
- [x] 3.4 Pruebas de alta, duplicado, desactivación bloqueada, activación y estado vacío.
- [x] 3.5 Historia del catálogo con datos sintéticos.

## 4. Verificación

- [x] 4.1 `ruff format --check`, `ruff check`, `mypy`, `pytest tests/test_instituciones.py tests/test_usuarios.py`.
- [x] 4.2 `bun run typecheck`, `lint`, `format:check`, `test`, `ui:check`, `tamanos`, `catalogo:build`.
- [x] 4.3 Captura de la pantalla en 1440 × 900.
