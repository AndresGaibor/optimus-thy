# Spec Delta

## Purpose

Definir el comportamiento de carga que evita imágenes idénticas dentro de un mismo caso y comunica el rechazo al usuario sin afectar otros casos.

## ADDED Requirements

### Requirement: Rechazo de imágenes duplicadas en el mismo caso

El sistema SHALL identificar una imagen por su contenido y rechazar su segunda carga en el mismo caso sin persistirla ni registrar una carga en auditoría.

#### Scenario: Imagen ya cargada en el caso

- **WHEN** un usuario carga en un caso una imagen con el mismo contenido que una imagen ya guardada allí
- **THEN** el sistema responde HTTP 409 con el código `imagen_duplicada` y el mensaje «Esta imagen ya está cargada en el caso.»
- **AND** no sube el archivo al almacenamiento, no crea un registro nuevo ni registra una carga en auditoría
- **AND** el diálogo de carga muestra ese mensaje al usuario

#### Scenario: Contenido igual en otro caso o contenido distinto

- **WHEN** un usuario carga la misma imagen en otro caso, o carga contenido distinto en el caso actual
- **THEN** el sistema acepta la carga y responde HTTP 201
