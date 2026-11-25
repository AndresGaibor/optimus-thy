## Por qué

TES-354 · HU-006 pide que cada cuenta cambie su propia contraseña; solo existía la recuperación por token.

## Qué cambia

- `PUT /auth/password`: exige la contraseña actual, aplica la política (mínimo 12 y rechazo de contraseñas filtradas), guarda el hash Argon2, cierra las demás sesiones y renueva la actual; audita `PASSWORD_CHANGE` sin registrar secretos.
- `/perfil` con los datos de la sesión y el formulario de cambio, validación por campo, errores del servidor en su campo, confirmación y aviso de cierre de las demás sesiones.
- Entrada «Mi perfil» en la navegación de las tres áreas.

## Impacto

- Contrato de API: una ruta nueva (`PUT /auth/password`), regenerada en `contracts/openapi.json` y en los tipos del frontend.
- Esquema: sin cambios.
- Seguridad: no se registra la contraseña en bitácora ni en logs; la sesión actual se renueva para no expulsar a quien cambia la contraseña.
