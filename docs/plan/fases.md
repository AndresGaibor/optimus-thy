# Plan de cierre al 100 % de OPTIMUS-THY (solo plan, sin implementar)

## 1. Contexto

Se pidió revisar las historias técnicas (HT) y de usuario (HU), validar qué funciona y dejar un plan detallado para completar todo, sin implementar aún. Entrega: 23 dic 2026; hoy es 5 nov (quedan ~7 semanas, tres tramos: S3, S4, S5).

Fuentes: catálogo de requisitos (246 IDs), backlog CSV (119 historias, 283 h), `docs/` reales y código en `main`. Las 11 ramas remotas ya están integradas en `main` (0 commits por delante).

**Qué NO se pudo validar todavía:** este plan se hizo leyendo código y documentos. No se ejecutó pytest, alembic ni la app (modo plan, solo lectura). Los puntos marcados *(inferido)* deben confirmarse en la Fase 0, paso 0.1.

Estimaciones de horas "ya hechas" y de holgura son mías (suma de HT/HU con commits en `main`); el CSV no lleva ese dato.

## 2. Estado verificado por historia

Evidencia: commits `(HT-xxx)` en `git log`, rutas en `backend/app`, `frontend/src/AppRoutes.tsx`, `docs/pruebas/matriz-de-pruebas.md`.

**Hechas o casi (≈22, ≈70 h):** HT-001, 002, 003, 004, 005, 006, 007 (servicio, sin rutas), 010 (cola; worker sin manejadores), 011, 012, 020, 021, 022, 024 (documento "propuesto"), 090, 100; HU-001, HU-002, HU-003 (selector de rol, commit `735b150`), HU-010 (parcial).

**Parciales:**
- HT-030 auditoría: servicio y trigger listos, **ninguna ruta lo llama**. RF-AUD-01/06/07 siguen sin cumplirse.
- HU-010: falta filtro por institución (solo opción "Todas") y edición de roles en UI (`reemplazarRoles` en `frontend/src/api/usuarios.ts:156` sin uso).
- HU-011/012: se asignan roles por `PUT /usuarios/{id}/roles`; no hay matriz de permisos (tablas `permisos`/`roles_permisos` existen vacías).
- HT-094: hay commit pero `docs/datos/imagenes-anonimizadas.md` está todo "por completar".
- HT-008 (Kanban): el tablero y su historial viven en Linear, proyecto «OPTIMUS-THY · Backlog de producto»; no hay tablero en el repositorio ni en GitHub.
- HT-009: `contracts/openapi.json` existe, pero CI no lo compara y las respuestas no están tipadas.
- HT-014: hay `docs/arquitectura/*` pero los ADR reales no existen (solo los de `docs/referencia`, que no son fuente de verdad).

**Pendientes (el resto, ≈215 h):** todo lo clínico (pacientes, casos, fichas, consentimiento, imágenes, documentos, OCR, inferencia, reportes, investigación, derechos, incidentes, retención) tiene modelo ORM pero **ninguna ruta ni pantalla**. `ia/` y `ocr/` ya no son stubs: existen con contrato versionado y pruebas; del tramo falta el resto de lo clínico, rutas de documentos y pantallas. Rutas de frontend `pacientes`, `inferencia`, `cohortes`, `exportaciones`, `auditoria` son `PlaceholderPage`. Playwright no está instalado.

## 3. Defectos y brechas detectadas (a corregir; D = defecto)

Gravedad: A alta (bloquea o viola requisito M), M media, B baja.

