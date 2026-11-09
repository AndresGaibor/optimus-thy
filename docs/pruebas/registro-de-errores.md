# Registro de errores (HT-100)

Un error es cualquier fallo observado: una prueba en rojo, un comportamiento
distinto al criterio de aceptación, un defecto de documentación o un hallazgo de
seguridad. Se registra aquí antes de corregirlo, y se cierra cuando la prueba
queda en verde.

## Cómo se usa

- **ID**: `ERR-###`, correlativo y estable.
- **Requisito e historia**: a qué requisito del catálogo y a qué tarjeta afecta.
- **Severidad**: `Crítica` (expone datos o impide operar), `Alta` (rompe un
  criterio de aceptación), `Media` (fallo parcial con alternativa), `Baja`
  (detalle de forma o documentación).
- **Estado**: `Abierto`, `En corrección`, `Resuelto`, `Descartado` (con motivo).
- **Evidencia**: prueba que falla, salida de la CI o captura.
- La fila correspondiente de `docs/pruebas/matriz-de-pruebas.md` apunta a este
  ID cuando el error bloquea un requisito.

## Errores registrados

| ID | Fecha | Requisito | Historia | Descripción | Severidad | Estado | Corrección | Commit |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ERR-001 | 2026-11-04 | RNF-CAL-01 | HT-003 | El check obligatorio `CI OK` fallaba en todas las PR, incluidas las de Dependabot: `gitleaks-action` exige `GITHUB_TOKEN` desde su versión mayor actual y el job de revisión de dependencias no corre sin GitHub Advanced Security (`Dependency review is not supported on this repository`). | Alta | Resuelto | Se pasa `GITHUB_TOKEN` a gitleaks y se le da `pull-requests: read`; el paso de dependency-review queda visible pero sin bloquear, porque el escaneo real del job son los `pip-audit` y `bun audit`. | `ca048fb` |
| ERR-002 | 2026-11-04 | RD-01 | HT-006 | La rama de HT-006 chocaba con `main`: la historia ya estaba cerrada allí con otra organización de módulos (`auditoria.py`, `pacientes.py`, migración `0001`), de modo que fusionarla habría dejado dos modelos y dos migraciones paralelas. | Alta | Resuelto | Se descartó la rama duplicada y las historias siguientes se rehicieron sobre `main`, reutilizando el modelo existente en lugar de sustituirlo. | `86e3d74` |
| ERR-003 | 2026-11-04 | RS-CIF-02 | HT-011 | El cifrado guardaba el criptograma como texto con prefijo `v1:`, pero el modelo v1 define las columnas de identidad como `BYTEA` con una columna `clave_version`, así que el código no encajaba con el esquema ya migrado. | Alta | Resuelto | El cifrador devuelve `nonce || criptograma` en bytes y el tipo `EncryptedBytes` conserva el `BYTEA`; `clave_version` guarda el identificador de la clave. | `86e3d74` |
| ERR-004 | 2026-11-05 | RF-AUT-02, RNF-SEG-04 | HU-003 | El servidor autorizaba por los roles asignados y no por el rol activo: un usuario con rol activo `doctor` seguía pasando `requiere_roles("admin")`, así que «el servidor aplica el rol activo» no se cumplía. | Alta | Resuelto | `requiere_roles` compara contra el rol activo de la sesión; el rol inicial es determinista (primer rol por nombre). | — |
| ERR-005 | 2026-11-05 | RF-AUD-01, RF-AUD-06, RF-AUD-07 | HT-030, HU-001, HU-003, HU-010 | `AuditService` existía pero ninguna ruta lo llamaba: login, logout, intentos fallidos, cambios de usuarios y roles y denegaciones no dejaban rastro. | Alta | Resuelto | `app/audit/http.py` registra cada evento desde las rutas, solo con códigos; nueva acción `ROLE_SWITCH`. | — |
| ERR-006 | 2026-11-05 | RNF-CON-02, RNF-SEG-04 | HT-010 | Los trabajos no tenían dueño (cualquier sesión leía el de otra persona), no había tiempo máximo ni reintento manual, y `error_detalle` devolvía `str(exc)` al cliente (filtraba host y rutas). | Alta | Resuelto | Migración `0007`: `creado_por`, `iniciado_en`, `timeout_segundos` y CHECK de estados; `recuperar_vencidos`, `POST /trabajos/{id}/reintentar`, errores como códigos y detalle solo en el log. | — |
| ERR-007 | 2026-11-05 | RF-AUT-01 | HU-001 | El login enviaba dos `Set-Cookie` y, para un correo inexistente, no pagaba el costo del hash (`_DUMMY_HASH` era inválido y no se usaba), de modo que el tiempo de respuesta revelaba si el correo existía. | Media | Resuelto | Una sola `set_cookie`; `verify_dummy` con hash válido calculado al importar. | — |
| ERR-008 | 2026-11-05 | RF-AUT-03 | HU-002 | Las respuestas autenticadas no llevaban `Cache-Control`, así que al volver atrás el navegador podía mostrar datos de una sesión cerrada. | Media | Resuelto | Middleware añade `Cache-Control: no-store` a toda la API. | — |
| ERR-009 | 2026-11-05 | RD-02 | HT-006 | Ninguna migración sembraba roles ni instituciones: en una base nueva `POST /usuarios` respondía «Rol desconocido». | Alta | Resuelto | Migración `0006_seed_base` idempotente (roles `admin`, `doctor`, `researcher`; ESPOCH y SOLCA), con downgrade que no borra lo que está en uso. | — |
| ERR-010 | 2026-11-05 | RNF-CAL-01 | HT-003 | Sin `TEST_DATABASE_URL` los 73 tests del backend se saltaban y la suite terminaba «verde» sin probar nada; la CI tampoco comparaba el esquema con los modelos ni el contrato OpenAPI con el código. | Alta | Resuelto | `REQUIRE_TEST_DB=1` hace fallar la suite si falta la base (CI y `make check`); `make db-test`; pasos `alembic check` y deriva de `openapi.json` en CI. | — |
| ERR-011 | 2026-11-05 | RD-02 | HT-006 | `alembic check` fallaba: el índice `ix_sesiones_expira_en` estaba en la migración `0002` pero no en el modelo `Sesion`. | Baja | Resuelto | Índice declarado en el modelo; prueba que compara el esquema real con los modelos. | — |
| ERR-012 | 2026-11-05 | RS-ACC-01 | HU-010 | `POST /usuarios` aceptaba cualquier texto como correo y contraseñas de cualquier longitud (el requisito pide ≥ 12). | Media | Resuelto | Validación de correo y `min_length=12` en el servidor, y el mismo mínimo en el formulario. | — |
| ERR-013 | 2026-11-05 | RDS-05 | HT-021 | El criterio de la historia incluye «paginación» pero el sistema de diseño no tenía el componente; `UsuariosPage` lo repetía a mano. | Baja | Resuelto | Molécula `Pagination` con story y pruebas; `UsuariosPage` la usa. | — |
| ERR-014 | 2026-11-05 | RNF-CAL-03 | HT-001 | `main` no tiene protección de rama (`gh api .../branches/main/protection` responde 404): el criterio «solo recibe cambios por pull request con CI en verde» no se cumple, y ya hubo pushes directos. | Alta | Abierto | Pendiente: activar la protección (requiere permisos de administración del repositorio). | — |
| ERR-015 | 2026-11-05 | RS-INF-01 | HT-012 | `optimus-thy-backend.service` escucha en `0.0.0.0:8000`; el criterio pide solo el proxy expuesto. `verificar-proxy.sh` lo detecta como aviso. | Media | En curso | El proxy del host (`optimus-thy-edge`, red del host) llega por `127.0.0.1:8000`, así que el unit ahora usa `--host 127.0.0.1` y `verificar-proxy.sh` falla si 8000 escucha fuera del bucle local. Falta reiniciar el servicio para aplicarlo. | — |
| ERR-016 | 2026-11-05 | RD-12 | HT-094 | `docs/datos/imagenes-anonimizadas.md` tiene origen, permiso y muestra «por completar»: el criterio de la historia no se cumple pese a su commit. | Media | Abierto | Pendiente: requiere los datos reales de origen y permiso; no se pueden inventar. | — |
| ERR-017 | 2026-11-05 | RD-04, RD-09 | HT-090 | El generador sintético elige TI-RADS, Bethesda y CIE-10 al azar e independientes entre sí; no existe etiqueta benigno/maligno/sin nódulo, las fichas no son coherentes con un diagnóstico de referencia y no hay emparejamiento con imágenes. Incumple 3 de los 4 criterios (solo cumple semilla reproducible y sin personas reales). | Alta | Resuelto | Cada caso toma una etiqueta (`sin_nodulo`, `benigno`, `maligno`) y de ella salen TI-RADS, Bethesda, CIE-10, tamaño y tipo de diagnóstico; las etiquetas se reparten en ciclo según la semilla. `--manifiesto` (CSV `archivo,etiqueta,sha256`) empareja cada caso con una imagen de su etiqueta. Falta el manifiesto real, que depende de HT-094. | — |
| ERR-018 | 2026-11-05 | RNF-CAL-05 | HT-005 | `frontend/src/api/schema.d.ts` (cliente tipado generado desde el contrato) estaba desfasado: no incluía `/trabajos` (167 líneas de diferencia con `contracts/openapi.json`). | Media | Resuelto | Se regeneró y la CI ejecuta `bun run gen:api` y falla si hay diferencias. | — |
| ERR-019 | 2026-11-05 | RF-ADM-03, RNF-SEG-04 | HU-013 | La autorización era un valor de retorno: cada ruta debía recordar `isinstance(actual, JSONResponse)`, una ruta nueva sin ese chequeo quedaba abierta, y la validación del cuerpo (422) se evaluaba antes que el 403. Los permisos no se leían de la base: las tablas `permisos` y `roles_permisos` estaban vacías. | Alta | Resuelto | `sesion_actual` y `requiere_permiso("recurso.accion")` lanzan `NoAutenticado` y `Prohibido` (manejadores globales); migración `0008` (catálogo de HU-011) siembra los permisos y la matriz; una prueba falla si una ruta queda sin permiso. | — |

## Plantilla para un error nuevo

```markdown
| ERR-000 | AAAA-MM-DD | RF-XX-XX | HT-000 | Qué se observó, con el paso que lo reproduce. | Media | Abierto | — | — |
```
