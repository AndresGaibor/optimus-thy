## ADDED Requirements

### Requirement: Edición de la plantilla sin escribir HTML

El administrador con permiso `ajustes.gestionar` SHALL poder editar el correo de recuperación desde campos de texto —encabezado, mensaje, texto del botón, nota del enlace y pie— sin escribir HTML. El sistema SHALL componer el mensaje con un diseño propio y SHALL insertar el enlace y la caducidad sin intervención del administrador.

#### Scenario: Guardar en modo Diseño

- **WHEN** el administrador escribe los campos y guarda
- **THEN** la API responde 200 con `modo: "visual"` y el HTML compuesto
- **AND** el correo enviado usa ese HTML

#### Scenario: Campo vacío

- **WHEN** falta el mensaje o el encabezado
- **THEN** la API responde 422 con el código `campos_incompletos`
- **AND** el HTML guardado no cambia

#### Scenario: Texto con caracteres especiales

- **WHEN** un campo incluye `<`, `&` o comillas
- **THEN** aparecen tal cual en el correo, escapados como texto y sin romper el diseño

### Requirement: Modo HTML avanzado

La plantilla SHALL poder seguir editándose como HTML, y el modo elegido SHALL conservarse entre visitas. Cambiar a modo Diseño SHALL partir de los campos guardados o, si no existen, de los de fábrica.

#### Scenario: Volver al modo Diseño

- **WHEN** la plantilla guardada está en modo HTML sin campos
- **THEN** la API devuelve los campos de fábrica para rellenar el formulario

#### Scenario: Variable inexistente en HTML

- **WHEN** el HTML usa un marcador distinto de `nombre`, `enlace` o `expira_en`
- **THEN** la API responde 422 con el código `variable_desconocida`

### Requirement: Vista previa renderizada por el servidor

La pantalla SHALL mostrar una vista previa producida por el mismo código que envía el correo, con datos de ejemplo, dentro de una maqueta con remitente, asunto y cuerpo. La vista previa SHALL NOT enviar correo ni guardar nada.

#### Scenario: Vista previa sin guardar

- **WHEN** el administrador edita el mensaje y aún no ha guardado
- **THEN** la vista previa muestra el texto nuevo con el asunto vigente

#### Scenario: Sin sesión

- **WHEN** se pide la vista previa sin sesión o sin `ajustes.gestionar`
- **THEN** la API responde 401 o 403 y no compone nada
