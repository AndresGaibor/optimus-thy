# Obligaciones de cumplimiento y su evidencia (HT-080)

Mapa de trabajo entre las obligaciones legales que el catálogo de requisitos ya
identifica, los requisitos que las cubren y la evidencia que existe hoy en el
repositorio. Cubre el criterio de aceptación de HT-080 sobre el mapa: **cada
obligación enlazada con su requisito y su evidencia**.

Este documento no es asesoría legal. Las normas, los números de artículo y las
citas son los que ya están escritos en
`docs/referencia/04-requisitos/catalogo-de-requisitos.md`; no se añadió ninguna
norma ni artículo que el repositorio no cite. El registro de tratamientos, el
texto de consentimiento, el aviso de privacidad y la evaluación de impacto son
entregables aparte y siguen pendientes (ver «Lo que falta»).

## Cómo leer los estados

| Estado | Significado |
| --- | --- |
| `cumple` | Existe un artefacto verificable en el repositorio que satisface el requisito tal como está escrito. |
| `parcial` | Existe una parte real y verificable, pero falta una pieza del requisito. |
| `pendiente` | No existe artefacto; el requisito está reconocido pero sin implementar. |

La columna «quién decide si es parcial» nombra el rol que debe aceptar la
evidencia y cerrar la discusión. **Los textos legales los revisa el director de
tesis (Diego Ávila Pesántez, según `README.md`)**; esta tabla no afirma que esa
revisión ya ocurrió. Para las normas sanitarias, el catálogo pide confirmarlas
con el director o con SOLCA.

## Obligaciones legales