| ID | Gravedad | Hallazgo (evidencia) | Corrección propuesta |
|---|---|---|---|
| D1 | A | No hay seed de roles/permisos/instituciones; solo los tests los crean. BD nueva → "Rol desconocido" (`backend/app/api/usuarios.py:204-211`) | Migración de datos `0006_seed_base` idempotente: roles `admin/doctor/researcher`, permisos, `roles_permisos`, instituciones ESPOCH y SOLCA. Test que corre `upgrade head` y comprueba filas |
| D2 | A | Fixtures autouse (`backend/tests/conftest.py:34-35,56-57`) hacen skip global sin `TEST_DATABASE_URL`; `make check` no la define *(inferido)* → "verde" sin ejecutar | Skip solo en tests que usan BD; `Makefile` levanta Postgres temporal o falla con aviso; CI imprime conteo de skips y falla si >0 |
| D3 | A | `AuditService` (`backend/app/audit/service.py`) no se invoca desde rutas; `LOGIN_FAILED` nunca se registra | Llamar en login/logout/fallo, alta/edición/roles de usuario, accesos denegados (RF-AUD-01/06/07). Test por evento |
| D4 | A | `GET/POST /trabajos` sin rol ni dueño: cualquier usuario lee el resultado de cualquier trabajo (`backend/app/api/trabajos.py:41,54`) | Columna `trabajos.creado_por` (FK usuarios) + filtro por dueño o rol; 404 si ajeno |
| D5 | M | `Set-Cookie` posiblemente duplicado (`backend/app/auth/routes.py:110-119`) *(inferido)* | Reproducir con `curl -i`; dejar una sola llamada a `set_cookie`; test sobre cabeceras |
| D6 | M | `_DUMMY_HASH` sin usar → tiempos distintos si el usuario no existe (enumeración); código muerto `contrasena_hash` (`routes.py:52-53,61,83-84`) | Verificar hash ficticio siempre; borrar lo muerto; test de tiempos aproximados |
| D7 | M | `requiere_roles` devuelve `JSONResponse` como valor (`backend/app/auth/deps.py:83-101`); cada ruta debe recordar el `isinstance` | Lanzar excepción propia con handler global; quitar el patrón de las 11 rutas (se hace dentro de HU-013) |
| D8 | A | Autorización usa roles asignados, no `rol_activo`; no se revalida por petición *(inferido)*. RS-ACC-05 (admin sin datos clínicos) no se puede hacer cumplir | `sesion_actual` resuelve `rol_activo` y `requiere_roles` compara contra él |
| D9 | M | `POST /usuarios` no valida formato de correo ni longitud de clave (`usuarios.py:49-54`); RS-ACC-01 pide ≥12 | `EmailStr` + `min_length=12` + lista de claves comunes |
| D10 | A | CSRF sin implementar; solo SameSite=Lax (RNF-SEG-03 y RS-APP-02 son M) | Token CSRF doble envío (cookie legible + cabecera `X-CSRF`) o verificación estricta de `Origin`; elegir en ADR |
| D11 | M | Backend sin CORS, `TrustedHost` ni cabeceras (solo nginx edge las pone) (RS-APP-03 M) | Middleware mínimo en backend; test |
| D12 | M | OpenAPI sin esquemas de respuesta (`response_model=None` en las 11 rutas); sin chequeo de deriva en CI (RNF-CAL-05) | Modelos de respuesta Pydantic; paso de CI `export_openapi.py && git diff --exit-code contracts/` |
| D13 | B | `ix_sesiones_expira_en` existe en migración `0002` y no en el modelo *(inferido)* | `alembic check` en CI; añadir índice al modelo |
| D14 | M | `inferencias.inmutable` es solo una bandera; ningún trigger la impone | Trigger `BEFORE UPDATE OR DELETE` como el de auditoría (migración 0008) |
| D15 | M | Worker (`backend/app/jobs/worker.py:39-50`) con diccionario de manejadores vacío: todo trabajo falla | Se resuelve registrando manejadores `ocr` (HT-040) e `inferencia` (HT-063) |
| D16 | M | `.env.example` define `OCR_URL`/`IA_URL`, pero `Settings` no los lee y `extra="ignore"` los descarta | Añadir a `backend/app/config.py` con validación |
| D17 | B | Frontend: `api/auth.ts` usa `fetch` directo en vez del cliente tipado; `src/screens/*` son mockups no enrutados | Migrar `auth.ts` al cliente tipado; decidir si `screens/` se borra o se adopta |
| D18 | M | Infra: `docker-compose.yml` usa `bitnamilegacy/minio:latest` (README dice `minio/minio`); README menciona `/auth/` en el proxy y la plantilla solo tiene `/api/`; `ci.yml:49` usa `checkout@v7` y el resto `@v4` *(inferido, verificar que exista)*; backend por systemd escucha en `0.0.0.0:8000` | Fijar versión de imagen, alinear README, unificar versiones de acciones, escuchar en 127.0.0.1 |
| D19 | A | Operación: despliegue de frontend en `tiroides2` sin definir; Worker de Cloudflare no enruta `/api`; `DATABASE_URL` del drop-in usa IP de contenedor `172.28.0.2` | Decisión (§6) + usar nombre de red/host estable |
| D20 | A | Clave del admin se compartió en el chat; existe usuario de prueba `prueba.api.*@example.com` activo | Rotar clave, desactivar con `PATCH /usuarios/{id}` |
| D21 | M | Falta comprobar que `fichas_clinicas` y tablas relacionadas cubren RF-CLI-01/02/03/11 (antecedentes, TI-RADS, Bethesda, histopatología, CIE-10, lateralidad, origen digitado/OCR) | Auditoría de columnas contra el catálogo antes de HU-040 |
| D22 | M | Existe el usuario `admin` con rol `doctor` y `researcher` (hecho hoy a petición). HU-012 exige "admin sin datos clínicos" (RS-ACC-05) | Decisión de política en §6; técnicamente se resuelve con D8 |

