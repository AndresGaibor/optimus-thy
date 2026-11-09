# ADR-012 — Repo de producción separado del académico

**Estado:** Aceptada.  
**Fecha:** 2026-11-09.  
**Origen:** snapshot del repositorio académico `AndresGaibor/optimus`, commit `66e5b8d`.

## Contexto

El repo académico conserva tesis, requisitos, backlog y evidencia. El repo de producción conserva el software que se despliega en `tiroides2.andresgaibor.com`. El segundo nace como copia exacta del primero y solo se separa por decisiones de operación y endurecimiento.

## Decisión

`optimus` conserva tesis, requisitos, backlog y evidencia. `optimus-thy` es el repo de entrega y producción, creado como snapshot del commit académico `66e5b8d` con historia raíz propia. Las correcciones que nazcan en producción se preparan como PR separado contra el académico; ningún cambio se copia entre repos sin revisión.

## Consecuencias

- El repo de producción no hereda la historia académica; el bundle previo queda fuera del árbol.
- La sincronización es explícita y auditada, no automática.