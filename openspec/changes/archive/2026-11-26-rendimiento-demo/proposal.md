# Proposal

## Why

La demostración carece de una medición repetible de rendimiento del stack y de evidencia que identifique el hardware que produjo los resultados. Sin esos datos, los tiempos no permiten comparar ejecuciones ni distinguir una referencia de servidor de una medición en la laptop de demostración.

## What Changes

- Añadir un procedimiento automatizado que levanta un proyecto Compose aislado, carga datos sintéticos, espera `/health` y mide latencias, memoria y arranque en frío.
- Generar un informe fechado con p50, p95, p99, recursos y procedencia del entorno, dejando explícita la limitación de no medir inferencia real sin pesos.
- Documentar cómo repetir y cómo interpretar resultados según hardware, disco y red.

## Capabilities

### New Capabilities
- `medicion-rendimiento`: ejecución reproducible de una medición integral del stack y publicación de evidencia contextualizada.

### Modified Capabilities
- Ninguna.

## Impact

Añade `tests/rendimiento/medir.sh` y documentación bajo `docs/operacion/`; ejecuta Docker Compose con un proyecto temporal separado y utiliza el seed sintético existente de backend. No modifica servicios ni datos del despliegue habitual.
