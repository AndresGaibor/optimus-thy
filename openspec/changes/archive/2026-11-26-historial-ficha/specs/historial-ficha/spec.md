# Spec Delta

## Purpose

Permitir consultar quién modificó una ficha clínica, cuándo ocurrió cada guardado y qué valores cambiaron, con acceso controlado y registro auditable.

## ADDED Requirements

### Requirement: Versionado atribuible de la ficha

La API SHALL registrar una versión por cada guardado que cambie efectivamente la ficha. Cada versión SHALL identificar al autor, la fecha y hora, los campos modificados y los valores anteriores y posteriores. Un guardado sin cambios efectivos SHALL no crear una versión. La bitácora SHALL registrar el evento y los nombres de campos, nunca los valores clínicos.

#### Scenario: Guardado con cambios

- **WHEN** una persona con permiso `ficha.escribir` guarda uno o más campos distintos a los actuales
- **THEN** se registra una versión con autor, fecha y hora, campos modificados y estado anterior y posterior
- **AND** la bitácora registra el cambio sin valores clínicos

#### Scenario: Guardado idempotente

- **WHEN** se guarda una ficha con los mismos valores actuales
- **THEN** la respuesta conserva el estado existente y no se crea una versión adicional

#### Scenario: Cuerpo vacío

- **WHEN** se intenta guardar sin campos
- **THEN** la API responde `422` y no modifica la ficha ni crea una versión

### Requirement: Consulta de versiones y comparación

La API SHALL exponer `GET /casos/{caso_id}/ficha/historial` para devolver las versiones del caso en orden descendente, con autor, fecha y hora, campos modificados y valores anteriores y posteriores. La consulta SHALL requerir `ficha.leer`, SHALL limitarse a la institución activa y SHALL auditarse como lectura del recurso.

#### Scenario: Historial disponible

- **WHEN** una persona autorizada consulta el historial de su institución
- **THEN** recibe las versiones de más reciente a más antigua con el antes y el después de cada cambio

#### Scenario: Caso de otra institución

- **WHEN** se consulta el historial de un caso ajeno a la institución activa
- **THEN** la API responde `404` sin revelar que el caso existe

#### Scenario: Sin permiso de lectura

- **WHEN** una persona sin `ficha.leer` consulta el historial
- **THEN** la API responde `403` y no devuelve datos de la ficha

### Requirement: Panel de historial en el caso

La pantalla del caso SHALL mostrar las versiones disponibles con autor, fecha, campos modificados y comparación antes/después. SHALL comunicar los estados de carga, vacío y error sin ocultar el contenido clínico ante una falla de red.

#### Scenario: Historial con versiones

- **WHEN** se abre el panel de historial de un caso que tiene versiones
- **THEN** se muestran las versiones y la comparación de cada campo modificado

#### Scenario: Historial vacío

- **WHEN** el caso todavía no tiene versiones
- **THEN** el panel informa que aún no hay cambios registrados