| Obligación (palabras del catálogo) | Familia / código de requisito | Cómo se cumple hoy | Evidencia verificable | Estado | Quién decide si es parcial |
| --- | --- | --- | --- | --- | --- |
| LOPDP, art. 10: principios de licitud, lealtad, transparencia, finalidad, minimización, proporcionalidad, confidencialidad, exactitud, conservación limitada, seguridad y responsabilidad proactiva | Todos los grupos RS | La minimización y la confidencialidad están en el modelo (paciente seudónimo e identidad cifrada aparte); la seguridad está en permisos, auditoría y cifrado; la conservación limitada no tiene plazos escritos | `backend/app/models/pacientes.py`, `backend/app/security/permisos.py`, `backend/app/audit/service.py`, `backend/app/security/encryption.py` | `parcial` | Dirección de tesis, con asesoría jurídica de la ESPOCH |
| LOPDP, arts. 7 y 8: consentimiento libre, específico, informado e inequívoco, revocable en cualquier momento sin efectos retroactivos | RS-LEG-03, RS-LEG-04, RS-DER-04 | Existe la tabla `consentimientos` con base legal restringida a tres valores, fecha de otorgamiento y fecha de revocación; no existe texto versionado ni ruta para otorgar o retirar | `backend/app/models/consentimientos.py`, `backend/alembic/versions/0001_modelo_datos_v1.py`, `backend/scripts/seed_sintetico.py` | `parcial` | Dirección de tesis (texto legal) |
| LOPDP, arts. 4, 25 y 26: los datos de salud son sensibles y su tratamiento exige consentimiento explícito o investigación científica | RS-LEG-03 | El modelo separa la identidad cifrada y admite consentimiento por caso con base legal; falta el registro de la finalidad y la versión del texto aceptado | `backend/app/models/consentimientos.py`, `backend/app/models/pacientes.py` | `parcial` | Dirección de tesis, con asesoría jurídica |
| LOPDP, arts. 30 a 32 (según el texto consultado por el catálogo): anonimizar o seudonimizar los datos de salud y usarlos para investigación solo anonimizados o con autorización | RS-ANO-01 a RS-ANO-09 | Seudonimización y cifrado implementados; el almacenamiento usa claves opacas; no hay exportación de datasets ni medición de k-anonimato | `backend/app/api/pacientes.py`, `backend/app/storage/s3.py`, `backend/tests/test_modelo_datos.py`, `backend/tests/test_storage.py` | `parcial` | Dirección de tesis, con asesoría jurídica |
| LOPDP, arts. 12 a 20: derechos de información, acceso, rectificación, eliminación, oposición, portabilidad, suspensión y explicación de decisiones automatizadas | RS-DER-01 a RS-DER-07 | Solo existe una pantalla de demostración con solicitudes sintéticas; no hay modelos, rutas ni plazos de 15 días en el backend | `frontend/src/screens/admin/DataRightsScreen.tsx`, `backend/app/main.py` (routers registrados) | `pendiente` | Dirección de tesis, con asesoría jurídica |
| LOPDP, arts. 37 a 41: medidas de seguridad proporcionales, cifrado y seudonimización, protección desde el diseño y por defecto | RS-ACC, RS-CIF, RS-APP, RNF-SEG | Permisos por código en el servidor, sesiones opacas, Argon2, AES-256-GCM sobre la identidad, TLS 1.2 y 1.3 en el borde, bucket privado y enlaces firmados | `backend/app/auth/deps.py`, `backend/app/security/passwords.py`, `backend/app/security/encryption.py`, `infra/nginx/default.conf.template`, `backend/app/storage/s3.py` | `parcial` | Dirección de tesis, con asesoría jurídica |
| LOPDP, arts. 42 y 48 a 50: evaluación de impacto previa y delegado de protección de datos cuando hay decisiones automatizadas o tratamiento a gran escala | RS-LEG-05, RS-LEG-06 | No hay evaluación de impacto escrita ni delegado designado con contacto visible | `docs/referencia/05-backlog/de-los-requisitos-al-backlog.md` (HT-084 pendiente) | `pendiente` | Dirección de tesis |
| LOPDP, arts. 43 y 46: aviso de vulneraciones en 2 días al responsable, 5 días a la autoridad y 3 días a los titulares | RS-INC | No hay plan de respuesta ni plantilla de notificación; la bitácora de solo escritura sí registra los hechos de seguridad | `backend/app/audit/service.py`, `backend/alembic/versions/0005_auditoria_solo_escritura.py` | `pendiente` | Dirección de tesis |
| Reglamento General de la LOPDP (Decreto Ejecutivo 904, 6 de noviembre de 2023): delegado, responsables conjuntos, transferencias internacionales y reclamos | RS-LEG | No hay documento de transferencias ni procedimiento de reclamos. El despliegue de producción pasa por Cloudflare como borde, lo que hay que documentar antes de usar datos reales | `docs/operacion/despliegue-tiroides2.md`, `docs/arquitectura/almacenamiento.md` | `pendiente` | Dirección de tesis, con asesoría jurídica |
| Norma técnica de notificación de vulneraciones (Resolución SPDP-SPD-2026-0040-R, 9 de septiembre de 2026): reporte en el Sistema Nacional de Registro de Datos Personales | RS-INC-04 | No existe la plantilla con plazos ni el procedimiento de reporte | `docs/pruebas/matriz-de-pruebas.md` (RS-INC-03, CP-115, Pendiente) | `pendiente` | Dirección de tesis |
| Acuerdo Ministerial 4889 (CEISH): la investigación con seres humanos o muestras biológicas la aprueba un comité de ética; consentimiento escrito, con fecha y firma | RS-LEG-09 | El sistema opera con datos sintéticos y no usa datos de pacientes. El convenio con SOLCA y la aprobación del comité están previstos en el proyecto de investigación, pero no hay evidencia en el repositorio de que se hayan ejecutado | `docs/referencia/02-proyecto-de-investigacion/Proyecto_Investigacion_OPTIMUS_THY_ESPOCH.md`, `backend/scripts/seed_sintetico.py`, `backend/tests/test_seed_sintetico.py` | `pendiente` | Dirección de tesis, con SOLCA |
| Normas sanitarias sobre la historia clínica: confidencialidad y derechos del paciente (el catálogo no fija artículos) | RS-LEG-12 | No están identificadas las normas aplicables ni incorporadas al mapa; la ficha existe como modelo, no como historia clínica en uso real | `backend/app/models/fichas.py`, `docs/referencia/04-requisitos/catalogo-de-requisitos.md` | `pendiente` | Dirección de tesis, con SOLCA |

