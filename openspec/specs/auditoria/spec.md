# auditoria Specification

## Purpose
Permitir que el administrador investigue qué pasó en la institución leyendo la bitácora sin traducir códigos técnicos y sin perder el dato original.

## Requirements

### Requirement: Eventos de auditoría legibles sin perder el código

La bitácora SHALL mostrar una descripción comprensible de cada evento conocido como información principal y SHALL conservar el código técnico original como información secundaria. Un código desconocido SHALL mostrarse tal cual, sin inventar una descripción.

#### Scenario: Evento conocido

- **WHEN** el evento es `AUTH.SESSION_START`
- **THEN** la fila muestra «Sesión iniciada» y el código `AUTH.SESSION_START`

#### Scenario: Evento desconocido

- **WHEN** llega un código que no está en el catálogo
- **THEN** la fila muestra el código sin descripción inventada

### Requirement: Fecha y hora sin cortes y en una zona horaria declarada

La bitácora SHALL mostrar la fecha y la hora en una sola línea, en formato de 24 horas, y SHALL indicar que tanto los valores como los filtros de fecha están en UTC.

#### Scenario: Fila con fecha

- **WHEN** se muestra un evento
- **THEN** fecha y hora caben en una línea y la cabecera de la columna dice UTC

### Requirement: Detalle técnico disponible sin salir de la página

La bitácora SHALL permitir abrir y cerrar el detalle técnico de cada evento desde su propia fila, sin navegar a otra página, y SHALL mantener la pantalla como solo lectura.

#### Scenario: Abrir detalle

- **WHEN** el administrador activa «Ver detalle» en una fila
- **THEN** se muestran el código, el módulo, el recurso con su identificador y los metadatos
- **AND** la acción cambia a «Ocultar» y el estado se anuncia con `aria-expanded`

### Requirement: Origen de la solicitud

El backend SHALL obtener la dirección del cliente a través de las cabeceras del proxy y SHALL confiar en ellas solo cuando la solicitud provenga de la dirección del proxy configurada.

#### Scenario: Solicitud a través del proxy

- **WHEN** Traefik reenvía una solicitud con `X-Forwarded-For`
- **THEN** el evento registra la dirección del cliente, no la del proxy

#### Scenario: Solicitud de un par no confiable

- **WHEN** la solicitud llega de una dirección distinta de la del proxy
- **THEN** el backend no usa las cabeceras de reenvío
