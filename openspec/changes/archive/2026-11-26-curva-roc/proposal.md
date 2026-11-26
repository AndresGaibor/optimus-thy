# Propuesta: curva ROC y distribución de probabilidades con tabla equivalente

## Por qué

HU-097 (TES-374) pide que el investigador vea la curva ROC y la distribución de probabilidades,
y que cada gráfico tenga una tabla equivalente accesible. La pantalla
`/investigador/roc` (`frontend/src/screens/researcher/RocScreen.tsx`) ya dibuja ambas figuras con
datos sintéticos, pero no ofrece tabla equivalente y su SVG vive fuera del sistema de diseño.

## Qué cambia

- Dos organismos nuevos en `frontend/src/design-system/`: `RocCurve` y `ProbabilityDistribution`,
  con la geometría que ya usa `RocScreen`, tokens en vez de colores literales y tabla equivalente
  en un `<details>`.
- `RocScreen` consume los organismos y pierde su SVG inline; conserva textos, AUC, leyenda y aviso
  de datos sintéticos.
- Historias CSF3 de ambos organismos, con `tags: ['ai-generated']`.

## Qué no cambia

- No se calcula ROC en el backend: los datos siguen siendo de la fixture de demostración y la
  pantalla sigue declarando que no son métricas reales.
- No se toca `ModelMetrics` ni la consulta de acuerdo.

## Alcance

Sistema de diseño y pantalla de investigación. Sin migraciones, sin API nueva.