## Decisiones de arquitectura que sostienen este mapa

| ADR | Decisión | Requisito que sostiene | Evidencia |
| --- | --- | --- | --- |
| ADR-007 (registro en `docs/adr/README.md`) | Sesión opaca persistida, token no almacenado en claro | RS-ACC-06, RNF-SEG-03 | `backend/app/auth/sessions.py`, `backend/app/auth/deps.py` |
| ADR-009 (registro en `docs/adr/README.md`) | Identidad cifrada aparte; datos clínicos sin datos personales | RS-ANO-01, RS-ANO-02, RNF-SEG-05 | `backend/app/models/pacientes.py`, `backend/app/security/encryption.py` |
| ADR-014 | MinIO como almacenamiento S3-compatible fijado por digest | RS-CIF-02, RS-CIF-04 | `docs/adr/ADR-014-minio-fijado.md`, `backend/app/storage/s3.py` |
| ADR-015 | Cookie `SameSite=Strict` y verificación de `Origin` | RNF-SEG-03 | `docs/adr/ADR-015-cookie-strict-origin.md`, `backend/app/auth/routes.py`, `backend/app/main.py` |

## Requisitos por familia

### Cumplimiento y gobierno (RS-LEG)

| Código | Requisito (resumen) | Cómo se cumple hoy | Evidencia | Estado | Quién decide |
| --- | --- | --- | --- | --- | --- |
| RS-LEG-01 | Mapa de cumplimiento con cada obligación, su requisito y su evidencia | Este documento | `docs/cumplimiento/obligaciones.md` | `cumple` | Dirección de tesis |
| RS-LEG-02 | Registro de tratamientos: datos, finalidad, base de licitud, accesos y conservación | No existe el documento; los datos están dispersos entre el modelo y el catálogo | `docs/pruebas/matriz-de-pruebas.md` (CP-086, Pendiente) | `pendiente` | Dirección de tesis |
| RS-LEG-03 | Base de licitud documentada con consentimiento explícito | Tabla `consentimientos` con `base_legal` restringido por `CHECK` y vigencia; sin ruta de alta ni finalidad | `backend/app/models/consentimientos.py`, `backend/alembic/versions/0001_modelo_datos_v1.py` | `parcial` | Dirección de tesis |
| RS-LEG-04 | Texto de consentimiento claro, con finalidades separadas, revocable, con fecha y versión | El modelo guarda fechas y base legal, pero no texto, versión ni finalidad; no hay ruta de retiro | `backend/app/models/consentimientos.py`, `docs/pruebas/matriz-de-pruebas.md` (CP-088, Pendiente) | `parcial` | Dirección de tesis |
| RS-LEG-05 | Evaluación de impacto escrita antes de tratar datos reales | No existe | `docs/referencia/05-backlog/de-los-requisitos-al-backlog.md` (HT-084 pendiente) | `pendiente` | Dirección de tesis |
| RS-LEG-06 | Responsable de protección de datos designado, con contacto visible | No existe designación ni contacto en la interfaz | `docs/referencia/04-requisitos/catalogo-de-requisitos.md` | `pendiente` | Dirección de tesis |
| RS-LEG-07 | Aviso de privacidad visible para pacientes y usuarios | No existe aviso en la aplicación ni en el catálogo | `frontend/src/design-system/inicio/Introduction.mdx` (solo declara datos sintéticos y la regla «Normal») | `pendiente` | Dirección de tesis |
| RS-LEG-08 | Acuerdo de confidencialidad firmado por cada usuario con acceso | No existe el documento ni su registro | `docs/referencia/04-requisitos/catalogo-de-requisitos.md` | `pendiente` | Dirección de tesis |
| RS-LEG-09 | Aprobación CEISH y convenio institucional antes de datos reales | Condición previa a los datos reales; hoy el sistema se prueba con datos sintéticos y no hay evidencia de la aprobación ni del convenio en el repositorio | `docs/referencia/02-proyecto-de-investigacion/Proyecto_Investigacion_OPTIMUS_THY_ESPOCH.md`, `backend/scripts/seed_sintetico.py`, `backend/tests/test_seed_sintetico.py` | `pendiente` | Dirección de tesis, con SOLCA |
| RS-LEG-10 | Ningún dato sale de la infraestructura propia | En local, todos los servicios son contenedores del compose y solo el borde publica puertos; la red no está marcada como `internal`, así que hay salida a Internet. En producción, el tráfico pasa por Cloudflare | `docker-compose.yml`, `docs/operacion/despliegue-tiroides2.md` | `parcial` | Dirección de tesis |
| RS-LEG-11 | La tesis declara que opera con datos sintéticos y qué falta para un uso real | El anteproyecto declara el trabajo con datos simulados; el proyecto de investigación fija el convenio con SOLCA y la aprobación del comité de ética como actividades previas a los datos reales | `docs/referencia/01-anteproyecto/Anteproyecto_OPTIMUS_THY_Gaibor_Quiguiri.md`, `docs/referencia/02-proyecto-de-investigacion/Proyecto_Investigacion_OPTIMUS_THY_ESPOCH.md`, `PRODUCT.md` | `cumple` | Dirección de tesis |
| RS-LEG-12 | Confirmar con el director o SOLCA las normas sanitarias aplicables | No identificadas | `docs/referencia/04-requisitos/catalogo-de-requisitos.md` | `pendiente` | Dirección de tesis, con SOLCA |

