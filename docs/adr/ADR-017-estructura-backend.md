# ADR-017 — Estructura del backend de producción

**Estado:** Aceptada. Reemplaza ADR-002.  
**Fecha:** 2026-11-09.

## Contexto

El backend del snapshot académico usa una organización modular por capacidad con capas ligeras, distinta de la separación estricta `domain/application/infrastructure/api` planteada originalmente.

## Decisión

Producción adopta la estructura modular plana del académico: `backend/app/api`, `auth`, `audit`, `jobs`, `models`, `security`, `storage`, `config.py`, `db.py`, `main.py`. Las dependencias se ordenan por módulo, pero no se impone la separación estricta `domain/application/infrastructure/api` de TES-4.

## Consecuencias

- Se evita un refactor no solicitado antes de la entrega.
- Si en el futuro se justifica, el cambio se hará con ADR nueva y migración gradual; no se reescribe este registro para ocultar la diferencia.