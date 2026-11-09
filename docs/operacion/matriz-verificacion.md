# Matriz de verificación

Los estados describen únicamente la evidencia disponible en esta preparación documental; ninguno certifica el host real.

| Objetivo | Estado | Evidencia o motivo |
|---|---|---|
| Separación de documentación labturingserver/tiroides2 | verificado localmente | Runbooks delimitan topología, alcance y prohibición de mezclarlos. |
| Adopción de Compose existente | pendiente de verificar en servidor | Procedimiento documentado; no se inspeccionó el host, los volúmenes ni el resultado de `./deploy.sh adopt`. |
| E2E en CI | verificado localmente | Contrato documentado como E2E aislado en DinD (`tests/e2e/`); resultado de CI de cada release debe comprobarse en su ejecución. |
| Controles de seguridad (identidad, guards, rollback) | verificado localmente | Guardas, identidad obligatoria y límites de rollback documentados; comportamiento real en host pendiente. |
| Recuperación PostgreSQL/MinIO | pendiente de verificar en servidor | Procedimiento redactado; restauración de host/volúmenes del entorno nuevo no ensayada. |
| Backups externos | bloqueado por configuración externa | Custodia externa/S3 no consta configurada ni verificada; requiere destino y custodia externos. |
| Checklist de release | verificado localmente | Checklist documental creado; ejecución/aprobación corresponde a cada release. |
| Índice y README | verificado localmente | Enlaces de navegación e índice operativo incorporados. |
| Auditoría de exposición | verificado localmente | Se sustituyen IP/nombre de tailnet por marcadores en los archivos dentro del alcance; no es auditoría de red del servidor. |