### Anonimización y seudonimización (RS-ANO)

| Código | Requisito (resumen) | Cómo se cumple hoy | Evidencia | Estado | Quién decide |
| --- | --- | --- | --- | --- | --- |
| RS-ANO-01 | Seudonimización por defecto; identificadores directos en tabla aparte | `pacientes.seudonimo` es el único identificador de la tabla; la identidad vive en `identidades_paciente`; las respuestas de la API nunca la incluyen | `backend/app/models/pacientes.py`, `backend/app/api/pacientes.py`, `backend/tests/test_modelo_datos.py` | `cumple` | Equipo del proyecto |
| RS-ANO-02 | La clave código-persona se guarda separada y solo la ve un rol autorizado | Está separada y cifrada con AES-256-GCM; revelar la identidad no está implementado y no existe permiso de revelado | `backend/app/security/encryption.py`, `backend/app/api/pacientes.py` (docstring), `backend/app/audit/actions.py` | `parcial` | Dirección de tesis |
| RS-ANO-03 | Datasets de investigación sin identificadores y con fechas o edades reducidas | No hay generación ni exportación de datasets | `docs/pruebas/matriz-de-pruebas.md` (CP-096, Pendiente) | `pendiente` | Equipo del proyecto |
| RS-ANO-04 | Quitar metadatos EXIF y DICOM y detectar texto incrustado con OCR | Al subir, la copia se rehace desde el píxel y se guarda sin EXIF, perfil ICC ni texto embebido (HT-050). El servicio OCR reconoce texto en imagen y PDF (HT-040). Falta aplicarlo a la ecografía para marcar y tapar el texto incrustado, sin tocar la zona del nódulo | `backend/app/api/imagenes.py` (`_sin_metadatos`), `backend/tests/test_imagenes.py` (`test_la_copia_guardada_no_trae_exif_ni_texto`), `ocr/app/` (`/reconocer`), `docs/referencia/05-backlog/backlog-tarjetas-kanban.csv` (HT-051 pendiente) | `parcial` | Equipo del proyecto |
| RS-ANO-05 | Documentos para investigación con datos personales tapados | No hay flujo de documentos para investigación | `docs/referencia/04-requisitos/catalogo-de-requisitos.md` | `pendiente` | Equipo del proyecto |
| RS-ANO-06 | Riesgo de reidentificación medido con k-anonimato k = 5 | No hay medición | `docs/referencia/04-requisitos/catalogo-de-requisitos.md` | `pendiente` | Dirección de tesis |
| RS-ANO-07 | Nombres de archivo y rutas sin datos personales | La clave del objeto es `prefijo/AAAA/MM/DD/<uuid>.<ext>` y la extensión se valida | `backend/app/storage/s3.py`, `backend/tests/test_storage.py` | `cumple` | Equipo del proyecto |
| RS-ANO-08 | Reportes y exportaciones sin identificadores | No hay exportaciones ni reportes reales; la pantalla de reportes usa fixtures | `frontend/src/screens/doctor/CaseReportScreen.tsx` | `pendiente` | Equipo del proyecto |
| RS-ANO-09 | Ficha técnica del dataset y exportación en la bitácora | No hay exportación de datasets | `docs/referencia/04-requisitos/catalogo-de-requisitos.md` | `pendiente` | Equipo del proyecto |

