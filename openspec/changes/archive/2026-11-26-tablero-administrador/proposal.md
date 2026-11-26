# Proposal

## Why

El administrador necesita una vista confiable del volumen de datos institucional, la actividad reciente y la disponibilidad de dependencias. El tablero debe reflejar la base y los servicios reales, evitando métricas simuladas y respetando los permisos existentes.

## What Changes

- Añadir `GET /administrador/tablero`, con recuentos por institución, actividad de auditoría de los últimos siete días y estado de dependencias.
- Registrar la lectura con `RECORD_READ`, módulo `ADMIN` y objeto `SYSTEM`.
- Incorporar la página administrativa con estados de carga, error y reintento, y fechas relativas en `es-EC`.
- Exponer la capacidad `tablero-administrador` y sus pruebas.

## Capabilities

### New Capabilities
- `tablero-administrador`: consulta agregada de datos, actividad auditada y salud de servicios para administración.

## Impact

- Backend: ruta de usuarios administrativos, cliente IA y comprobación de almacenamiento.
- Frontend: cliente de tablero, página y ruta/enlace administrativos.
- Tests: `backend/tests/test_tablero_admin.py` y `frontend/src/test/tablero-admin.test.tsx`.
