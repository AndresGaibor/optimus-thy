## 1. Pruebas de contrato

- [x] 1.1 Prueba de que la consulta no devuelve el secreto y sí `tiene_password`
- [x] 1.2 Prueba de bitácora `ADMIN.SETTINGS_CHANGE` con `setting_key` y sin el secreto
- [x] 1.3 Prueba de `403` sin el permiso `ajustes.gestionar`

## 2. Verificación

- [x] 2.1 `pytest tests/test_ajustes_no_sensibles.py` en verde contra la base de pruebas
