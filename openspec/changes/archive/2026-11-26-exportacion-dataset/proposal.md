# Proposal

## Why

El rol investigador puede consultar datasets anonimizados pero no puede sacarlos del sistema. RF-INV-08 (CA-10, CA-12) exige exportar datos y métricas desidentificados con permiso y registro, y la pantalla `/investigador/exportaciones` sigue en `PlaceholderPage`. Un archivo sin ficha técnica no es publicable: el lector no sabe qué cohorte, qué `k` ni qué huella corresponde a las filas.

## What Changes

- Añadir `GET /investigacion/datasets/{id}/exportar?formato=csv|json`, con el permiso `investigacion.exportar`.
- Incluir una ficha técnica en el archivo: nombre, descripción, fecha, `k`, `k_efectivo`, huella, criterios, columnas y nota de desidentificación. En CSV, la ficha va como líneas `#` antes de la cabecera.
- Registrar la exportación en la bitácora como `RESEARCH.DATASET_EXPORT` con el número de filas y el formato, nunca con el contenido.
- Negar con 403 si el rol no tiene el permiso y con 404 si el dataset no existe o es de otra institución.
- Ofrecer el botón «Exportar» en el detalle del dataset, con selector de formato y avisos de resultado.

## Capabilities

### New Capabilities

- `exportacion-datasets`: descarga de un dataset anonimizado con su ficha técnica y registro en la bitácora.

### Modified Capabilities

## Non-Goals

- No exporta métricas del modelo: eso ya lo cubre `metricas-modelo`.
- No recalcula la anonimización; exporta las filas ya persistidas.
- No añade un paquete comprimido con varios archivos: un formato por descarga.
