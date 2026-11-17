# auditoria Specification

## Purpose
Permitir que el administrador investigue qué pasó en la institución leyendo la bitácora sin traducir códigos técnicos y sin perder el dato original.

## Requirements

### Requirement: Eventos de auditoría legibles sin perder el código

La bitácora SHALL mostrar una descripción comprensible de cada evento conocido como información principal de la fila, y SHALL conservar el código técnico original en el detalle del evento, no en la tabla. Un código desconocido SHALL mostrarse tal cual, sin inventar una descripción.

#### Scenario: Evento conocido

- **WHEN** el evento es `AUTH.SESSION_START`
- **THEN** la fila muestra «Sesión iniciada» en una sola línea
- **AND** el código `AUTH.SESSION_START` aparece al abrir el detalle

#### Scenario: Evento desconocido

- **WHEN** llega un código que no está en el catálogo
- **THEN** la fila y el detalle muestran el código sin descripción inventada

### Requirement: Fecha y hora sin cortes y en una zona horaria declarada

La bitácora SHALL mostrar la fecha y la hora en una sola línea, en formato de 24 horas, y SHALL indicar que tanto los valores como los filtros de fecha están en UTC.

#### Scenario: Fila con fecha

- **WHEN** se muestra un evento
- **THEN** fecha y hora caben en una línea y la cabecera de la columna dice UTC

### Requirement: Detalle técnico disponible sin salir de la página

La bitácora SHALL abrir el detalle técnico de un evento en un panel lateral modal, con nombre accesible propio, sin navegar fuera de la pantalla. Al cerrarlo SHALL conservar los filtros, el orden, la página y la posición de la lista. La pantalla SHALL seguir siendo de solo lectura.

#### Scenario: Abrir detalle

- **WHEN** el administrador activa «Ver detalle» en una fila
- **THEN** se abre un panel lateral con fecha, usuario, evento, código, módulo, recurso, origen y metadatos
- **AND** el panel se anuncia como diálogo con nombre accesible

#### Scenario: Cerrar detalle

- **WHEN** el administrador cierra el panel con el botón de cierre o con Escape
- **THEN** los filtros, el orden, la página y la posición de la lista quedan como estaban

### Requirement: Barra de filtros y densidad de la tabla

La bitácora SHALL agrupar Usuario, Evento, Recurso, Desde y Hasta en una barra con nombre accesible y SHALL ofrecer «Limpiar filtros» solo cuando haya algún filtro activo. La tabla SHALL presentar una línea por evento con la acción en una columna final alineada a la derecha, y SHALL indicar el orden y la zona horaria junto a la tabla.

#### Scenario: Filtros activos

- **WHEN** el administrador aplica al menos un filtro
- **THEN** aparece «Limpiar filtros» y, al activarlo, los cinco filtros vuelven a su valor inicial

#### Scenario: Fila con acción fija

- **WHEN** un evento tiene metadatos de distinta longitud
- **THEN** «Ver detalle» sigue en la última columna, alineada a la derecha

### Requirement: Origen de la solicitud

El backend SHALL obtener la dirección del cliente a través de las cabeceras del proxy y SHALL confiar en ellas solo cuando la solicitud provenga de la dirección del proxy configurada.

#### Scenario: Solicitud a través del proxy

- **WHEN** Traefik reenvía una solicitud con `X-Forwarded-For`
- **THEN** el evento registra la dirección del cliente, no la del proxy

#### Scenario: Solicitud de un par no confiable

- **WHEN** la solicitud llega de una dirección distinta de la del proxy
- **THEN** el backend no usa las cabeceras de reenvío
