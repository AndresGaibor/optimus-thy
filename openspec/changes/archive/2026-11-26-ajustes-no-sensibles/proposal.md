## Why

La historia TES-359 (HU-016) promete que los ajustes del sistema se consultan sin revelar secretos y que cada cambio queda en la bitácora. El código de `/configuracion-correo` ya cifra la contraseña y registra `ADMIN.SETTINGS_CHANGE`, pero ninguna prueba fija ese contrato: una refactorización podría devolver el secreto o dejar de auditar sin que nadie lo note.

## What Changes

- Añadir pruebas de regresión que fijen las dos garantías observables de los ajustes: la respuesta de consulta no contiene el secreto y el cambio se registra en la bitácora con `setting_key` y sin el valor del secreto.
- Añadir la prueba de que consultar y guardar ajustes exige el permiso `ajustes.gestionar`.
- No se añade funcionalidad nueva: si una garantía falla, se corrige la frontera exacta en `app/api/correo.py` sin ampliar la respuesta.

## Impact

- Capacidad afectada: `ajustes-sistema`.
- Archivos: `backend/tests/test_ajustes_no_sensibles.py` (nuevo).
- Sin migraciones, sin cambios de contrato OpenAPI, sin cambios de interfaz.
