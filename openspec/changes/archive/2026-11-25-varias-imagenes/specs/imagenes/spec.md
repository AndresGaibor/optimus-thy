## ADDED Requirements

### Requirement: Carga de varias ecografías por caso

El sistema SHALL permitir elegir varios archivos PNG o JPEG en una sola operación, subirlos en orden y mostrar el estado y el error de cada archivo sin descartar los demás.

#### Scenario: Varios archivos válidos

- **WHEN** el médico elige dos o más archivos válidos y confirma la subida
- **THEN** cada archivo se envía por separado y queda marcado como listo
- **AND** la galería se refresca con las imágenes guardadas

#### Scenario: Archivo rechazado

- **WHEN** uno de los archivos elegidos no es PNG o JPEG, está vacío o supera 15 MB
- **THEN** ese archivo queda marcado como rechazado con su motivo
- **AND** los demás archivos se suben y la galería conserva las imágenes previas

#### Scenario: Fallo parcial

- **WHEN** la subida de un archivo falla en el servidor
- **THEN** el diálogo muestra el error de ese archivo y mantiene los ya guardados
- **AND** ofrece reintentar solo los pendientes o fallidos

### Requirement: Resultado de la inferencia con su imagen

El detalle de una inferencia SHALL indicar con qué imagen del caso se ejecutó.

#### Scenario: Varias imágenes en el caso

- **WHEN** se muestra una inferencia de un caso con varias imágenes
- **THEN** el detalle indica el formato, las dimensiones y la fecha de la imagen usada
- **AND** si la imagen ya no está en el listado, indica su identificador abreviado

## MODIFIED Requirements

### Requirement: Listado de ecografías del caso

El sistema SHALL listar las ecografías de un caso con enlaces firmados de corta duración, de la más reciente a la más antigua y sin límite de imágenes por caso.

#### Scenario: Listado con imágenes

- **WHEN** un usuario con permiso `imagen.leer` consulta las imágenes de un caso propio
- **THEN** el sistema responde con los metadatos y un enlace firmado por imagen
- **AND** las imágenes aparecen primero las más recientes, con un desempate estable
- **AND** registra la lectura en auditoría
