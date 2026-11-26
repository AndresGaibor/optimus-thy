# Proposal

## Why

Investigadores necesitan guardar los criterios de inclusión de una cohorte y reutilizarlos en consultas agregadas, sin mantener listas de pacientes ni duplicar los filtros entre pantallas.

## What Changes

- Añadir `CohorteInvestigacion`, con nombre único por institución y filtros tipados; la API lista, crea y borra cohortes acotadas al usuario autenticado.
- Reutilizar el criterio de selección de casos de investigación y aplicar los filtros de edad en memoria: el conjunto institucional se acota primero por SQL y la fecha de nacimiento permanece cifrada, sin índice consultable.
- La cohorte no permite filtrar por sexo: ese dato no se almacena en los modelos clínicos.
- Permitir que `/investigacion/metricas` aplique una cohorte propia de la institución.
- Reemplazar el placeholder `/investigador/cohortes` con una pantalla conectada a la API.

## Capabilities

### New Capabilities
- `cohortes-investigacion`: definición, reutilización y cómputo de métricas por cohortes institucionales.

## Impact

- Backend: modelo y migración `0024`, API de cohortes, filtrado compartido de criterios de cohorte y métricas.
- Frontend: cliente y página real bajo `/investigador/cohortes`.
- Tests: `backend/tests/test_cohortes.py` y `frontend/src/test/cohortes.test.tsx`.
