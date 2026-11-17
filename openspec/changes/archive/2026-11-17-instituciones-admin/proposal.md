# Proposal

## Why

La pantalla de Usuarios anunciaba «gestión de usuarios, roles e instituciones», pero la única ruta de instituciones era `GET /instituciones` (lectura de las activas). Crear o corregir una institución exigía acceso directo a la base de datos, y la tabla `instituciones` tenía `codigo` único y `activa` sin forma de mantenerse desde la aplicación.

## What Changes

- `POST /instituciones`: crea una institución activa con `nombre` y `codigo`; normaliza el código a mayúsculas y responde 409 si ya existe.
- `PATCH /instituciones/{id}`: actualiza `nombre`, `codigo` o `activa`; 409 si el código choca con otra institución.
- `GET /instituciones` admite `incluir_inactivas` y devuelve `activa` y `usuarios_activos` por institución.
- Nueva pantalla `/administrador/instituciones` con alta, edición, activación y desactivación; entrada «Instituciones» en la navegación del administrador.
- Regla de negocio: una institución con **usuarios activos** no se puede desactivar (409); hay que reasignarlos antes. No hay borrado: la institución se conserva por los usuarios y la auditoría que la referencian.

## Capabilities

### New Capabilities

- `gestion-de-instituciones`: mantenimiento de instituciones desde la administración, con código único, desactivación protegida y auditoría.

### Modified Capabilities

- `gestion-de-usuarios`: el listado de instituciones que alimenta el selector del filtro y el alta de usuario conserva su contrato y añade campos de solo lectura.

## Impact

- `backend/app/api/instituciones.py` (nuevo) y `backend/app/api/usuarios.py`.
- `backend/app/audit/actions.py`: acciones `INSTITUTION_CREATE`/`INSTITUTION_UPDATE` y objeto `INSTITUTION`.
- `contracts/openapi.json` y `frontend/src/api/schema.d.ts` regenerados.
- `frontend/src/api/instituciones.ts`, `frontend/src/pages/admin/InstitucionesPage.tsx`, `AppRoutes.tsx`, `layout/AppShell.tsx`.
- Permiso reutilizado: `usuario.gestionar`. Sin migraciones: la tabla ya tenía `codigo`, `activa` y `actualizado_en`.

## Fuera de alcance

- Borrado de instituciones y fusión de dos instituciones existentes.
- Reasignación masiva de usuarios entre instituciones.
