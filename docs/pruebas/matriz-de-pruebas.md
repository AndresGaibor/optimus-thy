# Matriz de pruebas (HT-100)

Una fila por requisito de prioridad **M** del catálogo. Cada fila tiene su caso de
prueba, el resultado, la evidencia y el error asociado. El catálogo completo, con
el texto íntegro de cada requisito, está en `docs/referencia/04-requisitos/catalogo-de-requisitos.md`.

## Cómo se mantiene

- **Caso de prueba**: identificador `CP-###`, estable. El detalle del caso vive en
  `backend/tests/` (unidad e integración) o en `frontend/src/test/` (componentes).
- **Resultado**: `Pendiente` (aún no se ejecuta), `En curso` (parcial, con la parte
  que falta indicada en la evidencia), `Aprobado` (caso en verde y evidencia
  guardada), `Falló` (el caso no pasa; se abre un error) o `Bloqueado` (depende de
  otra tarjeta o de datos que no existen).
- **Evidencia**: ruta de la prueba, captura o documento. Nunca datos clínicos reales.
- **Error asociado**: identificador del registro de errores (`ERR-###`).

Al cerrar una tarjeta se actualizan las filas de los requisitos que cubre: cambiar
`Pendiente` por `Aprobado` y añadir la evidencia es parte de la definición de terminado.

## Resumen

| Sección | Requisitos M | Aprobados | En curso | Pendientes |
| --- | --- | --- | --- | --- |
| El modelo existente (app.py y base.py) | 9 | 0 | 0 | 9 |
| Requisitos funcionales | 67 | 10 | 8 | 49 |
| Diseño y sistema de diseño | 8 | 0 | 0 | 8 |
| Seguridad, privacidad y cumplimiento legal | 34 | 2 | 5 | 27 |
| Requisitos no funcionales | 16 | 2 | 4 | 10 |
| Datos, integración y despliegue | 14 | 4 | 2 | 8 |
| Proceso del trabajo de titulación | 8 | 2 | 0 | 6 |
| **Total** | **156** | **20** | **19** | **117** |

## El modelo existente (app.py y base.py)

| Requisito | Texto del requisito (resumen) | Caso de prueba | Resultado | Evidencia | Error |
| --- | --- | --- | --- | --- | --- |
| RIA-01 | Empaquetar el flujo como servicio Python independiente que recibe una imagen y devuelve un resultado estructurado y las… | CP-001 | Pendiente | — | — |
| RIA-02 | Reescribir `base.py` sin rutas fijas ni variables globales mutables; configuración por variables de entorno | CP-002 | Pendiente | — | — |
| RIA-03 | Procesar cada solicitud en un espacio propio, sin borrar carpetas compartidas, para que dos usuarios no se pisen | CP-003 | Pendiente | — | — |
| RIA-04 | Cargar los tres modelos una sola vez al iniciar y exponer un chequeo de salud que confirma que están listos | CP-004 | Pendiente | — | — |
| RIA-05 | Registrar en cada inferencia la huella de los tres archivos de pesos y los umbrales usados | CP-005 | Pendiente | — | — |
| RIA-06 | Contrato de salida versionado por nódulo: caja, confianza del detector, origen de la máscara, probabilidades, clase y… | CP-006 | Pendiente | — | — |
| RIA-07 | Prueba de regresión: con imágenes de ejemplo, el servicio da los mismos resultados que `app.py` original | CP-007 | Pendiente | — | — |
| RIA-08 | Funcionar sin GPU y medir el tiempo por imagen en el equipo de la demostración | CP-008 | Pendiente | — | — |
| RIA-12 | `app.py` queda como herramienta de laboratorio; el producto no usa Streamlit | CP-009 | Pendiente | — | — |

## Requisitos funcionales

