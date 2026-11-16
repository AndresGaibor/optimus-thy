# Proposal

## Why

El repo de producción arrastra el modelo de datos y el servicio de OCR del anteproyecto, pero en producción no existe flujo de OCR: falta el endpoint, falta el manejador de la cola, `OCR_URL` no se lee en el backend y las tablas `extracciones_ocr` y `campos_ocr` nunca se llenan. El modelo de IA entregado solo devuelve la clase y la caja del nódulo, así que las columnas de máscara tampoco se pueden poblar.

## What Changes

- **BREAKING**: se eliminan las tablas `extracciones_ocr` y `campos_ocr` con la migración `0010`.
- Se eliminan del esquema las columnas que el modelo entregado no produce: `nodulos.mascara_ruta_s3`, `inferencias.inmutable` y `fichas_clinicas.origen_datos`.
- Se elimina el servicio `ocr/`, su contenedor en `docker-compose.yml`, la variable `OCR_URL` y las referencias de despliegue.
- Se elimina el tipo de trabajo `ocr`; la cola solo admite `inferencia`.
- Se eliminan las pantallas y piezas de interfaz que mostraban OCR con datos sintéticos (`OcrField`, `OcrWorkflowScreen`, estados «En OCR» y `ocrConfianza`).
- El repo académico conserva intacto el modelo completo y el servicio de OCR como evidencia del anteproyecto.

## Capabilities

### New Capabilities

- `documentos`: los documentos del caso se almacenan con hash y versión; no se procesan con OCR en producción.
- `inferencia`: el registro de una inferencia se limita a lo que el modelo entregado produce (clase, confianza y caja por nódulo).

### Modified Capabilities

Ninguna: el repo no tenía especificaciones previas.

## Impact

- Migración `0010` destructiva: elimina dos tablas y tres columnas. Hoy no hay filas en esas tablas (no existen endpoints que las escriban).
- Afecta `backend/app/models`, `backend/app/jobs`, `backend/app/api/trabajos.py`, `audit/actions.py`, `docker-compose.yml`, `infra/deploy/*`, `frontend/src` y `contracts/openapi.json`.
- Es la primera divergencia deliberada con el repo académico y se documenta en un ADR nuevo.
