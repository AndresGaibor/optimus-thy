# Design

## Context

`FichaVersion` y `fichas_versiones` ya existen y almacenan una instantánea posterior, autor y fecha, pero todavía no hay una ruta de guardado de ficha ni un endpoint de comparación. La ruta nueva vive en `backend/app/api/fichas.py`; `main.py` registra cada router de dominio. La pantalla real del caso es `frontend/src/pages/medico/CasoPage.tsx`.

## Goals / Non-Goals

**Goals:** conservar el antes y el después de cada cambio efectivo, limitar lectura/escritura al permiso de ficha y a la institución, y mostrar el historial en el caso.

**Non-Goals:** reescribir la bitácora, alterar `backend/app/api/pacientes.py`, cambiar datos históricos ya existentes o crear una segunda tabla de versiones.

## Decisions

- Extender la tabla existente `fichas_versiones` con `snapshot_anterior` nullable en una migración nueva; `snapshot` sigue representando el estado posterior. La nulabilidad conserva compatibilidad con filas históricas que solo guardaron el estado posterior.
- Añadir `PATCH /casos/{caso_id}/ficha` como entrada de guardado parcial y `GET /casos/{caso_id}/ficha/historial` como lectura de las versiones del caso en orden descendente.
- Reutilizar `ficha.leer`, `ficha.escribir`, el aislamiento por institución y `registrar` de auditoría.
- Componer el panel con átomos y moléculas existentes del barril `frontend/src/design-system`; mantener las llamadas HTTP en `frontend/src/api/`.

## Risks / Trade-offs

- Las instantáneas contienen información clínica y se mantienen junto a las versiones de ficha; la autorización de lectura y el alcance institucional se aplican en cada consulta.
- Para versiones antiguas sin `snapshot_anterior`, el antes no es recuperable si no existe una versión previa; la API lo presenta como desconocido y no lo inventa.
