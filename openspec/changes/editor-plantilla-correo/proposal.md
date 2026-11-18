## Why

El editor de la plantilla de recuperación es un área de texto con HTML crudo: se rompe al escribir una etiqueta de más, no muestra cómo se verá en un cliente de correo y obliga a conocer el diseño del mensaje de memoria. Para un administrador sin perfil técnico, editar el correo es hoy la parte más difícil de la pantalla.

## What Changes

- **Modo Diseño** (nuevo, predeterminado): el administrador edita cinco campos en lenguaje natural —encabezado, mensaje, texto del botón, nota del enlace y pie— y el sistema compone el HTML con un diseño fijo, tabular y compatible con clientes de correo. El enlace y la caducidad se insertan solos.
- **Modo HTML** (se conserva): para quien necesita control total; la plantilla guardada se sigue enviando tal cual.
- **Vista previa fiel**: la dibuja el servidor con los mismos datos que usará el envío, dentro de una maqueta de bandeja de entrada (remitente, asunto y cuerpo). Lo que se ve es lo que llega.
- El cambio entre modos no pierde trabajo: el HTML compuesto desde los campos se guarda junto a ellos.

## Impact

- Base de datos: columnas `modo` y `campos` en `plantillas_correo` (migración 0016).
- API: `PlantillaIn`/`PlantillaOut` ganan `modo` y `campos`; nuevo `POST /plantillas-correo/{clave}/preview` (no envía nada) que devuelve asunto y HTML renderizados con datos de ejemplo.
- Interfaz: `CorreoPlantillaForm` y `useCorreo`.
- Sin dependencias nuevas y sin tocar el envío: `enviar_recuperacion` sigue leyendo el HTML guardado.
