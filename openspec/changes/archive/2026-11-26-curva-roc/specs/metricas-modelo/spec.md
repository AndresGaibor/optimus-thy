## ADDED Requirements

### Requirement: Presentar la curva ROC con tabla equivalente

La navegación investigadora MUST mostrar la curva ROC del modelo junto a su AUC y MUST ofrecer
una tabla equivalente con los puntos de la curva. La figura MUST comunicar que los datos son
sintéticos de demostración y MUST NOT presentarse como validación clínica.

#### Scenario: Ver la curva

- **GIVEN** el investigador abre `/investigador/metricas`
- **WHEN** la pantalla termina de cargar
- **THEN** ve la curva ROC con el valor de AUC escrito como texto
- **AND** la figura no depende del color para distinguir la curva de la diagonal de referencia

#### Scenario: Abrir la tabla equivalente

- **GIVEN** la curva ROC está visible
- **WHEN** el investigador activa «Ver tabla equivalente»
- **THEN** aparece una tabla con una fila por punto: tasa de falsos positivos y de verdaderos positivos
- **AND** la tabla se puede abrir y cerrar con el teclado

### Requirement: Presentar la distribución de probabilidades con tabla equivalente

La navegación investigadora MUST mostrar la distribución de probabilidades agrupada por
intervalos para las clases benigno y maligno, con leyenda escrita y una tabla equivalente con
los recuentos de cada intervalo.

#### Scenario: Ver la distribución

- **GIVEN** el investigador abre `/investigador/metricas`
- **WHEN** la pantalla termina de cargar
- **THEN** ve las barras agrupadas por intervalo con el recuento escrito de cada serie
- **AND** la leyenda nombra cada serie, así que la lectura no depende del color

#### Scenario: Abrir la tabla equivalente

- **GIVEN** la distribución está visible
- **WHEN** el investigador activa «Ver tabla equivalente»
- **THEN** aparece una tabla con una fila por intervalo y una columna por clase
