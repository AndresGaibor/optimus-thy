# Spec Delta

## ADDED Requirements

### Requirement: Seguridad del segundo factor en el perfil

La pantalla de perfil SHALL mostrar el estado del segundo factor y permitir activarlo o desactivarlo con la contraseña actual. Los códigos de recuperación SHALL mostrarse una sola vez después de confirmar el enrolamiento.

#### Scenario: Activar segundo factor

- **WHEN** la persona completa el enrolamiento con un código válido
- **THEN** el perfil indica que el segundo factor está activo y muestra los códigos de recuperación recibidos

#### Scenario: Desactivar segundo factor

- **WHEN** la persona envía la contraseña actual correcta desde los controles de seguridad
- **THEN** el perfil indica que el segundo factor está desactivado
