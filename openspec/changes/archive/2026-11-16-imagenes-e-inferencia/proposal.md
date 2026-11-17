# Proposal

## Why

El operativo ya tiene la cadena real de IA y la administración de pesos, pero no puede recibir una ecografía ni ejecutar una inferencia: faltan la carga de imágenes con saneo de metadatos y el manejador del trabajo `inferencia`. Sin eso el flujo clínico termina en el servicio de IA y no deja evidencia en la base.

## What Changes

- Se añade `POST /casos/{caso_id}/imagenes` y `GET /casos/{caso_id}/imagenes`: tipo real por contenido con Pillow, límite de 15 MB, mínimo 64×64, recodificación píxel a píxel sin EXIF/ICC/texto y SHA-256 de la copia saneada; clave opaca en S3 y lectura solo por enlace firmado.
- El operativo no detecta texto incrustado en la imagen porque no tiene OCR (ADR-020); el saneo cubre metadatos.
- Se registra el manejador `inferencia` del worker: lee la imagen del almacenamiento, llama a `POST /inferir` del servicio de IA, decodifica el contrato 1.1 y guarda en una sola transacción inferencia, nódulos y artefactos (máscara, MGAC, XML, superposición, contrato crudo).
- La migración `0012` añade a `nodulos` la clase, las probabilidades, la región analizada y los píxeles de máscara.

## Capabilities

### New Capabilities

- `imagenes`: carga y listado de ecografías del caso con saneo de metadatos y enlaces firmados.
- `inferencia`: procesamiento en cola del trabajo `inferencia` con persistencia del contrato y sus artefactos.

## Impact

- Backend: rutas nuevas, worker con manejador registrado, dependencia `Pillow`, migración `0012`.
- Contrato OpenAPI y tipos del frontend regenerados.
- Sin cambios en el servicio `ia/`.