| Requisito | Texto del requisito (resumen) | Caso de prueba | Resultado | Evidencia | Error |
| --- | --- | --- | --- | --- | --- |
| RF-AUT-01 | El usuario inicia sesión con correo y contraseña y el servidor mantiene la sesión con una cookie HttpOnly | CP-010 | Aprobado | `backend/tests/test_validacion_ht_hu.py::test_hu001_*`; `backend/tests/test_auth.py` | ERR-007 |
| RF-AUT-02 | El rol activo sale solo de la sesión del servidor y solo entre los roles asignados al usuario; no existe selector libre… | CP-011 | Aprobado | `backend/tests/test_validacion_ht_hu.py::test_hu003_*` | ERR-004 |
| RF-AUT-03 | El cierre de sesión invalida la sesión en el servidor | CP-012 | Aprobado | `backend/tests/test_validacion_ht_hu.py::test_hu002_logout_invalida_sesion_y_queda_en_bitacora` | ERR-008 |
| RF-AUT-04 | Las rutas del frontend se protegen por rol y el acceso denegado muestra un mensaje claro | CP-013 | Aprobado | `frontend/src/test/routing.test.tsx` (guardia de rol, acceso denegado) | — |
| RF-ADM-01 | Crear, editar, activar y desactivar usuarios con rol e institución | CP-014 | Aprobado | `backend/tests/test_usuarios.py`; `backend/tests/test_validacion_ht_hu.py::test_hu010_*`; `frontend/src/test/usuarios-admin.test.tsx` | ERR-012 |
| RF-ADM-02 | Gestionar roles y asignar permisos a cada rol mediante una matriz | CP-015 | Aprobado | `backend/tests/test_roles.py`; `frontend/src/test/roles-admin.test.tsx` | — |
| RF-ADM-03 | Cada endpoint exige el permiso del rol y registra la denegación | CP-016 | Aprobado | `backend/tests/test_permisos.py`: cada ruta × cada rol (401, 403 y evento `AUTH.ACCESS_DENIED`), ninguna ruta sin permiso, base migrada = matriz | ERR-019 |
| RF-ADM-04 | Desactivar un usuario conserva su historial y sus registros | CP-017 | Aprobado | `backend/tests/test_usuarios.py` (desactivar conserva datos) | — |
| RF-AUD-01 | Registrar inicio y cierre de sesión e intentos fallidos, con usuario, hora y origen | CP-018 | En curso | `backend/tests/test_validacion_ht_hu.py::test_hu001_login_y_fallo_quedan_en_bitacora_sin_el_correo`, `test_hu002_logout_*`. Falta: el origen guarda la IP del proxy, no la del cliente | ERR-005 |
| RF-AUD-02 | Registrar la consulta de pacientes, fichas, documentos e imágenes | CP-019 | En curso | — | — |
| RF-AUD-03 | Registrar cada carga de documentos e imágenes | CP-020 | En curso | — | — |
| RF-AUD-04 | Registrar cada ejecución de inferencia con modelo, versión y resultado | CP-021 | En curso | — | — |
| RF-AUD-05 | Registrar cada exportación de reportes, datos y datasets | CP-022 | En curso | — | — |
| RF-AUD-06 | Registrar cambios de usuarios, roles, permisos y ajustes del sistema | CP-023 | En curso | `backend/tests/test_validacion_ht_hu.py::test_hu010_cambios_de_usuarios_*`. Faltan permisos y ajustes (no existen aún) | ERR-005 |
| RF-AUD-07 | Registrar los accesos denegados | CP-024 | En curso | `backend/tests/test_validacion_ht_hu.py::test_hu010_cambios_de_usuarios_*` (denegación por rol). Faltan denegaciones por objeto | ERR-005 |
| RF-AUD-08 | La bitácora no se puede editar ni borrar desde la aplicación | CP-025 | Aprobado | `backend/tests/test_audit.py::test_el_servicio_no_permite_editar_ni_borrar`; `backend/alembic/versions/0005_auditoria_solo_escritura.py` | — |
| RF-AUD-09 | La bitácora guarda referencias al paciente, no datos clínicos ni identificadores directos | CP-026 | Aprobado | `backend/tests/test_audit.py::test_el_evento_guarda_referencias_y_no_datos_clinicos`; `backend/tests/test_audit.py::test_la_bitacora_no_se_encadena_a_datos_clinicos` | — |
| RF-PAC-01 | Registrar un paciente con identificador interno y solo los datos mínimos necesarios | CP-027 | Pendiente | — | — |
| RF-PAC-02 | Los datos que identifican al paciente se guardan separados de los clínicos y cifrados | CP-028 | Pendiente | — | — |
| RF-PAC-03 | Consultar pacientes con búsqueda y filtros, limitados a lo que el rol permite | CP-029 | En curso | `frontend/src/test/pacientes.test.tsx` (lista con código y casos, estado vacío, error con reintento, alta válida e inválida). Falta: filtros por estado/fecha y detalle completo del paciente | — |
| RF-PAC-04 | Actualizar los datos del paciente conservando el historial de cambios | CP-030 | Pendiente | — | — |
| RF-PAC-05 | Crear casos por paciente; un caso agrupa ficha, documentos, imágenes e inferencias | CP-031 | Pendiente | — | — |
| RF-PAC-06 | Registrar y retirar el consentimiento del paciente para inferencia e investigación | CP-032 | Pendiente | — | — |
| RF-PAC-07 | Sin consentimiento vigente no se ejecuta inferencia ni se incluye al paciente en datasets de investigación | CP-033 | Pendiente | — | — |
| RF-CLI-01 | Registrar la ficha clínica del caso: antecedentes, síntomas y exploración | CP-034 | Pendiente | — | — |
| RF-CLI-02 | Registrar laboratorio relevante (TSH, T3, T4) con unidad y fecha | CP-035 | Pendiente | — | — |
| RF-CLI-03 | Registrar hallazgos de ecografía (TI-RADS, tamaño del nódulo, lateralidad) y citología (Bethesda) | CP-036 | Pendiente | — | — |
| RF-CLI-04 | Validar rangos y formatos de cada campo con mensajes claros | CP-037 | Pendiente | — | — |
| RF-CLI-05 | Versionar la ficha: cada cambio guarda quién, cuándo y qué cambió | CP-038 | Pendiente | — | — |
| RF-CLI-06 | Los campos extraídos por OCR entran a la ficha solo después de que el médico los confirma | CP-039 | Pendiente | — | — |
| RF-CLI-09 | La ficha se organiza en secciones: consulta, laboratorio, ecografía, PAAF y Bethesda, antecedentes y diagnóstico con… | CP-040 | Pendiente | — | — |
| RF-CLI-10 | Los datos de la ficha no entran al modelo de IA; el modelo recibe solo la imagen | CP-041 | Pendiente | — | — |
| RF-CLI-11 | El resultado histopatológico o la categoría Bethesda de la ficha sirve de referencia para auditar la predicción | CP-042 | Pendiente | — | — |
| RF-DOC-01 | Cargar fichas en PDF o imagen y asociarlas a un paciente y a un caso | CP-043 | Pendiente | — | — |
| RF-DOC-02 | Validar tipo, tamaño y contenido del archivo antes de aceptarlo; el rechazo explica el motivo | CP-044 | Pendiente | — | — |
| RF-DOC-03 | Guardar el archivo en almacenamiento compatible con S3 y en la base solo metadatos y ubicación | CP-045 | Pendiente | — | — |
| RF-DOC-05 | Extraer texto y campos con OCR local, sin enviar nada a servicios externos | CP-046 | Pendiente | — | — |
| RF-DOC-06 | El OCR corre en segundo plano y el usuario ve su estado: en cola, procesando, listo o con error | CP-047 | Pendiente | — | — |
| RF-DOC-07 | Mostrar los campos extraídos con su confianza junto al documento original para corregirlos | CP-048 | Pendiente | — | — |
| RF-DOC-09 | Visualizar y descargar documentos con permiso del rol y registro del acceso | CP-049 | Pendiente | — | — |
| RF-IMG-01 | Cargar imágenes ecográficas en los formatos que acepta el modelo | CP-050 | Pendiente | — | — |
| RF-IMG-02 | Validar formato, dimensiones y legibilidad; rechazar con motivo | CP-051 | Pendiente | — | — |
| RF-IMG-03 | Quitar metadatos con datos personales (EXIF, DICOM) antes de guardar o enviar al modelo | CP-052 | Pendiente | — | — |
| RF-IMG-04 | Preprocesar la imagen para el modelo sin alterar el original | CP-053 | Pendiente | — | — |
| RF-INF-01 | El médico elige paciente, caso e imagen y ejecuta la inferencia | CP-054 | Pendiente | — | — |
| RF-INF-02 | La API valida, preprocesa, llama al modelo OPTIMUS-THY y devuelve el resultado | CP-055 | Pendiente | — | — |
| RF-INF-03 | El resultado muestra, por cada nódulo detectado, la clase benigno o maligno con su probabilidad; si el detector no… | CP-056 | Pendiente | — | — |
| RF-INF-04 | Todo resultado lleva un aviso visible: es apoyo, no diagnóstico definitivo; en pantalla, reporte y exportaciones | CP-057 | Pendiente | — | — |
| RF-INF-05 | Guardar cada resultado con versión del modelo, parámetros, fecha, usuario e imagen de entrada | CP-058 | Pendiente | — | — |
| RF-INF-06 | Ejecución con estado visible, tiempo máximo y manejo de errores | CP-059 | Pendiente | — | — |
| RF-INF-07 | Si el modelo no responde, el sistema lo dice y no inventa un resultado | CP-060 | Pendiente | — | — |
| RF-INF-08 | Consultar el historial de inferencias de un caso | CP-061 | Pendiente | — | — |
| RF-INF-12 | Mostrar por nódulo la imagen original, la caja del detector, la máscara final, la región analizada y la superposición… | CP-062 | Pendiente | — | — |
| RF-INF-13 | Una imagen puede tener hasta 3 nódulos; cada uno recibe su caja, su máscara y su clasificación | CP-063 | Pendiente | — | — |
| RF-INF-14 | Si el detector no encuentra nódulo, el sistema no clasifica la imagen completa como si fuera un nódulo y lo informa | CP-064 | Pendiente | — | — |
| RF-REP-01 | Generar un reporte PDF por inferencia con datos mínimos del paciente, imagen, resultado, confianza, versión del modelo,… | CP-065 | Pendiente | — | — |
| RF-REP-02 | El reporte incluye el aviso de apoyo, no de diagnóstico | CP-066 | Pendiente | — | — |
| RF-REP-03 | Consultar resultados guardados con filtros por paciente, fecha y clase | CP-067 | Pendiente | — | — |
| RF-REP-04 | Descargar el reporte con permiso del rol y registro de la descarga | CP-068 | Pendiente | — | — |
| RF-INV-01 | El investigador consulta datasets desidentificados construidos a partir de casos con consentimiento | CP-069 | Pendiente | — | — |
| RF-INV-02 | Desidentificar antes de ofrecer datos: quitar identificadores directos y generalizar fechas y edades | CP-070 | Pendiente | — | — |
| RF-INV-03 | El investigador nunca ve datos que identifiquen al paciente | CP-071 | Pendiente | — | — |
| RF-INV-04 | Calcular métricas del modelo: sensibilidad, especificidad, precisión, F1, AUC y matriz de confusión | CP-072 | Pendiente | — | — |
| RF-INV-05 | Comparar resultados entre versiones del modelo o entre conjuntos de datos | CP-073 | Pendiente | — | — |
| RF-INV-06 | Auditar predicciones individuales: predicción, referencia clínica y diferencia | CP-074 | Pendiente | — | — |
| RF-INV-07 | Análisis de errores: falsos positivos y negativos con filtros y listado | CP-075 | Pendiente | — | — |
| RF-INV-08 | Exportar datos y métricas desidentificados con permiso y registro | CP-076 | Pendiente | — | — |

