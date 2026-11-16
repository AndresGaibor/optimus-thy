# resultados-inferencia Specification

## Purpose
Que el médico vea en pantalla el resultado de la inferencia con toda su evidencia.

## Requirements

### Requirement: Consulta de resultados por caso

El sistema SHALL devolver las inferencias de un caso con sus nódulos y enlaces firmados a los artefactos, solo a usuarios con permiso `inferencia.leer` y solo dentro de su institución.

#### Scenario: Caso con inferencias

- **WHEN** el médico consulta `GET /casos/{id}/inferencias` de un caso propio
- **THEN** el sistema responde con cada inferencia ordenada de la más reciente a la más antigua
- **AND** cada nódulo trae clase, probabilidades, caja, región, píxeles y enlaces firmados a máscara, MGAC, XML y superposición

#### Scenario: Caso ajeno o inexistente

- **WHEN** el caso no existe o pertenece a otra institución
- **THEN** el sistema responde 404, igual que si no existiera

### Requirement: Revisión del resultado por nódulo

La pantalla del caso SHALL mostrar cada nódulo con su clase y probabilidad en texto, sus imágenes derivadas y un aviso permanente de que el resultado es apoyo y no diagnóstico.

#### Scenario: Nódulo con artefactos

- **WHEN** el médico abre un caso con una inferencia completada
- **THEN** ve la caja, la clase, la probabilidad, la máscara, el MGAC, el XML y la superposición de cada nódulo
- **AND** el aviso «apoyo, no diagnóstico» está visible sin desplazarse

#### Scenario: Sin inferencias

- **WHEN** el caso no tiene inferencias
- **THEN** la pantalla muestra un estado vacío que invita a analizar una ecografía
