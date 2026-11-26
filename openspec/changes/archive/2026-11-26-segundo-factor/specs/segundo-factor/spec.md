# Spec Delta

## Purpose

Permite que cada persona proteja su cuenta con un segundo factor opcional, complete el acceso con una aplicación TOTP y conserve una vía de recuperación de un solo uso.

## ADDED Requirements

### Requirement: Inicio de sesión con segundo factor

El API SHALL solicitar un código adicional cuando la cuenta tenga el segundo factor activo. El desafío SHALL expirar a los cinco minutos, permitir como máximo cinco intentos y no SHALL crear una sesión ni una cookie antes de validar el código.

#### Scenario: Contraseña válida con segundo factor activo

- **WHEN** una cuenta con TOTP activo envía correo y contraseña correctos a `POST /auth/login`
- **THEN** el API responde 202 con `requiere_otp`, un desafío y `segundos_para_expirar`
- **AND** no crea una sesión ni envía una cookie de sesión

#### Scenario: Código válido

- **WHEN** se envía un TOTP vigente o un código de recuperación no usado a `POST /auth/login/otp`
- **THEN** el API crea la sesión habitual y consume el desafío
- **AND** si se usó un código de recuperación, queda marcado como usado

#### Scenario: Código incorrecto y agotamiento de intentos

- **WHEN** el código no es válido
- **THEN** el API responde 401 con el código genérico `codigo_invalido` y registra `AUTH_2FA_FAILED`
- **AND** al quinto intento inválido invalida el desafío

#### Scenario: Desafío vencido

- **WHEN** se presenta un desafío que venció
- **THEN** el API responde 410 con `desafio_expirado` y no crea una sesión

### Requirement: Enrolamiento TOTP

El API SHALL permitir a una persona autenticada iniciar el enrolamiento y confirmar un TOTP. La confirmación correcta SHALL activar el segundo factor y entregar diez códigos de recuperación en claro una sola vez.

#### Scenario: Iniciar enrolamiento

- **WHEN** una persona autenticada solicita `POST /auth/2fa/iniciar`
- **THEN** recibe un secreto y una URI `otpauth://totp/OPTIMUS-THY:<correo>` para configurar su aplicación

#### Scenario: Confirmar con código válido

- **WHEN** la persona confirma un TOTP válido
- **THEN** el segundo factor queda activo y la respuesta contiene diez códigos de recuperación
- **AND** una consulta posterior no vuelve a mostrar esos códigos

#### Scenario: Confirmar con código inválido

- **WHEN** la persona confirma un código que no es válido
- **THEN** el segundo factor no queda activo y el API responde con un error genérico

### Requirement: Códigos de recuperación de un solo uso

El sistema SHALL aceptar cada código de recuperación una sola vez y SHALL almacenar únicamente una representación no reversible del código.

#### Scenario: Reutilizar un código

- **WHEN** se intenta completar otro desafío con un código de recuperación ya usado
- **THEN** el código se rechaza como `codigo_invalido` y no crea una sesión

### Requirement: Desactivación del segundo factor

El API SHALL permitir que la persona autenticada desactive su segundo factor solo después de validar su contraseña actual, y SHALL eliminar el secreto y todos sus códigos de recuperación.

#### Scenario: Desactivación con contraseña correcta

- **WHEN** la persona autenticada envía su contraseña correcta a `POST /auth/2fa/desactivar`
- **THEN** el segundo factor queda desactivado y sus códigos de recuperación dejan de ser válidos

#### Scenario: Desactivación con contraseña incorrecta

- **WHEN** la contraseña enviada es incorrecta
- **THEN** el segundo factor y los códigos de recuperación permanecen sin cambios

### Requirement: Estado del segundo factor

`GET /auth/me` SHALL indicar si el segundo factor está activo para la cuenta autenticada mediante `segundo_factor_activo`.

#### Scenario: Consultar cuenta protegida

- **WHEN** una persona autenticada consulta `GET /auth/me`
- **THEN** la respuesta incluye `segundo_factor_activo` con valor `true` si TOTP está activo y `false` en caso contrario
