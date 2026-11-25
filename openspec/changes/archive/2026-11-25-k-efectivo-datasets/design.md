# Design

## Context

`anonimizar_caso` ya genera la fila que se guarda en `datasets_casos.datos`; `sujeto` se almacena aparte. No se modifica el esquema persistido ni la forma de anonimizar. La fila actual no publica sexo; los valores hormonales y `tamano_nodulo_mm` permanecen como atributos sensibles fuera de la clave, mientras que sus meses desplazados sí forman parte de ella.

## Goals / Non-Goals

**Goals:** calcular clases sobre las filas publicadas, rechazar clases pequeñas antes de persistir y exponer el mínimo efectivo en respuestas de datasets.

**Non-Goals:** cambiar la anonimización, modificar el modelo/migraciones o generalizar atributos sensibles.

## Decisions

- `cuasi_identificadores` devuelve una tupla ordenada con los once campos de baja cardinalidad del delta de especificación. El endpoint cuenta esas tuplas y no incluye `sujeto`.
- La validación se ejecuta después del control de tamaño total y antes de crear el registro. El error expone únicamente el número de clases bajo `k`.
- `k_efectivo` se calcula desde `datos` al crear y desde las filas persistidas al consultar; no se añade una columna ni se altera la huella.
- El listado carga sus filas en bloque para calcular los resúmenes sin una consulta por dataset.

## Risks / Trade-offs

El control garantiza tamaño mínimo por combinación de atributos de baja cardinalidad, no protege frente a inferencia o singularización basada en valores sensibles publicados. El informe conserva esos riesgos como residuales y el cálculo empírico sobre datos reales sigue requiriendo revisión contextual.
