# inferencia Specification

## Purpose
Registrar el resultado de una inferencia con lo que el modelo entregado produce: clase, confianza y caja por nódulo.

## Requirements

### Requirement: Trazabilidad del modelo

Cada inferencia SHALL quedar asociada a la versión del modelo con la que se ejecutó, incluida la huella de sus pesos.

#### Scenario: Modelo versionado

- **WHEN** se registra una inferencia
- **THEN** queda asociada a un modelo con nombre, versión y huella de pesos

### Requirement: Evidencia por nódulo

Una inferencia SHALL registrar, por cada nódulo, su índice, su caja, la confianza del detector y el origen de la máscara. Cuando el contrato traiga artefactos, SHALL guardar las rutas de la máscara final, la máscara MGAC, el XML Pascal-VOC y la superposición.

#### Scenario: Contrato con artefactos

- **WHEN** el servicio de IA devuelve una inferencia con artefactos por nódulo
- **THEN** cada nódulo guarda las rutas de sus cuatro artefactos
- **AND** la inferencia guarda ancho, alto, versión del contrato, umbrales y huella de los modelos

#### Scenario: Contrato sin artefactos

- **WHEN** el servicio devuelve una inferencia sin artefactos
- **THEN** las rutas quedan nulas y la inferencia se registra igual

### Requirement: Inferencia inmutable

Una inferencia registrada SHALL NOT modificarse; la corrección del médico vive en `decisiones_medicas`.

#### Scenario: Corrección posterior

- **WHEN** el médico corrige el resultado
- **THEN** se crea una decisión médica y la inferencia original no cambia

### Requirement: Inferencia en cola

El sistema SHALL procesar cada trabajo `inferencia` leyendo del payload solo `imagen_id`, enviando la imagen al servicio de IA y persistiendo el contrato 1.1 con sus artefactos.

#### Scenario: Inferencia completada

- **WHEN** el worker toma un trabajo `inferencia` con una imagen existente
- **THEN** lee la imagen del almacenamiento y llama a `POST /inferir`
- **AND** persiste en una sola transacción la inferencia, sus nódulos y el contrato crudo
- **AND** guarda por nódulo máscara, MGAC, XML y superposición cuando el contrato los trae

#### Scenario: Servicio de IA no disponible

- **WHEN** el servicio responde error o no está disponible
- **THEN** el trabajo queda en error con su código y no se persiste evidencia parcial

#### Scenario: Payload sin imagen

- **WHEN** el trabajo no trae `imagen_id` válido
- **THEN** el trabajo falla con código `payload_invalido`