## Diseño y sistema de diseño

| Requisito | Texto del requisito (resumen) | Caso de prueba | Resultado | Evidencia | Error |
| --- | --- | --- | --- | --- | --- |
| RDS-01 | Principios de diseño y dirección visual escritos: clínico, sobrio, legible y con jerarquía clara | CP-077 | Pendiente | — | — |
| RDS-02 | Tokens de diseño: color con roles semánticos (éxito, alerta, error, información), tipografía, espaciado, radios,… | CP-078 | Pendiente | — | — |
| RDS-03 | Colores propios para las clases normal, benigno y maligno que no se confundan con éxito o error y no dependan solo del… | CP-079 | Pendiente | — | — |
| RDS-05 | Biblioteca de componentes base: botón, campo, selector, tabla, tarjeta, modal, aviso, pestañas, navegación, paginación | CP-080 | Pendiente | — | — |
| RDS-06 | Patrones clínicos: tarjeta de paciente, ficha, resultado de IA con confianza, aviso de apoyo, visor de imagen, campo… | CP-081 | Pendiente | — | — |
| RDS-07 | Estados de carga, vacío y error definidos y usados en cada pantalla | CP-082 | Pendiente | — | — |
| RDS-09 | Accesibilidad WCAG 2.2 AA: contraste, foco visible, uso completo con teclado, etiquetas y lectores de pantalla | CP-083 | Pendiente | — | — |
| RDS-11 | Contenido en español claro, con glosario de términos clínicos y mensajes de error que dicen qué hacer | CP-084 | Pendiente | — | — |

