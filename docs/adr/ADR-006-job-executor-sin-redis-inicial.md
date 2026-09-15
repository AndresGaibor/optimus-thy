# ADR-006 — Ejecutor de trabajos simple, sin Redis inicialmente

- **Estado:** Aceptada
- **Fecha:** 2026-09-15
- **Responsable:** Andrés
- **Issue Linear:** TES-4

## Contexto

OCR e inferencia IA no deben bloquear requests HTTP, pero introducir Redis/RQ desde la primera ola añade infraestructura antes de validar carga real. El estado de los trabajos sí debe sobrevivir reinicios.

## Alternativas consideradas

1. Ejecutar OCR/IA dentro del request HTTP.
2. Introducir Redis/RQ desde el inicio.
3. Usar un `JobExecutor` reemplazable con implementación inicial en memoria y estado durable en PostgreSQL.

## Decisión

Usar inicialmente `InMemoryJobExecutor`; PostgreSQL conserva estados durables como `queued`, `running`, `succeeded`, `failed` y `cancelled`.

## Justificación

Permite validar el flujo asíncrono con menos infraestructura y conserva un puerto que puede migrar a Redis/RQ u otra cola cuando exista evidencia de necesidad.

## Consecuencias

- El proceso ejecutor inicial no es una solución de alta disponibilidad.
- Reinicios requieren reconciliar trabajos durables pendientes.
- La sustitución futura no debe alterar los casos de uso ni el contrato externo.

## Evidencia

- Linear: TES-4.
- Registro académico: pestaña `Decisiones` del Sheet Tesis.