## 4. Inconsistencias documentales a resolver (Fase 0, paso 0.6)

1. **Estado:** CSV marca 119 "Pendiente"; la pila marca Hecho HT-001/004/005/021/024 (`pila-producto-7255-7270.md:11,14,15,22,23`) y ~22 están en `main`. → Actualizar el estado de cada historia en Linear y la columna Estado del CSV.
2. **Requisitos M sin historia que los cubra:** RNF-SEG-01 (Argon2: ya cumplido, etiquetar HU-001), RS-IA-03 (no reentrenar con inferencias → HT-063), RF-CLI-10 (ficha no entra al modelo → HU-040/HT-070), RS-ANO-02 (clave de seudónimos separada y por rol → HT-011), RS-ACC-07 (cuentas de servicio distintas para app/migraciones/escritor de auditoría → HT-082), RI-04/RI-05 (contrato versionado con IA y OCR → HT-063/HT-040), RS-RET-03 (datos reales no van a desarrollo, hoy solo en HT-085 "Después" → adelantar guardia mínima a HT-090/HT-002).
3. **HU-120 (asistencia local)** existe en el catálogo, fue eliminada en `00-decisiones` y R9 la cita con 5 h: decidir y quitarla de todos lados.
4. **HT-060** eliminada, pero `de-los-requisitos-al-backlog.md:159,584` aún pide "tres modelos cargan en CPU".
5. **Pesos de IA:** decisiones dicen un solo archivo; catálogo dice tres. Los tres existen como assets de la release privada `modelos-idi-086-v1`, con manifiesto `ia/modelos.sha256` y `make modelos`; no se versionan.
6. **Cortes de capacidad:** `de-los-requisitos-al-backlog.md:616` propone recortar historias M (HU-021, HT-023, HT-013, HU-004, HU-005) pese a la regla "lo M no se recorta".
7. **Dependencias faltantes:** HT-103 (E2E), HT-102 (matriz), HU-110 (UnUQ) y HT-105 dicen "Ninguna" pero necesitan el flujo completo (HU-050, HU-070, HU-080, HU-091). → colocarlas al final de S5.
8. Otros menores: "cerca de 400 requisitos" vs 246 IDs; "4" vs "2" puntos por confirmar con el director; prioridad MoSCoW vs Alta/Media/Baja; HU-001 no exige 12 caracteres (eso es HU-006); archivar/exportar paciente atribuidos al administrador cuando son de médico; columna "Origen" quitada en decisiones pero presente en el catálogo; evaluadores UnUQ (CA-17 sin administradores vs HU-110 con ellos).

