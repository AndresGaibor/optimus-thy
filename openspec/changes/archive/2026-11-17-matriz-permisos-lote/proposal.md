## Why

La matriz de permisos se edita con interruptores y un botón «Guardar cambios» arriba, pero los permisos se envían de uno en uno: un fallo a mitad deja roles guardados y otros no. Tampoco hay forma de saber qué cambió ni de detectar que otro administrador editó la matriz entre la carga y el guardado.

## What Changes

- Nuevo `PUT /roles/permisos` que guarda la matriz completa en una sola transacción y registra la auditoría por rol.
- Control de concurrencia optimista: el cliente envía el estado del que partió; si la base ya no coincide, el servidor responde `409` y no escribe nada.
- El endpoint de un solo rol (`PUT /roles/{id}/permisos`) se retira: era la vía que permitía el guardado parcial.
- La pantalla pasa a casillas de verificación con tres estados explícitos (concedido, no concedido y «No aplica»), permisos agrupados por recurso, descripción principal y contador de cambios pendientes con descarte.
- Aviso de cambios sin guardar antes de abandonar la pantalla.

## Impact

- API: `PUT /roles/permisos`; desaparece `PUT /roles/{id}/permisos`. Contrato en `contracts/openapi.json`.
- Sin cambios en las reglas de ámbito, en los permisos fijos del administrador ni en el modelo de datos.
- Auditoría: un `PERMISSION_CHANGE` por rol escrito, dentro de la misma transacción.
- Riesgo: un cliente antiguo que use el endpoint de un solo rol recibirá `404`; hoy solo lo consume esta pantalla.
