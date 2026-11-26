## Why

TES-363 · HT-096 exige impedir pacientes duplicados por documento en la misma institución. Hoy el alta crea siempre una fila nueva, de modo que un doble clic o un registro con el mismo documento produce dos pacientes distintos e irreconciliables.

## What Changes

- El alta comprueba el documento cifrado dentro de la institución activa antes de insertar.
- Si ya existe, responde `409` con `error.code = "posible_duplicado"`, un mensaje sin datos del paciente existente y su identificador, y no crea filas.
- `confirmar_duplicado = true` permite el alta deliberada.
- La pantalla de pacientes muestra el aviso y exige un segundo envío explícito.

## Impact

- Contrato: `POST /pacientes` documenta `409` y el campo `confirmar_duplicado` de `CrearPacienteRequest`; el modelo de respuesta `PacienteOut` se conserva.
- Código: `backend/app/api/pacientes.py`, `frontend/src/api/pacientes.ts`, `frontend/src/pages/medico/PacientesPage.tsx`.
- Sin migración: la comprobación usa la columna cifrada existente.
