# Checklist de release

## Antes

- [ ] CI verde para la revisión aprobada; E2E ejecutado y aislado en DinD, sin recursos ni secretos de producción.
- [ ] Migraciones revisadas por compatibilidad hacia delante/atrás y existe una sola head Alembic.
- [ ] Respaldo reciente de PostgreSQL y MinIO, integridad verificada y restaurabilidad probada en destino desechable.
- [ ] Aprobación humana, ventana y responsable identificados.
- [ ] Changelog/versión y artefacto/revisión de release identificables.
- [ ] Entorno y valores de identidad confirmados; overlay, `.env`, red y volúmenes pertenecen al entorno objetivo.
- [ ] Procedimiento de recuperación y criterio de rollback disponibles.

## Durante

- [ ] Confirmar identidad: `DEPLOY_ENV`, `COMPOSE_PROJECT_NAME`, `IMAGE_PREFIX`, `COMPOSE_NETWORK`.
- [ ] Confirmar guard y lock del despliegue; detenerse ante contexto inconsistente.
- [ ] Crear respaldo antes de migrar y anotar identificador/huellas.
- [ ] Aplicar cambios con `deploy.sh`; migraciones Alembic explícitas, según el flujo aprobado.
- [ ] Verificar salud de servicios y errores de logs tras cada etapa.
- [ ] Confirmar que PostgreSQL/storage y sus volúmenes persistentes no se recrearon.

## Después

- [ ] Smoke HTTP por la ruta interna y el borde autorizado; confirmar códigos y TLS.
- [ ] Revisar estado de DB/Alembic sin extraer datos clínicos.
- [ ] Inspeccionar montajes y nombres de volúmenes; confirmar persistencia.
- [ ] Registrar revisión, respaldo, migración, checks HTTP, salud y desviaciones como evidencia sin secretos.
- [ ] Mantener una ventana de observación y una ventana de rollback acordadas con responsable.

## Rollback

Iniciar rollback si el servicio no recupera salud dentro del umbral aprobado, si fallan rutas críticas, hay errores de integridad o la migración no es compatible. Antes de actuar, confirmar nuevamente identidad, metadata de Compose y autorización; conservar logs y evidencia. El rollback de código solo es admisible si la revisión Alembic actual es compatible con la versión anterior. Si no lo es, detenerse y activar recuperación aprobada con respaldo; no forzar downgrade.

No se revierten automáticamente migraciones de base, datos escritos después del respaldo, objetos MinIO, secretos/configuración del host, certificados ni cambios externos de red/proxy. No ejecutar `docker compose down -v`, no recrear `postgres`/`storage` y no sustituir `.env`.
