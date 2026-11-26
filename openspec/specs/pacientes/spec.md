# pacientes Specification

## Purpose
Avisar de un documento duplicado en el alta de un paciente y pedir confirmación antes de continuar.

## Requirements

### Requirement: Aviso de documento duplicado en el alta

Al crear o corregir un paciente, el sistema SHALL comparar el documento
canónico —mayúsculas y sin espacios, guiones ni puntos— contra los documentos
descifrados de la institución de la sesión. La comprobación y la inserción
SHALL ejecutarse bajo un bloqueo transaccional por institución y documento
canónico, de modo que dos peticiones simultáneas con el mismo documento no
puedan crear dos pacientes sin aviso. Si el documento existe y la petición no
confirma el duplicado, SHALL responder `409` con `error.code =
"posible_duplicado"`, un mensaje que nombra el documento y no revela datos ni
identificadores del paciente existente. La comprobación SHALL limitarse a la
institución activa.

#### Scenario: Alta con documento ya registrado

- **GIVEN** un paciente con el documento `ABC-12345` en la institución activa
- **WHEN** se envía un alta con ese documento y sin confirmar el duplicado
- **THEN** la respuesta es `409` con código `posible_duplicado`, sin
  `paciente_id` en el cuerpo, y no se crea ningún paciente ni identidad

#### Scenario: Documento equivalente con otro formato

- **GIVEN** un paciente con el documento `AB12345` en la institución activa
- **WHEN** se envía un alta con `ab-12345`
- **THEN** la respuesta es `409` con código `posible_duplicado`

#### Scenario: Altas simultáneas del mismo documento

- **GIVEN** dos peticiones de alta con el mismo documento enviadas a la vez
- **WHEN** ambas llegan sin `confirmar_duplicado`
- **THEN** exactamente una crea el paciente y la otra responde `409`

#### Scenario: Confirmación explícita

- **GIVEN** el mismo documento y una petición con `confirmar_duplicado = true`
- **THEN** se crea un paciente nuevo y la respuesta es `201`

### Requirement: Confirmación en la pantalla de pacientes

Cuando el alta responde `409` con `posible_duplicado`, la pantalla SHALL
mantener el formulario abierto, mostrar un aviso y ofrecer un botón que reenvía
la petición con `confirmar_duplicado = true`. La pantalla no SHALL mostrar
identificadores del paciente existente. Si la persona cambia el documento
después del aviso, la pantalla SHALL descartar el aviso y volver a comprobar el
documento nuevo antes de reenviar con confirmación.

#### Scenario: Segundo envío

- **GIVEN** el formulario con el aviso de documento duplicado
- **WHEN** la persona pulsa «Registrar igualmente»
- **THEN** la petición se reenvía con `confirmar_duplicado = true`

#### Scenario: Documento distinto tras el aviso

- **GIVEN** el formulario con el aviso de documento duplicado para el documento A
- **WHEN** la persona sustituye el documento por B y guarda
- **THEN** la petición se envía sin confirmación y el resultado depende de B

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
