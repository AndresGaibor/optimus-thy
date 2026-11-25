## ADDED Requirements

### Requirement: Visor de imágenes del caso

El sistema SHALL ofrecer un visor sobre las imágenes del caso con ampliación, ajuste a ventana, navegación entre imágenes, metadatos y descarga.

#### Scenario: Abrir el visor

- **WHEN** el caso tiene al menos una ecografía y el médico pulsa «Abrir visor»
- **THEN** se abre un diálogo con la primera imagen y sus metadatos

#### Scenario: Navegar entre imágenes

- **WHEN** el médico usa anterior o siguiente
- **THEN** el visor cambia de imagen sin cerrar el diálogo

#### Scenario: Descargar

- **WHEN** el médico pulsa «Descargar»
- **THEN** la descarga usa la URL firmada que entrega la API

### Requirement: Fallo de carga de una imagen

El visor SHALL detectar el error de carga de una imagen y ofrecer reintento.

#### Scenario: Imagen inaccesible

- **WHEN** la URL de la imagen falla
- **THEN** el visor muestra el error con acción de reintento
- **AND** el resto de imágenes sigue navegable
