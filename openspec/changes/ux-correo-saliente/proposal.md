## Why

El correo saliente ya se configura y la plantilla se edita por campos, pero la página aún deja huecos que se notan en el uso diario: la prueba de envío manda un texto genérico en vez de la plantilla que se está editando, no se sabe si el servidor sigue funcionando, se puede salir con cambios a medias y la vista previa solo se ve a lo ancho de un escritorio.

## What Changes

- **La prueba de envío usa la plantilla vigente**: se envía al administrador el correo tal como está guardado, con su diseño y con un enlace a la página pública de recuperación.
- **Estado de salud del correo**: la página muestra si el correo está activo y cuándo fue la última prueba y si salió bien. Se guarda en la configuración (migración 0017).
- **Cambios sin guardar**: la plantilla avisa cuando el borrador difiere de lo guardado y «Guardar plantilla» solo se habilita si hay algo que guardar.
- **Marcador en el asunto**: el asunto se edita como un campo más y admite el nombre de quien recibe el correo.
- **Vista previa en ancho móvil**: se puede ver el correo a 320 px, que es como lo leerá la mayoría.

## Impact

- Base de datos: `ultima_prueba_en` y `ultima_prueba_ok` en `configuracion_correo` (migración 0017).
- API: `ConfiguracionOut` gana ambos campos; `POST /configuracion-correo/probar` ahora envía la plantilla vigente.
- Interfaz: `CorreoPage`, `CorreoPlantillaForm`, `CorreoVistaPrevia`, `useCorreo`, `usePlantillaCorreo` y un hook nuevo `useServidorCorreo`.
- Sin dependencias nuevas.
