# Proposal

## Why

El endpoint exige un total de casos igual o superior a `k`, pero esa condición no garantiza que cada combinación publicada de cuasi-identificadores tenga al menos `k` filas. La creación debe rechazar clases pequeñas y comunicar el mínimo efectivo sin revelar sus valores.

## What Changes

- Definir una clave de equivalencia con los atributos de baja cardinalidad que publica la fila anonimizada.
- Rechazar la creación con `k_no_alcanzado` e indicar cuántas clases incumplen el umbral, sin exponer filas ni valores.
- Incluir `k_efectivo`, el mínimo de filas por clase, en la respuesta del dataset.
- Añadir pruebas sintéticas y actualizar el análisis de riesgo.

## Capabilities

### New Capabilities

<!-- No se introduce una capacidad nueva. -->

### Modified Capabilities

- `consulta-datasets`: exigir y exponer el k efectivo por clase de equivalencia.

## Non-Goals

- Cambiar los campos, tipos o transformaciones de la fila anonimizada.
- Generalizar atributos sensibles de investigación.
- Estimar el riesgo residual de reidentificación sobre datos reales.