## Seguridad, privacidad y cumplimiento legal

| Requisito | Texto del requisito (resumen) | Caso de prueba | Resultado | Evidencia | Error |
| --- | --- | --- | --- | --- | --- |
| RS-LEG-01 | Mapa de cumplimiento: cada obligación de la tabla anterior enlazada con el requisito que la cubre y su evidencia | CP-085 | Pendiente | — | — |
| RS-LEG-02 | Registro de tratamientos: qué datos, para qué finalidad, con qué base de licitud, quién accede y cuánto se conservan | CP-086 | Pendiente | — | — |
| RS-LEG-03 | Base de licitud documentada: consentimiento explícito del paciente para el tratamiento de sus datos de salud | CP-087 | Pendiente | — | — |
| RS-LEG-04 | Texto de consentimiento claro, con finalidades separadas (atención e inferencia por un lado, investigación por otro),… | CP-088 | Pendiente | — | — |
| RS-LEG-09 | Antes de usar datos reales de pacientes: aprobación de un comité de ética (CEISH) y convenio con la institución de salud | CP-089 | Pendiente | — | — |
| RS-LEG-10 | Ningún dato sale de la infraestructura propia: sin servicios externos de OCR, IA, analítica ni almacenamiento | CP-090 | Pendiente | — | — |
| RS-DER-02 | Rectificación: corregir datos inexactos conservando el historial del cambio | CP-091 | Pendiente | — | — |
| RS-DER-04 | Oposición y retiro del consentimiento con efecto desde ese momento y exclusión de los datasets de investigación futuros | CP-092 | Pendiente | — | — |
| RS-DER-06 | Decisiones automatizadas: explicar cómo se obtuvo la predicción y dejar claro que la decisión es del médico | CP-093 | Pendiente | — | — |
| RS-ANO-01 | Seudonimización por defecto: toda la aplicación usa el código interno del paciente y los identificadores directos viven… | CP-094 | Aprobado | `backend/tests/test_modelo_datos.py::test_pacientes_sin_columnas_de_identidad` | — |
| RS-ANO-02 | La clave que relaciona el código con la persona se guarda separada y solo la ve un rol autorizado | CP-095 | Pendiente | — | — |
| RS-ANO-03 | Datasets de investigación sin nombre, cédula, contacto, dirección ni número de historia; fechas desplazadas o reducidas… | CP-096 | Pendiente | — | — |
| RS-ANO-04 | Imágenes: quitar metadatos (EXIF, DICOM) y detectar con OCR texto incrustado en la imagen, como nombres o fechas, para… | CP-097 | Pendiente | — | — |
| RS-ANO-07 | Nombres de archivo y rutas sin datos personales | CP-098 | Pendiente | — | — |
| RS-ANO-08 | Los reportes y exportaciones para investigación no contienen identificadores | CP-099 | Pendiente | — | — |
| RS-ACC-03 | Mínimo privilegio: cada rol tiene solo los permisos necesarios y se revisan antes de la entrega | CP-100 | En curso | Matriz por defecto y sus pruebas en `backend/app/security/permisos.py` y `backend/tests/test_roles.py`; falta la revisión final antes de la entrega | — |
| RS-ACC-04 | Control de acceso por objeto: un usuario no puede leer casos ni pacientes que no le corresponden, aunque cambie un… | CP-101 | Pendiente | — | — |
| RS-ACC-05 | Separación de funciones: el rol de administrador solo no ve datos clínicos | CP-102 | Aprobado | `backend/tests/test_roles.py::test_el_administrador_no_tiene_permisos_clinicos` | — |
| RS-ACC-07 | Cuentas de servicio (IA, OCR, almacenamiento) con credenciales propias y permisos mínimos | CP-103 | Pendiente | — | — |
| RS-CIF-01 | TLS 1.2 o superior en todo el tráfico, incluido el que va entre servicios, o red interna aislada | CP-104 | Pendiente | — | — |
| RS-CIF-02 | Cifrado en reposo de la base de datos, del almacenamiento de archivos y de los respaldos | CP-105 | En curso | Campos del paciente cifrados (HT-011); respaldo cifrado y restauración probados (HT-013, `docs/pruebas/evidencia-respaldo.md`); falta la copia fuera del equipo | — |
| RS-CIF-03 | Claves fuera del repositorio, separadas por función y rotables | CP-106 | En curso | Clave en variable de entorno con `clave_version` por fila y rotación documentada; falta separar claves por función | — |
| RS-CIF-04 | Descarga de archivos con enlaces firmados de corta duración; el almacenamiento nunca es público | CP-107 | Pendiente | — | — |
| RS-CIF-05 | Respaldos cifrados, con una copia fuera del equipo principal y restauración probada | CP-108 | En curso | `infra/scripts/probar-respaldo.sh`; `docs/pruebas/evidencia-respaldo.md`. Falta la copia fuera del equipo | — |
| RS-CIF-06 | Archivos cargados revisados: tipo real, tamaño, rechazo de ejecutables y PDF con scripts | CP-109 | Pendiente | — | — |
| RS-APP-02 | Defensa contra inyección SQL, XSS, CSRF, SSRF y recorrido de rutas | CP-110 | Pendiente | — | — |
| RS-APP-03 | Cabeceras de seguridad (CSP, HSTS, X-Content-Type-Options, frame-ancestors) y CORS restrictivo | CP-111 | Pendiente | — | — |
| RS-APP-04 | Errores sin detalles internos para el usuario; el detalle va solo a los logs | CP-112 | Pendiente | — | — |
| RS-APP-05 | Validación de toda entrada en el servidor | CP-113 | Pendiente | — | — |
| RS-INC-01 | Bitácora de seguridad con inicios fallidos, cambios de permisos y accesos denegados, sin editarse (ver RF-AUD) | CP-114 | En curso | `backend/app/audit/actions.py`; `backend/tests/test_audit.py::test_registra_las_acciones_del_anteproyecto` (falta que cada módulo llame al servicio) | — |
| RS-INC-03 | Plan de respuesta a incidentes escrito: detectar, contener, evaluar, notificar y corregir | CP-115 | Pendiente | — | — |
| RS-RET-03 | Datos de desarrollo y pruebas separados de los de uso real; nunca se copian datos reales a desarrollo | CP-116 | Pendiente | — | — |
| RS-IA-03 | Las inferencias y los datos del sistema no se usan para reentrenar el modelo | CP-117 | Pendiente | — | — |
| RS-INF-01 | Solo el proxy inverso queda expuesto; base de datos, almacenamiento, IA y OCR sin puertos públicos | CP-118 | Pendiente | — | — |

