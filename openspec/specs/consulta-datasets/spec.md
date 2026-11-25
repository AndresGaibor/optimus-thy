# consulta-datasets Specification

## Purpose
TBD - created by archiving change consulta-datasets. Update Purpose after archive.

## Requirements

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

### Requirement: k efectivo por clase de equivalencia

El API MUST agrupar por la combinación de `edad_rango`, `mes_caso`, `mes_tsh`, `mes_t3`, `mes_t4`, `lateralidad`, `tirads`, `bethesda`, `cie10`, `tipo_diagnostico` y `tipo_consulta`, sin incluir `sujeto`. Las hormonas y el tamaño del nódulo son atributos sensibles, no parte de la clave. `k_efectivo` es el mínimo de filas por clase.

#### Scenario: Dataset con clases suficientes

- **GIVEN** cada clase tiene al menos `k` filas y `k` es igual o mayor que 5
- **WHEN** el investigador crea el dataset
- **THEN** el API responde 201 e incluye `k_efectivo` con un valor igual o mayor que `k`

#### Scenario: Una o más clases no alcanzan k

- **GIVEN** el total de filas alcanza `k` pero existen clases con menos de `k` filas
- **WHEN** el investigador crea el dataset
- **THEN** el API responde 422 con código `k_no_alcanzado` e indica el número de clases incumplidas sin revelar valores ni filas

#### Scenario: k inferior al mínimo

- **GIVEN** el investigador solicita un valor de `k` inferior a 5
- **WHEN** crea el dataset
- **THEN** el API responde 422 con código `k_insuficiente`
