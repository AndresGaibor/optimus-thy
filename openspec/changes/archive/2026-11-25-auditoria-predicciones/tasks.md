## 1. API

- [x] 1.1 `GET /investigacion/predicciones` con permiso `investigacion.leer`.
- [x] 1.2 Filtros `desde`, `hasta`, `resultado`, `decision`, `caso`, `modelo` y paginación.
- [x] 1.3 Referencia clínica y diferencia `coincide`/`difiere`/`pendiente`.
- [x] 1.4 Evento `INFERENCE.INFERENCE_READ` al consultar.

## 2. Interfaz

- [x] 2.1 Cliente `src/api/predicciones.ts` contra el endpoint real.
- [x] 2.2 `AuditoriaPrediccionesPage` con filtros, tabla y paginación.
- [x] 2.3 Estados de carga, vacío y error con reintento.

## 3. Pruebas

- [x] 3.1 `backend/tests/test_predicciones.py` (7 casos).
- [x] 3.2 `frontend/src/test/auditoria-predicciones.test.tsx` (5 casos).

## 4. Cierre

- [ ] 4.1 Montar la ruta de la página en el área de investigador (lo integra el principal).