## Requisitos no funcionales

| Requisito | Texto del requisito (resumen) | Caso de prueba | Resultado | Evidencia | Error |
| --- | --- | --- | --- | --- | --- |
| RNF-SEG-01 | Contraseñas guardadas con un hash robusto (Argon2 o bcrypt), nunca en claro | CP-119 | Aprobado | `backend/tests/test_auth.py` (Argon2id con rehash) | — |
| RNF-SEG-02 | Tráfico cifrado con TLS entre navegador y servidor, también en la demostración local | CP-120 | Pendiente | — | — |
| RNF-SEG-03 | Cookies de sesión HttpOnly y SameSite, con protección contra CSRF | CP-121 | Pendiente | — | — |
| RNF-SEG-04 | La autorización se comprueba en el servidor en cada endpoint, nunca solo en la interfaz | CP-122 | En curso | `backend/tests/test_permisos.py` cubre las rutas actuales con `requiere_permiso`. Faltan los endpoints clínicos | ERR-019 |
| RNF-SEG-05 | Datos que identifican al paciente cifrados en reposo, con la clave fuera del repositorio | CP-123 | Aprobado | `backend/tests/test_encryption.py`; `docs/arquitectura/cifrado-en-reposo.md` | — |
| RNF-SEG-06 | Secretos fuera del repositorio, con escaneo de secretos en la integración continua | CP-124 | Pendiente | — | — |
| RNF-PRI-01 | Datos simulados o anonimizados en desarrollo, pruebas y demostraciones; ningún dato real en el repositorio | CP-125 | Pendiente | — | — |
| RNF-PRI-02 | Minimización: cada función pide solo los datos que necesita | CP-126 | Pendiente | — | — |
| RNF-PRI-04 | Los logs de la aplicación no contienen datos personales ni clínicos | CP-127 | Pendiente | — | — |
| RNF-USA-01 | Los flujos principales se completan sin ayuda y se miden con el UnUQ de 22 ítems | CP-128 | Pendiente | — | — |
| RNF-USA-03 | Tareas de prueba definidas para médico, investigador y administrador | CP-129 | Pendiente | — | — |
| RNF-CAL-01 | Pruebas unitarias, de integración y de extremo a extremo en la integración continua; un cambio que las rompe no se… | CP-130 | En curso | CI en verde con pruebas unitarias; faltan integración y extremo a extremo | — |
| RNF-CAL-02 | Migraciones de base de datos versionadas y reproducibles | CP-131 | Pendiente | — | — |
| RNF-CAL-03 | Un pull request por historia, con revisión y mensajes de commit claros | CP-132 | Pendiente | — | — |
| RNF-CON-01 | Respaldos periódicos de base de datos y archivos, con restauración probada | CP-133 | En curso | `infra/scripts/probar-respaldo.sh`; `docs/pruebas/evidencia-respaldo.md`. Falta activar el temporizador `optimus-thy-respaldo.timer` | — |
| RNF-CON-02 | Si el OCR o el modelo fallan, el sistema sigue funcionando, lo informa y permite reintentar | CP-134 | En curso | `backend/tests/test_validacion_ht_hu.py::test_ht010_*` (un fallo no tumba el worker; reintento manual). Faltan OCR e IA | ERR-006 |

