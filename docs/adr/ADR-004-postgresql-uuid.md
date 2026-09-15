# ADR-004 — PostgreSQL durable + UUID

- **Estado:** Aceptada
- **Fecha:** 2026-09-15
- **Responsable:** Andrés
- **Issue Linear:** TES-4 / TES-6

## Contexto

La referencia mezcla identificadores `int` y UUID y conserva parte del estado de manera no durable. El sistema necesita consistencia entre pacientes, usuarios, documentos, imágenes y trabajos asíncronos.

## Alternativas consideradas

1. Identificadores enteros autoincrementales.
2. Mezcla de enteros y UUID según módulo.
3. UUID para entidades principales con PostgreSQL como fuente durable.

## Decisión

PostgreSQL será la fuente durable de verdad y las entidades principales usarán UUID.

## Justificación

Unifica contratos, evita colisiones entre módulos y facilita desacoplar almacenamiento e integración futura sin exponer secuencias internas.

## Consecuencias

- Migraciones y APIs deben mantener el mismo tipo de identificador.
- Seeds y fixtures deben generar UUID reproducibles cuando sea necesario.
- La decisión no obliga a que toda tabla auxiliar use UUID si existe una razón técnica documentada.

## Evidencia

- Linear: TES-4, TES-6.
- Registro académico: pestaña `Decisiones` del Sheet Tesis.