## ADDED Requirements

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
