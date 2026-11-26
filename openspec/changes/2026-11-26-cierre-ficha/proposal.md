# Proposal

## Why

Una ficha sin estado de cierre puede seguir recibiendo cambios después de considerarse finalizada, y no queda constancia de quién la cerró o reabrió. Un cierre controlado evita ediciones posteriores y permite reabrir la ficha únicamente con el permiso de escritura ya existente.

## What Changes

- Guardar en la ficha la fecha y el usuario que la cerraron.
- Añadir acciones autenticadas para cerrar y reabrir; rechazar con `409` y un código estable los cambios de una ficha cerrada.
- Auditar cierre y reapertura, y ofrecer en la pantalla del caso controles con confirmación accesible.

## Capabilities

### New Capabilities
- `cierre-ficha`: estado de cierre de la ficha y control de sus transiciones.

### Modified Capabilities

## Impact

Afecta el modelo de ficha y su migración, la API de fichas y el panel clínico de caso. Reutiliza `ficha.escribir`, las sesiones y la bitácora actuales; no introduce dependencias.
