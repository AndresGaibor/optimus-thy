# ADR-014 — Almacenamiento S3-compatible con MinIO fijado

**Estado:** Aceptada. Reemplaza ADR-005.  
**Fecha:** 2026-11-09.

## Contexto

El almacenamiento de objetos debe ser S3-compatible y reproducible en despliegue; una etiqueta mutable (`:latest`) dificulta auditoría y rollback.

## Decisión

Producción usa MinIO como implementación local S3-compatible, fijada por digest `bitnamilegacy/minio@sha256:451fe6858cb770cc9d0e77ba811ce287420f781c7c1b806a386f6896471a349c`. El dominio y los casos de uso solo dependen de `ObjectStorage` y de configuración `S3_*`.

## Consecuencias

- No se usa `:latest`; una actualización de MinIO exige cambiar el digest y verificar backup/restauración.
- RustFS queda como alternativa evaluada, no adoptada.
- La configuración de compose refleja el digest; la aplicación operativa del stack depende del entorno de despliegue.