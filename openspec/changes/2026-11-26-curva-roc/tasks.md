# Tareas

## 1. Sistema de diseño

- [ ] 1.1 Escribir `RocCurve.stories.tsx` (valores normales y curva vacía) y hacer que falle con `bun run ui:check` porque el componente no existe.
- [ ] 1.2 Implementar `src/design-system/components/organisms/RocCurve.tsx` con cinco secciones JSDoc, SVG en `currentColor`, AUC como texto y tabla equivalente en `<details>`; exportarlo en el barril.
- [ ] 1.3 Implementar `ProbabilityDistribution.tsx` y su historia con el mismo criterio: barras agrupadas, leyenda escrita y tabla equivalente plegable.

## 2. Pantalla investigadora

- [ ] 2.1 Añadir a `fixtures/types.ts` y `fixtures/researcher.ts` los puntos de ROC y los intervalos de probabilidad sintéticos.
- [ ] 2.2 Integrar ambas figuras en `ModelMetricsSections.tsx` y pasarlas desde `ModelMetrics.tsx` sin superar 220 líneas.
- [ ] 2.3 Cubrir los estados: carga, vacío, error y listo en las historias de `ModelMetrics`.

## 3. Verificación

- [ ] 3.1 `cd frontend && bun run ui:check && bun run tamanos && bun run typecheck && bun run lint`
- [ ] 3.2 `cd frontend && bunx vitest run --project=storybook src/screens/researcher src/design-system/components/organisms`
- [ ] 3.3 Abrir la previsualización (`bun run capturar --base http://127.0.0.1:6114`) y revisar el PNG de las figuras.
