# Spec Delta: pacientes

## ADDED Requirements

### Requirement: Archivar y reactivar pacientes sin borrar información

El sistema SHALL permitir archivar y reactivar pacientes mediante `POST /pacientes/{id}/archivar` y `POST /pacientes/{id}/desarchivar`, protegidos por `paciente.archivar`. Ninguna transición SHALL borrar el paciente, su identidad ni sus casos, y cada transición exitosa SHALL registrar `PATIENT_ARCHIVE` o `PATIENT_UNARCHIVE` sin datos personales.

#### Scenario: Archivado exitoso

- **GIVEN** un paciente activo de la institución
- **WHEN** una persona con `paciente.archivar` envía `POST /pacientes/{id}/archivar`
- **THEN** se conserva el paciente y se registra la fecha y el usuario que lo archivó
- **Y** se agrega `PATIENT_ARCHIVE` a la bitácora sin datos personales

#### Scenario: Reactivación exitosa

- **GIVEN** un paciente archivado de la institución
- **WHEN** una persona con `paciente.archivar` envía `POST /pacientes/{id}/desarchivar`
- **THEN** se conservan el paciente y sus datos, y se limpian `archivado_en` y `archivado_por_id`
- **Y** se agrega `PATIENT_UNARCHIVE` a la bitácora sin datos personales

#### Scenario: Transición repetida

- **GIVEN** un paciente archivado o activo
- **WHEN** se solicita de nuevo la misma transición
- **THEN** se responde `409` con `paciente_ya_archivado` o `paciente_no_archivado`, según corresponda
- **Y** no se registra una transición adicional

#### Scenario: Paciente fuera de institución

- **GIVEN** un paciente inexistente o perteneciente a otra institución
- **WHEN** se intenta archivarlo o reactivarlo
- **THEN** se responde `404` con `not_found`

### Requirement: Listado de pacientes archivados

`GET /pacientes` SHALL excluir pacientes archivados por defecto. El parámetro booleano `incluir_archivados`, cuyo valor predeterminado SHALL ser `false`, SHALL incluirlos cuando sea `true` sin quitar los filtros de institución, búsqueda ni paginación. Cada paciente devuelto SHALL incluir `archivado_en`, como fecha y hora o `null`. `GET /pacientes/{id}` SHALL seguir permitiendo consultar pacientes archivados de la institución.

#### Scenario: Listado predeterminado

- **GIVEN** pacientes activos y archivados de la institución
- **WHEN** se consulta `GET /pacientes` sin `incluir_archivados`
- **THEN** la lista y su total incluyen solo pacientes activos
- **Y** cada elemento incluye `archivado_en = null`

#### Scenario: Listado con archivados

- **GIVEN** pacientes activos y archivados de la institución
- **WHEN** se consulta `GET /pacientes?incluir_archivados=true`
- **THEN** se incluyen ambos estados y el valor `archivado_en` distingue a los archivados

#### Scenario: Consulta directa de un paciente archivado

- **GIVEN** un paciente archivado de la institución
- **WHEN** se consulta `GET /pacientes/{id}`
- **THEN** la respuesta incluye su información y `archivado_en` sin exponer datos ajenos a la respuesta habitual

### Requirement: Impedir casos nuevos para pacientes archivados

El sistema SHALL rechazar la creación de un caso para un paciente archivado con `409` y `error.code = "paciente_archivado"`, sin insertar el caso ni registrar un evento de creación.

#### Scenario: Intento de crear un caso

- **GIVEN** un paciente archivado de la institución
- **WHEN** se envía `POST /pacientes/{id}/casos`
- **THEN** la respuesta es `409` con `paciente_archivado` y no se crea un caso
