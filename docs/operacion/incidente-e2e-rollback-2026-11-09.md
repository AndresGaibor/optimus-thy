# Incidente: rollback E2E recreó contenedores de producción (2026-11-09)

> Documento de incidente. No afirma pérdida cero. No incluye secretos ni datos sensibles. No se desplegó nada remoto como parte de esta documentación.

## Resumen

El 2026-11-09, alrededor de las 07:45 (hora local), una ejecución de rollback E2E actuó sobre el proyecto Compose `optimus-thy` de producción. El caso de rollback no cargó el entorno esperado (`load_env`) y existía un valor/proyecto por defecto, por lo que Compose apuntó a la pila de producción en lugar de a un entorno E2E aislado.

Como consecuencia, Compose recreó contenedores de producción (`postgres`, `storage`, `backend`, `frontend`, `ocr`, `ia`) usando imágenes por defecto tras la restauración del estado local. El contenedor edge intentó publicar `127.0.0.1:18444` y falló porque el puerto ya estaba ocupado. No se tocó el edge manual `optimus-thy-edge` (puerto 5033) ni `optimus-thy-s3`.

Los volúmenes `optimus-thy_pgdata` y `optimus-thy_miniodata` conservan `CreatedAt` 2026-11-04 y no fueron borrados. La pila se restauró con el Compose base y el `.env` de producción mediante `up -d --build postgres storage backend frontend ocr ia`; los contenedores restaurados se crearon el 2026-11-09T12:48Z. La verificación posterior mostró servicios accesibles y datos coherentes con el backup previo disponible, dentro de los límites descritos abajo.

Runbooks relacionados:

- [Despliegue de producción en el servidor Tailscale](despliegue-produccion.md)
- [Despliegue en tiroides2.andresgaibor.com](despliegue-tiroides2.md)

## Línea de tiempo

| Momento (evidencia reportada) | Evento |
|---|---|
| 2026-11-09 07:08 / 07:22 | Backup previo disponible: Alembic `0009`, 24 tablas, 3 usuarios, 54 auditorías; restauración probada. |
| 2026-11-09 ~07:45 local | Ejecución de rollback E2E. El caso no ejecutó `load_env` y había proyecto Compose por defecto. |
| 2026-11-09 ~07:45 local | Compose usó el proyecto `optimus-thy` de producción y recreó `postgres`, `storage`, `backend`, `frontend`, `ocr`, `ia` con imágenes por defecto tras restaurar. |
| 2026-11-09 ~07:45 local | El edge intentó bindear `127.0.0.1:18444` y falló por puerto ocupado. |
| 2026-11-09T12:48Z | Restauración con Compose base y `.env` de producción: `up -d --build postgres storage backend frontend ocr ia`. Contenedores creados en ese momento. |
| Posterior a la restauración | Verificación: host `127.0.0.1:8000/health` 200; `https://tiroides2.andresgaibor.com/` 200; `/api/health` 200; `/api/auth/me` 401; Alembic `0009`; usuarios 3; auditoría 54. |

## Causa raíz

1. **Entorno no cargado en el caso de rollback:** el flujo E2E de rollback no ejecutó `load_env`, por lo que no estableció de forma explícita las variables/identidad del entorno de prueba.
2. **Proyecto Compose por defecto:** al faltar esa identidad, la ejecución resolvió al proyecto Compose por defecto `optimus-thy`, que correspondía a producción.
3. **Aislamiento insuficiente del E2E:** el escenario no impidió operar sobre la pila real cuando el contexto de entorno era incorrecto o incompleto.

## Impacto observado

### Contenedores recreados por Compose (producción)

| Contenedor/servicio | Observación |
|---|---|
| `postgres` | Recreado por Compose sobre el proyecto `optimus-thy`. |
| `storage` | Recreado por Compose sobre el proyecto `optimus-thy`. |
| `backend` | Recreado por Compose sobre el proyecto `optimus-thy`. |
| `frontend` | Recreado por Compose sobre el proyecto `optimus-thy`. |
| `ocr` | Recreado por Compose sobre el proyecto `optimus-thy`. |
| `ia` | Recreado por Compose sobre el proyecto `optimus-thy`. |

Las imágenes usadas tras la recreación/restauración fueron las imágenes por defecto disponibles en ese estado local.

### Edge

| Elemento | Observación |
|---|---|
| Edge del flujo afectado | Intentó bindear `127.0.0.1:18444`; **falló por puerto ocupado**. |

### Componentes no tocados

| Componente | Observación |
|---|---|
| `optimus-thy-edge` (manual) | No tocado; servicio asociado al puerto 5033 según operación existente. |
| `optimus-thy-s3` | No tocado. |

