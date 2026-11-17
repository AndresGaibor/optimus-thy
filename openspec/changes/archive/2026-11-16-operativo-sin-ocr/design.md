# Design

## Context

Ver `proposal.md`. El esquema de producción tiene 23 tablas, de las cuales 12 tienen endpoints; `extracciones_ocr` y `campos_ocr` no tienen endpoint ni manejador de cola (`jobs/worker.py` deja `MANEJADORES` vacío) y `OCR_URL` no se lee en `backend/app`. El servicio `ocr/` solo expone `/health`.

## Goals / Non-Goals

**Goals:**

- Que el esquema de producción refleje lo que el sistema hace: documentos sin OCR y una inferencia con clase, confianza y caja.
- Que el despliegue de producción no construya ni levante el servicio de OCR.
- Que las pruebas y la documentación del operativo sigan verdes tras el recorte.

**Non-Goals:**

- Adaptar `ia/` al modelo entregado (HT-062): la cadena de tres modelos se queda como está.
- Modificar el repo académico: allí el modelo completo y `ocr/` siguen siendo evidencia del anteproyecto.

## Decisions

- **Borrar tablas y columnas en vez de dejarlas vacías.** No hay filas ni endpoints que las escriban; mantenerlas obliga a documentar un modelo que producción no usa. Alternativa descartada: dejar las tablas y marcarlas obsoletas, que no elimina el mantenimiento.
- **Migración `0010` con `downgrade` que recrea estructuras vacías.** El rollback no recupera datos (no existen), pero devuelve el esquema anterior para no bloquear un despliegue fallido.
- **Recorte de columnas del esquema de inferencia.** `nodulos.mascara_ruta_s3`, `inferencias.inmutable` y `fichas_clinicas.origen_datos` no tienen origen con el modelo entregado; se eliminan junto con su código.
- **Tipo de trabajo único `inferencia`.** La cola y el `Literal` de la API se reducen a lo que existe.
- **La interfaz OCR de demostración se elimina.** `OcrField`, `OcrWorkflowScreen`, el estado «En OCR» y `ocrConfianza` describen un flujo que el operativo no tiene; dejarlos induce a error.

## Risks / Trade-offs

- [Pérdida de datos] → No hay filas en las tablas eliminadas ni endpoints que las creen; el `downgrade` recrea la estructura.
- [La demostración del anteproyecto se apoya en el operativo] → La evidencia queda en `optimus-thy-academico`, que conserva esquema, servicio y pantallas.
- [Componentes de Storybook huérfanos] → La guardia `ui:check` y `make check` detectan referencias rotas tras borrar `OcrField`.
- [OpenAPI desactualizado] → `contracts/openapi.json` se regenera con el comando del repo en la misma entrega.

## Migration Plan

1. Aplicar la migración `0010` en el entorno local y verificar `alembic downgrade -1` seguido de `upgrade head`.
2. Desplegar con el `docker-compose.yml` sin el servicio `ocr`; el backend arranca sin `OCR_URL`.
3. Rollback: `alembic downgrade 0009` y volver a la release anterior.

## Open Questions

Ninguna.
