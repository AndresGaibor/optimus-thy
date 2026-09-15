# ADR-007 — Sesiones opacas en PostgreSQL

- **Estado:** Aceptada
- **Fecha:** 2026-09-15
- **Responsable:** Andrés
- **Issue Linear:** TES-4 / TES-7

## Contexto

La aplicación maneja información clínica y necesita revocación clara, auditoría y control de sesión. El login del repositorio de referencia es simulado y no constituye una estrategia de seguridad.

## Alternativas consideradas

1. JWT persistido en `localStorage`.
2. JWT en cookie.
3. Sesiones opacas persistidas en PostgreSQL.

## Decisión

Usar sesiones opacas persistidas en PostgreSQL y cookie `HttpOnly`, `Secure` y `SameSite`. Las contraseñas se almacenan mediante Argon2id.

## Justificación

Favorece revocación, trazabilidad y gestión simple de sesiones en una aplicación web centralizada.

## Consecuencias

- El backend debe validar sesión en cada request protegido.
- Deben implementarse expiración y revocación.
- El frontend no debe almacenar tokens sensibles accesibles desde JavaScript.

## Evidencia

- Linear: TES-4, TES-7.
- Registro académico: pestaña `Decisiones` del Sheet Tesis.