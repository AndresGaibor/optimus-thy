# ADR-005 — RustFS local mediante interfaz S3-compatible

- **Estado:** Aceptada
- **Fecha:** 2026-09-15
- **Responsable:** Andrés
- **Issue Linear:** TES-4

## Contexto

OPTIMUS-THY necesita almacenar documentos e imágenes fuera de PostgreSQL sin acoplar el dominio a rutas locales. El anteproyecto contempla repositorio local con posibilidad de API compatible con S3.

## Alternativas consideradas

1. Guardar blobs pesados en PostgreSQL.
2. Acoplar el sistema al filesystem local.
3. MinIO.
4. RustFS local detrás de un puerto S3-compatible.

## Decisión

Usar RustFS local detrás de una abstracción `ObjectStorage` compatible con S3.

## Justificación

Mantiene almacenamiento local durante la tesis, permite sustituibilidad mediante una interfaz estándar y evita que los casos de uso dependan del proveedor.

## Consecuencias

- Los metadatos permanecen en PostgreSQL y los binarios en object storage.
- Debe definirse política de nombres, integridad y eliminación consistente.
- Si RustFS deja de ser adecuado, el puerto permite reemplazarlo sin reescribir dominio/aplicación.

## Evidencia

- Linear: TES-4.
- Registro académico: pestaña `Decisiones` del Sheet Tesis.