### Autenticación y control de acceso (RS-ACC)

| Código | Requisito (resumen) | Cómo se cumple hoy | Evidencia | Estado | Quién decide |
| --- | --- | --- | --- | --- | --- |
| RS-ACC-01 | Contraseñas de al menos 12 caracteres contra listas de filtradas | El alta exige 12 caracteres; no hay comprobación contra listas de filtradas | `backend/app/api/usuarios.py` (comentario RS-ACC-01) | `parcial` | Equipo del proyecto |
| RS-ACC-02 | Segundo factor obligatorio para administradores y opcional para el resto | No implementado | `docs/referencia/04-requisitos/catalogo-de-requisitos.md` | `pendiente` | Dirección de tesis |
| RS-ACC-03 | Mínimo privilegio y revisión antes de la entrega | Catálogo de permisos y matriz por rol con pruebas; falta la revisión final | `backend/app/security/permisos.py`, `backend/alembic/versions/0008_roles_y_permisos_base.py`, `backend/tests/test_roles.py` | `parcial` | Dirección de tesis |
| RS-ACC-04 | Control de acceso por objeto aunque se cambie el identificador | Pacientes y casos se filtran por institución y devuelven 404 si no son del usuario | `backend/app/api/pacientes.py`, `backend/tests/test_pacientes.py` | `cumple` | Equipo del proyecto |
| RS-ACC-05 | Separación de funciones: el administrador no ve datos clínicos | La matriz del rol `admin` no incluye permisos clínicos y hay pruebas de que no ve pacientes | `backend/app/security/permisos.py`, `backend/tests/test_roles.py`, `backend/tests/test_pacientes.py` | `cumple` | Equipo del proyecto |
| RS-ACC-06 | Sesión nueva en cada inicio, expiración por inactividad y cierre remoto de todas las sesiones | Token opaco nuevo por inicio, caducidad por inactividad y cierre de la sesión actual; no hay cierre de todas las sesiones | `backend/app/auth/sessions.py`, `backend/app/auth/deps.py`, `backend/tests/test_sesiones_seguridad.py` | `parcial` | Equipo del proyecto |
| RS-ACC-07 | Cuentas de servicio con credenciales propias y permisos mínimos | Los servicios están separados en contenedores, pero el almacenamiento usa credenciales raíz de MinIO y OCR e IA no tienen credenciales propias | `docker-compose.yml`, `backend/app/storage/s3.py` | `pendiente` | Equipo del proyecto |
| RS-ACC-08 | Baja inmediata de un usuario que deja de necesitar acceso | Desactivar deja `activo = false`; el inicio de sesión y cada petición rechazan la cuenta desactivada | `backend/app/api/usuarios.py`, `backend/app/auth/deps.py`, `backend/tests/test_usuarios.py` | `cumple` | Equipo del proyecto |
| RS-ACC-09 | Acceso excepcional a un paciente con justificación y registro | No implementado | `docs/referencia/04-requisitos/catalogo-de-requisitos.md` | `pendiente` | Dirección de tesis |