## 5. Modelo de datos: lo que falta (todo con migración Alembic y test)

Existen 23 tablas (`backend/app/models/__init__.py:44-68`), migraciones 0001–0005. Convención: nombres de constraints en `backend/app/db.py:14-20`, PK UUID, JSONB para snapshots.

| Migración | Contenido | Historias |
|---|---|---|
| 0006 `seed_base` | Roles, permisos (`recurso:accion`), matriz `roles_permisos`, instituciones base | D1, HU-011/013 |
| 0007 `auth_endurecida` | `usuarios.intentos_fallidos`, `usuarios.bloqueado_hasta`; `sesiones.ultima_actividad`; `trabajos.creado_por`; índice `expira_en` al modelo; (después) `usuarios.mfa_secreto_cifrado` con `EncryptedBytes` | D4, D13, HU-004/005/007 |
| 0008 `inferencia_inmutable` | Trigger de inmutabilidad en `inferencias`/`nodulos`; tabla `informes` (inferencia_id, version, ruta_s3, hash, creado_por, creado_en); índice parcial único: un solo `modelos_ia` activo | D14, HU-080, HT-063 |
| 0009 `investigacion` | `datasets` (versión, hash, ficha técnica JSONB), `dataset_items` (caso/paciente por seudónimo), `experimentos` (métricas JSONB, modelo, dataset), `cohortes`, `publicaciones` | HU-090–097, HT-070/071 |
| 0010 `gobierno` | `solicitudes_derechos` (tipo, fecha, plazo 15 días, responsable, estado), `incidentes` (detectado, notificado, plazo), `politicas_retencion`, `respuestas_unuq` (22 ítems, puntaje, rol), `ajustes` | HU-100, HT-081/085, HU-110, HU-016 |
| 0011 `permisos_clinicos` (si D21 lo exige) | Ajustes a `fichas_clinicas`/`extracciones_ocr` según auditoría de columnas | HU-040/041/052 |

Reglas de datos que cada migración debe respetar: sin datos personales ni clínicos en `auditoria` (solo códigos y números); identidad solo en `identidades_paciente` cifrada; nombres de objeto S3 opacos; inferencia no se borra.

## 6. Decisiones abiertas y bloqueos (se resuelven antes de la fase que las usa)

Marcadas con quién debe decidir. Hasta que se decidan, el plan usa el valor por defecto indicado.

1. **Pesos de IA (bloquea HT-061/062/063):** hoy solo `best_bgaunet.keras` (25,4 MB). Necesito los otros dos o confirmar que el flujo usa solo BGAU-Net. *Defecto:* pedirlos al director/Daniel en la semana de F0. Si no llegan antes del 12 nov, HT-063 se entrega con un servicio IA "contrato + modelo simulado" y se marca RF-INF-02 como parcial.
2. **Despliegue del frontend en `tiroides2` y ruta `/api` del Worker (bloquea demo y E2E):** cómo se sirve hoy y qué hostname es oficial.
3. **Política de rol admin con datos clínicos (D22):** *defecto:* admin NO ve datos clínicos aunque tenga otros roles; ve solo cuando cambia el rol activo y queda auditado. Alternativa: cuentas separadas.
4. **CSRF (D10):** token doble envío (*defecto*) vs verificación de `Origin`.
5. **Visto bueno del director:** "Normal = sin nódulo detectado"; umbral de confianza OCR; revelar PII; formato de exportación (`docs/diseno/pantallas-clave.md:180-188`).
6. **Reparto de trabajo entre Andrés y Daniel:** ningún documento asigna responsable por issue. *Defecto:* backend/IA/infra vs frontend/diseño/pruebas, respetando los límites de trabajo en curso en Linear (2 en proceso, 3 en revisión). Confirmar.
7. **Evaluadores UnUQ:** lista de 10 antes de S3 (`de-los-requisitos-al-backlog.md:686`); 3-5 fichas reales (con aprobación ética/convenio, RS-LEG-09) antes de S4. Sin fichas reales, OCR se mide con el conjunto sintético (HT-093) y se declara como tal (RS-LEG-11).
8. **Capacidad:** 302 h disponibles (S3 96 + S4 96 + S5 110) frente a ≈215 h pendientes de backlog + ≈25 h de correcciones de §3 y Fase 0 → ≈240 h, holgura ≈60 h (≈20 %). Incluye "Después" (64 h) solo si la holgura se mantiene; el plan trata "Después" como Fase 4.

