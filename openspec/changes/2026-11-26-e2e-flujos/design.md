# Diseño: recorridos E2E médico e investigador

## Decisión

Reutilizar `playwright` instalado y el patrón de runner Bun de `frontend/e2e/capturar.ts`, sin añadir dependencias. Por defecto, el runner ejecuta `bun run build`, obtiene un puerto libre y lanza `bunx vite preview`; `--base <url>` permite apuntar a una app ya servida. Chromium ejecuta flujos secuenciales y aislados.

## Aislamiento

Cada página registra `page.route('**/api/**')`. Las sesiones, pacientes, caso, imagen, consentimiento, resultado, métricas y dataset provienen de `flujos.datos.ts`; las respuestas son sintéticas. Una petición API sin fixture falla el flujo. No se inicia backend ni base de datos. El runner cierra navegador y preview en `finally`, muestra una línea por recorrido y un resumen, y solo termina con código 0 si ambos pasan.

## Recorridos

- Médico: login; listado de pacientes; diálogo de detalle y apertura de caso; ejecución de análisis; resultado con confianza y texto que limita la IA a apoyo profesional, no diagnóstico.
- Investigador: login; métricas del modelo; lista y filas desidentificadas de un dataset.

Los localizadores y textos se toman de las páginas de login, pacientes, caso, resultados, métricas y datasets y de sus clientes API actuales. No se agregan selectores a la aplicación.

## Integración

Un job con Bun, cache de Bun y Chromium instala dependencias, Chromium y ejecuta `bun run e2e:flujos` cuando cambia el frontend. El resultado forma parte del gate `CI OK`. La capacidad OpenSpec elegida es `marco-de-aplicacion`, por el recorrido autenticado y la navegación entre áreas.
