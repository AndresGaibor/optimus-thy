# Spec Delta: consulta-datasets

## ADDED Requirements

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
