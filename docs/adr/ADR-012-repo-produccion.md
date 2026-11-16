# ADR-012 — Repo de producción separado del académico

**Estado:** Aceptada.  
**Fecha:** 2026-11-09.  
**Actualizada:** 2026-11-16.  
**Origen:** snapshot del repositorio académico `AndresGaibor/optimus`, commit `66e5b8d`.

## Contexto

El repo académico conserva tesis, requisitos, backlog y evidencia. El repo de producción conserva el software que se despliega en `tiroides2.andresgaibor.com`. El segundo nace como copia exacta del primero y solo se separa por decisiones de operación y endurecimiento.

## Decisión

`optimus` (académico) conserva tesis, requisitos, backlog y evidencia. `optimus-thy` (producción) es el repo de entrega y producción, creado como snapshot del commit académico `66e5b8d` con historia raíz propia.

Producción es la fuente del software: las implementaciones se construyen aquí y se entregan de forma progresiva y selectiva al académico, en pull requests separados adaptados a la base de datos y los módulos del repo destino; ningún cambio se copia entre repos sin revisión.

La divergencia es esperada y permanente, no un defecto a corregir: esquema y migraciones de base de datos, módulos, configuración y dependencias evolucionan a distinto ritmo en cada repo. Cada repo mantiene su propia raíz `openspec/` y sus especificaciones.

## Consecuencias

- El repo de producción no hereda la historia académica; el bundle previo queda fuera del árbol.
- La sincronización es explícita y auditada, no automática.
- Las migraciones de Alembic y los módulos no se asumen equivalentes entre repos: no se reutiliza una migración ni un diff sin adaptarlo al esquema de destino.
- La entrega al académico se registra como pull request que cita requisito, historia e issue de Linear.
