# Tareas

- [x] Crear `backend/tests/test_acceso_objetos.py` con la sustitución de identificadores entre instituciones en pacientes, casos, imágenes, trabajos, usuarios, roles y solicitudes de derechos, más la `imagen_id` ajena en el cuerpo de una inferencia. Verificado con `pytest tests/test_acceso_objetos.py`: 11 pruebas en verde.
- [x] Corregir las denegaciones demostradas por las pruebas: `GET /usuarios` filtrado por institución, `POST`, `PATCH` y `PUT /usuarios/{id}/roles` limitados a la institución activa, y `POST /trabajos` con `404` para `imagen_id` ajena. Verificado con `pytest tests/test_acceso_objetos.py tests/test_usuarios.py tests/test_permisos.py`.
- [x] Crear `tests/seguridad/escanear.sh` con proyecto Compose aleatorio, puerto libre, datos efímeros, espera de `/health`, informe en `docs/cumplimiento/zap/`, limpieza en `trap` y código `3` cuando la imagen ZAP no se puede obtener.
- [x] Ejecutar `bash tests/seguridad/escanear.sh` y conservar sus informes en `docs/cumplimiento/zap/`: 0 fallos, 9 avisos, 59 comprobaciones en verde, código 2.
- [x] Escribir `docs/cumplimiento/informe-seguridad.md` con alcance, comandos, resultados, avisos abiertos y superficie no examinada.
- [x] Validar el cambio con `openspec validate 2026-11-26-pruebas-seguridad --type change --strict`.
