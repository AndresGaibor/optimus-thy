# ADR-001 — Monorepo modular

- **Estado:** Aceptada
- **Fecha:** 2026-09-15
- **Responsable:** Andrés
- **Issue Linear:** TES-4

## Contexto

OPTIMUS-THY requiere coordinar frontend, API, procesamiento asíncrono, contratos, infraestructura y documentación entre dos tesistas. El repositorio de referencia mezcla componentes incompletos y no debe copiarse como estructura canónica.

## Alternativas consideradas

1. Repositorios separados por componente.
2. Monorepo plano sin límites claros.
3. Monorepo modular con límites explícitos.

## Decisión

Usar un único repositorio con `apps/web`, `apps/api`, `services/worker` como límite preparado para procesamiento futuro, `packages/contracts`, `infra` y `docs`.

## Justificación

Simplifica coordinación, CI y trazabilidad entre issue, código y documentación, manteniendo responsabilidades separadas por carpeta.

## Consecuencias

- Facilita cambios coordinados frontend/backend.
- Exige mantener límites entre módulos para evitar un monolito desordenado.
- Permite centralizar ADR, pruebas y documentación técnica.

## Evidencia

- Linear: TES-4.
- Registro académico: pestaña `Decisiones` del Sheet Tesis.