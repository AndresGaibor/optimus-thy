# Propuesta: recorridos E2E médico e investigador

## Contexto

Los recorridos de navegación entre autenticación, pacientes, inferencia y herramientas de investigación no tienen una comprobación automatizada de navegador en CI. Las páginas usan la API real del producto, por lo que el E2E debe aislarse de servicios y datos persistentes.

## Cambio propuesto

Añadir un runner Playwright que construya la aplicación de producción, la sirva con Vite Preview y simule `**/api/**` con fixtures sintéticos. El recorrido médico autenticará, abrirá un paciente y un caso, ejecutará una inferencia y comprobará confianza y el aviso de apoyo, no diagnóstico. El investigador consultará métricas y filas de un dataset desidentificado. El job correrá en CI y será parte del gate final.

## Fuera de alcance

No se modifican páginas de producto, API, backend, base de datos, dependencias ni datos reales. No se amplía el catálogo de historias.

## Criterio de éxito

`bun run e2e:flujos` completa ambos recorridos con API simulada, devuelve código distinto de cero ante fallos y el job E2E participa en el gate final de CI.
