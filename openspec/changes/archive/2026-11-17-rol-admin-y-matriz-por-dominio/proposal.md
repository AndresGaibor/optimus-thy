# Proposal

## Why

La matriz de `/administrador/roles` muestra el rol `admin` como editable y ofrece, para cada rol, los 17 permisos del catálogo, incluidos los que no tienen sentido para ese rol (por ejemplo, `usuario.gestionar` para `researcher`). Editar el rol `admin` solo puede degradar la administración, y los permisos cruzados entre dominios (clínico, investigación, administración) invitan a conceder de más. La decisión D22 mantiene al administrador sin datos clínicos salvo que active otro rol, así que el rol `admin` no puede recibir los 17 permisos.

## What Changes

- El rol `admin` deja de listarse en `GET /roles` y `PUT /roles/{id}/permisos` lo rechaza con 422: sus permisos son fijos.
- Cada rol declara los permisos que le aplican (`asignables`) y la matriz solo muestra esos interruptores; el resto de celdas se muestra como «no aplica».
- `PUT /roles/{id}/permisos` rechaza con 422 cualquier permiso fuera del dominio del rol.
- Se retira el permiso irrenunciable del administrador, que deja de tener sentido cuando el rol ya es inmutable.

## Capabilities

### New Capabilities

- `administracion-roles`: matriz de permisos por rol con dominios fijos y rol administrador inmutable.

### Modified Capabilities

Ninguna.

## Impact

- `backend/app/api/roles.py`, `backend/app/security/permisos.py`, `backend/tests/test_roles.py`.
- `frontend/src/pages/admin/RolesPage.tsx`, `frontend/src/api/roles.ts`, `frontend/src/test/roles-admin.test.tsx` y `frontend/src/api/schema.d.ts`.
- `contracts/openapi.json` (campo aditivo `asignables`).
- Sin migraciones ni cambios de datos: la matriz sembrada ya cumple los dominios.
