## Por qué

TES-253 · HU-072 pide ver el historial de inferencias; la API ya lo expone (`GET /resultados` institucional y `GET /casos/{id}/inferencias`) y la pantalla no existía.

## Qué cambia

- Pantalla `/medico/historial` y `/medico/casos/:casoId/historial` con la API real, filtros de servidor y paginación.
- Entrada «Historial» en la navegación del rol médico.
- Estados de carga, vacío y error con reintento.

## Impacto

- Contrato de API: sin cambios.
- Esquema: sin cambios.
- Rutas nuevas en `AppRoutes.tsx`.
