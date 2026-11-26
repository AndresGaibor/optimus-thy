# Spec Delta

## ADDED Requirements

### Requirement: Validación previa de ecografía tiroidea

El servicio de inferencia SHALL comprobar antes de ejecutar los modelos que la imagen decodificada parezca una ecografía tiroidea mediante un criterio visual barato y determinista.

#### Scenario: Imagen compatible

- **WHEN** el servicio recibe una imagen decodificable que satisface el criterio de compatibilidad
- **THEN** continúa el flujo existente de inferencia sin modificar su contrato de salida

#### Scenario: Imagen no compatible

- **WHEN** el servicio recibe una imagen decodificable que no satisface el criterio de compatibilidad
- **THEN** responde HTTP 422 con el código `imagen_no_parece_ecografia`
- **AND** no ejecuta ningún modelo

#### Scenario: Valor en el umbral

- **WHEN** la medida visual de la imagen alcanza exactamente el umbral configurado
- **THEN** el servicio la acepta y continúa la inferencia
