# exportacion-paciente Specification

## Purpose
Permitir que el personal autorizado descargue la ficha completa de un paciente —datos, casos, imágenes, inferencias y decisiones— en un único archivo, dejando registro en la auditoría.

## Requirements

### Requirement: Exportar JSON autorizado
El sistema SHALL exportar en JSON la identidad disponible (`seudonimo`, nombres, apellidos, documento y fecha de nacimiento ISO) y los casos/inferencias del paciente. Solo podrán hacerlo usuarios con `paciente.leer` para pacientes de su institución. La exportación SHALL omitir identificadores internos, rutas de almacenamiento, hashes de modelos, documentos escaneados y campos no almacenados.

#### Scenario: Exportación JSON con inferencias
- **GIVEN** un usuario autorizado solicita exportar un paciente de su institución
- **WHEN** solicita el formato JSON
- **THEN** recibe identidad, casos y todas sus inferencias con fecha, resultado, confianza, modelo, versión del contrato y decisión, sin datos internos de almacenamiento

### Requirement: Exportar CSV
El sistema SHALL generar CSV UTF-8 con BOM, separador coma y columnas planas `seudonimo,documento,codigo_caso,fecha_inferencia,resultado,confianza,modelo,decision`, una fila por inferencia; un caso sin inferencias SHALL producir una fila con los campos de inferencia vacíos.

#### Scenario: CSV legible en Excel
- **GIVEN** un usuario autorizado solicita un CSV de paciente
- **WHEN** hay resultados de inferencia
- **THEN** recibe una fila por resultado con el documento como segunda columna, con comillas correctamente escapadas y tildes preservadas

### Requirement: Registrar la exportación
Toda exportación exitosa SHALL registrarse como `EXPORT` en `EXPORT`, objeto `PATIENT`, con `detalles` que contengan el formato y el número real de inferencias exportadas (también para JSON).

#### Scenario: Evento de auditoría
- **GIVEN** una exportación autorizada que produce filas
- **WHEN** la descarga se genera
- **THEN** se registra el evento con `format` y `resource_count` igual al número de inferencias, sin incluir el contenido exportado

### Requirement: Restringir acceso a exportación
La ruta SHALL exigir `paciente.leer` y SHALL ocultar pacientes de otras instituciones con 404 y el error `not_found`.

#### Scenario: Usuario sin permiso
- **GIVEN** un usuario sin `paciente.leer`
- **WHEN** solicita una exportación
- **THEN** recibe 403

#### Scenario: Paciente ajeno
- **GIVEN** un usuario autorizado consulta un paciente de otra institución
- **WHEN** solicita la exportación
- **THEN** recibe 404 `not_found` sin revelar su existencia

### Requirement: Descargar exportación desde la ficha
La ficha del paciente SHALL permitir elegir JSON o CSV y descargar el archivo adjunto. El control SHALL estar deshabilitado sin `paciente.leer` y mostrar un error comprensible si falla la descarga.

#### Scenario: Descargar o mostrar error
- **GIVEN** la ficha de un paciente visible
- **WHEN** se elige JSON o CSV y se solicita la exportación
- **THEN** se descarga el archivo, o se muestra un error sin detalles internos
