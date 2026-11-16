# ADR-020 — El operativo no procesa OCR

**Estado:** Aceptada.  
**Fecha:** 2026-11-16.  
**Relacionada:** [ADR-012](ADR-012-repo-produccion.md).

## Contexto

El OCR del anteproyecto (Tesseract + PyMuPDF, RF-DOC-05/06/07/08, CA-04) llegó al repo operativo como esquema y servicio sin flujo: `extracciones_ocr` y `campos_ocr` no tenían endpoint, `jobs/worker.py` dejaba `MANEJADORES` vacío y `OCR_URL` no se leía en el backend. El modelo de IA entregado devuelve la clase y la caja del nódulo, sin máscara, así que las columnas de máscara del esquema tampoco tenían origen.

## Decisión

El repo operativo elimina el OCR completo: las tablas `extracciones_ocr` y `campos_ocr`, el servicio `ocr/`, la variable `OCR_URL`, el tipo de trabajo `ocr` y las pantallas que lo representaban. También se recortan `nodulos.mascara_ruta_s3`, `inferencias.inmutable` y `fichas_clinicas.origen_datos`.

El repo académico conserva el modelo completo, el servicio `ocr/` y las pantallas: son evidencia del anteproyecto. La diferencia es deliberada y se rige por ADR-012: no se copia entre repos, se adapta.

## Consecuencias

- El esquema de producción pasa de 23 a 21 tablas; migración `0010` con `downgrade` que recrea la estructura vacía.
- `docs/arquitectura/modelo-de-datos-v1.md` describe el esquema de producción; el académico mantiene su propio documento.
- La demostración de OCR no puede ejecutarse desde el operativo; se muestra desde el académico.
- El contrato OpenAPI y las pruebas de humo de despliegue dejan de nombrar el servicio `ocr`.
