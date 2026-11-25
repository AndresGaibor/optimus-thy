## Por qué

TES-369 · HU-061 pide un visor de imágenes dentro del caso; la galería actual no permite ampliar, recorrer ni descargar con metadatos.

## Qué cambia

- Diálogo de visor con zoom, ajuste a ventana, navegación anterior/siguiente, metadatos y descarga mediante la URL firmada.
- Botón «Abrir visor» en la sección de ecografías del caso.

## Impacto

- Contrato de API: sin cambios; usa `GET /casos/{id}/imagenes`.
- Esquema: sin cambios.
