# Propuesta: curva ROC y distribución de probabilidades

## Por qué

HU-097 (TES-374) pide que el investigador evalúe el modelo de forma visual: curva ROC y
distribución de probabilidades, cada gráfico con una tabla equivalente accesible. Hoy
`/investigador/metricas` muestra la tabla de acuerdo, la matriz de confusión y las barras de
tendencia, pero no la curva ROC ni cómo se reparten las probabilidades entre clases.

## Qué cambia

- Dos organismos nuevos en `frontend/src/design-system/`:
  - `RocCurve`: curva ROC con AUC, diagonal de referencia y tabla equivalente plegable.
  - `ProbabilityDistribution`: barras agrupadas por intervalo de probabilidad para benigno y
    maligno, con leyenda y tabla equivalente plegable.
- Fixtures sintéticos de la pantalla investigadora con puntos de ROC y recuentos por intervalo.
- `ModelMetrics` incorpora ambas figuras bajo su sección de métricas, con el aviso de que son
  datos sintéticos de demostración y no validación clínica.

## Qué no cambia

- No se calcula ROC en el backend: no hay conjunto etiquetado de validación y el sistema no
  presenta métricas de validación clínica. Los datos son de la fixture de demostración.
- No se toca la consulta de acuerdo ni sus permisos.

## Alcance

Interfaz de la navegación investigadora y sistema de diseño. Sin migraciones, sin API nueva.
