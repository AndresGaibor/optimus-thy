## ADDED Requirements

### Requirement: Listado de predicciones auditables

La API SHALL exponer las inferencias de la institución de quien consulta con su caso, modelo y versión, resultado, confianza, huella de la imagen y el usuario que lanzó el trabajo, sin exponer datos personales del paciente ni de los usuarios.

#### Scenario: Predicción con su contexto

- **WHEN** un investigador consulta las predicciones de su institución
- **THEN** cada fila trae fecha, código de caso, seudónimo del paciente, nombre y versión del modelo, resultado, confianza, huella SHA-256 de la imagen y el identificador y rol de quien lanzó la inferencia

#### Scenario: Predicción sin trabajo asociado

- **WHEN** una inferencia no tiene un trabajo que la referencie
- **THEN** la fila se devuelve con `lanzado_por` nulo y el resto de sus datos intactos

### Requirement: Referencia clínica y diferencia

La API SHALL cruzar cada predicción con la decisión médica registrada y SHALL clasificar la diferencia como `coincide`, `difiere` o `pendiente`, sin modificar el resultado del modelo.

#### Scenario: Referencia que acepta

- **WHEN** la decisión registrada es `acepta`
- **THEN** la fila trae la referencia clínica con su fecha y `diferencia` igual a `coincide`

#### Scenario: Referencia que corrige o descarta

- **WHEN** la decisión registrada es `corrige` o `descarta`
- **THEN** `diferencia` es `difiere`

#### Scenario: Sin decisión

- **WHEN** la inferencia aún no tiene decisión médica
- **THEN** `referencia_clinica` es nulo y `diferencia` es `pendiente`

### Requirement: Filtros y aislamiento por institución

La consulta SHALL aplicar los filtros `desde`, `hasta`, `resultado`, `decision`, `caso` y `modelo` en el servidor, SHALL paginar con `limite` y `desplazamiento` y SHALL devolver solo inferencias de casos de la institución de la sesión.

#### Scenario: Filtros combinados

- **WHEN** se envían un rango de fechas, un resultado y una diferencia
- **THEN** la respuesta solo incluye las predicciones que cumplen los tres filtros y el total refleja ese subconjunto

#### Scenario: Otra institución

- **WHEN** existen predicciones de casos de otra institución
- **THEN** no aparecen en la respuesta

#### Scenario: Parámetros inválidos

- **WHEN** el caso o el modelo no son identificadores válidos, la fecha inicial es posterior a la final o el resultado o la decisión no están en el catálogo
- **THEN** la respuesta es `422` con el sobre de error habitual

### Requirement: Permiso y bitácora de la consulta

La consulta SHALL exigir el permiso `investigacion.leer` y SHALL registrar el acceso como `INFERENCE.INFERENCE_READ` con el número de filas, sin copiar contenido clínico.

#### Scenario: Sin permiso

- **WHEN** un usuario sin `investigacion.leer` consulta las predicciones
- **THEN** la respuesta es `403`

#### Scenario: Consulta registrada

- **WHEN** la consulta devuelve filas
- **THEN** la bitácora guarda un evento `INFERENCE.INFERENCE_READ` con `resource_count`
