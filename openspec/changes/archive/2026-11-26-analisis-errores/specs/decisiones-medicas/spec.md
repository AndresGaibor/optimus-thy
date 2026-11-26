# Spec Delta: decisiones-medicas

## MODIFIED Requirements

### Requirement: Registro de la conclusión médica

La API SHALL permitir registrar una única conclusión por inferencia, con `acepta`, `corrige` o `descarta`, observaciones opcionales y el usuario del token como autor. La conclusión no SHALL modificar la inferencia. Cuando sea `corrige`, SHALL exigir `resultado_corregido` (`benigno`, `maligno` o `sin_nodulo`) distinto del resultado del modelo y SHALL devolverlo junto al resultado predicho.

#### Scenario: Conclusión registrada

- **WHEN** el médico envía una conclusión válida sobre una inferencia de un caso suyo
- **THEN** la decisión queda guardada con su autor y su fecha, y la inferencia no cambia

#### Scenario: Segunda conclusión

- **WHEN** ya existe una decisión para esa inferencia
- **THEN** la respuesta es `409` y la decisión original se conserva

#### Scenario: Corrección sin resultado clínico

- **WHEN** el médico envía `corrige` sin `resultado_corregido`, o con el mismo resultado del modelo
- **THEN** la respuesta es `422` y no se guarda la decisión

#### Scenario: Resultado corregido aceptado

- **WHEN** el médico corrige una predicción `benigno` a `maligno`
- **THEN** la decisión guarda `resultado_corregido = maligno` y lo devuelve con el resultado del modelo

#### Scenario: Inferencia de otro caso

- **WHEN** la inferencia no pertenece al caso indicado
- **THEN** la respuesta es `404`

#### Scenario: Observaciones fuera de rango

- **WHEN** las observaciones tienen menos de 10 o más de 2000 caracteres
- **THEN** la respuesta es `422`
