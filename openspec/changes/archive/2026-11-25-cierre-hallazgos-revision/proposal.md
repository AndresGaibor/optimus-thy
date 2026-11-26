# Proposal

## Why

La revisión de los seis commits sin publicar encontró defectos concretos en tres
controles recién introducidos: el aviso de documento duplicado se puede saltar
con dos altas simultáneas o con un cambio de mayúsculas, y su respuesta 409
entrega el UUID de otro paciente; el listado de datasets calcula `k_efectivo`
cargando todas las filas de la institución en memoria; y la verificación de la
bitácora no detecta que se hayan eliminado los eventos finales. Además, dos
respuestas quedaron sin tipar en el contrato y la pantalla de alta conserva el
aviso de duplicado aunque se cambie el documento.

## What Changes

- El alta y la corrección de pacientes comprueban el documento con una clave
  canónica (mayúsculas y sin separadores) y serializan esa comprobación por
  institución y documento con un bloqueo transaccional, para que dos altas
  simultáneas no creen el mismo documento sin aviso.
- **BREAKING**: la respuesta `409 posible_duplicado` deja de incluir
  `paciente_id`; el cuerpo queda tipado con `code`, `message` y `request_id`.
- El listado de datasets obtiene `k_efectivo` con una agregación SQL agrupada
  por la clave de cuasi-identificadores, sin cargar las filas de cada dataset.
- La verificación de la bitácora compara el recuento y el hash final con un
  ancla persistida aparte, de modo que recortar la cola de eventos se detecta;
  su respuesta queda tipada en OpenAPI.
- La pantalla de alta descarta el aviso de duplicado cuando cambia el
  documento, y el tipo generado marca `confirmar_duplicado` como opcional.

## Capabilities

### Modified Capabilities

- `pacientes`: comprobación canónica y serializada del documento; el 409 ya no
  revela el identificador del paciente existente.
- `consulta-datasets`: `k_efectivo` del listado se calcula en la base de datos.
- `bitacora-integridad`: la verificación detecta el recorte de la cola y su
  respuesta está descrita en el contrato.

## Impact

- `backend/app/api/pacientes.py`, `backend/app/api/datasets.py`,
  `backend/app/api/auditoria.py`, `backend/app/audit/service.py`.
- Esquema: nueva tabla de ancla de la bitácora (migración `0021`) y, si la
  normalización exige persistir la clave canónica, columna e índice en
  `identidades_paciente`.
- Contratos: `contracts/openapi.json`, `frontend/src/api/schema.d.ts`.
- `frontend/src/pages/medico/useAltaPaciente.ts` y pruebas de pacientes y
  datasets.
