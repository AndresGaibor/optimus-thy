# Proposal

## Why

La purga operativa necesita una política explícita, una ejecución revisable y un valor de seguridad predeterminado que no borre datos accidentalmente. La configuración actual tampoco impide iniciar producción con una clave PII de ejemplo, cookies de sesión inseguras o una base local.

## What Changes

- Añadir plazos configurables para trabajos terminados (90 días) y alertas revisadas (365 días), con validación positiva y purga desactivada por defecto.
- Añadir una purga por lotes que solo elimine trabajos terminales y alertas revisadas vencidas; informar cuando la tabla `alertas` todavía no exista.
- Añadir el comando `python -m app.jobs.retencion`: sin `--si` simula; con `--si` solicita la purga y respeta `PURGA_HABILITADA`.
- Conservar completa la bitácora append-only; informar explícitamente que no se purga porque el trigger y el ancla deben seguir verificando la cadena.
- Reforzar las guardas al iniciar: producción requiere clave PII propia, cookie segura y base no local; desarrollo avisa si la base parece de producción.
- Programar la ejecución diaria a las 04:30 con systemd y documentar el procedimiento y su comprobación.

## Capabilities

### New Capabilities

- `retencion-entornos`: retención operativa explícita y comprobación de separación de entornos.

### Modified Capabilities

- Ninguna.

## Impact

- Backend: `backend/app/config.py`, nuevo `backend/app/jobs/retencion.py` y pruebas específicas.
- Operación: nuevas unidades systemd y `docs/operacion/retencion.md`.
- OpenSpec: nueva especificación `retencion-entornos`; no cambia el contrato de integridad de auditoría ni introduce migraciones.
