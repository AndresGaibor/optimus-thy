# ADR-009 — Separación de PII del paciente

- **Estado:** Aceptada
- **Fecha:** 2026-09-15
- **Responsable:** Andrés
- **Issue Linear:** TES-4 / TES-6

## Contexto

El DDL de referencia separa `pacientes.pacientes` de `pacientes.identidad_paciente`, mientras otros modelos mezclan identidad y datos clínicos. El proyecto debe reducir exposición innecesaria de información personal y permitir investigación con datos desidentificados.

## Alternativas consideradas

1. Mantener PII y datos clínicos en una única representación.
2. Cifrar campos aislados sin separar responsabilidades.
3. Separar identidad sensible del registro clínico operacional y generar proyecciones desidentificadas para investigación.

## Decisión

Separar PII del paciente de la información clínica operacional. El módulo de investigación consumirá proyecciones desidentificadas según permisos y consentimiento aplicables.

## Justificación

Aplica privacidad por diseño, limita exposición accidental y facilita controlar qué información necesita cada módulo.

## Consecuencias

- Los casos de uso deben resolver identidad solo cuando sea necesaria.
- Búsquedas por identificadores personales requieren un tratamiento específico.
- Logs, pruebas y datasets de investigación no deben exponer PII innecesaria.

## Evidencia

- Linear: TES-4, TES-6.
- Registro académico: pestaña `Decisiones` del Sheet Tesis.