## 7. Plan por fases

Regla común de terminado (RP-03, `docs/pruebas/matriz-de-pruebas.md`): PR por historia (`ht-xxx-nombre`, commit `tipo(HT-xxx): resumen`), CI verde, requisitos cubiertos pasan de `Pendiente` a `Aprobado` con evidencia, `docs-lint` sin errores si cambia comportamiento, ficha actualizada en CSV. `main` solo por PR (regla de `CLAUDE.md`; ojo: el último push fue directo a `main`).

### Fase 0 — Línea base y estabilización (5–9 nov, ≈18 h; antes de S3)

| Paso | Qué hacer exactamente | Salida / criterio | h |
|---|---|---|---|
| 0.1 | Levantar Postgres 16 temporal (`docker compose up -d postgres` o contenedor aparte), exportar `TEST_DATABASE_URL`, correr `pytest -rs`, `alembic upgrade head && alembic check`, `make check`, `bun run test` | Cifras reales (pasan/saltan/fallan) en `docs/pruebas/registro-de-errores.md` (ERR-004…). Confirma o descarta D2, D5, D13 | 2 |
| 0.2 | Migración 0006 seed + test | D1 cerrado; `crear_usuario` funciona en BD limpia | 2 |
| 0.3 | Hardening de auth: D5, D6, D9, D16 | Tests por cada uno en `backend/tests/test_auth.py` | 3 |
| 0.4 | Cerrar `/trabajos` (D4) + migración 0007 parcial (`creado_por`) | 404 a ajenos; test | 1 |
| 0.5 | Corregir skips globales (D2) y añadir `alembic check` + deriva OpenAPI a CI (D12, D13) | CI falla si hay skips o deriva | 2 |
| 0.6 | Sincronizar documentos (§4): Estado del CSV, pila, quitar HU-120/HT-060 sobrantes, asignar requisitos M huérfanos | `docs-lint` limpio; trazabilidad sin M huérfanos | 3 |
| 0.7 | Operación: rotar clave del admin, desactivar usuario de prueba, `DATABASE_URL` por host estable, decidir despliegue del frontend (§6.2) | Login funcionando en el host oficial | 2 |
| 0.8 | Completar HT-094 (llenar `docs/datos/imagenes-anonimizadas.md`: origen, permiso, muestra revisada) y confirmar HT-008 en Linear (tablero e historial) | Documento sin "por completar" | 1 |
| 0.9 | Pedir pesos de IA y fijar fecha de corte (§6.1) | Respuesta registrada | 0 |

### Fase 1 — Tramo S3 (10–23 nov, ≈54 h de backlog + 15 h de fase 0 = 69 de 96 h)

Orden recomendado: semana 1 = fundaciones (HU-013, HT-061/062, HT-080, HU-030, HU-033); semana 2 = ficha, consentimiento, imagen, integración IA. HT-061 se integra y se prueba en la laptop de demo antes de construir encima (riesgo R2).

