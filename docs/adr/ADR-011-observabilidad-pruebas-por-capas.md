# ADR-011 — Observabilidad ligera y pruebas por capas

- **Estado:** Aceptada
- **Fecha:** 2026-09-15
- **Responsable:** Andrés
- **Issue Linear:** TES-4

## Contexto

La tesis necesita evidencia reproducible y capacidad de diagnosticar fallos, pero desplegar desde la primera ola un stack completo de tracing/métricas añade complejidad sin una necesidad demostrada.

## Alternativas consideradas

1. Sin observabilidad explícita durante desarrollo.
2. Stack completo de métricas, tracing y dashboards desde el inicio.
3. Observabilidad ligera + estrategia de pruebas por capas.

## Decisión

Implementar inicialmente logs estructurados, `request_id`, `job_id`, endpoint `/health`, duración/estado de trabajos y pruebas unitarias, integración, API, frontend y E2E críticos. Benchmarks OCR/IA se mantienen separados.

## Justificación

Entrega evidencia suficiente para depuración, manual técnico y metodología sin sobrecargar la Ola 1.

## Consecuencias

- La observabilidad puede crecer si pruebas/carga revelan la necesidad.
- La Definition of Done debe exigir pruebas acordes al riesgo del cambio.
- Evidencias de test deben registrar versión/commit y entorno cuando sea relevante.

## Evidencia

- Linear: TES-4.
- Registro académico: pestaña `Decisiones` del Sheet Tesis.