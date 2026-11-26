# perfil Specification

## Purpose
Permitir que cada usuario cambie su contraseña autenticado y consulte los datos de su perfil.

## Requirements

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

### Requirement: Seguridad del segundo factor en el perfil

La pantalla de perfil SHALL mostrar el estado del segundo factor y permitir activarlo o desactivarlo con la contraseña actual. Los códigos de recuperación SHALL mostrarse una sola vez después de confirmar el enrolamiento.

#### Scenario: Activar segundo factor

- **WHEN** la persona completa el enrolamiento con un código válido
- **THEN** el perfil indica que el segundo factor está activo y muestra los códigos de recuperación recibidos

#### Scenario: Desactivar segundo factor

- **WHEN** la persona envía la contraseña actual correcta desde los controles de seguridad
- **THEN** el perfil indica que el segundo factor está desactivado
