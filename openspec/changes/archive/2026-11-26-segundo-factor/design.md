# Design

## Context

Ver `proposal.md` para la motivación y `specs/` para el contrato observable. La autenticación está concentrada en `backend/app/auth/routes.py`; la creación de sesiones y cookies ya tiene un flujo reutilizable. `Usuario` se define en `app/models/usuarios.py`, y `EncryptedBytes` cifra texto con AES-GCM usando `PII_ENCRYPTION_KEY`. La bitácora valida acciones y módulos mediante enums. El perfil y el login usan el design system de `frontend/`.

## Goals / Non-Goals

**Goals:**

- Mantener compatibilidad de cuentas existentes: el TOTP está inactivo hasta que la persona lo confirme.
- Limitar la exposición de credenciales temporales: secretos cifrados, códigos de recuperación y desafíos persistidos solo como hashes, desafío de vida corta y sin cookie antes del OTP.
- Reutilizar el proveedor TOTP estándar con funciones puras y vectores RFC 6238, sin dependencias nuevas.
- Reutilizar las sesiones, cookies, autenticación y componentes existentes.

**Non-Goals:**

- No exigir segundo factor a todas las cuentas ni a roles específicos.
- No ofrecer QR, rotación o regeneración de códigos de recuperación, ni administración de 2FA por terceros.
- No modificar pacientes, OCR, investigación ni la autenticación de servicios externos.

## Decisions

- **TOTP con biblioteca estándar.** `app/security/totp.py` implementará SHA-1, pasos de 30 segundos, seis dígitos y ventana de verificación ±1 paso. Se usarán secretos aleatorios codificados en Base32 y `secrets.compare_digest`; pruebas con los vectores publicados de RFC 6238 adaptados a seis dígitos. Se descarta `pyotp` porque `hmac`, `base64` y `secrets` cubren el contrato sin dependencia nueva.
- **Secreto mediante `EncryptedBytes`.** `usuarios.totp_secreto_cifrado` se mapeará con el tipo existente, cuya columna física es `BYTEA`; `totp_activado_en` distingue un enrolamiento pendiente del activo. No se devuelve el secreto fuera del inicio de enrolamiento ni se incluye en auditoría.
- **Material efímero y recuperable separado.** `codigos_recuperacion.hash` conserva SHA-256 de códigos aleatorios y `usado_en` hace atómico el consumo de cada código. `desafios_otp.token_hash` conserva SHA-256 del token aleatorio, con caducidad de 5 minutos e intentos persistidos hasta cinco. Los desafíos se consumen tras éxito, agotamiento o expiración cuando se presentan.
- **Login conserva el contrato de sesión.** La contraseña correcta de una cuenta protegida devuelve un desafío 202 sin crear sesión ni cookie. `POST /auth/login/otp` valida TOTP o consume un código de recuperación y luego usa la ruta existente de creación de sesión/cookie. Los códigos inválidos comparten respuesta genérica.
- **Rutas y auditoría dentro de la arquitectura actual.** Los endpoints viven bajo `/auth`, usan `SesionActual` donde corresponda y registran `AUTH_2FA_ENABLED`, `AUTH_2FA_DISABLED` y `AUTH_2FA_FAILED` con módulo `AUTH` y objeto `USER`, sin detalles con códigos o secretos.
- **Interfaz en login y perfil.** El login incorpora el paso OTP y el cambio explícito al modo de código de recuperación. Los controles de activación, confirmación, visualización única de códigos y desactivación se agregan al perfil existente, usando piezas del design system y campos etiquetados.
- **Migración aditiva `0027`.** Añade los dos campos opcionales de usuario y las tablas `codigos_recuperacion` y `desafios_otp`, con FK `ON DELETE CASCADE`, restricciones únicas y el índice de expiración pedido. `down_revision` se fija a `0025` según el alcance solicitado.

## Risks / Trade-offs

- **Reloj del servidor fuera de sincronía:** puede rechazar códigos de una aplicación válida → se acepta una ventana de ±1 paso y el despliegue debe mantener UTC sincronizado.
- **Divulgación de códigos de recuperación:** solo se muestran una vez al confirmar, y solo se conserva su hash; la persona debe guardarlos en un lugar seguro.
- **Reutilización concurrente de recuperación:** el consumo debe ser condicional a `usado_en IS NULL` dentro de la transacción que crea la sesión.
- **Cifrado requiere la clave existente:** la apertura del secreto depende de `PII_ENCRYPTION_KEY`, igual que otros campos cifrados del sistema; no se introduce una clave paralela.

## Migration Plan

1. Aplicar `0027` de forma aditiva: las cuentas existentes continúan con segundo factor desactivado.
2. Desplegar backend y frontend; la inscripción solo se activa tras confirmar un TOTP.
3. Si hace falta revertir, detener el despliegue y bajar `0027`; esto elimina secretos, desafíos y códigos de recuperación creados desde la migración.
