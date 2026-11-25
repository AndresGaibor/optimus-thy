# Métricas de acuerdo del modelo

## ADDED Requirements

### Requirement: Consultar el acuerdo entre modelo y decisión médica

El sistema MUST ofrecer al investigador con permiso `investigacion.leer` un agregado de las inferencias de su institución, agrupado por modelo, con filtros opcionales `desde`, `hasta` (fechas ISO inclusivas) y `modelo` (UUID). La consulta MUST quedar registrada en la bitácora.

#### Scenario: Aislar la institución y exigir permiso

- **GIVEN** una institución tiene inferencias que pertenecen a otra institución
- **WHEN** su investigador consulta el agregado
- **THEN** las decisiones de la otra institución no alteran ningún conteo
- **AND** una cuenta sin `investigacion.leer` recibe una respuesta 403

### Requirement: Calcular el acuerdo y el desglose por resultado

Cada modelo de la respuesta MUST incluir nombre, versión y huella de pesos; total, acepta, corrige, descarta y pendiente; `acuerdo` igual a acepta / total redondeado a cuatro decimales, nulo cuando total es cero; y esos conteos para cada resultado `benigno`, `maligno` y `sin_nodulo`. La respuesta MUST NOT presentar estos datos como sensibilidad, especificidad ni validación clínica.

#### Scenario: Agregar acuerdo y desglose por clase

- **GIVEN** existen inferencias de distintos resultados, con decisiones aceptadas, corregidas, descartadas y pendientes
- **WHEN** un investigador consulta las métricas sin filtros
- **THEN** recibe un agregado por modelo, el acuerdo sobre el total de inferencias y el desglose de cada decisión por resultado
- **AND** una versión del modelo sin inferencias presenta total cero y acuerdo nulo

#### Scenario: Filtrar por fechas y modelo

- **GIVEN** existen inferencias en distintas fechas y versiones de modelo
- **WHEN** el investigador indica fechas inicial y final, y el UUID de un modelo
- **THEN** el agregado incluye solo las inferencias de esa institución dentro del período inclusivo y de ese modelo

### Requirement: Presentar métricas de acuerdo en la navegación investigadora

El sistema MUST ofrecer `/investigador/metricas` bajo el rol investigador, con filtros de fechas y modelo y una tabla accesible con resumen por modelo y desglose por resultado. La pantalla comunica que el acuerdo no es una métrica de validación clínica.

#### Scenario: Carga

- **GIVEN** el investigador abre la pantalla
- **WHEN** la consulta sigue en curso
- **THEN** se muestra una estructura de carga Skeleton con un estado accesible de carga

#### Scenario: Sin métricas

- **GIVEN** la consulta devuelve una lista vacía
- **WHEN** termina la carga
- **THEN** se presenta un estado vacío comprensible, sin una tabla de resultados

#### Scenario: Error recuperable

- **GIVEN** la consulta falla
- **WHEN** termina la carga
- **THEN** se muestra un mensaje seguro y una acción para reintentar
- **AND** al reintentar se vuelve a consultar la API

#### Scenario: Aplicar filtros

- **GIVEN** hay modelos disponibles y el investigador cambia fecha o modelo
- **WHEN** se aplican los filtros
- **THEN** la petición a la API envía los valores seleccionados
- **AND** el resultado refleja solo los criterios indicados
