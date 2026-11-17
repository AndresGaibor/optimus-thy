## Why

La bitácora es correcta pero cuesta recorrerla: cada fila lleva dos líneas, el código técnico compite con el nombre del evento, los metadatos empujan la acción a posiciones distintas y los cinco filtros ocupan una rejilla ancha. Un administrador tarda en encontrar un evento, reconocer qué ocurrió e inspeccionarlo.

## What Changes

- Fila de una línea por evento: fecha y hora tabulares, usuario, evento traducido, recurso y origen; el código técnico sale de la tabla.
- Columna final estrecha, alineada a la derecha, con «Ver detalle» y nombre accesible que incluye el evento y la fecha.
- El detalle deja de desplegarse dentro de la tabla: se abre en un panel lateral del `Dialog` (`side="right"`), que conserva filtros, orden, página y scroll al cerrarse.
- Los filtros pasan a `FilterBar` con Usuario, Evento y Recurso en la primera línea y el rango de fechas en la segunda; «Limpiar filtros» solo aparece con algún filtro activo.
- La línea «Más reciente primero · Horas en UTC» queda sobre la tabla; el conteo sigue en la paginación.

## Impact

- Solo frontend: `AuditoriaPage`, `AuditoriaTabla`, `AuditoriaFiltros`, `etiquetas-evento`, la variante `side` de `Dialog` y las historias y pruebas de ambas pantallas.
- Sin cambios de contrato, de esquema ni de permisos; el orden y la paginación siguen viniendo del servidor.
- No se añade búsqueda de texto libre: el backend no la soporta.
