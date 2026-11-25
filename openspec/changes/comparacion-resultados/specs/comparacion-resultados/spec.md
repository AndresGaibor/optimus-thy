## ADDED Requirements

### Requirement: Comparación de resultados por imagen

El sistema SHALL agrupar las inferencias por imagen y comparar, para cada imagen, el resultado de cada modelo y versión que la haya analizado.

#### Scenario: Dos modelos coinciden

- **WHEN** una imagen tiene inferencias de dos versiones distintas con la misma clase
- **THEN** el grupo se marca «Coinciden»
- **AND** cada fila muestra modelo con versión, resultado, confianza y probabilidades

#### Scenario: Dos modelos difieren

- **WHEN** una imagen tiene inferencias de dos versiones con clases distintas
- **THEN** el grupo se marca «Difieren»
- **AND** el filtro «Solo discrepancias» deja solo esos grupos

#### Scenario: Una sola inferencia

- **WHEN** la imagen solo tiene inferencias de una versión de modelo
- **THEN** el grupo se marca «Sin comparación»

### Requirement: La comparación no es una recomendación

La pantalla SHALL mostrar de forma permanente que la comparación no constituye una recomendación clínica.

#### Scenario: Aviso visible

- **WHEN** el médico abre `/medico/comparacion`
- **THEN** el aviso «No es una recomendación clínica» está visible junto a la tabla
