# solicitudes-derechos Specification

## Purpose
Registrar las solicitudes de derechos de los titulares, seguir su plazo y cerrarlas con constancia de la respuesta.

## Requirements

### Requirement: Registro de la solicitud

El API MUST exponer `POST /administrador/solicitudes-derechos` con el permiso `derechos.gestionar`. MUST guardar tipo, referencia interna del titular, fecha de solicitud, plazo (15 días por defecto, entre 1 y 60), estado `pendiente` y el administrador de la sesión como responsable. MUST NOT guardar datos clínicos ni identificadores directos del titular, y MUST responder 409 `solicitud_duplicada` si repite titular, tipo y fecha.

#### Scenario: Alta correcta

- **GIVEN** una sesión con `derechos.gestionar`
- **WHEN** registra una solicitud de acceso con fecha `2026-11-01`
- **THEN** el API responde 201 con `pendiente`, `plazo_dias = 15` y `fecha_limite = 2026-11-16`

#### Scenario: Duplicado

- **GIVEN** una solicitud ya registrada para ese titular, tipo y fecha
- **WHEN** se intenta registrar de nuevo
- **THEN** el API responde 409 con el código `solicitud_duplicada`

#### Scenario: Plazo fuera de rango

- **WHEN** se registra con `plazo_dias = 0` o `61`
- **THEN** el API responde 422 y no guarda nada

### Requirement: Seguimiento del plazo

El API MUST exponer `GET /administrador/solicitudes-derechos` con el permiso `derechos.gestionar`, limitado a la institución del usuario. Cada elemento MUST incluir `fecha_limite`, `dias_restantes` y la marca `vencida` (pendiente con plazo agotado), y la respuesta MUST incluir los conteos `pendientes` y `vencidas`. El filtro `estado` MUST acotar el listado.

#### Scenario: Plazo vencido

- **GIVEN** una solicitud pendiente con fecha de hace 30 días
- **WHEN** se consulta el listado
- **THEN** el elemento tiene `dias_restantes = -15`, `vencida = true` y suma uno a `vencidas`

#### Scenario: Otra institución

- **GIVEN** solicitudes de otra institución
- **WHEN** se consulta el listado
- **THEN** el API responde 200 con la lista de la propia institución y sin filas ajenas

### Requirement: Cierre de la solicitud

El API MUST permitir cambiar el estado con `PATCH /administrador/solicitudes-derechos/{id}`. Cerrar como `atendida` o `rechazada` MUST exigir una respuesta de 10 a 2000 caracteres; volver a `pendiente` MUST rechazar la respuesta. Una solicitud de otra institución MUST responder 404. Cada cambio MUST quedar en la bitácora como `RIGHTS_REQUEST_UPDATE` con el estado, sin el texto de la respuesta.

#### Scenario: Cierre con respuesta

- **GIVEN** una solicitud pendiente de la institución
- **WHEN** se cierra como `atendida` con una respuesta
- **THEN** el API responde 200 con el estado nuevo y la respuesta guardada

#### Scenario: Cierre sin respuesta

- **WHEN** se cierra como `rechazada` sin respuesta
- **THEN** el API responde 422 y la solicitud sigue `pendiente`

#### Scenario: Solicitud de otra institución

- **WHEN** se intenta cerrar una solicitud de otra institución
- **THEN** el API responde 404