### Cifrado, archivos y respaldos (RS-CIF)

| Código | Requisito (resumen) | Cómo se cumple hoy | Evidencia | Estado | Quién decide |
| --- | --- | --- | --- | --- | --- |
| RS-CIF-01 | TLS 1.2 o superior, o red interna aislada | El borde habla TLS 1.2 y 1.3 y solo él publica puertos; el tráfico entre servicios es HTTP dentro de una red `bridge` que no está marcada como `internal`, así que la segunda alternativa no se cumple del todo | `infra/nginx/default.conf.template`, `docker-compose.yml` | `parcial` | Equipo del proyecto |
| RS-CIF-02 | Cifrado en reposo de base, archivos y respaldos | Identidad cifrada con AES-256-GCM, objetos con `ServerSideEncryption=AES256`, respaldos con GPG; el cifrado del volumen de PostgreSQL depende del disco del host | `backend/app/security/encryption.py`, `backend/app/storage/s3.py`, `infra/scripts/respaldo.sh`, `docs/arquitectura/cifrado-en-reposo.md` | `parcial` | Equipo del proyecto |
| RS-CIF-03 | Claves fuera del repositorio, separadas por función y rotables | La clave se lee del entorno, `.env` está ignorado y hay escaneo de secretos; la rotación está documentada, pero hay una sola clave para toda la identidad | `backend/app/config.py`, `.env.example`, `.gitignore`, `.gitleaks.toml`, `docs/arquitectura/cifrado-en-reposo.md` | `parcial` | Equipo del proyecto |
| RS-CIF-04 | Descarga con enlaces firmados de corta duración y almacenamiento no público | El bucket se crea privado y la única lectura es `generate_presigned_link`, con vigencia validada | `backend/app/storage/s3.py`, `backend/tests/test_storage.py` | `cumple` | Equipo del proyecto |
| RS-CIF-05 | Respaldos cifrados, con copia fuera del equipo y restauración probada | Respaldo cifrado y restauración verificada; falta la copia fuera del equipo | `infra/scripts/respaldo.sh`, `docs/pruebas/evidencia-respaldo.md` | `parcial` | Equipo del proyecto |
| RS-CIF-06 | Archivos revisados: tipo real, tamaño, rechazo de ejecutables y PDF con scripts | La interfaz acepta PDF, PNG y JPEG y rechaza un archivo vacío; no hay ruta de carga en el backend ni comprobación real de tipo o de scripts en PDF | `frontend/src/screens/doctor/DocumentUploadDialog.tsx`, `backend/app/main.py` (routers registrados) | `parcial` | Equipo del proyecto |
| RS-CIF-07 | Borrado seguro de archivos eliminados o vencidos | Solo existe `delete_object`, sin borrado seguro ni vencimiento | `backend/app/storage/s3.py` | `pendiente` | Equipo del proyecto |

### Retención y ciclo de vida de los datos (RS-RET)

| Código | Requisito (resumen) | Cómo se cumple hoy | Evidencia | Estado | Quién decide |
| --- | --- | --- | --- | --- | --- |
| RS-RET-01 | Plazo de conservación definido por tipo de dato | No hay plazos escritos; HT-085 sigue pendiente | `docs/referencia/05-backlog/de-los-requisitos-al-backlog.md` (HT-085) | `pendiente` | Dirección de tesis, con SOLCA |
| RS-RET-02 | Borrado o anonimización al vencer el plazo | No hay tarea ni procedimiento | `docs/referencia/05-backlog/de-los-requisitos-al-backlog.md` (HT-085) | `pendiente` | Dirección de tesis |
| RS-RET-03 | Datos de desarrollo y pruebas separados de los de uso real | Las pruebas exigen `TEST_DATABASE_URL` y `REQUIRE_TEST_DB=1`; el generador es sintético. No hay política escrita que impida copiar datos reales | `backend/tests/conftest.py`, `backend/scripts/seed_sintetico.py`, `docker-compose.yml` | `parcial` | Equipo del proyecto |

