# Tasks

## 1. Algoritmo y persistencia

- [ ] 1.1 Escribir `backend/tests/test_totp.py` con los vectores RFC 6238, formato del secreto y ventana ±1; verificar que `pytest -q tests/test_totp.py` falla antes de implementar.
- [ ] 1.2 Implementar `generar_secreto()`, `codigo_para(secreto, momento)` y `verificar_codigo(...)` en `backend/app/security/totp.py`; verificar los vectores RFC con `cd backend && pytest -q tests/test_totp.py`.
- [ ] 1.3 Añadir los campos de `Usuario`, modelos `CodigoRecuperacion` y `DesafioOtp`, registro ORM y migración `0027` con FK CASCADE, columnas, defaults, unicidad e índice solicitados; verificar la subida a `head` en las pruebas de `test_auth_2fa.py`.

## 2. Autenticación y auditoría

- [ ] 2.1 Escribir `backend/tests/test_auth_2fa.py` para desafío de login, cinco intentos, expiración, TOTP, código de recuperación de un solo uso, enrolamiento, desactivación y auditoría; comprobar primero el fallo esperado de las rutas inexistentes.
- [ ] 2.2 Implementar login en dos pasos, enrolamiento, confirmación, desactivación, estado en `/auth/me` y acciones `AUTH_2FA_*`; verificar con `TEST_DATABASE_URL=postgresql+psycopg://postgres:test@127.0.0.1:55432/test pytest -q tests/test_auth.py tests/test_sesiones_seguridad.py tests/test_totp.py tests/test_auth_2fa.py` desde `backend/`.

## 3. Interfaz

- [x] 3.1 Extender el cliente y el estado de sesión para el desafío OTP; implementar el paso TOTP y «usar código de recuperación» en el login; verificar con `cd frontend && bunx vitest run src/test/login-otp.test.tsx`.
- [x] 3.2 Añadir al perfil los controles de seguridad para activar, confirmar, mostrar códigos una sola vez y desactivar con contraseña; verificar con `cd frontend && bunx vitest run src/test/seguridad-2fa.test.tsx`.

## 4. Integración

- [ ] 4.1 Ejecutar los comandos de aceptación de backend y frontend definidos en la historia, después de la última edición, y conservar su salida real.
