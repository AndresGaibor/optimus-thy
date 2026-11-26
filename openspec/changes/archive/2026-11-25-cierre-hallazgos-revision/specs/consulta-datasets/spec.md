## ADDED Requirements

### Requirement: k efectivo en el listado sin cargar filas

El listado de datasets SHALL obtener `k_efectivo` con una agregación en la base
de datos sobre la misma clave de equivalencia que usa la creación: `edad_rango`,
`mes_caso`, `mes_tsh`, `mes_t3`, `mes_t4`, `lateralidad`, `tirads`, `bethesda`,
`cie10`, `tipo_diagnostico` y `tipo_consulta`, sin `sujeto` ni atributos
sensibles. El listado no SHALL cargar las filas de cada dataset en memoria y su
coste SHALL depender del número de datasets y de filas, sin resultados
descartables en el cliente.

#### Scenario: Listado con datasets grandes

- **GIVEN** una institución con varios datasets de miles de filas
- **WHEN** el investigador abre la lista
- **THEN** cada conjunto muestra su `k_efectivo` y la consulta se resuelve con
  una agregación agrupada en la base de datos

#### Scenario: Coherencia con la creación

- **GIVEN** un dataset creado por el API
- **WHEN** se compara su `k_efectivo` de creación con el del listado
- **THEN** ambos valores coinciden
