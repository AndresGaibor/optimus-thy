# Spec Delta

## Purpose

Recibir las ecografías del caso sin metadatos identificables y permitir su consulta posterior.

## ADDED Requirements

### Requirement: Carga saneada de ecografías

El sistema SHALL aceptar una ecografía PNG o JPEG de un caso, decidir el tipo por su contenido y guardar una copia recodificada sin EXIF, perfil ICC ni texto de metadatos.

#### Scenario: Imagen válida

- **WHEN** un usuario con permiso `imagen.cargar` sube un PNG o JPEG de al menos 64×64
- **THEN** el sistema valida el tipo con Pillow y recodifica la imagen
- **AND** guarda una copia con clave opaca y el SHA-256 de esa copia
- **AND** responde 201 con los metadatos y un enlace firmado

#### Scenario: Archivo que no es imagen

- **WHEN** el archivo no se puede decodificar como PNG o JPEG
- **THEN** el sistema responde 422 `archivo_invalido` sin guardar nada

#### Scenario: Caso ajeno

- **WHEN** el caso no existe o pertenece a otra institución
- **THEN** el sistema responde 404, igual que si no existiera

### Requirement: Listado de ecografías del caso

El sistema SHALL listar las ecografías de un caso con enlaces firmados de corta duración.

#### Scenario: Listado con imágenes

- **WHEN** un usuario con permiso `imagen.leer` consulta las imágenes de un caso propio
- **THEN** el sistema responde con los metadatos y un enlace firmado por imagen
- **AND** registra la lectura en auditoría
