# Tareas

- [x] Modelos `configuracion_correo`, `plantillas_correo` y `tokens_recuperacion` con la migración 0015.
- [x] Servicio de correo: render escapado, envío por `smtplib`, plantilla de fábrica.
- [x] API de configuración (leer, guardar, probar) con permiso `ajustes.gestionar` y auditoría.
- [x] API de plantilla (leer, guardar, restaurar) validando variables.
- [x] Recuperación: solicitud 202 sin enumeración, token hasheado, confirmación con cierre de sesiones.
- [x] Pruebas del backend del correo y la recuperación.
- [x] Pantalla `/administrador/correo` con servidor, plantilla y vista previa.
- [x] Pantallas `/recuperar` y `/restablecer/:token`.
- [x] Rutas, navegación y enlace en el inicio de sesión.
- [x] Historias, capturas y verificación visual a 1280, 1440 y 1920.
