# Tareas

- [x] Normalizar `codigo` a minúsculas en el alta y en la edición.
- [x] Sustituir la unicidad del modelo por un índice único sobre `lower(codigo)`.
- [x] Migración `0014` que consolida duplicados, normaliza códigos y cambia la restricción.
- [x] Pruebas: alta en minúsculas y `409` con la misma caja o distinta.
- [x] Verificar la migración en una base vacía: consolidación, índice y reversibilidad.
- [ ] Aplicar en producción con el despliegue y comprobar que queda un solo registro de ESPOCH.
