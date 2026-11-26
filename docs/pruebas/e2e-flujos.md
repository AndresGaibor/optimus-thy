# Recorridos E2E de flujos

Ejecuta desde `frontend`:

```sh
bun run e2e:flujos
```

El runner crea un build de producción y lo sirve con Vite Preview en un puerto libre. Chromium simula todas las respuestas bajo `/api/` con fixtures sintéticos; no necesita backend ni base de datos. `bun e2e/flujos.ts --ayuda` muestra opciones; `--base <url>` permite usar una aplicación ya servida.

Se recorren la atención médica (paciente, caso, inferencia y confianza con aviso de apoyo, no diagnóstico) y la investigación (métricas y filas de dataset desidentificado). Cada petición API debe tener fixture. Un flujo fallido produce código de salida distinto de cero.

En CI, `E2E flujos (Playwright)` instala Bun y Chromium y forma parte del gate `CI OK`.
