# Estrategia de releases — OPTIMUS-THY

Este documento define cómo versionar hitos demostrables del producto sin confundir cada merge con una release.

## Principio

Una release representa un estado del sistema que puede demostrarse, probarse y relacionarse con un hito académico. No se crea una release solo porque una tarea terminó.

## Releases planificadas

| Versión | Fecha objetivo | Propósito |
|---|---:|---|
| `v0.1.0` | 2026-09-27 | Cierre de Ola 1: base técnica, autenticación/RBAC y primer flujo vertical verificable. |
| `v0.7.5` | 2026-11-13 | Corte de medio ciclo: producto con avance sustancial (~75%) y módulos principales demostrables. |
| `v0.9.0-rc.1` | 2026-12-23 | Release candidata del segundo avance: integración casi cerrada, foco en pruebas/correcciones. |
| `v1.0.0` | 2027-01-05 | Producto final demostrable para exposición de fin de ciclo. |

> Las versiones y fechas anteriores son objetivos internos alineados con los hitos de Linear. Si el alcance real cambia, se ajusta la versión antes de publicar; no se falsifica el estado del producto para cumplir el número.

## Criterio para publicar una release

- [ ] El conjunto de funcionalidades del hito está identificado.
- [ ] Los tests relevantes están verdes.
- [ ] No hay secretos versionados ni datos clínicos reales en artefactos.
- [ ] La documentación de arranque está actualizada.
- [ ] Las decisiones arquitectónicas relevantes están registradas.
- [ ] La evidencia reutilizable para tesis está enlazada o registrada.
- [ ] Se conocen y documentan limitaciones/bloqueos abiertos.

## Contenido mínimo de las notas de release

1. objetivo del hito;
2. funcionalidades incluidas;
3. cambios técnicos relevantes;
4. pruebas ejecutadas;
5. limitaciones conocidas;
6. issues principales relacionados;
7. evidencia/artefactos útiles para tesis cuando aplique.

## Trazabilidad

Las releases complementan, pero no reemplazan, la trazabilidad principal:

`requisito → issue → decisión/diseño → implementación → prueba/evidencia → release → tesis`

## Regla para agentes

No crear una release automáticamente al cerrar una issue. Prepararla únicamente cuando el milestone correspondiente alcance un estado demostrable y verificable.