# Tasks

## 1. Esquema de datos

- [x] 1.1 Crear la migración `0010` que elimina `extracciones_ocr` y `campos_ocr`, y las columnas `nodulos.mascara_ruta_s3`, `inferencias.inmutable` y `fichas_clinicas.origen_datos`; `downgrade` recrea la estructura vacía.
- [x] 1.2 Quitar de `app/models` los modelos `ExtraccionOCR` y `CampoOCR`, su relación en `Documento`, los exports de `__init__.py` y las columnas eliminadas.
- [x] 1.3 Verificar con `alembic upgrade head` y `alembic downgrade -1` en el entorno local.

## 2. Aplicación

- [x] 2.1 Reducir `jobs/queue.py` (`TIPOS`) y `api/trabajos.py` (tipo `inferencia`) al único tipo vigente.
- [x] 2.2 Quitar las entradas de OCR de `audit/actions.py` y su caso en `tests/test_audit.py`.
- [x] 2.3 Ajustar `tests/test_modelo_datos.py` y `tests/test_validacion_ht_hu.py` al esquema recortado.
- [x] 2.4 Regenerar `contracts/openapi.json`.

## 3. Despliegue

- [x] 3.1 Eliminar el servicio `ocr` de `docker-compose.yml` y la variable `OCR_URL` del backend; borrar el directorio `ocr/`.
- [x] 3.2 Quitar `ocr` de `infra/deploy/lib.sh`, `release.sh`, `rollback.sh` y actualizar `infra/README.md`.

## 4. Interfaz

- [x] 4.1 Eliminar `OcrField` y `OcrWorkflowScreen` con sus historias, y quitar `ocrConfianza`, «En OCR» y los estados de OCR de las pantallas y fixtures.
- [x] 4.2 Quitar la mención de `ocr/` en `frontend/src/inicio/Arquitectura.mdx` y ajustar el texto de `HomeScreen`.

## 5. Documentación y cierre

- [x] 5.1 Actualizar `docs/arquitectura/modelo-de-datos-v1.md` y su diagrama al esquema resultante.
- [x] 5.2 Escribir un ADR nuevo que registre la divergencia: el académico conserva OCR y el operativo no.
- [x] 5.3 Correr `make check` y verificar el arranque del entorno sin el servicio `ocr`.
- [x] 5.4 Commit y pull request del operativo.