## Volúmenes y persistencia

| Volumen | Evidencia reportada | Interpretación |
|---|---|---|
| `optimus-thy_pgdata` | `CreatedAt` 2026-11-04 | Conservado; no borrado por el incidente reportado. |
| `optimus-thy_miniodata` | `CreatedAt` 2026-11-04 | Conservado; no borrado por el incidente reportado. |

La conservación de volúmenes no equivale a prueba de integridad completa de datos: no hay checksum fila a fila ni auditoría de MinIO que permita afirmar pérdida cero.

## Acciones de restauración

Restauración ejecutada con Compose base y el `.env` de producción:

```bash
# Comando ejecutado para restauración (referencia operativa; no ejecutar sin ventana/aprobación)
docker compose --env-file .env up -d --build postgres storage backend frontend ocr ia
```

Resultado reportado: contenedores creados el `2026-11-09T12:48Z`.

## Evidencia posterior a la restauración

| Verificación | Resultado reportado |
|---|---|
| Host `127.0.0.1:8000/health` | `200` |
| `https://tiroides2.andresgaibor.com/` | `200` |
| `/api/health` | `200` |
| `/api/auth/me` (sin sesión) | `401` |
| Alembic | `0009` |
| Usuarios | `3` |
| Auditoría | `54` |

## Backup previo

Backup disponible del 2026-11-09 07:08 / 07:22:

| Dato | Valor reportado |
|---|---|
| Revisión Alembic | `0009` |
| Tablas | `24` |
| Usuarios | `3` |
| Auditorías | `54` |
| Restauración probada | Sí |

La coherencia entre el backup previo y la verificación posterior es consistente con los recuentos reportados, pero no constituye prueba exhaustiva de integridad.

## Límites y alcance de la evidencia

- **No hay checksum fila a fila:** no se verificó integridad completa de cada registro de base de datos.
- **No hay auditoría de MinIO/objetos:** no se verificó inventario, checksums ni integridad de archivos objeto a objeto.
- **No se puede afirmar pérdida cero:** la ausencia de borrado de volúmenes y la coincidencia de recuentos reportados no prueban que no haya pérdida, corrupción parcial o inconsistencias no observadas.
- **No se desplegó nada remoto:** esta documentación registra el incidente y la restauración local/reportada; no implica despliegue remoto nuevo.
- **Evidencia acotada a lo reportado:** los valores de tiempo, recuentos, códigos HTTP y estado de contenedores/volúmenes provienen de la evidencia proporcionada para este incidente.

## Acciones correctivas

| Acción | Estado/objetivo |
|---|---|
| Guard de rollback (`c2a6234`) | Mitigar ejecuciones de rollback sobre contexto incorrecto. |
| `load_env`/carga explícita de entorno | Evitar que casos E2E operen sin identidad de entorno cargada. |
| Identidad obligatoria de despliegue/proyecto | Requerir proyecto/entorno explícito antes de acciones destructivas o recreadoras. |
| Metadata/validación de contexto | Validar que metadatos y destino coincidan con el entorno esperado antes de ejecutar rollback. |
| E2E aislado (DinD / entorno separado) | Ejecutar E2E en aislamiento para impedir interacción con la pila de producción. |

## Comandos de verificación seguros

Comandos de solo lectura o verificación HTTP/local. No incluyen secretos, no borran datos y no modifican estado.

```bash
# Salud local del backend (solo lectura HTTP)
curl -sS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8000/health

# Salud pública/app (solo lectura HTTP)
curl -sS -o /dev/null -w '%{http_code}\n' https://tiroides2.andresgaibor.com/
curl -sS -o /dev/null -w '%{http_code}\n' https://tiroides2.andresgaibor.com/api/health
curl -sS -o /dev/null -w '%{http_code}\n' https://tiroides2.andresgaibor.com/api/auth/me

# Inspección de contenedores del proyecto (solo lectura)
docker compose -p optimus-thy ps

# Confirmar metadatos de volúmenes sin modificarlos (solo lectura)
docker volume inspect optimus-thy_pgdata --format '{{.Name}} {{.CreatedAt}}'
docker volume inspect optimus-thy_miniodata --format '{{.Name}} {{.CreatedAt}}'
```

Interpretación esperada tras restauración, según evidencia reportada: `/health` y `/api/health` 200; `/api/auth/me` 401 sin sesión; volúmenes existentes con `CreatedAt` previo al incidente. Cualquier acción correctiva o de recuperación adicional debe seguir el runbook correspondiente y requerir ventana/aprobación humana cuando aplique.
