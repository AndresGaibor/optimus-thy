# Spec Delta: pacientes

## ADDED Requirements

### Requirement: Archivar y reactivar pacientes sin borrar información

El sistema SHALL permitir archivar y reactivar pacientes mediante `POST /pacientes/{id}/archivar` y `POST /pacientes/{id}/desarchivar`, ambos protegidos por `paciente.archivar`. Un identificador inexistente, inválido o ajeno a la institución activa SHALL responder `404` con `error.code = "not_found"`. Archivar un paciente ya archivado SHALL responder `409` con `paciente_ya_archivado`; reactivar uno activo SHALL responder `409` con `paciente_no_archivado`. Ninguna transición SHALL borrar el paciente, su identidad ni sus casos. Cada transición exitosa SHALL registrar `PATIENT_ARCHIVE` o `PATIENT_UNARCHIVE` con referencias de usuario y paciente, sin datos personales.

#### Scenario: Archivado exitoso

- **DADO** un paciente activo de la institución
- **CUANDO** una persona con `paciente.archivar` envía `POST /pacientes/{id}/archivar`
- **ENTONCES** se conserva el paciente y se registra la fecha y el usuario que lo archivó
- **Y** se agrega `PATIENT_ARCHIVE` a la bitácora sin datos personales

#### Scenario: Reactivación exitosa

- **DADO** un paciente archivado de la institución
- **CUANDO** una persona con `paciente.archivar` envía `POST /pacientes/{id}/desarchivar`
- **ENTONCES** se conservan el paciente y sus datos, y se limpian `archivado_en` y `archivado_por_id`
- **Y** se agrega `PATIENT_UNARCHIVE` a la bitácora sin datos personales

#### Scenario: Transición repetida

- **DADO** un paciente archivado o activo
- **CUANDO** se solicita de nuevo la misma transición
- **ENTONCES** se responde `409` con `paciente_ya_archivado` o `paciente_no_archivado`, según corresponda
- **Y** no se registra una transición adicional

#### Scenario: Paciente fuera de institución

- **DADO** un paciente inexistente o perteneciente a otra institución
- **CUANDO** se intenta archivarlo o reactivarlo
- **ENTONCES** se responde `404` con `not_found`

### Requirement: Listado de pacientes archivados

`GET /pacientes` SHALL excluir pacientes archivados por defecto. El parámetro booleano `incluir_archivados`, cuyo valor predeterminado SHALL ser `false`, SHALL incluirlos cuando sea `true` sin quitar los filtros de institución, búsqueda ni paginación. Cada paciente devuelto SHALL incluir `archivado_en`, como fecha y hora o `null`. `GET /pacientes/{id}` SHALL seguir permitiendo consultar pacientes archivados de la institución.

#### Scenario: Listado predeterminado

- **DADO** pacientes activos y archivados de la institución
- **CUANDO** se consulta `GET /pacientes` sin `incluir_archivados`
- **ENTONCES** la lista y su total incluyen solo pacientes activos
- **Y** cada elemento incluye `archivado_en = null`

#### Scenario: Listado con archivados

- **DADO** pacientes activos y archivados de la institución
- **CUANDO** se consulta `GET /pacientes?incluir_archivados=true`
- **ENTONCES** se incluyen ambos estados y el valor `archivado_en` distingue a los archivados

#### Scenario: Consulta directa de un paciente archivado

- **DADO** un paciente archivado de la institución
- **CUANDO** se consulta `GET /pacientes/{id}`
- **ENTONCES** la respuesta incluye su información y `archivado_en` sin exponer datos ajenos a la respuesta habitual

### Requirement: Impedir casos nuevos para pacientes archivados

El sistema SHALL rechazar la creación de un caso para un paciente archivado con `409` y `error.code = "paciente_archivado"`, sin insertar el caso ni registrar un evento de creación.

#### Scenario: Intento de crear un caso

- **DADO** un paciente archivado de la institución
- **CUANDO** se envía `POST /pacientes/{id}/casos`
- **ENTONCES** la respuesta es `409` con `paciente_archivado` y no se crea un caso
