# analisis-errores Specification

## Purpose
Permitir al personal investigador consultar los falsos positivos y negativos del modelo y registrar la corrección de una clasificación con su resultado clínico.

## Requirements

### Requirement: Corrección con resultado clínico

El API MUST aceptar `resultado_corregido` (`benigno`, `maligno` o `sin_nodulo`) solo cuando `decision = corrige`, y MUST responder 422 si falta en una corrección o si coincide con el resultado del modelo. La decisión MUST guardarlo y MUST devolverlo junto al resultado del modelo, sin modificar la inferencia.

#### Scenario: Corrección válida

- **GIVEN** una inferencia con resultado `benigno` y una sesión con `inferencia.ejecutar`
- **WHEN** el usuario registra `decision = corrige` con `resultado_corregido = maligno`
- **THEN** el API responde 201 con `resultado = benigno` y `resultado_corregido = maligno`

#### Scenario: Corrección incompleta

- **GIVEN** la misma inferencia
- **WHEN** el usuario registra `decision = corrige` sin `resultado_corregido`
- **THEN** el API responde 422 y no guarda la decisión

#### Scenario: Resultado corregido igual al modelo

- **GIVEN** una inferencia con resultado `benigno`
- **WHEN** el usuario corrige a `benigno`
- **THEN** el API responde 422 con el código `correccion_sin_cambio`

### Requirement: Consulta de falsos positivos y negativos

El API MUST exponer `GET /investigacion/errores` con el permiso `investigacion.leer`, limitado a la institución del usuario. MUST considerar solo correcciones con `resultado_corregido`, clasificar como falso positivo la predicción `maligno` corregida a otro resultado y como falso negativo la predicción no maligna corregida a `maligno`, y MUST devolver el total, los conteos por tipo y los elementos paginados. Los filtros `tipo`, `modelo`, `desde` y `hasta` MUST acotar la consulta.

#### Scenario: Reparto de errores

- **GIVEN** una predicción `maligno` corregida a `benigno` y otra `benigno` corregida a `maligno`
- **WHEN** el investigador consulta sin filtros
- **THEN** el API responde 200 con `falsos_positivos = 1`, `falsos_negativos = 1` y dos elementos

#### Scenario: Filtro por tipo

- **GIVEN** las mismas predicciones
- **WHEN** el investigador consulta `tipo = falso_negativo`
- **THEN** el API responde 200 con `total = 1` y el elemento de tipo `falso_negativo`

#### Scenario: Otra institución

- **GIVEN** correcciones de otra institución
- **WHEN** un médico sin `investigacion.leer` consulta el endpoint
- **THEN** el API responde 403 y no expone datos ajenos
