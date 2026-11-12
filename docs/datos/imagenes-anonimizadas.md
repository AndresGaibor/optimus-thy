# Imágenes anonimizadas: origen y permiso de uso (HT-094)

Estado: **parcialmente completado**. Las celdas verificables por medición del paquete están completas; los campos que dependen de documentación externa permanecen pendientes y se indican explícitamente.

## Origen y permiso

| Campo | Valor |
| --- | --- |
| Origen de las imágenes (institución, servicio, conjunto) | Paquete de imágenes del estudio **IDI-086** («Thyroid Data»), entregado para esta tesis. **Declaración del usuario (2026-11-10, no verificable externamente):** las imágenes se entregaron como paquete del estudio IDI-086 para esta tesis y son las que usa el modelo. Institución/servicio clínico de origen: _no documentado en el repositorio_. |
| Quién las entregó y fecha | **Declaración del usuario (2026-11-10):** entregadas por los autores de la tesis como paquete del estudio IDI-086 para esta tesis. Fecha exacta de entrega: _pendiente de confirmación documental_. |
| Cantidad total | **3.115** archivos de imagen. Recuento por clase/carpeta del paquete: `0` = 1.905, `1` = 1.210. |
| Permiso de uso (documento, autoridad, alcance, vigencia) | **Pendiente (documento externo).** Falta: documento formal de permiso de uso con **autoridad emisora**, **alcance** y **vigencia** (p. ej. aprobación del comité de ética del estudio IDI-086, convenio o carta de cesión de datos). **Quién lo aporta:** tesistas y/o director de tesis (custodios del estudio). Sin este documento no se puede afirmar permiso formal más allá de la declaración de uso para la tesis. |
| Condiciones (solo investigación, sin redistribución, etc.) | Uso declarado para esta tesis (según declaración del usuario, 2026-11-10). Condiciones formales escritas (p. ej. solo investigación, sin redistribución, retención): **pendientes** del documento de permiso/aprobación ética; no se asumen condiciones adicionales. |

## Revisión de muestra

Objetivo: comprobar que ninguna imagen traiga texto ni datos personales grabados (nombre, cédula, fecha de nacimiento, historia clínica, marcas del equipo con identificadores).

| Campo | Valor |
| --- | --- |
| Tamaño y criterio de la muestra | **60 imágenes** (30 por clase `0` y `1`), selección sistemática y reproducible: primeros 30 de cada clase ordenados por `sha256` ascendente del archivo. |
| Revisor y fecha | Revisión automatizada por script de auditoría (`/tmp/ht094_audit.py`, manifiesto `/tmp/ht094_imagenes_manifiesto.json`), **2026-11-10**. Revisión humana de las detecciones marcadas: _pendiente_. |
| Imágenes con texto o datos grabados | OCR (`tesseract 5.5.0`, `-l spa --psm 6`): **18/60** imágenes con palabras de confianza media > 60 (9 clase `0`, 9 clase `1`), tipificadas como **fragmento corto/ruido** (14) y **texto corto/indeterminado** (4); ejemplos de texto detectado: «ar», «4», «E», «5 3 pu», «2 5 A», «E A ES E y a E». **Ninguna detección compatible con nombre, cédula, fecha, historia clínica ni identificador de equipo** en la muestra; las detecciones son caracteres aislados/ruido de OCR sobre ecografía. Metadatos de imagen: **0** con EXIF, **0** con perfil ICC, **0** con comentario. |
| Acción tomada (recorte, descarte, reanonimización) | **Ninguna** en esta revisión automatizada (no se modificó el conjunto). Se recomienda revisión visual humana de las 18 imágenes marcadas si se requiere certeza absoluta. |
| Resultado | **Sin evidencia de datos personales grabados en la muestra** (0/60 con texto compatible con identificadores personales/fechas/equipo). Conjunto medido: 3.115 JPEG, modo RGB, 0 con EXIF/ICC/comentario, 0 duplicados exactos por `sha256`. La ausencia total en las 3.055 imágenes no muestreadas no queda demostrada por esta muestra. |

Las imágenes no se guardan en este repositorio.

## Mediciones del conjunto (agregadas)

| Medición | Valor |
| --- | --- |
| Total / por clase | 3.115 (clase `0`: 1.905, clase `1`: 1.210) |
| Formato real (cabecera) y PIL | JPEG 3.115 / 3.115 |
| Tamaño de archivo (bytes) | mín. 5.131, mediana 31.991, máx. 80.458 |
| Modo / resoluciones distintas | RGB; 259 resoluciones únicas (muestra de tamaños en píxeles en el manifiesto) |
| Metadatos | EXIF: 0 imágenes (sin etiquetas); perfil ICC: 0; comentario: 0 |
| Duplicados exactos (`sha256`) | 0 grupos, 0 archivos en grupos duplicados |

## Pendientes explícitos (no verificables en el repositorio)

- **Documento de permiso de uso con autoridad y vigencia** (aprobación ética del estudio IDI-086, convenio o carta de cesión): falta. **Quién lo aporta:** tesistas y/o director de tesis. Sin él no se acredita permiso formal.
- **Fecha exacta de entrega** de las imágenes: pendiente de confirmación documental.
- **Institución/servicio clínico de origen** y condiciones formales escritas: no documentadas aquí.
- **Revisión humana** de las 18 detecciones OCR de la muestra y, si se exige, revisión exhaustiva fuera de muestra.

No se inventan números de oficio ni fechas de aprobación.

## Cómo se reprodujo

- Entorno: `/home/ubuntu/modelos/venv-py312/bin/python` (Python 3.12.3, Pillow 13.0.0, numpy 2.5.4, opencv 5.0.0) y `tesseract 5.5.0` (leptonica 1.86.0, idioma `spa`).
- Comando:
  - `/home/ubuntu/modelos/venv-py312/bin/python /tmp/ht094_audit.py`
- Script desechable: `/tmp/ht094_audit.py` (no incluido en el repo). Manifiesto completo (agregados y detalle de la muestra OCR, sin imágenes ni datos personales): `/tmp/ht094_imagenes_manifiesto.json`.
- Resumen del manifiesto: `counts {0:1905,1:1210} total 3115`; `sizes_bytes {min:5131, median:31991, max:80458}`; `formats_magic/pil_formats {JPEG:3115}`; `modes {RGB:3115}`; `resolutions_unique_count 259`; `metadata {images_with_exif:0, images_with_icc_profile:0, images_with_comment:0, exif_tag_names:[]}`; `duplicates {duplicate_groups:0, files_in_duplicate_groups:0}`; OCR muestra 60 (30/clase, sha256 asc.): `flagged_count_mean_conf_gt60 18` (14 fragmento corto/ruido, 4 texto corto/indeterminado), sin detecciones compatibles con nombre/cédula/fecha/historia clínica/identificador de equipo.

