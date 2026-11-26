## ADDED Requirements

### Requirement: Ancla del final de la cadena

El sistema SHALL guardar en una tabla propia, fuera de `auditoria`, el recuento
de eventos y el último `hash_actual` confirmados. Cada evento SHALL actualizar
el ancla en la misma transacción en que se inserta, conservando la protección
de solo escritura de la bitácora.

#### Scenario: Registrar un evento actualiza el ancla

- **GIVEN** un ancla con `registros = n` y su hash final
- **WHEN** se confirma un evento nuevo
- **THEN** el ancla pasa a `registros = n + 1` y a su `hash_actual`

### Requirement: Verificación contra el ancla

`GET /auditoria/integridad` SHALL comparar, además de encadenar los hashes, el
recuento y el hash final de los registros presentes contra el ancla. Si la
bitácora contiene menos eventos que el ancla, o su hash final no coincide, SHALL
responder `valida: false` sin identificar el evento eliminado. La respuesta
SHALL describirse en OpenAPI con `valida`, `registros` y `primer_fallo`.

#### Scenario: Cola de eventos eliminada

- **GIVEN** una bitácora a la que se le eliminaron los últimos eventos
- **WHEN** una persona con permiso `auditoria.leer` consulta la verificación
- **THEN** recibe `valida: false` con el recuento verificado y `primer_fallo: null`

#### Scenario: Cadena recortada y ancla reescrita

- **GIVEN** una bitácora y un ancla coherentes entre sí pero manipulados en bloque
- **WHEN** se consulta la verificación
- **THEN** el sistema no puede detectarlo; el riesgo residual queda documentado
