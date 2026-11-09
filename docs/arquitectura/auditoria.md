# Auditoría de solo escritura (HT-030)

Implementado en `backend/app/audit/`. Cumple RF-AUD-01 a RF-AUD-09 y RS-INC-01:
cada hecho relevante deja un evento con quién, cuándo, desde dónde y sobre qué
objeto, y nadie puede corregir ese rastro después.

## Qué se registra

| Grupo | Acciones |
| --- | --- |
| Sesión | `SESSION_START`, `SESSION_END`, `LOGIN_FAILED` |
| Consultas | `PATIENT_READ`, `RECORD_READ`, `DOCUMENT_READ`, `IMAGE_READ` |
| Cargas | `DOCUMENT_UPLOAD`, `IMAGE_UPLOAD` |
| Procesamiento | `OCR_REQUEST`, `INFERENCE_REQUEST` |
| Exportaciones | `EXPORT` |
| Administración | `USER_CREATE`, `USER_UPDATE`, `USER_ROLE_CHANGE`, `PERMISSION_CHANGE`, `SETTINGS_CHANGE` |
| Datos personales | `PII_REVEAL` (consultar la identidad de un paciente) |
| Bitácora | `AUDIT_READ` |
| Accesos denegados | `ACCESS_DENIED` |

Cada acción se cruza con el módulo de origen (`AUTH`, `PATIENTS`, `CLINICAL`,
`FILES`, `OCR`, `INFERENCE`, `ADMIN`, `EXPORT`, `AUDIT`) y se guarda en
`auditoria.accion` como `MODULO.ACCION`, por ejemplo `PATIENTS.PATIENT_READ`.

## Qué se guarda y qué no

`auditoria` (modelo v1) guarda referencias: `usuario_id`, `institucion_id`,
`entidad` y `entidad_id` (tipo y UUID del objeto), `direccion_ip`, `user_agent`,
`accion` y `ocurrido_en`. La migración `0005` añade `detalles`, una columna JSON
para el contexto técnico.

`detalles` no es texto libre: el servicio solo admite un conjunto cerrado de
claves (`model_name`, `model_version`, `result_label`, `confidence`,
`reason_code`, `role_code`, …) y los valores de texto tienen que ser códigos
(`^[A-Za-z0-9_.:@/+-]{1,64}$`). Un nombre, una cédula o una frase se rechazan con
`AuditError`, así que la bitácora no se convierte en una segunda copia de los
datos clínicos. El rol vigente viaja como `role_code`, para no depender del
estado actual del usuario.

## Solo escritura

Por tres vías independientes:

1. **Superficie del servicio**: solo `record` y `record_denied`; no hay `update`
   ni `delete`, y una prueba fija esa superficie para que no crezca por descuido.
2. **Disparador en PostgreSQL**: la migración `0005` crea
   `optimus_auditoria_solo_escritura` y el disparador `auditoria_solo_escritura`
   (`BEFORE UPDATE OR DELETE`), que lanza una excepción aunque alguien escriba
   SQL a mano.
3. **Hora del servidor**: `ocurrido_en` la pone `now()` de la base; el proceso no
   puede elegir la hora del evento.

El `downgrade` de la migración elimina el disparador y la columna, así que la
migración sigue siendo reversible. En SQLite (pruebas) el disparador se omite:
no hay funciones ni disparadores equivalentes, y allí la garantía es la
superficie del servicio.

## Pruebas

`backend/tests/test_audit.py` cubre: una acción por cada hecho del anteproyecto,
los campos de referencia y la institución heredada del usuario, que la hora
venga de la base, los detalles admitidos y los rechazados, el objeto sin tipo,
la validación de entrada, el atajo de denegaciones, la superficie de solo
escritura, que la tabla no se encadene a datos clínicos y que la migración cree
el disparador.
