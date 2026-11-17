# ADR-020 — El operativo no procesa OCR

**Estado:** Aceptada.  
**Fecha:** 2026-11-16.  
**Actualizada:** 2026-11-16, tras portar la cadena real de IDI-086.  
**Relacionada:** [ADR-012](ADR-012-repo-produccion.md).

## Contexto

El OCR del anteproyecto (Tesseract + PyMuPDF, RF-DOC-05/06/07/08, CA-04) llegó al repo operativo como esquema y servicio sin flujo: `extracciones_ocr` y `campos_ocr` no tenían endpoint, `jobs/worker.py` dejaba `MANEJADORES` vacío y `OCR_URL` no se leía en el backend. El modelo de IA entregado devuelve la clase y la caja del nódulo, sin máscara, así que las columnas de máscara del esquema tampoco tenían origen.

## Decisión

El repo operativo elimina el OCR completo: las tablas `extracciones_ocr` y `campos_ocr`, el servicio `ocr/`, la variable `OCR_URL`, el tipo de trabajo `ocr` y las pantallas que lo representaban. También se recorta `fichas_clinicas.origen_datos`, que solo distinguía valores digitados de confirmados por OCR.

La evidencia de la inferencia **no** se recorta: la cadena de IDI-086 devuelve máscara, máscara MGAC, XML y superposición por nódulo, así que la migración `0011` restaura `nodulos.{origen_mascara,mascara_ruta_s3,mgac_ruta_s3,xml_ruta_s3,superposicion_ruta_s3}` y `inferencias.{ancho,alto,version_contrato,umbrales,huella_modelos,inmutable}`. La primera versión de este ADR los había eliminado por error.

El repo académico conserva el modelo completo, el servicio `ocr/` y las pantallas: son evidencia del anteproyecto. La diferencia es deliberada y se rige por ADR-012: no se copia entre repos, se adapta.

## Consecuencias

- El esquema de producción mantiene 21 tablas; migraciones `0010` (OCR fuera) y `0011` (artefactos de inferencia y ruta de pesos), ambas reversibles.
- `docs/arquitectura/modelo-de-datos-v1.md` describe el esquema de producción; el académico mantiene su propio documento.
- La demostración de OCR no puede ejecutarse desde el operativo; se muestra desde el académico.
- El contrato OpenAPI y las pruebas de humo de despliegue dejan de nombrar el servicio `ocr`.
