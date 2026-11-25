## Por qué

TES-371 · HU-074 pide explicar qué hace el modelo y cuáles son sus límites, y hoy el médico solo ve el resultado sin ese marco.

## Qué cambia

- `/medico/modelo`: cadena del modelo (detector, segmentador, clasificador), significado de Normal (sin nódulo), benigno y maligno, límites explícitos, qué se registra al decidir y qué queda en la bitácora.
- Bloque con el modelo en uso: nombre, versión, huella de pesos y fecha, leídos de la API; error solo en ese bloque.

## Impacto

- Contrato de API: sin cambios.
- Esquema: sin cambios.
- Sin cifras de rendimiento: no se muestran métricas que el sistema no tenga.