### Requisitos no funcionales de seguridad (RNF-SEG)

| Código | Requisito (resumen) | Cómo se cumple hoy | Evidencia | Estado | Quién decide |
| --- | --- | --- | --- | --- | --- |
| RNF-SEG-01 | Contraseñas con hash robusto, nunca en claro | Argon2 con rehash automático y verificación de costo constante para correos inexistentes | `backend/app/security/passwords.py`, `backend/tests/test_auth.py` | `cumple` | Equipo del proyecto |
| RNF-SEG-02 | TLS entre navegador y servidor, también en la demostración local | El borde sirve TLS 1.2 y 1.3 con certificado de desarrollo | `infra/nginx/default.conf.template`, `infra/scripts/generar-certificado-dev.sh` | `cumple` | Equipo del proyecto |
| RNF-SEG-03 | Cookies HttpOnly y SameSite, con protección contra CSRF | Cookie `HttpOnly`, `SameSite=strict`, `Secure` fuera de local y rechazo de `Origin` ajeno en métodos que cambian estado | `backend/app/auth/routes.py`, `backend/app/main.py`, `backend/tests/test_csrf.py` | `cumple` | Equipo del proyecto |
| RNF-SEG-04 | Autorización comprobada en el servidor en cada endpoint | `requiere_permiso("...")` en las rutas y una prueba que falla si una ruta queda sin proteger | `backend/app/auth/deps.py`, `backend/tests/test_permisos.py` | `cumple` | Equipo del proyecto |
| RNF-SEG-05 | Datos identificativos cifrados en reposo, con la clave fuera del repositorio | AES-256-GCM en la frontera de la columna y clave desde `PII_ENCRYPTION_KEY`; fuera de desarrollo se rechaza la clave de ejemplo | `backend/app/security/encryption.py`, `backend/app/config.py`, `backend/tests/test_encryption.py` | `cumple` | Equipo del proyecto |
| RNF-SEG-06 | Secretos fuera del repositorio y escaneo en la integración continua | `.env` ignorado, `.env.example` sin secretos y job de gitleaks en CI | `.gitignore`, `.gitleaks.toml`, `.github/workflows/ci.yml` | `cumple` | Equipo del proyecto |
| RNF-SEG-07 | Validación estricta de entradas y límite de peticiones en la API | La mayoría de los cuerpos se validan con Pydantic y hay bloqueo temporal tras intentos fallidos; `POST /trabajos` acepta un `payload` como diccionario libre y no hay límite general de peticiones | `backend/app/api/usuarios.py`, `backend/app/api/trabajos.py`, `backend/app/auth/routes.py` | `parcial` | Equipo del proyecto |
| RNF-SEG-08 | Escaneo de vulnerabilidades en las dependencias | `pip-audit` bloqueante por proyecto y `bun audit` informativo en CI | `.github/workflows/ci.yml` | `cumple` | Equipo del proyecto |

## Lo que falta

Solo huecos reales encontrados al abrir los archivos de arriba:

- **Registro de tratamientos (RS-LEG-02).** No existe el documento que pida el
  requisito: qué datos, finalidad, base de licitud, quién accede y por cuánto
  tiempo.
- **Consentimiento (RS-LEG-04, RS-DER-04).** Hay tabla y restricciones, pero no
  texto versionado, finalidades separadas ni ruta para otorgar o retirar. La
  retirada no puede excluir a un caso de los datasets futuros porque tampoco
  existen datasets.
- **Aviso de privacidad y delegado (RS-LEG-06, RS-LEG-07).** Sin aviso visible
  ni contacto del responsable.
- **Evaluación de impacto (RS-LEG-05).** Sin documento; es requisito previo a
  datos reales.
- **CEISH y convenio (RS-LEG-09).** Sin evidencia en el repositorio de aprobación
  del comité ni del convenio; son condición para usar datos reales y hoy no se
  usan.
- **Normas sanitarias de historia clínica (RS-LEG-12).** Sin identificar; el
  catálogo pide confirmarlas con el director o con SOLCA.
