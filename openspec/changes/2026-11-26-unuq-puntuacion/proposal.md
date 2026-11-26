# Proposal

## Why

TES-335 (HT-110) exige medir la usabilidad con el UnUQ aplicando la fórmula del artículo, pero el cálculo implementado no la sigue: usa `(Σ respuestas / (22 × 5)) × 100` y no invierte los siete ítems negativos (S3, S6, S8, S13, S16, S18, S22). Con esa fórmula una respuesta uniforme de 3 puntos da 60 en lugar de 50, y un evaluador que puntúa 5 en un ítem negativo suma como si fuera a favor. El resultado de la pantalla no es comparable con la escala publicada y no se puede citar en la tesis.

Además, la evaluación no tiene material operativo: el protocolo, el consentimiento y las tareas existen solo como pantalla de demostración con datos sintéticos, sin hoja de respuestas ni instrucciones para aplicarla a diez evaluadores.

## What Changes

- Corregir `calcularPuntajeUnuq` y `resumirAtributosUnuq` para calcular la contribución de cada ítem (0–4), invertir los siete ítems negativos y normalizar sobre 88 con el factor 100/88 del artículo.
- Mostrar en `UnuqResult` la fórmula corregida, la suma de contribuciones y el promedio por atributo en escala 0–4.
- Eliminar la copia muerta del UnUQ en `frontend/src/screens/fixtures/casos-extra.ts`, que define el mismo concepto con otra fórmula y nadie importa.
- Añadir pruebas de la puntuación: extremos, respuestas uniformes, efecto de la inversión y desglose por atributo.
- Añadir el kit de evaluación en `docs/pruebas/unuq/`: protocolo, consentimiento informado, tareas por rol, cuestionario de 22 ítems, hoja de respuestas y reglas de cálculo y análisis con la escala descriptiva del artículo.

## Capabilities

### New Capabilities
- `puntuacion-unuq`: cálculo del instrumento UnUQ conforme al artículo, con ítems negativos invertidos y desglose por los siete atributos.

### Modified Capabilities
- Ninguna: no cambia contrato de API, esquema de base de datos ni comportamiento de módulos del producto; la pantalla de estudio sigue siendo material académico sin persistencia.

## Impact

Toca `frontend/src/screens/fixtures/unuq-extra.ts`, `frontend/src/screens/researcher/UnuqResult.tsx` y `frontend/src/screens/fixtures/casos-extra.ts`; añade pruebas y documentación. No modifica el backend, la base de datos ni la inferencia. Las respuestas siguen sin guardarse: la sesión real se registra en la hoja CSV del kit.