| ID | h | Trabajo específico (backend / frontend / datos / pruebas) | Aceptación (resumen) |
|---|---|---|---|
| HU-011 (resto) | 2 | `GET/PUT /roles` y `/roles/{id}/permisos` (admin); UI matriz en `/administrador/roles` | Tres roles base; matriz editable y auditada |
| HU-012 (resto) | 1 | Política D22; test "admin sin rol médico no ve `/pacientes`" | Admin sin datos clínicos |
| HU-013 | 3 | Permisos `recurso:accion` en `requiere_permiso()`; cierra D7 y D8; test parametrizado endpoint×rol | 403 y evento de acceso denegado en cada ruta |
| HT-061 | 8 | `ia/app/`: función imagen→resultado a partir de `docs/referencia/06-codigo-ia-existente/base.py` y `app.py`; hasta 3 nódulos; igualar salida de referencia con la imagen de prueba | Mismo resultado que `app.py` (tolerancia fijada) |
| HT-062 | 2 | Carga única de modelos al arrancar; `/health` con versión y huella SHA-256 de pesos | Huella guardada; falla ruidosa si falta modelo |
| HT-025 | 1 | Glosario y guía de mensajes en `docs/diseno/` | Cada error dice qué hacer |
| HT-080 | 3 | Mapa normativo, registro de tratamientos, texto de consentimiento con finalidades separadas, aviso de privacidad en `docs/cumplimiento/` | Revisión del director; `docs-lint` |
| HU-030 | 3 | `POST /pacientes` (código interno `PAC-n`, identidad cifrada vía `EncryptedBytes`); UI en `/medico/pacientes` | Sin identidad en respuestas; auditoría |
| HU-031 | 2 | `GET /pacientes?q&institucion&estado` paginado; evento de consulta | <2 s con 1 000 sintéticos |
| HU-033 | 2 | `POST/GET /pacientes/{id}/casos` | Varios casos por paciente |
| HU-034 | 3 | `POST /pacientes/{id}/consentimientos`, `.../retirar`; versión, fecha, finalidad, base legal; UI | Retiro sin efecto retroactivo |
| HU-035 | 1 | Dependencia `requiere_consentimiento(finalidad)` en inferencia/datasets; botón desactivado con motivo | 409 + mensaje |
| HU-040 | 5 | `PUT /casos/{id}/ficha/{seccion}`; secciones RF-CLI-09; UI por secciones; incluye D21 | Cada sección se guarda; `origen_datos` |
| HU-041 | 2 | Validadores de rango TSH/T3/T4/tamaño configurables, TI-RADS y Bethesda válidos; mensajes | Mensaje por campo |
| HU-060 | 3 | `POST /casos/{id}/imagenes` (multipart, tipo/tamaño/dimensiones, ≤20 MB); guarda vía `ObjectStorage` | Rechazo con motivo; clave opaca |
| HT-050 | 2 | Quitar EXIF/DICOM al subir; original sin metadatos | Test con imagen con metadatos |
| HT-063 | 5 | Manejador `inferencia` en `backend/app/jobs/worker.py`; cliente HTTP a `IA_URL` con timeout (RNF-REN-02 meta 60 s); `POST /casos/{id}/inferencias`, `GET /inferencias/{id}`; guarda artefactos en `inference/{job_id}`; no inventa resultado si falla (RF-INF-07); RS-IA-03 y RI-04 | Contrato versionado; prueba de integración |
| HT-091 | 2 | Tres plantillas de ficha en PDF digital con variaciones (extiende `backend/scripts/seed_sintetico.py`) | Reproducible por semilla |
| HT-092 | 1 | Versión escaneada (ruido/rotación) reproducible | Misma semilla → mismo archivo |
| HT-093 | 1 | Valor esperado por campo (JSON) para medir OCR | 7 campos por ficha |

Cierre de fase: demo local del recorrido paciente → caso → consentimiento → ficha → imagen → inferencia (resultado simulado si no hay pesos).

### Fase 2 — Tramo S4 (24 nov–7 dic, 47 h de 96)

