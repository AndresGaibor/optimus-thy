# Specification: puntuación UnUQ

## ADDED Requirements

### Requirement: cálculo conforme al artículo

El cálculo del UnUQ SHALL convertir cada respuesta de la escala 1–5 en una contribución de 0–4, SHALL invertir los siete ítems negativos (S3, S6, S8, S13, S16, S18 y S22) y SHALL normalizar la suma sobre 88 con el factor 100/88, redondeando a entero.

#### Scenario: respuestas uniformes en el punto medio
- **GIVEN** veintidós respuestas con valor 3
- **WHEN** se calcula la puntuación
- **THEN** el resultado es 50

#### Scenario: ítem negativo con la puntuación máxima
- **GIVEN** veintidós respuestas con valor 5 salvo un ítem negativo con valor 1
- **WHEN** se calcula la puntuación
- **THEN** el resultado es 100

#### Scenario: entrada incompleta
- **GIVEN** una lista de respuestas vacía
- **WHEN** se calcula la puntuación
- **THEN** el resultado es 0 y no se lanza una excepción

### Requirement: desglose por atributo

El desglose SHALL agrupar los ítems en los siete atributos del artículo y SHALL presentar, por atributo, el promedio de contribuciones en escala 0–4 y su equivalente 0–100, con el peso 1/7.

#### Scenario: utilidad con respuestas altas
- **GIVEN** veintidós respuestas con valor 4
- **WHEN** se resume el atributo Utilidad, formado por S1, S2 y el ítem invertido S3
- **THEN** el promedio es 2,33 y el puntaje del atributo es 58

### Requirement: material de aplicación

El repositorio SHALL contener el kit de evaluación en `docs/pruebas/unuq/` con protocolo, consentimiento informado, tareas por rol, cuestionario de veintidós ítems con la escala y la clave de inversión, hoja de respuestas sin datos personales y reglas de cálculo y análisis con la escala descriptiva del artículo.

#### Scenario: sesión aplicable sin el sistema
- **GIVEN** el kit versionado
- **WHEN** un tesista prepara la sesión con diez evaluadores
- **THEN** dispone de consentimiento, tareas, cuestionario, hoja de respuestas y reglas de cálculo sin depender de la pantalla de demostración

### Requirement: una sola definición del instrumento

El instrumento UnUQ SHALL definirse en un único módulo; las definiciones duplicadas con otra fórmula SHALL eliminarse.

#### Scenario: fixture duplicado retirado
- **GIVEN** `casos-extra.ts` definía ítems, respuestas y funciones UnUQ alternativas
- **WHEN** se busca el cálculo del instrumento
- **THEN** solo `unuq-extra.ts` lo define y ninguna pantalla usa la copia
