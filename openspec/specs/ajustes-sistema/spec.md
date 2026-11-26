# ajustes-sistema Specification

## Purpose
Exponer y modificar los ajustes operativos del sistema con permisos de gestión, sin revelar secretos y con cada cambio registrado en la bitácora.

## Requirements

### Requirement: Consultar ajustes sin revelar secretos

La consulta de ajustes SHALL devolver la configuración vigente sin el valor de ningún secreto ni su forma cifrada, y SHALL indicar mediante un indicador booleano si el secreto está configurado.

#### Scenario: Contraseña configurada

- **WHEN** el administrador consulta `/configuracion-correo` después de guardar una contraseña SMTP
- **THEN** la respuesta incluye `tiene_password` en `true`
- **AND** el cuerpo no contiene las claves `password` ni `password_cifrado`
- **AND** el valor de la contraseña no aparece en el texto de la respuesta

### Requirement: Todo cambio de ajuste queda en la bitácora sin el secreto

Guardar un ajuste SHALL registrar un evento de auditoría con la acción del módulo de administración, la clave del ajuste cambiado y su estado resultante, sin el valor del secreto ni datos del usuario en texto libre.

#### Scenario: Guardar la configuración SMTP

- **WHEN** el administrador guarda la configuración de correo
- **THEN** la bitácora registra `ADMIN.SETTINGS_CHANGE`
- **AND** el detalle incluye `setting_key` con el valor `smtp`
- **AND** la contraseña no aparece ni en el detalle ni en el agente de usuario

### Requirement: Los ajustes exigen permiso de gestión

Consultar o modificar ajustes SHALL exigir el permiso `ajustes.gestionar`; un usuario sin ese permiso SHALL recibir un rechazo de autorización.

#### Scenario: Usuario sin permiso

- **WHEN** un usuario con rol de médico consulta o guarda `/configuracion-correo`
- **THEN** ambas peticiones reciben `403`
