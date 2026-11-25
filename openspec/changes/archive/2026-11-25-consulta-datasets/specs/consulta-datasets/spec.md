## ADDED Requirements

### Requirement: Consulta de datasets anonimizados

El sistema SHALL listar los datasets de la institución de la sesión y permitir abrir uno para ver sus filas anonimizadas.

#### Scenario: Lista de conjuntos

- **WHEN** el investigador abre `/investigador/datasets`
- **THEN** ve cada conjunto con nombre, descripción, total de casos, k, huella y fecha
- **AND** la huella se muestra abreviada y completa en el título del elemento

#### Scenario: Detalle con filas anonimizadas

- **WHEN** el investigador elige un conjunto
- **THEN** se muestran sus filas anonimizadas: sujeto, edad agrupada, mes, analíticas, nódulo, TI-RADS, Bethesda y diagnóstico

#### Scenario: Dataset inexistente

- **WHEN** el conjunto ya no existe o es de otra institución
- **THEN** el detalle muestra «El dataset ya no está disponible» con opción de reintentar

### Requirement: Estados de la consulta

La lista y el detalle SHALL mostrar carga, vacío y error con reintento, sin depender solo del color.

#### Scenario: Error de red en la lista

- **WHEN** la petición de la lista falla
- **THEN** se muestra un aviso con acción de reintento
