## ADDED Requirements

### Requirement: Historial de inferencias sobre la API real

El sistema SHALL mostrar el historial de inferencias del rol médico usando únicamente datos del backend: `GET /resultados` en modo institucional, con los filtros que ese endpoint acepta (`paciente`, `desde`, `hasta`, `clase`, `limite`, `desplazamiento`), y `GET /casos/{caso_id}/inferencias` en modo caso.

#### Scenario: Listado institucional con paginación del servidor

- **WHEN** el médico abre `/medico/historial`
- **THEN** la pantalla pide `GET /resultados` con `limite` y `desplazamiento`
- **AND** cada fila muestra fecha, imagen, resultado con texto, confianza y modelo con su versión

#### Scenario: Filtro por clase

- **WHEN** el médico elige la clase «maligno»
- **THEN** la petición incluye `clase=maligno`
- **AND** la tabla muestra solo las filas devueltas por el servidor

#### Scenario: Historial de un caso

- **WHEN** el médico abre `/medico/casos/{caso_id}/historial`
- **THEN** la pantalla pide `GET /casos/{caso_id}/inferencias`
- **AND** la paginación se resuelve en memoria y se ofrece «Volver al caso»

### Requirement: Estados de la pantalla

La pantalla SHALL mostrar carga, vacío y error con reintento, sin depender solo del color.

#### Scenario: Fallo de red

- **WHEN** la petición falla
- **THEN** se muestra un mensaje de error con acción de reintento
- **AND** el reintento vuelve a lanzar la misma petición
