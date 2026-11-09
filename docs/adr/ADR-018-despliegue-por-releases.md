# ADR-018: Despliegue por releases con migraciones explícitas

- Estado: Aceptada
- Fecha: 2026-11-09

## Contexto

El despliegue nuevo necesita releases identificables y recuperables sin confundir el sistema tiroides2 anterior. Migrar automáticamente al arrancar el backend mezcla operación de aplicación y esquema; además, una vuelta de código no revierte de forma segura una migración.

## Decisión

Cada release se construye desde un SHA y se conserva en `APP_DIR/releases/<sha>`. El CLI registra la release activa en `APP_DIR/deployments/current.json`, ejecuta migraciones Alembic explícitas y respalda antes de migrar. Debe haber una sola `head`. Se usan healthchecks para decidir si la versión se acepta. El rollback solo revierte la aplicación cuando la revisión del esquema es compatible; nunca se infiere que sea seguro hacer downgrade. Check/status son de solo lectura y las operaciones mutables requieren bloqueo y confirmación.

## Consecuencias

Se puede identificar qué código está activo y retener releases anteriores. El despliegue requiere verificar respaldo, salud y compatibilidad del esquema, y puede detenerse para intervención ante migraciones fallidas. La base y el volumen de archivos son estado durable y quedan fuera de la lógica de rollback de aplicación.

## Alternativas consideradas

- Migrar automáticamente al iniciar el backend: rechazada por acoplar arranque y cambios de esquema.
- Desplegar una rama/tag móvil sin registrar SHA: rechazada por no permitir identificar el artefacto exacto.
- Rollback automático con downgrade de base: rechazado por riesgo de pérdida/incompatibilidad de datos.
- Sobrescribir una única instalación sin releases: rechazada por dificultar recuperación y auditoría.
