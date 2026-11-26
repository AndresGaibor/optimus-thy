# Tasks

## 1. API

- [x] 1.1 Añadir `DATASET_EXPORT` a `AuditAction`.
- [x] 1.2 Implementar `GET /investigacion/datasets/{id}/exportar` con `investigacion.exportar`, formatos `csv` y `json`, ficha técnica y 404/422.
- [x] 1.3 Registrar el evento con `resource_count` y `format`.

## 2. Interfaz

- [x] 2.1 Cliente `exportarDataset` con nombre de archivo desde `Content-Disposition`.
- [x] 2.2 Componente `BotonExportar` con selector de formato, descarga y avisos.
- [x] 2.3 Integrarlo en el detalle del dataset.

## 3. Verificación

- [x] 3.1 `pytest tests/test_datasets.py` en verde (19 pruebas).
- [x] 3.2 `vitest` de la pantalla en verde (9 pruebas).
- [x] 3.3 `ruff`, `mypy`, `typecheck`, `lint`, `ui:check` y `tamanos` en verde.
