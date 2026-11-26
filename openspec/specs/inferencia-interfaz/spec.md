# inferencia-interfaz Specification

## Purpose
Ejecutar la inferencia desde la ficha del caso, presentar el resultado por nódulo y recordar que apoya el diagnóstico sin sustituirlo.

## Requirements

### Requirement: Ejecución de la inferencia desde la ficha

La pantalla SHALL permitir elegir una imagen del caso y lanzar su inferencia, mostrando el progreso del trabajo hasta que termine o falle.

#### Scenario: Imagen elegida y trabajo encolado

- **WHEN** el médico elige una imagen del caso y lanza la inferencia
- **THEN** se crea el trabajo y la pantalla muestra su estado, sin salir de la página

#### Scenario: Sin consentimiento vigente

- **WHEN** el caso no tiene consentimiento vigente de atención de salud
- **THEN** la pantalla bloquea la ejecución y explica el motivo, sin llamar al servicio de IA

#### Scenario: Caso sin imágenes

- **WHEN** el caso no tiene ninguna imagen
- **THEN** la pantalla muestra el estado vacío con la acción de cargar una ecografía

### Requirement: Resultado por nódulo

La pantalla SHALL mostrar, por cada nódulo, su índice, clase, probabilidad de benigno y maligno, confianza del detector y caja; SHALL mostrar los artefactos solo cuando el contrato los trae.

#### Scenario: Contrato con nódulos

- **WHEN** la inferencia termina con nódulos
- **THEN** cada nódulo aparece con su clase, sus dos probabilidades y su caja
- **AND** los artefactos disponibles se ofrecen para abrir

#### Scenario: Contrato sin nódulos

- **WHEN** la inferencia termina sin nódulos detectados
- **THEN** la pantalla lo indica como «sin nódulo detectado» y no muestra tarjetas vacías

### Requirement: Aviso de apoyo y no diagnóstico

El resultado SHALL llevar el aviso de que es apoyo a la decisión y no un diagnóstico.

#### Scenario: Resultado visible

- **WHEN** se muestra cualquier resultado de inferencia
- **THEN** el aviso «apoyo, no diagnóstico» está presente y es legible

### Requirement: Estados explícitos

La pantalla SHALL cubrir carga, vacío y error con reintento, y SHALL no comunicar estados solo con color.

#### Scenario: Falla del servicio de IA

- **WHEN** el trabajo termina en error o el servicio no responde
- **THEN** la pantalla muestra un mensaje sin detalles internos y ofrece reintentar
