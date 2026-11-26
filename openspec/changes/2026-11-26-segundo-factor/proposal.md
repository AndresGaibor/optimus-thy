# Proposal

## Why

El inicio de sesión actual termina con la contraseña y no ofrece una barrera adicional ante credenciales expuestas. Se incorpora un segundo factor TOTP opcional, con recuperación de acceso y controles de cuenta para que cada usuario pueda proteger su propia sesión sin depender de un administrador.

## What Changes

- Añadir TOTP RFC 6238 con secreto cifrado en reposo, códigos de recuperación de un solo uso y migración de persistencia.
- Si la cuenta tiene TOTP activo, separar la validación de contraseña de la creación de sesión mediante un desafío temporal y de intentos limitados.
- Permitir iniciar, confirmar y desactivar el segundo factor; desactivarlo exige la contraseña actual.
- Añadir el estado de activación a `GET /auth/me` y auditar activación, desactivación y fallos sin registrar secretos ni códigos.
- Incorporar el paso OTP y la administración de seguridad en el perfil, mostrando los códigos de recuperación una sola vez.

## Capabilities

### New Capabilities

- `segundo-factor`: enrolamiento TOTP, inicio de sesión en dos pasos y uso de códigos de recuperación.

### Modified Capabilities

- `perfil`: añade la administración autenticada del segundo factor.
- `auditoria`: añade eventos de activación, desactivación y fallos del segundo factor sin material secreto.

## Impact

- Backend: modelos de usuario y segundo factor, migración `0027`, módulo TOTP, rutas y auditoría de autenticación.
- API: `POST /auth/login` puede responder con desafío; se agregan `POST /auth/login/otp`, `/auth/2fa/iniciar`, `/auth/2fa/confirmar` y `/auth/2fa/desactivar`; `GET /auth/me` expone `segundo_factor_activo`.
- Frontend: cliente de autenticación, pantalla pública de login y perfil de cuenta.
- Pruebas focalizadas para algoritmo TOTP, flujos de autenticación y pantallas.
- No se añaden dependencias externas; el algoritmo TOTP usa la biblioteca estándar y el cifrado AES-GCM existente.
