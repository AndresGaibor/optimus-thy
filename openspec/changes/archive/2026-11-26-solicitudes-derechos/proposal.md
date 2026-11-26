# Proposal

## Why

RS-DER-07 (CA-12) exige registrar cada solicitud de derechos de un titular con su fecha, responsable y plazo de respuesta. Hoy no existe ningún registro: una solicitud que llegue por correo o presencialmente no deja rastro, no se puede consultar su plazo y nadie ve las que vencen.

## What Changes

- Nueva tabla `solicitudes_derechos` (migración `0023`): institución, tipo (`acceso`, `rectificacion`, `cancelacion`, `oposicion`), referencia interna del titular, fecha de solicitud, plazo (15 días por defecto, 1-60), estado (`pendiente`, `atendida`, `rechazada`), responsable y respuesta.
- Permiso nuevo `derechos.gestionar`, asignado al rol `admin`; se añade al catálogo de `app/security/permisos.py` y a la migración.
- `POST /administrador/solicitudes-derechos`: registra la solicitud con el administrador de la sesión como responsable y responde 409 `solicitud_duplicada` si ya existe la misma combinación titular + tipo + fecha.
- `GET /administrador/solicitudes-derechos`: listado por institución con `fecha_limite`, `dias_restantes`, marca `vencida`, conteos `pendientes`/`vencidas` y filtro por estado.
- `PATCH /administrador/solicitudes-derechos/{id}`: cierra como `atendida` o `rechazada` exigiendo respuesta (10-2000 caracteres) o reabre como `pendiente` limpiando la respuesta.
- Bitácora: `RIGHTS_REQUEST_READ`, `RIGHTS_REQUEST_CREATE` y `RIGHTS_REQUEST_UPDATE`, con objeto `RIGHTS_REQUEST`; nunca se registra el contenido de la respuesta.
- Pantalla `/administrador/derechos`: formulario de registro, contadores, tabla con plazo restante y diálogo de cierre.

## Capabilities

### New Capabilities

- `solicitudes-derechos`: registro y seguimiento de las solicitudes de derechos de los titulares con su plazo legal.

### Modified Capabilities

- `administracion-roles`: el catálogo de permisos incorpora `derechos.gestionar` en el dominio del administrador.

## Non-Goals

- No ejecuta la exportación ni el borrado de datos del titular: eso son HU-039 y HU-043.
- No notifica por correo al titular.
- No sustituye a la bitácora: las acciones sobre la solicitud quedan en ambas.
