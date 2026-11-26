# Proposal

## Why

RF-INV-07 exige separar falsos positivos y falsos negativos, pero `decisiones_medicas` solo guardaba `acepta | corrige | descarta`. Con «corrige» no se sabe a qué resultado corrigió el médico, así que un falso positivo (dijo maligno, era benigno) es indistinguible de un falso negativo (dijo benigno, era maligno). Sin ese dato no hay análisis de errores ni indicador de calidad del modelo.

## What Changes

- Añadir `decisiones_medicas.resultado_corregido` (`benigno | maligno | sin_nodulo`, nullable) con restricción `CHECK`, mediante la migración `0022`.
- Exigir `resultado_corregido` cuando `decision = corrige`, rechazarlo en `acepta` y `descarta`, y responder 422 `correccion_sin_cambio` si coincide con el resultado del modelo.
- Devolver `resultado` (del modelo) y `resultado_corregido` en la decisión registrada y en su lectura.
- Añadir `GET /investigacion/errores` con el permiso `investigacion.leer`: clasifica cada corrección en falso positivo o falso negativo, con conteos, filtros por tipo, modelo y rango de fechas, y paginación.
- Registrar la consulta en la bitácora como `INFERENCE.INFERENCE_READ`.
- Pantalla `/investigador/errores` con el reparto de errores, filtro por tipo y tabla de correcciones, enlazada en el menú.

## Capabilities

### New Capabilities

- `analisis-errores`: clasificación de falsos positivos y negativos a partir de la corrección médica, con consulta filtrada y registro.

### Modified Capabilities

- `decision-medica`: la corrección exige y guarda el resultado clínico correcto.

## Non-Goals

- No modifica la inferencia: sigue siendo inmutable.
- No calcula sensibilidad ni especificidad: eso es `metricas-modelo`.
- No corrige decisiones ya registradas sin `resultado_corregido`: quedan fuera del análisis y la UI no las muestra.
