## ADDED Requirements

### Requirement: Aviso de documento duplicado en el alta

Al crear un paciente, el sistema SHALL comprobar si el documento ya existe cifrado dentro de la institución de la sesión antes de insertar cualquier fila. Si existe y la petición no confirma el duplicado, SHALL responder `409` con `error.code = "posible_duplicado"`, un mensaje que nombra el documento sin revelar datos del paciente existente y el identificador de ese paciente. La comprobación SHALL limitarse a la institución activa.

#### Scenario: Alta con documento ya registrado

- **GIVEN** un paciente con el documento `ABC-12345` en la institución activa
- **WHEN** se envía un alta con ese documento y sin confirmar el duplicado
- **THEN** la respuesta es `409` con código `posible_duplicado` y no se crea ningún paciente ni identidad

#### Scenario: Confirmación explícita

- **GIVEN** el mismo documento y una petición con `confirmar_duplicado = true`
- **THEN** se crea un paciente nuevo y la respuesta es `201`

### Requirement: Confirmación en la pantalla de pacientes

Cuando el alta responde `409` con `posible_duplicado`, la pantalla SHALL mantener el formulario abierto, mostrar un aviso y ofrecer un botón que reenvía la petición con `confirmar_duplicado = true`. La pantalla no SHALL mostrar el identificador del paciente existente.

#### Scenario: Segundo envío

- **GIVEN** el formulario con el aviso de documento duplicado
- **WHEN** la persona pulsa «Registrar igualmente»
- **THEN** la petición se reenvía con `confirmar_duplicado = true`
