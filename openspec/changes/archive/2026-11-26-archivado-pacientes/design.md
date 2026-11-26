# Design

## Context

La entidad `Paciente` ya conserva identidad cifrada y casos relacionados, y el API limita las consultas por institución. El listado es paginado y filtra por código; la matriz de permisos se mantiene en el catálogo de aplicación y en migraciones. El cliente web consume tipos OpenAPI y reutiliza `Badge`, `Checkbox` y `Dialog` del design system.

## Goals / Non-Goals

**Goals:**

- Representar el archivado como estado reversible y conservar todas las filas clínicas relacionadas.
- Evitar transiciones simultáneas incompatibles y auditar únicamente las transiciones efectivas.
- Mantener el filtro y la paginación del listado, permitiendo consultar registros archivados de forma deliberada.
- Hacer explícita la consecuencia de archivar o reactivar antes de confirmar.

**Non-Goals:**

- Borrar pacientes, identidades, casos o contenido clínico.
- Impedir la lectura, exportación o corrección de datos de un paciente archivado.
- Cambiar autenticación, OCR o investigación.

## Decisions

- Añadir `archivado_en TIMESTAMPTZ NULL` y `archivado_por_id UUID NULL` con FK `ON DELETE SET NULL`. La fecha nula identifica el estado activo; la fecha registrada conserva el historial aunque después se elimine el usuario actor.
- Usar el permiso nuevo `paciente.archivar`, incorporado al catálogo y al dominio del rol doctor. La migración asignará el permiso a cualquier rol que, al aplicarse, ya tenga `paciente.escribir`; ambas inserciones serán idempotentes.
- Ejecutar las transiciones con bloqueo de fila y comprobar la institución antes de cambiar el estado. Las solicitudes repetidas producen `409`; las transiciones correctas confirman el paciente y registran después un evento sin valores personales ni detalles, identificado por el usuario y el paciente.
- Mantener la consulta por id independiente del estado. El listado filtrará archivados en SQL antes de contar y paginar, y aceptará `incluir_archivados=true`; cada respuesta `PacienteOut` incluirá `archivado_en`.
- Comprobar el estado archivado antes de crear un caso. No se inserta el caso ni se registra `CASE_CREATE` cuando la operación responde `409 paciente_archivado`.
- En la pantalla, usar un checkbox etiquetado para el filtro, un `Badge` con texto para distinguir ambos estados y el `Dialog` existente para confirmar. Su descripción será explícita y Radix conservará el comportamiento de foco y Escape; tras confirmar, se recarga la lista.
- Extender el tipo OpenAPI y el cliente API existente; no se añade dependencia ni un segundo patrón de diálogo.

## Risks / Trade-offs

- Si se elimina al usuario actor, `archivado_por_id` queda nulo por diseño, pero `archivado_en` y el evento de auditoría conservan la evidencia de la transición.
- La exclusión predeterminada cambia el total y las páginas visibles para quienes antes veían todos los pacientes; `incluir_archivados` conserva una vía explícita para consultar el conjunto completo.
- La prueba de migración depende de ejecutar Alembic hasta `head`; los endpoints y permisos se verifican además con la base PostgreSQL de pruebas.
