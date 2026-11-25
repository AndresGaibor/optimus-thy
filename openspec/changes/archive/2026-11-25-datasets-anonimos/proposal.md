## Why

El módulo de investigación aún no puede entregar datos: no existe un dataset persistido y las rutas de consulta no tienen nada que leer. Sin un proceso de anonimización verificable, exponer casos clínicos incumpliría RF-INV-02 y RS-ANO-03.

## What Changes

- **Modelo y migración**: `datasets` guarda la versión fija (nombre, descripción, total, `k`, huella, criterios y fecha) y `datasets_casos` guarda cada fila anonimizada con su vínculo interno al caso; migración `0019`.
- **Anonimización**: módulo `app/investigacion/anonimizacion.py` que elimina identificadores directos, reemplaza al paciente por un seudónimo aleatorio por dataset, desplaza y trunca fechas a mes, agrupa edades en decenios y descarta texto libre.
- **Alta**: `POST /investigacion/datasets` construye el conjunto a partir de un filtro clínico, exige consentimiento vigente de investigación, rechaza `k < 5` o conjuntos menores que `k` con 422 y guarda la huella SHA-256.
- **Consulta**: `GET /investigacion/datasets` lista los metadatos y `GET /investigacion/datasets/{id}` abre las filas anonimizadas; ambas exigen `investigacion.leer` y solo ven la institución de la sesión.
- **Auditoría**: crear, listar y abrir dejan un evento `RESEARCH.DATASET_CREATE` o `RESEARCH.DATASET_READ` con el identificador del dataset y el número de filas, sin datos clínicos ni personales.
- **Pruebas**: `backend/tests/test_datasets.py` cubre alta, listado, detalle, umbral `k`, permisos, anonimización campo a campo, filtro, huella estable y bitácora.

## Impact

- Base de datos: nueva migración `0019_datasets_anonimos` con dos tablas, claves foráneas, índices y restricciones de `k`.
- API: tres rutas nuevas en el router de investigación y contrato OpenAPI regenerado.
- Permisos: se reutiliza `investigacion.leer`; no se crean permisos nuevos.
- Fuera de alcance: exportación de archivos (HU-095), métricas del modelo (HU-091), cohortes (HU-096) y la interfaz del investigador.
