## ADDED Requirements

### Requirement: Cambio de contraseña autenticado

El sistema SHALL permitir que una cuenta autenticada cambie su contraseña exigiendo la contraseña actual.

#### Scenario: Cambio correcto

- **WHEN** la cuenta envía contraseña actual válida y una nueva que cumple la política
- **THEN** se guarda el hash nuevo
- **AND** las demás sesiones de la cuenta quedan cerradas
- **AND** la sesión actual sigue activa
- **AND** la bitácora registra `PASSWORD_CHANGE` sin la contraseña

#### Scenario: Contraseña actual incorrecta

- **WHEN** la contraseña actual no coincide
- **THEN** responde 400 y no cambia nada

#### Scenario: Contraseña nueva débil

- **WHEN** la contraseña nueva tiene menos de 12 caracteres o aparece en listas de contraseñas filtradas
- **THEN** responde 422 con el motivo y no cambia nada

### Requirement: Formulario de perfil

La pantalla de perfil SHALL mostrar los datos de la sesión y el formulario de cambio con validación por campo.

#### Scenario: Validación en el cliente

- **WHEN** la nueva contraseña y su repetición no coinciden
- **THEN** el error se muestra en el campo de repetición y no se envía la petición

#### Scenario: Fallo de red

- **WHEN** la petición falla por red
- **THEN** se muestra el error y se ofrece reintentar sin borrar lo escrito