## Datos, integración y despliegue

| Requisito | Texto del requisito (resumen) | Caso de prueba | Resultado | Evidencia | Error |
| --- | --- | --- | --- | --- | --- |
| RD-01 | Modelo de datos documentado con diagrama entidad-relación | CP-135 | Aprobado | `docs/arquitectura/modelo-de-datos-v1.md`; `backend/tests/test_modelo_datos.py` | — |
| RD-02 | PostgreSQL con integridad referencial y migraciones | CP-136 | Aprobado | `backend/alembic/versions/0001_modelo_datos_v1.py`; `backend/tests/test_modelo_datos.py::test_tablas_modelo_coinciden_con_metadata` | — |
| RD-03 | Archivos en almacenamiento compatible con S3, con nombres opacos; la base guarda solo metadatos y ubicación | CP-137 | En curso | HT-007 en esta misma entrega; la matriz se actualiza con su evidencia | — |
| RD-04 | Generador reproducible de datos sintéticos con casos benignos, malignos y sin nódulo detectado, para desarrollo,… | CP-138 | Aprobado | `backend/tests/test_seed_sintetico.py::test_hay_benignos_malignos_y_sin_nodulo`, `test_ficha_coherente_con_la_etiqueta`, `test_determinismo` | ERR-017 |
| RI-01 | Un solo comando levanta backend, frontend, base de datos, almacenamiento y OCR en el entorno local | CP-139 | Pendiente | — | — |
| RI-02 | Variables de entorno documentadas, con un ejemplo sin secretos | CP-140 | Pendiente | — | — |
| RI-03 | Respaldo y restauración documentados y probados | CP-141 | Aprobado | `infra/scripts/probar-respaldo.sh`; `docs/pruebas/evidencia-respaldo.md`; `infra/README.md` | — |
| RI-04 | Integración con el modelo existente mediante un contrato versionado de entrada y salida | CP-142 | Pendiente | — | — |
| RI-05 | Integración con el motor de OCR local mediante un contrato versionado | CP-143 | Pendiente | — | — |
| RI-06 | Pruebas de integración entre API y modelo, API y OCR, API y almacenamiento | CP-144 | Pendiente | — | — |
| RI-07 | Integración continua en GitHub: formato, tipos, pruebas y construcción | CP-145 | Pendiente | — | — |
| RD-09 | Conjunto sintético emparejado: cada imagen de ejemplo recibe un paciente sintético con una ficha coherente con su… | CP-146 | En curso | `backend/tests/test_seed_sintetico.py::test_manifiesto_empareja_cada_caso_con_una_imagen_de_su_etiqueta`. Falta el manifiesto con las imágenes reales (HT-094) | ERR-017 |
| RD-10 | Cada ficha sintética en dos versiones: PDF digital con texto y PDF escaneado con ruido e inclinación, para probar el OCR | CP-147 | Pendiente | — | — |
| RD-12 | Confirmar y documentar que las imágenes del proyecto están anonimizadas y que se pueden usar en este sistema; ningún… | CP-148 | Pendiente | — | — |

