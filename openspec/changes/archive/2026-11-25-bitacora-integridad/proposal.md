## Why

TES-343 · HT-031 requiere poder detectar modificaciones, omisiones o rupturas en la bitácora de auditoría sin exponer información personal.

## What Changes

- Cada evento queda vinculado al hash SHA-256 del evento anterior y a una representación JSON canónica de sus campos de integridad.
- La creación serializa las escrituras concurrentes dentro de la transacción; una migración reversible encadena los registros existentes por orden de creación.
- `GET /auditoria/integridad` verifica la cadena y devuelve el estado, el total recorrido y el identificador del primer registro inválido, sin datos personales.

## Impact

- Esquema: `hash_anterior`, `hash_actual` e índice único para este último.
- Seguridad: la ruta requiere `auditoria.leer`; la bitácora mantiene sus restricciones de solo escritura.
