# Design

## Context

`FichaClinica` es la ficha única por caso y ya dispone de control de cambios mediante `FichaVersion`. No hay aún estado de cierre ni endpoints de edición/cierre; la pantalla de caso carga datos desde `CasoPage.tsx` y la API utiliza permisos basados en `requiere_permiso`.

## Goals / Non-Goals

**Goals:** persistir el estado de cierre y su actor, exponer transiciones con el permiso existente, impedir ediciones posteriores hasta reabrir y dar confirmación accesible en el caso.

**Non-Goals:** cerrar el caso clínico ni modificar la identidad del paciente, permisos o políticas de roles.

## Decisions

- Añadir `cerrada_en` y `cerrada_por_id` a `FichaClinica`; `cerrada_por_id` referencia al usuario y acepta nulo cuando la ficha está abierta o si el usuario se elimina.
- Incorporar `POST /casos/{caso_id}/ficha/cerrar` y `POST /casos/{caso_id}/ficha/reabrir` en `backend/app/api/fichas.py`. Ambos usan `ficha.escribir`, verifican institución y estado antes de persistir; el cierre no crea una ficha si todavía no existe.
- Comprobar el estado de cierre dentro de la ruta de guardado de ficha y responder `409` con `ficha_cerrada`; cierre, reapertura y edición se serializan bloqueando la fila padre del caso.
- Registrar acciones diferenciadas de cierre y reapertura con `AuditModule.PATIENTS` y referencia al caso; los detalles contienen solo el nombre de la transición.
- Exponer el estado de cierre mediante `GET /casos/{caso_id}/ficha`; la página ofrece la acción inversa y confirma la transición con el `Dialog` existente.

## Risks / Trade-offs

- Una ficha cerrada no puede editarse hasta reabrirla; el permiso existente permite tanto edición como reapertura, según el requerimiento.
- La ruta `GET` debe informar ficha inexistente sin crearla; las acciones de cierre lo tratan como `404`.
