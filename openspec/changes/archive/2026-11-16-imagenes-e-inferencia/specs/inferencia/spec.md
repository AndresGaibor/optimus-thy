# Spec Delta

## Purpose

Cerrar el flujo clínico: del trabajo en cola a la evidencia persistida.

## ADDED Requirements

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
