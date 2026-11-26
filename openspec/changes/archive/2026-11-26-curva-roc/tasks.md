# Tareas

## 1. Sistema de diseño

- [x] 1.1 Historia `RocCurve.stories.tsx` (curva normal y sin puntos) que falle porque el componente no existe.
- [x] 1.2 `RocCurve.tsx`: misma geometría que `RocPlot`, trazos por token, AUC como texto y tabla equivalente en `<details>`; exportado en el barril.
- [x] 1.3 `ProbabilityDistribution.tsx` y su historia: barras agrupadas por intervalo, leyenda escrita, recuento visible y tabla equivalente plegable.

## 2. Pantalla

- [x] 2.1 `RocScreen.tsx` consume los dos organismos y pierde el SVG inline; conserva título, descripción, AUC, leyenda y nota sintética.
- [x] 2.2 Actualizar `RocScreen.stories.tsx` si existe, con los estados reales.

## 3. Verificación

- [x] 3.1 `cd frontend && bun run ui:check && bun run tamanos && bun run typecheck && bun run format:check && bun run lint`
- [x] 3.2 `cd frontend && bunx vitest run --project=storybook src/design-system/components/organisms src/screens/researcher`
- [x] 3.3 Captura revisada con `bun run capturar --solo aplicación-investigador-curva-roc--buen-desempeno`: curva en color de marca, diagonal punteada, leyenda y tabla plegable visibles.
