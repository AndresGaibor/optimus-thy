# ADR-003 — OpenAPI como contrato canónico

- **Estado:** Aceptada
- **Fecha:** 2026-09-15
- **Responsable:** Andrés
- **Issue Linear:** TES-4

## Contexto

El repositorio de referencia presenta representaciones incompatibles del paciente entre DDL, DTOs/entidades Python y schema frontend. Mantener contratos HTTP duplicados manualmente aumenta el riesgo de repetir esa divergencia.

## Alternativas consideradas

1. Mantener DTO equivalentes manualmente en Python y TypeScript.
2. Compartir modelos internos entre capas y lenguajes.
3. Usar FastAPI/OpenAPI como contrato HTTP canónico y generar tipos/cliente TypeScript.

## Decisión

FastAPI/OpenAPI será la fuente del contrato HTTP; el frontend generará tipos y cliente a partir del esquema expuesto.

## Justificación

Reduce duplicación y hace detectable cualquier cambio de contrato entre backend y frontend.

## Consecuencias

- Los modelos internos de dominio no tienen que coincidir con modelos HTTP.
- Cambios de API deben regenerar/validar los tipos del frontend.
- CI debe detectar incompatibilidades del contrato cuando se implemente esa automatización.

## Evidencia

- Linear: TES-4.
- Registro académico: pestaña `Decisiones` del Sheet Tesis.