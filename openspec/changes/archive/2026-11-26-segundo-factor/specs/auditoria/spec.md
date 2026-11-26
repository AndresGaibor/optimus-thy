# Spec Delta

## ADDED Requirements

### Requirement: Auditoría del segundo factor

El sistema SHALL registrar la activación, desactivación y los intentos fallidos del segundo factor con las acciones `AUTH_2FA_ENABLED`, `AUTH_2FA_DISABLED` y `AUTH_2FA_FAILED`, sin incluir secretos, TOTP ni códigos de recuperación.

#### Scenario: Activación y desactivación

- **WHEN** una persona activa o desactiva su segundo factor
- **THEN** la bitácora registra la acción correspondiente para esa cuenta
- **AND** no guarda el secreto ni los códigos de recuperación

#### Scenario: Fallo de verificación

- **WHEN** se rechaza un código TOTP o de recuperación
- **THEN** la bitácora registra `AUTH_2FA_FAILED` sin guardar el código presentado
