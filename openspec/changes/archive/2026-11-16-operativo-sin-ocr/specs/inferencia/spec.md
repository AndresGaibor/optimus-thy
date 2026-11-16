# Spec Delta

## Purpose

Registrar el resultado de una inferencia con lo que el modelo entregado produce: clase, confianza y caja por nódulo.

## ADDED Requirements

### Requirement: Registro acotado al modelo entregado

Una inferencia SHALL registrar el resultado (`benigno`, `maligno` o `sin_nodulo`), su confianza, el tiempo de ejecución y, por cada nódulo, su índice, su caja y la confianza del detector. El sistema SHALL NOT exigir máscara, región analizada ni probabilidades separadas.

#### Scenario: Inferencia con nódulo detectado

- **WHEN** el modelo devuelve una clase y una caja para una imagen
- **THEN** la inferencia guarda la clase y su confianza
- **AND** el nódulo guarda su índice, su caja y la confianza del detector

#### Scenario: Inferencia sin nódulo

- **WHEN** el modelo no detecta ningún nódulo
- **THEN** la inferencia se guarda con resultado `sin_nodulo`
- **AND** no se crea ningún registro de nódulo

### Requirement: Trazabilidad del modelo

Cada inferencia SHALL quedar asociada a la versión del modelo con la que se ejecutó, incluida la huella de sus pesos.

#### Scenario: Modelo versionado

- **WHEN** se registra una inferencia
- **THEN** queda asociada a un modelo con nombre, versión y huella de pesos
