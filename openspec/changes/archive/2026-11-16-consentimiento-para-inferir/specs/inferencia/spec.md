# Spec Delta

## Purpose

La inferencia solo se ejecuta con consentimiento vigente de atención de salud.

## MODIFIED Requirements

### Requirement: Inferencia en cola

El sistema SHALL procesar cada trabajo `inferencia` solo si el caso tiene consentimiento vigente de atención de salud, leyendo del payload solo `imagen_id`, enviando la imagen al servicio de IA y persistiendo el contrato 1.1 con sus artefactos.

#### Scenario: Inferencia completada

- **WHEN** el worker toma un trabajo `inferencia` con una imagen existente y el caso tiene consentimiento vigente
- **THEN** lee la imagen del almacenamiento y llama a `POST /inferir`
- **AND** persiste en una sola transacción la inferencia, sus nódulos y el contrato crudo
- **AND** guarda por nódulo máscara, MGAC, XML y superposición cuando el contrato los trae

#### Scenario: Servicio de IA no disponible

- **WHEN** el servicio responde error o no está disponible
- **THEN** el trabajo queda en error con su código y no se persiste evidencia parcial

#### Scenario: Payload sin imagen

- **WHEN** el trabajo no trae `imagen_id` válido
- **THEN** el trabajo falla con código `payload_invalido`

#### Scenario: Sin consentimiento

- **WHEN** se solicita una inferencia para un caso sin consentimiento vigente de atención de salud
- **THEN** la API responde 409 `sin_consentimiento`
- **AND** el worker no lee la imagen ni persiste evidencia
