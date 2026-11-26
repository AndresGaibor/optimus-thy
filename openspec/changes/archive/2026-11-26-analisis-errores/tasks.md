# Tasks

## 1. Datos

- [x] 1.1 Migración `0022`: columna `decisiones_medicas.resultado_corregido` con `CHECK` y `downgrade`.
- [x] 1.2 Columna en el modelo `DecisionMedica`.

## 2. API

- [x] 2.1 `DecisionIn` exige `resultado_corregido` en `corrige`, lo prohíbe fuera de `corrige` y rechaza la corrección igual al modelo con 422 `correccion_sin_cambio`.
- [x] 2.2 `DecisionOut` devuelve `resultado` y `resultado_corregido` al registrar y al leer.
- [x] 2.3 `GET /investigacion/errores` con permiso `investigacion.leer`, conteos, filtros y paginación.
- [x] 2.4 Registrar la consulta con `INFERENCE.INFERENCE_READ`.
- [x] 2.5 Contrato `openapi.json` y `schema.d.ts` regenerados.

## 3. Interfaz

- [x] 3.1 Cliente `listarErrores` con tipo de error validado.
- [x] 3.2 Página `ErroresPage` con contadores, filtro, tabla y estados de carga, vacío y error.
- [x] 3.3 Ruta `/investigador/errores` y entrada «Errores» en el menú del investigador.

## 4. Verificación

- [x] 4.1 `pytest tests/test_decisiones.py tests/test_predicciones.py` en verde (27 pruebas).
- [x] 4.2 `vitest` de la página en verde (4 pruebas) y de rutas en verde.
- [x] 4.3 `ruff`, `mypy`, `typecheck`, `lint`, `format:check`, `ui:check` y `tamanos` en verde.
