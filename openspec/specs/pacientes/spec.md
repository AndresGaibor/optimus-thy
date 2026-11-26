# pacientes Specification

## Purpose
TBD - created by archiving change aviso-duplicado-paciente. Update Purpose after archive.

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
