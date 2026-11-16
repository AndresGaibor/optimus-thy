# Proposal

## Why

El `ia/` del operativo quedó en el scaffold: no tiene adaptadores reales, no carga los tres pesos y no devuelve las máscaras ni el XML que produce la cadena entregada (IDI-086). El backend, además, perdió en la migración `0010` las columnas donde se persiste esa evidencia. El académico ya tiene la implementación real medida en CPU (~12 s por inferencia).

## What Changes

- Se porta al operativo el servicio `ia/` del académico: adaptadores de YOLO11, BGAU-Net y Swin, carga única con huella de los pesos, MGAC y artefactos por nódulo (contrato 1.1).
- Se añade `POST /recargar` al servicio de IA para releer los pesos sin reiniciar el contenedor.
- **BREAKING**: la migración `0011` restaura `nodulos.mascara_ruta_s3`, `mgac_ruta_s3`, `xml_ruta_s3`, `superposicion_ruta_s3` y `origen_mascara`, y `inferencias.ancho`, `alto`, `version_contrato`, `umbrales`, `huella_modelos` e `inmutable`.
- Se añade `modelos_ia.ruta_pesos` y el flujo de administración: subir un paquete de pesos, verificar su SHA-256, registrarlo y activarlo.
- El modelo activo no se codifica en el código: vive en `MODELOS_DIR`, un volumen compartido entre backend e `ia`, y el administrador lo reemplaza desde la interfaz.

## Capabilities

### New Capabilities

- `modelos-ia`: un administrador sube un paquete de pesos, el sistema lo verifica, lo registra y activa una sola versión; la IA recarga desde el volumen compartido.

### Modified Capabilities

- `inferencia`: el registro vuelve a incluir los artefactos por nódulo y la metadata del contrato.

## Impact

- `ia/` completo, `backend/app/models/imagenes.py`, migración `0011`, `backend/app/api/modelos_ia.py`, `backend/app/config.py`, `docker-compose.yml`, `docs/` y `ADR-020`.
- El OCR sigue fuera del operativo: no se restauran `extracciones_ocr`, `campos_ocr` ni las columnas de OCR de documentos e imágenes.
