## Why

HU-062 (TES-370) pide asociar varias imágenes a un caso y elegir cuál se usa en la inferencia. El backend ya acepta cargas repetidas y guarda cada archivo como una fila independiente, pero el listado devolvía primero la más antigua y la interfaz solo permitía elegir y subir un archivo por diálogo, sin estado ni error por archivo.

## What Changes

- **Subida múltiple**: el diálogo acepta varios PNG o JPEG, los sube en orden y muestra el estado de cada archivo (en cola, subiendo, lista, error, rechazado).
- **Errores por archivo**: un archivo inválido o una subida fallida queda marcada con su motivo y no oculta ni descarta las demás; el botón pasa a «Reintentar subida» y reintenta solo los pendientes o fallidos.
- **Progreso real del lote**: contador de archivos listos y barra de avance mientras se sube el lote.
- **Orden estable**: `GET /casos/{id}/imagenes` devuelve primero la más reciente, con `id` como desempate.
- **Sin límite inventado**: el backend no limita cuántas imágenes admite un caso; solo limita el tamaño y el formato de cada archivo. Se documenta tal cual.

## Impact

- Interfaz: `DialogoSubida`, `useSubidaEcografia`, `CasoPage` (reutiliza el diálogo compartido) y `VistaDelCaso`.
- API: `GET /casos/{id}/imagenes` cambia el orden de los elementos; no cambia el contrato ni añade rutas.
- Sin dependencias nuevas, migraciones ni límites por caso.
