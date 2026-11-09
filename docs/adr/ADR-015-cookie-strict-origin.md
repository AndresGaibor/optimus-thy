# ADR-015 — Cookie SameSite=Strict y verificación de Origin

**Estado:** Aceptada.  
**Fecha:** 2026-11-09.

## Contexto

La sesión debe resistir CSRF y uso cross-site sin depender solo de `SameSite=Lax`, manteniendo compatibilidad con clientes no navegadores cuando corresponda.

## Decisión

La cookie de sesión se emite con `HttpOnly`, `Path=/`, sin `Domain`, `Secure` fuera de desarrollo y `SameSite=Strict`. Todo request que cambia estado (`POST`, `PUT`, `PATCH`, `DELETE`) con cabecera `Origin` debe traer un origen permitido en `ALLOWED_ORIGINS`; un origen distinto responde 403 sin ejecutar el caso de uso. Los clientes sin `Origin` (curl, pruebas) se evalúan por separado y no reciben la cookie cross-site.

## Consecuencias

- El frontend debe ser same-origin o estar listado en `ALLOWED_ORIGINS`.
- Se elimina la dependencia exclusiva de `SameSite=Lax`.
- La decisión se implementa en producción y se propone al académico en el PR de endurecimiento. Su verificación operativa/pruebas en el entorno desplegado queda como pendiente hasta ejecutar el corte y las comprobaciones correspondientes.