## Why

La bitácora de auditoría registra lecturas y decisiones, pero no permite revisar predicciones individuales: hoy no hay forma de ver, caso por caso, qué modelo produjo el resultado, quién lanzó la inferencia, qué huella tenía la imagen y en qué difiere de la referencia clínica. RF-INV-06 y CA-10 exigen esa auditoría para el módulo de investigación.

## What Changes

- **Consulta de predicciones auditables**: `GET /investigacion/predicciones`, con permiso `investigacion.leer`, devuelve una fila por inferencia con fecha, caso, paciente seudónimo, modelo y versión, resultado, confianza, quién lanzó el trabajo, huella SHA-256 de la imagen y la referencia clínica registrada.
- **Diferencia explícita**: la respuesta clasifica cada predicción como `coincide` (la referencia acepta el resultado), `difiere` (lo corrige o descarta) o `pendiente` (aún sin decisión médica).
- **Filtros del servidor**: `desde`, `hasta`, `resultado`, `decision`, `caso`, `modelo`, `limite` y `desplazamiento`; el aislamiento por institución es obligatorio y un rango de fechas inválido responde `422`.
- **Bitácora de la consulta**: cada lectura queda registrada como `INFERENCE.INFERENCE_READ` con el número de filas, sin copiar contenido clínico.
- **Pantalla de auditoría**: `AuditoriaPrediccionesPage` lista las predicciones con sus filtros, paginación y estados de carga, vacío y error con reintento.

## Impact

- API: nuevo módulo `backend/app/api/predicciones.py` y su registro en `app/main.py`; contrato regenerado.
- Interfaz: cliente `frontend/src/api/predicciones.ts` y página nueva en `frontend/src/pages/medico/`.
- Sin migraciones: usa `inferencias`, `imagenes`, `modelos_ia`, `trabajos` y `decisiones_medicas` existentes.
- Rutas: el principal monta la página bajo el área de investigador.
