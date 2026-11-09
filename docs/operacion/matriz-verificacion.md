# Matriz de verificación

Los estados describen únicamente la evidencia disponible en esta preparación documental; ninguno certifica el host real.

| Objetivo | Estado | Evidencia o motivo |
|---|---|---|
| Separación de documentación labturingserver/tiroides2 | verificado localmente | Runbooks delimitan topología, alcance y prohibición de mezclarlos. |
| Adopción de Compose existente | pendiente de verificar en servidor | Escenario de adopción verificado localmente en E2E; inspección del host, volúmenes y resultado en servidor pendientes. |
| E2E local en DinD | verificado localmente | `TMPDIR=/var/tmp bash tests/e2e/run-isolated.sh` terminó con exit 0; detalles en «Evidencia de la verificación local (2026-11-09)». |
| Job E2E en GitHub Actions | pendiente de verificar en servidor | Definido en el workflow; se ejecutará al abrir el PR; no se ha corrido en Actions. |
| Controles de seguridad (identidad, guards, rollback) | verificado localmente | `bun audit --audit-level=high`: 0 high/critical; `bun run test`: 187 pruebas OK; `bun run catalogo:test`: 280 pruebas OK; `shellcheck` y `bash -n` de scripts de despliegue/E2E OK. |
| Recuperación PostgreSQL | pendiente de verificar en servidor | Procedimiento redactado; restauración de host/volúmenes del entorno nuevo no ensayada. |
| Recuperación MinIO | pendiente de verificar en servidor | `infra/scripts/restaurar-archivos.sh` probado localmente con datos sintéticos (verificar, extraer, rechazar path traversal y volumen no vacío); restauración real en servidor pendiente. |
| Backups externos | bloqueado por configuración externa | Custodia externa/S3 no consta configurada ni verificada; requiere destino y custodia externos. |
| Checklist de release | verificado localmente | Checklist documental creado; ejecución/aprobación corresponde a cada release. |
| Índice y README | verificado localmente | Enlaces de navegación e índice operativo incorporados. |
| Auditoría de exposición | verificado localmente | Se sustituyen IP/nombre de tailnet por marcadores en los archivos dentro del alcance; no es auditoría de red del servidor. |

## Evidencia de la verificación local (2026-11-09)

- `TMPDIR=/var/tmp bash tests/e2e/run-isolated.sh` → exit 0. Pasaron guards negativos (sin `.env`, proyecto vacío, proyecto de producción, sin overlay, `APP_DIR` fuera de `E2E_ROOT`, rollback con metadata inválida y target inválido), ausencia de `down -v`, detección de instalación heredada con `./deploy.sh adopt`, deploy con respaldo y migración, y salud HTTPS (`/healthz` 200, `/api/health` 200, `/api/auth/me` 401).
- El E2E confirmó la persistencia del registro sintético `e2e_adopcion` y de `CreatedAt` del volumen `*_pgdata` tras la adopción; segundo deploy y rollback con salud OK; snapshot exterior del proyecto `optimus-thy` idéntico.
- `bun audit --audit-level=high` → 0 high/critical; `bun run test` → 187 pruebas OK; `bun run catalogo:test` → 280 pruebas OK.
- `shellcheck` y `bash -n` de scripts de despliegue/E2E → OK; enlaces relativos de docs operativos → 0 rotos.