- **Derechos de los titulares (RS-DER).** La pantalla
  `frontend/src/screens/admin/DataRightsScreen.tsx` es de demostración: no hay
  tablas, rutas ni plazos de 15 días en el backend.
- **Datasets y anonimización de exportaciones (RS-ANO-03, RS-ANO-05,
  RS-ANO-08, RS-ANO-09).** Sin generación, sin ficha técnica y sin registro en
  la bitácora.
- **k-anonimato (RS-ANO-06).** Sin medición del riesgo de reidentificación.
- **Metadatos de imágenes y texto incrustado (RS-ANO-04).** La limpieza de
  EXIF/DICOM y el OCR ya existen (filas y pruebas de la tabla); falta la
  detección de texto incrustado en la ecografía (HT-051).
- **Segundo factor, listas de contraseñas filtradas y cierre de todas las
  sesiones (RS-ACC-01, RS-ACC-02, RS-ACC-06).** Parciales: falta el segundo
  factor, la comprobación contra listas y el cierre remoto de todas las sesiones.
- **Cuentas de servicio (RS-ACC-07).** MinIO usa credenciales raíz y OCR e IA no
  tienen credenciales propias.
- **Acceso excepcional con justificación (RS-ACC-09).** Sin implementar.
- **Validación de archivos en el servidor (RS-CIF-06).** La comprobación vive en
  la interfaz; no hay ruta de carga ni comprobación de tipo real, tamaño o
  scripts en PDF.
- **Borrado seguro (RS-CIF-07).** Solo se borra el objeto, sin borrado seguro ni
  vencimiento.
- **Tráfico entre servicios (RS-CIF-01).** Va en HTTP sobre la red `bridge` del
  compose, que no está marcada como `internal`; falta TLS interno o aislar la
  red de verdad.
- **Copia externa del respaldo (RS-CIF-05).** El respaldo queda en el mismo
  equipo.
- **Plazos de conservación y borrado (RS-RET-01, RS-RET-02).** Sin definir; HT-085
  pendiente. Los plazos deben decidirse con el director y SOLCA, no inventarse.
- **Política de separación de entornos (RS-RET-03).** La separación existe por
  configuración y datos sintéticos, pero no hay regla escrita ni control.
- **Límite de peticiones (RNF-SEG-07).** No hay limitador general; solo bloqueo
  de cuenta tras intentos fallidos. Además, `POST /trabajos` recibe un `payload`
  libre (`backend/app/api/trabajos.py`).
- **Cloudflare como borde de producción (RS-LEG-10).** El tráfico de producción
  pasa por Cloudflare (`docs/operacion/despliegue-tiroides2.md`); antes de usar
  datos reales hay que documentar el encargado o la transferencia, o evitarla.
- **Bitácora sin lectura por API.** Se escribe y no se puede modificar, pero el
  permiso `auditoria.leer` no tiene ruta que lo use.
- **Matriz de pruebas desactualizada.** Varias filas de
  `docs/pruebas/matriz-de-pruebas.md` dicen «Pendiente» donde el código y las
  pruebas ya existen (por ejemplo RS-CIF-04 y RS-ACC-04) y viceversa; conviene
  sincronizarla con este mapa.
- **MinIO sin el digest que fija el ADR.** `docs/adr/ADR-014-minio-fijado.md`
  decide fijar la imagen por digest, pero `docker-compose.yml` usa
  `bitnamilegacy/minio:latest`. No cambia la evidencia de cifrado ni de enlaces
  firmados, pero sí la reproducibilidad del almacenamiento.

## Revisión

Los textos legales (consentimiento, aviso de privacidad, registro de
tratamientos y evaluación de impacto) los revisa el director de tesis antes de
darse por cerrados. Este documento deja el mapa y la evidencia; no sustituye esa
revisión ni afirma que ya se hizo. Tampoco es asesoría legal: la interpretación
de la LOPDP y de las normas sanitarias corresponde al director y, si hace falta,
a un asesor jurídico de la ESPOCH.