## Proceso del trabajo de titulación

| Requisito | Texto del requisito (resumen) | Caso de prueba | Resultado | Evidencia | Error |
| --- | --- | --- | --- | --- | --- |
| RP-01 | Tablero Kanban con los estados pendiente, en proceso, revisión y finalizado; cada historia es una tarjeta | CP-149 | Pendiente | — | — |
| RP-03 | Historias de usuario con criterios de aceptación verificables | CP-150 | Pendiente | — | — |
| RP-04 | Matriz de trazabilidad: compromiso, requisito, historia y prueba | CP-151 | Pendiente | — | — |
| RP-05 | Matriz de pruebas funcionales y de integración con evidencias | CP-152 | Aprobado | `docs/pruebas/matriz-de-pruebas.md` | — |
| RP-06 | Registro de errores encontrados y cómo se resolvieron | CP-153 | Aprobado | `docs/pruebas/registro-de-errores.md` | — |
| RP-07 | Aplicar el UnUQ a 10 participantes con tareas definidas y consentimiento informado | CP-154 | Pendiente | — | — |
| RP-08 | Calcular la puntuación del UnUQ de 0 a 100 (suma de ítems recodificados por 100/88, con 5 puntos Likert) y analizarla… | CP-155 | Pendiente | — | — |
| RP-09 | Hitos del cronograma: aprobar requerimientos, validar diseño, completar integración, entrega final y sustentación | CP-156 | Pendiente | — | — |

