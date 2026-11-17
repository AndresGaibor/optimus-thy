# Spec Delta

## Purpose

Presentar el resultado normal y ordenar el historial de inferencias del caso.

## ADDED Requirements

### Requirement: Resultado sin nódulo

El sistema SHALL presentar como «Normal: sin nódulo detectado» toda inferencia cuyo contrato no traiga nódulos, sin inventar una clasificación.

#### Scenario: Inferencia normal

- **WHEN** el médico abre un caso con una inferencia completada sin nódulos
- **THEN** ve el aviso «Normal: sin nódulo detectado»
- **AND** no se muestra ninguna tarjeta de nódulo
- **AND** el aviso permanente de apoyo sigue visible

### Requirement: Historial de inferencias del caso

El sistema SHALL listar las inferencias del caso de la más reciente a la más antigua, cada una con fecha, modelo y resultado.

#### Scenario: Varias inferencias

- **WHEN** el caso tiene más de una inferencia
- **THEN** cada una aparece con su fecha, su modelo y su resultado
- **AND** las de una misma ecografía se distinguen por su fecha
