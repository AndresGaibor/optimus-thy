# correo-saliente Specification

## Purpose
Enviar correo desde la aplicación con un servidor SMTP que el administrador configura en la propia interfaz, sin secretos en el repositorio y con plantillas editables.

## Requirements

### Requirement: Configuración del servidor de correo desde la aplicación

El administrador con permiso `ajustes.gestionar` SHALL poder configurar host, puerto, cifrado, usuario, remitente y contraseña del servidor SMTP desde `/administrador/correo`. La contraseña SHALL guardarse cifrada y SHALL NOT devolverse nunca al navegador: la interfaz solo SHALL saber si existe.

#### Scenario: Preset de Gmail

- **WHEN** el administrador abre la pestaña del servidor en una instalación sin configurar
- **THEN** los campos llegan con `smtp.gmail.com`, puerto 587 y STARTTLS
- **AND** puede cambiar los valores por los de otro proveedor

#### Scenario: Guardar sin contraseña previa

- **WHEN** el administrador intenta activar el correo sin contraseña guardada ni nueva
- **THEN** la API responde 422 con el código `password_requerida`

#### Scenario: Contraseña guardada

- **WHEN** el administrador ya guardó una contraseña y vuelve a abrir la página
- **THEN** el campo aparece vacío y la respuesta indica `tiene_password: true`

### Requirement: Prueba de envío real

La página SHALL ofrecer un envío de prueba que use la configuración guardada y la plantilla vigente, dirigido a la cuenta del administrador conectado. Los errores SHALL llegar al navegador con un mensaje genérico, sin host, puerto ni credenciales.

#### Scenario: Servidor caído

- **WHEN** el servidor SMTP rechaza la conexión
- **THEN** la API responde 502 con `envio_fallido`
- **AND** el mensaje no incluye detalles internos

### Requirement: Plantilla editable

La plantilla de recuperación SHALL guardarse en la base de datos con asunto y HTML, SHALL admitir solo las variables `nombre`, `enlace` y `expira_en`, y SHALL poder restaurarse a la de fábrica.

#### Scenario: Variable no admitida

- **WHEN** el administrador guarda una plantilla con `{{telefono}}`
- **THEN** la API responde 422 indicando la variable no admitida

#### Scenario: Restaurar

- **WHEN** el administrador pulsa «Restaurar la de fábrica»
- **THEN** la plantilla guardada se borra y vuelve a mostrarse la de fábrica

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