| ID | h | Trabajo específico | Aceptación |
|---|---|---|---|
| HT-040 | 5 | `ocr/app/`: `/extraer` con PyMuPDF + Tesseract (español), sin internet, CPU; contrato versionado (RI-05); manejador `ocr` en el worker | Una página <60 s |
| HT-041 | 3 | Reglas por campo (TSH, T3, T4, fecha, tamaño, lateralidad, TI-RADS) con confianza | 7 campos con confianza |
| HT-043 | 2 | Script que mide exactitud por campo contra HT-093 y escribe informe | Meta fijada antes de medir |
| HT-051 | 3 | Detectar y tapar texto incrustado en la ecografía | Nódulo intacto |
| HT-064 | 2 | Respuesta "normal (sin nódulo detectado)" con aviso de apoyo | Texto aprobado por el director |
| HU-050 | 3 | `POST /casos/{id}/documentos` (PDF/imagen, validación, S3 privado, evento) | Tipo/tamaño/contenido validados |
| HU-051 | 1 | Estado del OCR por consulta periódica en UI | Sin recargar |
| HU-052 | 5 | Pantalla lado a lado documento/campos, confianza por campo; confirmar antes de que entren a la ficha (RF-CLI-06) | Nada entra sin confirmar |
| HU-053 | 1 | `GET /documentos/{id}/enlace` firmado 3 600 s + evento | Registrado |
| HU-004 | 1 | Migración 0007: contador y bloqueo temporal; evento `LOGIN_FAILED` | Bloqueo con mensaje genérico |
| HU-005 | 1 | `ultima_actividad`; aviso y relogin | Expira por inactividad |
| HU-020 | 3 | `GET /auditoria` (admin, filtros y paginación); UI en `/administrador/auditoria` | <2 s |
| HU-070 | 3 | UI en `/medico/inferencia`: elegir caso/imagen, ejecutar, estado | Solo con consentimiento |
| HU-071 | 5 | Resultado por nódulo (caja, máscara, clase, probabilidad, aviso) con componentes `AiResultCard`, `ImageViewer`, `TiradsBadge` | Texto + color (no solo color) |
| HU-072 | 1 | Historial por caso | Orden cronológico |
| HU-080 | 5 | Reporte PDF por inferencia con encabezado ESPOCH/SOLCA y aviso; guarda en `informes` | Descargable |
| HU-081 | 2 | Consulta de resultados con filtros | Filtros combinables |
| HU-082 | 1 | Evento de descarga | Usuario/reporte/hora |

Hito: **primer recorrido completo con pantalla** (ficha PDF → OCR → confirmación → inferencia → reporte).

### Fase 3 — Tramo S5 (8–23 dic, 50 h de 110; +5 h si hay espacio)

Orden: investigación y seguridad primero, calidad y evaluación al final (HT-101 → HT-103 → HT-102 → HU-110 → HT-105).

| ID | h | Trabajo específico |
|---|---|---|
| HT-070 | 3 | Anonimizar datasets: quitar identificadores, desplazar fechas, reducir edades, ficha técnica del dataset (migración 0009) |
| HU-090 | 3 | Dataset anonimizado solo con consentimiento de investigación |
| HU-091 | 3 | Métricas: sensibilidad, especificidad, precisión, F1, AUC, matriz (`ConfusionMatrix` existente) |
| HU-092 / 093 / 094 | 2+2+2 | Comparar, auditar predicciones, análisis de errores (FP/FN) |
| HU-095 | 2 | Exportación anonimizada con permiso y evento |
| HT-082 | 3 | Pruebas de ataque (SQLi/XSS/CSRF/SSRF/traversal), límites de tamaño y de peticiones; cuentas de servicio separadas (RS-ACC-07) |
| HT-013 | 3 | Respaldo cifrado de Postgres y bucket, restauración probada (`infra/scripts/`) |
| HT-081 | 1 | Plan de respuesta a incidentes con plantilla de plazos |
| HT-023 | 2 | axe-core en CI, teclado, contraste |
| HU-021 | 2 | Estados carga/vacío/error en todas las pantallas |
| HU-032 / HU-042 | 2+2 | Corrección de paciente e historial de versiones de ficha |
| HT-101 | 3 | Integración API–IA/OCR/almacenamiento en CI |
| HT-103 | 3 | Playwright: subir ficha → inferir → reporte (instalar `@playwright/test`, config, job de CI) |
| HT-102 | 3 | Ejecutar las 156 filas M con evidencia en `matriz-de-pruebas.md` |
| HU-110 | 8 | UnUQ con 10 evaluadores, 22 ítems, meta ≥70; tabla `respuestas_unuq` |
| HT-105 | 1 | Matriz de trazabilidad |
| Si hay espacio | 5 | HT-084 (EIPD), HU-073 (conclusión del médico), HU-100 (solicitudes de derechos) |

