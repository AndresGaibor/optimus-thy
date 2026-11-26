# Tasks

## 1. Estado de cierre en la API

- [ ] 1.1 Añadir pruebas en `backend/tests/test_ficha_cierre.py` para cierre, reapertura, auditoría, permisos y bloqueo de ediciones con `409 ficha_cerrada`.
- [ ] 1.2 Añadir los campos de cierre y su migración; implementar cierre y reapertura en `backend/app/api/fichas.py`, proteger guardados y registrar el router.

## 2. Controles en el caso

- [ ] 2.1 Añadir al cliente de `frontend/src/api/` operaciones para consultar, cerrar y reabrir la ficha.
- [ ] 2.2 Mostrar el estado y la acción de cerrar/reabrir con confirmación accesible en el caso; agregar prueba focalizada de UI.
