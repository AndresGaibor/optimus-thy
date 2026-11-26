# Tareas

- [x] Corregir `calcularPuntajeUnuq` y `resumirAtributosUnuq` en `frontend/src/screens/fixtures/unuq-extra.ts`: contribución 0–4, inversión de S3, S6, S8, S13, S16, S18 y S22, normalización sobre 88 y fórmula publicada en `unuqFormula`. Verificar con las pruebas nuevas.
- [x] Actualizar `frontend/src/screens/researcher/UnuqResult.tsx` para mostrar la suma de contribuciones, la fórmula corregida y el promedio por atributo en escala 0–4. Verificar con `bun run typecheck` y la historia del catálogo.
- [x] Eliminar las definiciones UnUQ muertas de `frontend/src/screens/fixtures/casos-extra.ts` (tipos, ítems, respuestas, funciones y el barril `casosExtraFixtures`). Verificar con `grep` de importadores y `bun run typecheck`.
- [x] Añadir `frontend/src/screens/fixtures/unuq-extra.test.ts` con extremos, punto medio, inversión de ítems negativos y desglose por atributo. Verificar con `bunx vitest run --project=app src/screens/fixtures/unuq-extra.test.ts`.
- [x] Crear el kit en `docs/pruebas/unuq/`: `LEEME.md`, `consentimiento-informado.md`, `tareas-por-rol.md`, `cuestionario-22-items.md`, `calculo-y-analisis.md` y `hoja-de-respuestas.csv`. Verificar que los 22 ítems y la clave de inversión coinciden con `unuq-extra.ts`.
- [x] Registrar el defecto de la fórmula anterior como ERR-021 en `docs/pruebas/registro-de-errores.md` y actualizar la línea del UnUQ en `docs/pruebas/evidencias-resultados.md`.
- [x] Pasar el gate de UI y tipos: `bun run typecheck`, `bun run lint`, `bun run ui:check`, `bun run tamanos`.
