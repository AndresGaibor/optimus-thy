# Proposal

## Why

La inferencia ya se ejecuta y persiste, pero no se puede consultar desde la aplicación: no hay endpoint que devuelva la inferencia con sus nódulos y artefactos, ni pantalla de caso para subir la ecografía, ejecutar el análisis y revisar el resultado. HU-070 y HU-071 quedan sin flujo visible.

## What Changes

- `GET /casos/{caso_id}/inferencias`: lista las inferencias del caso con modelo, resultado, umbrales, huella, tiempo y, por nódulo, clase, probabilidades, caja, región, píxeles y enlaces firmados a máscara, MGAC, XML y superposición. Permiso `inferencia.leer` y alcance por institución.
- Pantalla de caso en `/medico/casos/:id`: datos del caso, ecografías con carga, botón «Analizar» por imagen, estado del trabajo en cola y resultados por nódulo con sus imágenes derivadas y el aviso «apoyo, no diagnóstico» siempre visible.
- Navegación desde el listado de casos del paciente.
- Estilos solo del sistema de diseño; clase y probabilidad se muestran con texto además del color.

## Capabilities

### New Capabilities

- `resultados-inferencia`: consulta de inferencias y artefactos por caso, y su pantalla de revisión.

## Non-Goals

- No se crea CRUD de consentimientos: la validación de «consentimiento vigente» de HU-070 queda pendiente de esa pieza y se documenta como dependencia, no se simula.
- No se implementa la decisión médica (HU-073) ni el reporte PDF (HU-080).

## Impact

- Backend: módulo `app/api/resultados.py` (o dentro de `imagenes.py`), contrato OpenAPI y tipos regenerados.
- Frontend: módulo `api/imagenes.ts`, `api/resultados.ts`, `api/trabajos.ts`; página `pages/medico/CasoPage.tsx` y componentes de resultado.
- Sin migraciones: las columnas ya existen desde `0011` y `0012`.
