# ADR-008 — Un rol real y vista operativa del administrador

- **Estado:** Aceptada
- **Fecha:** 2026-09-15
- **Responsable:** Andrés
- **Issue Linear:** TES-4 / TES-7

## Contexto

El prototipo de referencia permite seleccionar rol desde la interfaz, lo que no representa autorización real. OPTIMUS-THY necesita permisos simples y trazabilidad del actor efectivo.

## Alternativas consideradas

1. Multirol general para todos los usuarios.
2. Selección libre de rol desde frontend.
3. Un rol real por usuario y vistas operativas controladas para administrador.

## Decisión

Cada usuario tiene un solo rol real: médico, investigador o administrador. Un administrador puede entrar a una vista operativa equivalente a médico/investigador sin cambiar su identidad administrativa ni sus eventos de auditoría.

## Justificación

Simplifica autorización, evita autoconcesión de privilegios y preserva quién ejecutó realmente cada operación.

## Consecuencias

- El backend sigue siendo la autoridad de permisos.
- La UI puede adaptar navegación, pero ocultar controles no reemplaza autorización.
- Auditoría debe conservar identidad y rol real del actor.

## Evidencia

- Linear: TES-4, TES-7.
- Registro académico: pestaña `Decisiones` del Sheet Tesis.