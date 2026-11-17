## Why

La aplicación no puede enviar correo: el servidor SMTP no existe en ninguna parte y no hay forma de configurarlo sin tocar el repositorio. Sin eso no se puede recuperar una contraseña olvidada, y el administrador depende de soporte manual para cada caso.

## What Changes

- Página `/administrador/correo` con dos pestañas: **Servidor** (preset Gmail y modo «Otro») y **Plantilla** (asunto y HTML de la recuperación, con vista previa y restauración de la de fábrica).
- Configuración SMTP guardada en base de datos: host, puerto, cifrado, usuario, remitente y contraseña cifrada con AES-GCM. La contraseña nunca vuelve al navegador.
- Botón «Enviar prueba» que entrega un correo real a la cuenta del administrador conectado, con errores genéricos.
- Recuperación de contraseña: solicitud pública que siempre responde 202, enlace de un solo uso con caducidad, y confirmación que cambia la contraseña, quema el token y cierra todas las sesiones del usuario.
- Envío con `smtplib` de la biblioteca estándar: sin dependencias nuevas.

## Impact

- Base de datos: `configuracion_correo` (fila única), `plantillas_correo` y `tokens_recuperacion` (migración 0015).
- API: `/configuracion-correo`, `/configuracion-correo/probar`, `/plantillas-correo/{clave}`, `/plantillas-correo/{clave}/restaurar`, `/auth/recuperacion`, `/auth/recuperacion/confirmar`.
- Permiso existente `ajustes.gestionar`; auditoría `SETTINGS_CHANGE` y `PASSWORD_RESET`.
- Configuración nueva por entorno: `APP_PUBLIC_URL`, `CORREO_TIMEOUT_SEGUNDOS`, `RECUPERACION_TTL_MINUTOS`, `RECUPERACION_MAX_SOLICITUDES`, `RECUPERACION_VENTANA_MINUTOS`.
- El enlace de recuperación sale por correo; no se registra ni se devuelve nunca.