### Fase 4 — "Después" (64 h; fuera de plazo o si sobra holgura)

Seguridad y cuentas: HU-006, HU-007 (TOTP), HU-008, HU-014, HU-015, HU-016, HU-022. Pacientes: HU-036, HU-037, HU-038, HU-039. Ficha y documentos: HU-043, HU-044, HU-054, HU-055, HT-042, HT-044. Imagen e IA: HU-061, HU-062, HU-074, HT-065, HT-066. Reporte e investigación: HU-083, HU-096, HU-097, HT-071. Plataforma: HT-009, HT-014, HT-026, HT-027, HT-031, HT-083, HT-085, HT-086, HT-104, HT-106. Cada una conserva el alcance del CSV; detallarlas por separado al entrar a fase.

## 8. Verificación (cómo se comprueba que todo funciona)

1. **Backend:** `cd backend && ruff format --check . && ruff check . && mypy app && TEST_DATABASE_URL=… pytest -rs` (cero skips). `alembic upgrade head` en BD vacía y `alembic check` sin diferencias.
2. **Contrato:** `python scripts/export_openapi.py` y `git diff --exit-code contracts/openapi.json`.
3. **Frontend:** `cd frontend && bun run lint && bun run format:check && bun run typecheck && bun run test && bun run build`; tras HT-103, `bunx playwright test`.
4. **Compose y proxy:** `make up`; `infra/scripts/verificar-proxy.sh`; `docker compose config -q`.
5. **Seguridad:** `curl -i` al login (una sola `Set-Cookie`, HttpOnly, SameSite), prueba de CSRF sin token (debe fallar), gitleaks y pip-audit en CI.
6. **Datos:** consulta que confirme cero identificadores en `auditoria`, `trabajos.payload` y logs; restauración de respaldo en BD vacía.
7. **Documentación:** `docs-lint` (skill `docs-kit`) sobre `docs/`; matriz de pruebas con 156/156 M en `Aprobado` y evidencia; trazabilidad sin requisito M huérfano.
8. **Aceptación final:** recorrido manual de los tres roles en el host oficial y UnUQ ≥70.

## 9. Riesgos principales

1. Pesos de IA incompletos (§6.1): mitigación = modelo simulado tras contrato fijo; no bloquear el resto.
2. Falta de fichas reales para OCR: mitigación = conjunto sintético emparejado, declarado como tal.
3. Evaluadores UnUQ sin confirmar: HU-110 depende de ellos y cae el 20 dic; pedir la lista antes del 23 nov.
4. Autorización por valor de retorno (D7) y `rol_activo` sin revalidar (D8): una ruta nueva sin chequeo queda abierta; se cierra en HU-013 antes de agregar módulos clínicos.
5. Tamaño del flujo clínico en S3–S4: si S3 pasa de 80 h reales, mover HU-041, HU-060 y HT-050 a inicio de S4 y no tocar lo M de S5.

## 10. Qué se entregará al aprobar este plan

Nada se implementa. Al aprobarlo, el siguiente paso sería convertir este documento en artefactos del repo: `docs/plan/fases.md` (esta estructura), actualización del CSV (Estado y tramos), issues nuevos propuestos para D1–D21 con IDs de historia a confirmar, y el paso 0.1 como primera tarea ejecutable.
