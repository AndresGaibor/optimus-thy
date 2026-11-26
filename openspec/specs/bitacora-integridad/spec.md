# bitacora-integridad Specification

## Purpose
Garantizar que la bitácora de auditoría sea íntegra y verificable: cadena criptográfica, escrituras serializadas, ancla del final y comprobación contra esa ancla.

## Requirements

### Requirement: Cadena criptográfica de auditoría

El sistema SHALL guardar con cada evento el SHA-256 de una serialización JSON canónica de `hash_anterior`, instante UTC, `usuario_id`, `accion`, `entidad`, `entidad_id` y `detalles`. La serialización SHALL usar UTF-8, claves ordenadas, separadores compactos y microsegundos; los UUID se representarán como cadenas. El primer evento SHALL tener `hash_anterior` nulo.

#### Scenario: Registrar eventos encadenados

- **GIVEN** una bitácora vacía o con una cadena válida
- **WHEN** se confirma un nuevo evento
- **THEN** su `hash_anterior` coincide con el hash del registro precedente y su `hash_actual` corresponde a sus campos canónicos

### Requirement: Escrituras serializadas de la bitácora

Las escrituras PostgreSQL SHALL adquirir `LOCK TABLE auditoria IN SHARE ROW EXCLUSIVE MODE` antes de leer el último hash y conservarlo hasta que termine la transacción, para serializar la lectura y creación de cada evento incluso cuando la tabla está vacía.

#### Scenario: Escrituras concurrentes

- **GIVEN** dos transacciones intentan registrar eventos simultáneamente
- **WHEN** ambas obtienen el bloqueo transaccional de la tabla
- **THEN** la segunda lee el hash del evento confirmado por la primera y no se crea una bifurcación

### Requirement: Relleno histórico de la cadena

La migración SHALL rellenar los eventos existentes en orden ascendente de `id`, calculando ambos hashes, y SHALL ser reversible.

#### Scenario: Completar hashes históricos

- **GIVEN** existen eventos anteriores a la migración
- **WHEN** se aplica la migración
- **THEN** se calculan ambos hashes recorriendo los registros por `id` ascendente y se restaura la protección de solo escritura

### Requirement: Verificación de integridad

`GET /auditoria/integridad` SHALL exigir el permiso `auditoria.leer`, verificar los registros en orden ascendente de `id` y responder `{valida, registros, primer_fallo}`. `registros` SHALL contar las filas verificadas hasta completar la cadena o encontrar la primera falla; `primer_fallo` SHALL ser el `id` del registro inválido o nulo si la cadena es válida. La respuesta SHALL omitir datos personales y detalles del evento.

#### Scenario: Consultar una cadena válida

- **GIVEN** una persona con permiso `auditoria.leer` y una cadena íntegra
- **WHEN** consulta `GET /auditoria/integridad`
- **THEN** recibe `valida: true`, el número de registros verificados y `primer_fallo: null`

#### Scenario: Detectar un registro alterado

- **GIVEN** una cadena cuyo evento fue alterado después de guardarse
- **WHEN** una persona con permiso `auditoria.leer` consulta la verificación
- **THEN** recibe `valida: false` y el `id` del primer registro donde falla la cadena
- **AND** no recibe datos personales ni el contenido del evento

#### Scenario: Denegar la verificación sin permiso

- **GIVEN** una persona autenticada sin permiso `auditoria.leer`
- **WHEN** consulta `GET /auditoria/integridad`
- **THEN** recibe una respuesta de acceso prohibido

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
