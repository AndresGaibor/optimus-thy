# recuperacion-contrasena Specification

## Purpose
Permitir que una persona recupere el acceso a su cuenta por correo con un enlace de un solo uso, sin revelar qué direcciones tienen cuenta y cerrando las sesiones abiertas al cambiar la contraseña.

## Requirements

### Requirement: Solicitud de recuperación sin revelar cuentas

Cualquier persona SHALL poder solicitar un enlace de recuperación indicando un correo. La API SHALL responder 202 con el mismo cuerpo exista o no la cuenta, y SHALL limitar las solicitudes por cuenta dentro de una ventana.

#### Scenario: Correo inexistente

- **WHEN** se solicita recuperación para una dirección sin cuenta
- **THEN** la respuesta es 202 y no se crea ningún token

#### Scenario: Demasiadas solicitudes

- **WHEN** una cuenta supera el máximo de solicitudes en la ventana
- **THEN** no se crea un token nuevo y la respuesta sigue siendo 202

### Requirement: Enlace de un solo uso y con caducidad

El enlace SHALL llevar un token aleatorio que solo se guarda como SHA-256, SHALL caducar según `RECUPERACION_TTL_MINUTOS` y SHALL dejar de valer al usarse.

#### Scenario: Reutilizar el enlace

- **WHEN** se confirma un token ya usado
- **THEN** la API responde 400 con `token_invalido`

#### Scenario: Token caducado

- **WHEN** se confirma un token vencido
- **THEN** la API responde 400 con `token_invalido`

### Requirement: Confirmación con cierre de sesiones

La confirmación SHALL exigir una contraseña de 12 a 128 caracteres, SHALL guardarla con Argon2, SHALL revocar todas las sesiones abiertas del usuario y SHALL registrar el evento `PASSWORD_RESET`.

#### Scenario: Cambio correcto

- **WHEN** el usuario confirma con un token válido
- **THEN** la API responde 204, la contraseña anterior deja de servir y la nueva funciona
- **AND** las sesiones abiertas quedan revocadas

#### Scenario: Contraseña corta

- **WHEN** la contraseña nueva tiene menos de 12 caracteres
- **THEN** la API responde 422 y el token no se consume
