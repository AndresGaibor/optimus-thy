# Tasks

## 1. Backend

- [x] 1.1 Declarar `PERMISOS_ASIGNABLES_POR_ROL` en `app/security/permisos.py` y retirar `PERMISO_IRRENUNCIABLE_ADMIN`.
- [x] 1.2 Excluir el rol `admin` de `GET /roles` y añadir `asignables` a cada rol.
- [x] 1.3 Rechazar con 422 el cambio de permisos del rol `admin` y los códigos fuera del dominio del rol.
- [x] 1.4 Actualizar `tests/test_roles.py` al contrato nuevo (matriz sin admin, dominio, invariante por defecto ⊆ asignables ⊆ catálogo).
- [x] 1.5 Regenerar `contracts/openapi.json`: no cambia, las rutas usan `response_model=None`.

## 2. Interfaz

- [x] 2.1 Quitar el interruptor clavado y su nota de `RolesPage`; renderizar «no aplica» cuando el permiso no está en `asignables`.
- [x] 2.2 Actualizar `api/roles.ts`, los mocks y el texto informativo de la pantalla.
- [x] 2.3 Actualizar `test/roles-admin.test.tsx` y la historia `RolesPage.stories.tsx`: sin columna de administrador y sin casillas que no aplican.

## 3. Cierre

- [x] 3.1 Correr `pytest tests/test_roles.py tests/test_permisos.py`, `bun run test`, `typecheck`, `lint`, `ui:check`, `tamanos` y la historia del catálogo.
- [ ] 3.2 Archivar el change y desplegar por el flujo normal de PR.
