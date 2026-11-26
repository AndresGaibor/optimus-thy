# cierre-ficha Specification

## Purpose
Controlar el cierre y la reapertura de la ficha clínica, impedir correcciones mientras permanezca cerrada y dejar constancia auditable de cada transición.

## Requirements

### Requirement: Cierre y reapertura atribuibles

La API SHALL permitir cerrar y reabrir una ficha registrada, conservando la fecha y el usuario de cierre mientras esté cerrada. Cerrar y reabrir SHALL requerir `ficha.escribir` y SHALL registrar cada transición en la bitácora sin almacenar valores clínicos.

#### Scenario: Cierre autorizado

- **WHEN** una persona con `ficha.escribir` cierra una ficha abierta
- **THEN** la ficha queda cerrada con fecha y usuario, y el evento queda auditado

#### Scenario: Reapertura autorizada

- **WHEN** una persona con `ficha.escribir` reabre una ficha cerrada
- **THEN** la ficha queda abierta, se limpian sus datos de cierre y la transición queda auditada

#### Scenario: Usuario sin permiso

- **WHEN** una persona sin `ficha.escribir` intenta cerrar o reabrir una ficha
- **THEN** la API responde `403` y el estado de la ficha no cambia

#### Scenario: Ficha inexistente

- **WHEN** se intenta cerrar una ficha aún no registrada
- **THEN** la API responde `404` y no crea una ficha vacía

### Requirement: Protección de ficha cerrada

Mientras una ficha esté cerrada, la API SHALL rechazar cualquier guardado de sus campos con `409` y `error.code = "ficha_cerrada"`, sin modificar campos ni crear una versión. La reapertura SHALL requerir el mismo permiso `ficha.escribir` de edición.

#### Scenario: Guardado bloqueado

- **WHEN** una persona con permiso de edición intenta guardar una ficha cerrada
- **THEN** la API responde `409` con código `ficha_cerrada` y conserva sus datos

#### Scenario: Reapertura antes de editar

- **WHEN** una persona con `ficha.escribir` reabre la ficha y después guarda un cambio
- **THEN** la API acepta el cambio y registra una nueva versión

### Requirement: Confirmación de cierre en la pantalla del caso

La pantalla del caso SHALL mostrar la condición abierta o cerrada y ofrecer la acción correspondiente mediante una confirmación accesible antes de cambiar el estado.

#### Scenario: Confirmar cierre

- **WHEN** la persona elige cerrar una ficha y confirma el diálogo
- **THEN** se solicita el cierre, se actualiza el estado visible y se informa el resultado

#### Scenario: Cancelar cierre

- **WHEN** la persona cancela el diálogo de cierre
- **THEN** la ficha conserva su estado actual

#### Scenario: Reabrir ficha

- **WHEN** una ficha cerrada se reabre con confirmación
- **THEN** la pantalla muestra la ficha abierta y habilita las acciones de edición
