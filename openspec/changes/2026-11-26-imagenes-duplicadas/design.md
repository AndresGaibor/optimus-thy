# Design

## Context

La carga se expone desde `CasoPage` mediante `useSubidaEcografia` y `DialogoSubida`. El backend valida y sanea bytes antes de guardar el objeto, y registra auditoría después de insertar la imagen.

## Goals / Non-Goals

**Goals:** comparar el hash del contenido recibido con las huellas del caso antes de acceder al almacenamiento y hacer visible el motivo de conflicto en la lista de archivos.

**Non-Goals:** deduplicación entre casos, eliminación o consolidación de imágenes existentes y cambios al contrato de éxito.

## Decisions

- Calcular SHA-256 de los bytes recibidos y persistir esa huella en la fila de la imagen. La consulta combina `caso_id` y huella, antes de la validación que guarda el objeto.
- Responder el conflicto con el helper existente `_error`; el retorno temprano evita almacenamiento, inserción y auditoría.
- Conservar el mensaje de error entregado por la API en `subirImagen`, que el hook ya presenta como error asociado al archivo.

## Risks / Trade-offs

Las filas creadas antes de este cambio guardan la huella del contenido saneado y no necesariamente la huella de los bytes originales; no se incluye una migración de esas filas en este cambio.
