## ADDED Requirements

### Requirement: Corrección de la identidad del paciente

La API SHALL permitir corregir nombres, apellidos, documento y fecha de nacimiento de un paciente existente, con las mismas validaciones del alta y volviendo a cifrar la identidad.

#### Scenario: Corrección válida

- **WHEN** un usuario con `paciente.escribir` envía un cambio válido
- **THEN** la identidad cifrada se actualiza y la respuesta trae el paciente sin identidad

#### Scenario: Documento duplicado

- **WHEN** el documento corregido pertenece a otro paciente
- **THEN** la respuesta es `409` y nada cambia

#### Scenario: Sin permiso

- **WHEN** el usuario no tiene `paciente.escribir`
- **THEN** la respuesta es `403` y no se descifra ni escribe nada

### Requirement: Lectura controlada de la identidad

La API SHALL devolver la identidad descifrada solo por su ruta propia, para precargar la corrección, y SHALL registrar ese acceso en la bitácora.

#### Scenario: Precarga autorizada

- **WHEN** un usuario con `paciente.leer` pide la identidad de un paciente
- **THEN** recibe los cuatro campos y queda un evento de acceso a datos personales

### Requirement: Auditoría del cambio

La API SHALL registrar cada corrección con la lista de campos modificados y nunca con sus valores.

#### Scenario: Cambio auditado

- **WHEN** una corrección se aplica
- **THEN** la bitácora guarda `PATIENT_UPDATE` con el identificador del paciente y los nombres de los campos cambiados
