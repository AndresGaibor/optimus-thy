# Tareas

- [x] Crear `tests/rendimiento/medir.sh` para reservar puertos, aislar y levantar Compose, inicializar datos sintéticos, medir las cinco rutas 50 veces, registrar percentiles/recursos y limpiar solo su proyecto. Verificar con `bash tests/rendimiento/medir.sh`.
- [x] Crear `docs/operacion/rendimiento.md` con requisitos, comando repetible, seguridad del aislamiento e interpretación comparativa entre host y laptop. Verificar que documente CPU, disco y red compartidos.
- [x] Generar `docs/operacion/rendimiento-<fecha>.md` tras la última edición con la tabla real, identificación del host, commit y limitación de inferencia. Verificar contra la salida de la medición.
