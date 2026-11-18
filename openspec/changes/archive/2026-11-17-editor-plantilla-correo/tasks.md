## 1. Datos y backend

- [x] 1.1 Migración 0016: `modo` y `campos` en `plantillas_correo`.
- [x] 1.2 Compositor `html_desde_campos` y campos de fábrica en `app/correo/servicio.py`.
- [x] 1.3 `PlantillaIn`/`PlantillaOut` con modo y campos; validaciones y códigos de error.
- [x] 1.4 `POST /plantillas-correo/{clave}/preview` con datos de ejemplo.
- [x] 1.5 Pruebas: composición, escape, campo vacío, variable desconocida, vista previa y permisos.

## 2. Interfaz

- [x] 2.1 `useCorreo` con modo, campos y vista previa (con rebote).
- [x] 2.2 `CorreoPlantillaForm`: pestañas Diseño/HTML y maqueta de bandeja.
- [x] 2.3 Pruebas de interacción y actualización de la historia del catálogo.
- [x] 2.4 Capturas de evidencia y gates (`ui:check`, `tamanos`, `catalogo:build`).

## 3. Cierre

- [x] 3.1 Gates locales en verde; pendiente CI y despliegue.
- [x] 3.2 Archivar el change.
