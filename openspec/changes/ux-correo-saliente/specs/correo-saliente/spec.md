## ADDED Requirements

### Requirement: La prueba de envío usa la plantilla vigente

La prueba de envío SHALL entregar al administrador el correo con la plantilla guardada, con su asunto y su diseño, en lugar de un texto genérico. El enlace del correo de prueba SHALL apuntar a la página pública de recuperación.

#### Scenario: Plantilla guardada

- **WHEN** el administrador pide una prueba y hay una plantilla guardada
- **THEN** el correo recibido tiene el asunto y el HTML de esa plantilla, con los marcadores sustituidos por datos de ejemplo

#### Scenario: Sin plantilla guardada

- **WHEN** el administrador pide una prueba y no hay plantilla guardada
- **THEN** el correo recibido es el de comprobación básica y el envío no falla

### Requirement: Estado de salud del correo

La configuración del correo SHALL registrar la fecha y el resultado de la última prueba, y la página SHALL mostrarlos, junto con si el correo está activo.

#### Scenario: Última prueba correcta

- **WHEN** el administrador abre la página tras una prueba correcta
- **THEN** ve la fecha y hora de esa prueba y que el correo está activo

#### Scenario: Última prueba fallida

- **WHEN** la última prueba falló
- **THEN** la página lo señala aunque el envío no se haya vuelto a intentar

#### Scenario: Todavía sin pruebas

- **WHEN** no se ha enviado ninguna prueba
- **THEN** la página lo dice en lugar de mostrar una fecha vacía

### Requirement: Cambios sin guardar en la plantilla

La página SHALL avisar cuando el borrador de la plantilla difiere de lo guardado y el botón de guardar SHALL permanecer deshabilitado mientras no haya cambios.

#### Scenario: Se edita un campo

- **WHEN** el administrador cambia un campo de la plantilla
- **THEN** aparece el aviso de cambios sin guardar y el botón de guardar se habilita

#### Scenario: No hay cambios

- **WHEN** la plantilla está intacta
- **THEN** el botón de guardar está deshabilitado

### Requirement: Vista previa en ancho móvil

La vista previa SHALL poder mostrarse a un ancho de móvil, para comprobar cómo se lee el correo en el teléfono.

#### Scenario: Ancho móvil

- **WHEN** el administrador elige el ancho móvil
- **THEN** la maqueta del correo se muestra con el ancho de un teléfono
