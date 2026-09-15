# ADR-002 — Clean Architecture modular por capacidad

- **Estado:** Aceptada
- **Fecha:** 2026-09-15
- **Responsable:** Andrés
- **Issue Linear:** TES-4

## Contexto

El backend de referencia materializa solo parte de las capas de dominio y aplicación. Una jerarquía global por capas puede dificultar la evolución de capacidades independientes como autenticación, pacientes, documentos, imágenes, inferencia, investigación y auditoría.

## Alternativas consideradas

1. Jerarquía global única por capas.
2. Organización por capacidad sin límites arquitectónicos.
3. Clean Architecture modular por capacidad.

## Decisión

Organizar el backend por capacidades (`auth`, `patients`, `documents`, `imaging`, `inference`, `research`, `audit`) con límites `domain`, `application`, `infrastructure` y `api` cuando correspondan.

## Justificación

Reduce acoplamiento, facilita pruebas aisladas y evita asumir que la estructura parcial del repositorio de referencia ya constituye una arquitectura terminada.

## Consecuencias

- Cada módulo debe respetar sus límites y puertos.
- Puede existir algo de repetición estructural a cambio de claridad.
- Facilita sustituir infraestructura sin modificar casos de uso.

## Evidencia

- Linear: TES-4.
- Registro académico: pestaña `Decisiones` del Sheet Tesis.