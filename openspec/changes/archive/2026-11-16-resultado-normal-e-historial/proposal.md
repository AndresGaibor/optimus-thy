# Proposal

## Why

HT-064 pide que una inferencia sin nódulos se presente como resultado normal, y HU-072 pide poder repasar el historial de inferencias del caso. El backend ya persiste `sin_nodulo`, pero la pantalla no muestra nada cuando no hay nódulos y no distingue una inferencia de otra en la lista.

## What Changes

- Cada inferencia de la pantalla del caso muestra fecha, modelo y resultado (Benigno, Maligno o Normal sin nódulo) como encabezado del historial.
- Una inferencia sin nódulos muestra «Normal: sin nódulo detectado» en lugar de un espacio vacío.
- Prueba del manejador que fija `resultado = 'sin_nodulo'` y `confianza = NULL` cuando el contrato no trae nódulos.
- Historia de Storybook para el estado normal.

## Capabilities

### Modified Capabilities

- `resultados-inferencia`: se añade el resultado sin nódulo y el encabezado de historial por inferencia.

## Non-Goals

- No se cambia la definición clínica de «Normal»: sigue siendo «sin nódulo detectado» y el texto queda pendiente del visto bueno del director.
- No se añade filtrado ni paginación del historial.
