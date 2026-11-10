# Operación

## Entornos

| Entorno | Topología | Ruta de aplicación | Puerto | Exposición |
|---|---|---|---|---|
| labturingserver | Docker Compose; borde HTTPS | `/opt/apps/optimus-thy` | `18443` | Solo Tailscale; host y URL efectivos **pendientes de verificar en servidor**. |
| tiroides2 | Cloudflare Tunnel → nginx en `127.0.0.1:5033`; backend y datos separados según instalación existente | Repo operativo y configuración del host existente | `5033` (nginx) | Dominio por Cloudflare; Tailscale Serve adicional solo en la tailnet. |

**No mezclar runbooks:** las rutas, puertos, proxy, servicios y procedimientos de `labturingserver` no describen `tiroides2`, ni a la inversa. Antes de operar, identifica el host y sigue únicamente su runbook.

## Documentos operativos

| Documento | Propósito | Estado |
|---|---|---|
| [labturingserver.md](labturingserver.md) | Adopción inicial, despliegue, rollback, identidad y E2E del host nuevo. | vigente; datos de servidor pendientes de verificar |
| [despliegue-tiroides2.md](despliegue-tiroides2.md) | Operación y corte del entorno antiguo tiroides2. | vigente para ese entorno |
| [recuperacion.md](recuperacion.md) | Recuperación de base, archivos, secretos y servidor limpio. | referencia operativa; ensayos pendientes |
| [diagnostico.md](diagnostico.md) | Comprobaciones de solo lectura y acciones seguras ante síntomas. | referencia operativa |
| [checklist-release.md](checklist-release.md) | Controles previos, durante y posteriores a un release, rollback. | vigente |
| [matriz-verificacion.md](matriz-verificacion.md) | Evidencia y estado de verificación de controles y runbooks. | vigente; no acredita verificación en servidor |
| [custodia-respaldos.md](custodia-respaldos.md) | Custodia de respaldos, claves, secretos y simulacros. | referencia operativa |
| [incidente-e2e-rollback-2026-11-09.md](incidente-e2e-rollback-2026-11-09.md) | Registro de incidente y acciones correctivas. | incidente |
| [sincronizar-academico.md](sincronizar-academico.md) | Flujo de sincronización del repositorio académico y producción. | referencia |
| [politica-dependencias.md](politica-dependencias.md) | Política de evaluación, actualización y revisión de dependencias. | vigente |

## Primera actualización

1. Leer este índice y confirmar el entorno destino.
2. Para labturingserver, revisar [labturingserver.md](labturingserver.md), [checklist-release.md](checklist-release.md) y [matriz-verificacion.md](matriz-verificacion.md).
3. Revisar [recuperacion.md](recuperacion.md) y [custodia-respaldos.md](custodia-respaldos.md) antes de cualquier operación con datos o claves.
4. Si el destino es tiroides2, usar exclusivamente [despliegue-tiroides2.md](despliegue-tiroides2.md).
