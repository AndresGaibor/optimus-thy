# Spec Delta

## ADDED Requirements

### Requirement: Aviso por imagen que no parece una ecografía tiroidea

La pantalla SHALL explicar al médico que una inferencia se rechazó porque la imagen no parece una ecografía tiroidea, sin mostrar detalles internos del servicio.

#### Scenario: El trabajo rechaza una imagen no compatible

- **WHEN** el trabajo de inferencia termina con el código `imagen_no_parece_ecografia`
- **THEN** la pantalla muestra un aviso específico para seleccionar una imagen que sí sea una ecografía tiroidea
- **AND** no presenta el fallo como una indisponibilidad general del servicio
