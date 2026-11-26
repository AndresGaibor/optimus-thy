# reporte-consolidado

## ADDED Requirements

### Requirement: Consolidar inferencias de un caso
El sistema SHALL generar un PDF sin imágenes con portada y aviso de apoyo, identificador `REP-` más los primeros 12 caracteres hexadecimales de la huella, una tabla resumen y una sección de resultado y nódulos por cada inferencia. El endpoint SHALL requerir `reporte.generar`, aislar por institución y adjuntar el PDF con su huella SHA-256 en `X-Reporte-Huella`.

#### Scenario: Todas las inferencias
- **WHEN** se solicita el PDF de un caso propio con dos inferencias
- **THEN** el PDF representa las dos inferencias, incluye su identificador y se audita la huella con un conteo de dos

#### Scenario: Caso sin inferencias
- **WHEN** se solicita el PDF de un caso propio sin inferencias
- **THEN** el sistema responde 409 con código `sin_inferencias`

#### Scenario: Caso ajeno
- **WHEN** se solicita el PDF de un caso de otra institución
- **THEN** el sistema responde 404 `not_found`

### Requirement: Auditar descargas consolidadas
El sistema SHALL registrar cada descarga como `REPORT_DOWNLOAD`, módulo `INFERENCE`, tipo `REPORT`, identificada por el id del caso, y detalles `report_kind`, `report_sha256` y `resource_count`.

#### Scenario: Auditoría de descarga
- **WHEN** se descarga el reporte de un caso con inferencias
- **THEN** la auditoría guarda la huella, tipo de reporte y cantidad de inferencias.

### Requirement: Verificar la huella del reporte
El sistema SHALL aceptar huellas SHA-256 de 64 caracteres hexadecimales y comprobarlas contra los eventos `REPORT_DOWNLOAD` auditados. Si no hay coincidencia (incluido formato inválido), SHALL responder 404 `not_found`; si existe, SHALL informar caso, fecha, usuario y cantidad de inferencias.

#### Scenario: Huella verificable
- **WHEN** se consulta una huella generada por un reporte auditado
- **THEN** se informa que es válida y se devuelven el código de caso, la fecha, el usuario y el número de inferencias
