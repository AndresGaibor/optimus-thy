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

### Requirement: Exportación filtrada de la bitácora

El sistema SHALL exponer `GET /auditoria/exportar`, que devuelve un CSV en UTF-8 con las columnas del listado menos la dirección IP, aplicando los mismos filtros combinables del listado: usuario, acción, rango de fechas y recurso.

#### Scenario: Filtros aplicados

- **WHEN** el administrador exporta con usuario, evento, fechas o recurso seleccionados
- **THEN** el archivo contiene solo los eventos de su institución que cumplen todos los filtros

#### Scenario: Filtro inválido

- **WHEN** el usuario del filtro no es un identificador válido o la fecha inicial supera la final
- **THEN** la exportación responde 422 con el sobre de error habitual y no genera archivo

### Requirement: Tope de filas documentado

La exportación SHALL incluir como máximo 5000 eventos, ordenados del más reciente al más antiguo, y ese tope SHALL estar documentado en el código.

#### Scenario: Más eventos que el tope

- **WHEN** los eventos filtrados superan las 5000 filas
- **THEN** el archivo contiene las 5000 más recientes y la exportación queda registrada con ese número

### Requirement: Tipo y nombre del archivo

La respuesta SHALL declarar `text/csv; charset=utf-8` y `Content-Disposition: attachment` con un nombre fechado `bitacora-AAAAMMDD-HHMMSS.csv`.

#### Scenario: Descarga correcta

- **WHEN** la exportación termina correctamente
- **THEN** la respuesta incluye el nombre fechado y el navegador descarga el archivo

### Requirement: La exportación queda registrada

Cada exportación SHALL registrar un evento de auditoría `EXPORT.EXPORT` con el usuario, la institución y el número de filas exportadas, sin guardar el contenido del archivo.

#### Scenario: Evento propio de la exportación

- **WHEN** la exportación termina
- **THEN** la bitácora registra un evento `EXPORT.EXPORT` con `resource_count` igual al número de filas

### Requirement: Permiso existente

La exportación SHALL exigir el permiso `auditoria.leer`; un rol sin ese permiso SHALL recibir 403 y no SHALL generar evento de exportación.

#### Scenario: Rol sin permiso

- **WHEN** un usuario sin `auditoria.leer` solicita la exportación
- **THEN** la respuesta es 403 y la bitácora no registra la exportación

### Requirement: Acción en la pantalla de auditoría

La pantalla SHALL ofrecer un botón «Exportar CSV» que envíe los filtros activos y descargue el archivo, y SHALL mostrar un aviso si la exportación falla.

#### Scenario: Exportar desde la pantalla

- **WHEN** el administrador pulsa «Exportar CSV» con filtros aplicados
- **THEN** la petición incluye esos filtros y el navegador descarga el archivo

#### Scenario: Error de exportación

- **WHEN** la petición de exportación falla
- **THEN** la pantalla muestra «No se pudo exportar la bitácora» sin descargar nada

### Requirement: Auditoría del segundo factor

El sistema SHALL registrar la activación, desactivación y los intentos fallidos del segundo factor con las acciones `AUTH_2FA_ENABLED`, `AUTH_2FA_DISABLED` y `AUTH_2FA_FAILED`, sin incluir secretos, TOTP ni códigos de recuperación.

#### Scenario: Activación y desactivación

- **WHEN** una persona activa o desactiva su segundo factor
- **THEN** la bitácora registra la acción correspondiente para esa cuenta
- **AND** no guarda el secreto ni los códigos de recuperación

#### Scenario: Fallo de verificación

- **WHEN** se rechaza un código TOTP o de recuperación
- **THEN** la bitácora registra `AUTH_2FA_FAILED` sin guardar el código presentado

### Requirement: Alertas ante patrones raros de uso

El sistema SHALL detectar y exponer patrones inusuales en los eventos de auditoría de las últimas 24 horas. La consulta SHALL requerir `auditoria.leer`, SHALL limitar los eventos a la institución del usuario autenticado y SHALL registrar la consulta como `AUDIT_READ` sin incluir direcciones IP ni detalles de alertas. Las descripciones SHALL omitir correos, nombres y contenido clínico.

#### Scenario: Muchos fallos de acceso

- **WHEN** se registran cinco o más acciones `LOGIN_FAILED`, `AUTH_2FA_FAILED` o `ACCESS_DENIED` del mismo usuario y dirección IP en quince minutos
- **THEN** el sistema devuelve una alerta `fallos_de_acceso` con cantidad, ventana y severidad
- **AND** cuatro eventos o menos no generan esa alerta

#### Scenario: Descargas masivas

- **WHEN** el mismo usuario registra treinta o más acciones `EXPORT`, `DATASET_EXPORT` o `REPORT_DOWNLOAD` en veinticuatro horas
- **THEN** el sistema devuelve una alerta `descargas_masivas` con cantidad, ventana y severidad
- **AND** veintinueve eventos o menos no generan esa alerta

#### Scenario: Exportación fuera de horario

- **WHEN** se registra una acción `EXPORT`, `DATASET_EXPORT` o `REPORT_DOWNLOAD` antes de las 07:00 o desde las 19:00 en la zona `America/Guayaquil`
- **THEN** el sistema devuelve una alerta `exportaciones_fuera_de_horario`
- **AND** las acciones entre 07:00 inclusive y 19:00 exclusive no generan esa alerta

#### Scenario: Aislamiento por institución

- **WHEN** se consultan alertas con una sesión perteneciente a una institución
- **THEN** solo se consideran y exponen eventos con el `institucion_id` de esa sesión
- **AND** los eventos de otra institución no aparecen ni alteran los conteos
