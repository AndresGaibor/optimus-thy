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
