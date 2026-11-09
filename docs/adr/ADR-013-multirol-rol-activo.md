# ADR-013 — Multirol con rol activo auditado

**Estado:** Aceptada. Reemplaza ADR-008.  
**Fecha:** 2026-11-09.

## Contexto

La implementación real permite que un usuario tenga más de un rol y que el acceso efectivo dependa de un contexto de sesión auditable, en lugar de un único rol “real” por usuario.

## Decisión

Un usuario puede tener varios roles (`usuarios_roles`). La autorización usa el rol activo de la sesión (`sesiones.rol_activo_id`) y la matriz `roles_permisos`; cada cambio de rol activo queda auditado. El rol administrador no concede por sí solo acceso clínico: para ver datos clínicos debe cambiar a un rol médico o investigador, y el evento conserva la identidad real del actor.

## Consecuencias

- Se elimina la noción de “un rol real por usuario”.
- Los permisos se evalúan por `recurso:accion`, no por nombre de rol.
- La UI puede ocultar navegación, pero el backend sigue siendo la autoridad.