# OPTIMUS-THY: catálogo de requisitos

Oct 20, 2026 · @Andres Gaibor

## Cómo leer este documento

Este catálogo separa lo que el anteproyecto aprobado te obliga a cumplir de lo que puedes ajustar. Todo se construye desde cero; el repo de referencia solo se usa como insumo (sección 3).

**Identificadores.** RF funcional, RDS diseño y sistema de diseño, RNF no funcional, RS seguridad, privacidad y cumplimiento legal, RD datos, RI integración y despliegue, RP proceso del trabajo de titulación.

**Origen de cada requisito.**

- **A**: aprobado en el anteproyecto. Se respeta tal cual.
- **D**: derivado de lo aprobado. No está escrito literalmente, pero sin él no se puede cumplir lo aprobado.
- **U**: pedido por ti en esta conversación, como el sistema de diseño.
- **P**: propuesta mía. Tú decides si entra, se pospone o se descarta.

**Prioridad (MoSCoW).** M debe estar, S debería estar, C podría estar, W queda fuera por ahora.

## Lo aprobado que no se puede tocar

El anteproyecto fija 21 compromisos verificables y todos se construyen desde cero; la última columna dice con qué evidencia se demuestra cada uno. Lo que no figure aquí puede cambiar.

| ID | Compromiso aprobado | Dónde lo dice | Evidencia de cumplimiento |
| --- | --- | --- | --- |
| CA-01 | Frontend en React y backend en Python | 4.4.3, 5.1.3 | Repositorio y arquitectura documentada |
| CA-02 | PostgreSQL para datos; archivos en repositorio local compatible con S3 (RustFS o similar); la base guarda solo metadatos y ubicación | 4.4.9 | Diagrama de datos y despliegue con almacenamiento |
| CA-03 | Módulo de gestión clínica y documental: pacientes, fichas clínicas, documentos e imágenes asociadas a cada caso, consultables y actualizables | 4.2.2 | Pruebas funcionales del módulo |
| CA-04 | OCR local para fichas en PDF o imagen, sin enviar nada a servicios externos (GLM OCR u otra alternativa) | 4.4.7, 4.2.1 | Pruebas con fichas de muestra y medición de calidad del OCR |
| CA-05 | Módulo de inferencia: cargar estudios, elegir paciente, ejecutar inferencia sobre imágenes o documentos asociados y mostrar resultado, confianza y reportes | 4.2.2 | Prueba de extremo a extremo |
| CA-06 | API en Python que valida la imagen, preprocesa, llama al modelo y devuelve el resultado | 4.4.6 | Pruebas de integración de la API con el modelo |
| CA-07 | Salida del modelo normal, benigno o maligno con probabilidad o nivel de confianza | 4.1.1, 4.4.4 | Contrato de salida y pruebas |
| CA-08 | La predicción es apoyo al usuario autorizado, nunca diagnóstico definitivo | 4.4.5, 4.2.2 | Aviso visible en pantalla y en el reporte |
| CA-09 | El modelo es el existente de OPTIMUS-THY; el sistema solo lo consume y guarda resultados, no lo entrena | 4.3.1, 4.4.5 | Modelo real desplegado con su versión registrada |
| CA-10 | Módulo de investigación: métricas, comparar resultados, auditar predicciones, analizar errores y consultar datasets desidentificados | 4.2.2 | Pruebas con datos desidentificados y exportación auditada |
| CA-11 | Administración de usuarios, roles y permisos | 4.2.2 | Pruebas de permisos por rol |
| CA-12 | Registro de acciones: accesos, consultas, cargas de documentos, ejecuciones de inferencia y exportaciones | 4.2.2 | Bitácora con un evento por cada acción listada |
| CA-13 | Datos simulados o anonimizados en desarrollo y pruebas; privacidad y confidencialidad desde el diseño | 4.4.2, 4.2.1, 5.2.4 | Datos sintéticos en pruebas y revisión de privacidad |
| CA-14 | Reportes generados y consulta de resultados | 4.2.2, Gantt 16 | Reporte PDF de ejemplo |
| CA-15 | Kanban con estados pendiente, en proceso, revisión y finalizado | 5.1.1 | Tablero con historial de tarjetas |
| CA-16 | Requisitos con historias de usuario y criterios de aceptación | 5.1.2, objetivo 1 | Este documento y el backlog |
| CA-17 | Usabilidad medida con el cuestionario UnUQ de 22 ítems, con 10 médicos e investigadores | 4.4.8, 5.1.4, objetivo 3 | Resultados UnUQ con n = 10 |
| CA-18 | Pruebas funcionales y de integración con matrices, registro de errores y evidencias | 5.1.3, capítulo V | Matriz de pruebas y registro de errores |
| CA-19 | Entorno local que ejecuta backend, frontend, base de datos y OCR | 5.2.1 | Despliegue documentado y repetible |
| CA-20 | Respaldos de imágenes, documentos y base de datos | 5.2.1 | Respaldo y restauración probados |
| CA-21 | Git y GitHub para control de versiones | 5.1.3 | Historial de commits y pull requests |

## La referencia: qué aprovechar y qué rehacer

El repo `optimus-thy-referencia` sirve para no partir en blanco, pero ningún requisito se da por cumplido: todo se construye y se prueba de nuevo.

**Qué aprovechar como insumo, no como base de código.**

- El modelo de datos: 28 tablas que cubren usuarios, roles, pacientes, casos, estudios, imágenes, documentos, OCR, inferencia y auditoría.
- El contrato OpenAPI y la lista de endpoints, como lista de chequeo de las operaciones que hacen falta.
- Los ADR 001 a 007 sobre arquitectura, autenticación y roles, datos personales, trabajos asíncronos, almacenamiento y observabilidad.
- Los campos que debe extraer el OCR (TSH, T3, T4, TI-RADS, tamaño del nódulo, Bethesda, lateralidad) y la interfaz fija del modelo.
- Las guías de respaldo, restauración y despliegue, y las especificaciones end to end como guion de pruebas.
- El informe de auditoría de experiencia de usuario (`TES-135`) en `docs/`, por si sirve para el rediseño.

**Qué hizo a medias y hay que hacer bien.**

- **Modelo de IA (CA-09).** El ADR-MODEL-001 (23 de septiembre de 2026) decidió seguir con un runner simulado porque los pesos de DINOv3 no están desplegados. Los archivos app.py y base.py que recibiste muestran que el modelo real es otro; ver la sección siguiente.
- **OCR (CA-04).** No hay motor real: usa expresiones regulares sobre el contenido del archivo y no lee imágenes escaneadas.
- **Investigación (CA-10).** Lista cuatro datasets fijos inventados, sin exportación ni desidentificación.
- **Auditoría (CA-12).** Registra sesión, imágenes, documentos, OCR e inferencia, pero no la consulta de pacientes, los cambios de usuarios y roles ni las exportaciones.
- **Seguridad.** Sesión fija de 24 horas, sin bloqueo por intentos fallidos y sin exigir consentimiento antes de inferir.
- **Aviso de apoyo (CA-08).** Solo hay una nota sobre Grad-CAM en un modal.
- **Salida del modelo (CA-07).** Devuelve probabilidad y una bandera de malignidad; no tiene la clase normal del anteproyecto.
- **Reportes (CA-14).** El reporte es un JSON, no un PDF.
- **Frontend.** 13 archivos conservan restos de datos ficticios y existe una pantalla de selección libre de rol.

**Lo que sobra.** El portal público con CMS de proyectos no figura en ningún módulo aprobado; la decisión sobre él está en la última sección.

**Qué revisé y qué no.** Revisé la estructura, el README, los ADR, las tablas, la lista de endpoints, los motores de OCR e IA, `docker-compose`, la CI y los nombres de las páginas. No ejecuté la aplicación ni los tests, no leí cada página del frontend y no leí el código de dashboard, métricas y cohortes de investigación.

## El modelo existente (app.py y base.py)

Los dos archivos que recibiste son el modelo que el anteproyecto dice consumir, y es distinto de lo que asumía el repo de referencia.

**Qué hace.** Por cada imagen ecográfica corre cinco pasos: YOLO11 detecta hasta 3 nódulos y guarda una anotación XML (Pascal VOC); una pseudomáscara MGAC delimita el nódulo; BGAU-Net (TensorFlow) segmenta la máscara final y, si queda casi vacía, se usa la MGAC; y un Swin Transformer de dos ramas (PyTorch) clasifica imagen y máscara como benigno o maligno con las dos probabilidades. `app.py` es una interfaz de Streamlit que lo ejecuta, muestra los resultados intermedios y genera un PDF, un CSV y un ZIP. Su pie ya dice que es una herramienta de apoyo y no reemplaza a un profesional.

**Qué le falta para cumplir los objetivos.**

- Pacientes, fichas, documentos, usuarios, roles, auditoría y base de datos: no existen. Cada ejecución usa carpetas temporales.
- OCR de fichas, módulo de investigación con métricas y reportes ligados a un caso: no existen.
- La clase normal del anteproyecto: el clasificador es binario.
- Explicación tipo Grad-CAM: no existe; las máscaras y la superposición hacen de explicación visual.
- La interfaz es Streamlit; el anteproyecto aprueba React.

**Qué hay que corregir al integrarlo.**

- `base.py` usa rutas fijas de Windows y variables globales que `app.py` reescribe en tiempo de ejecución; `app.py` borra la carpeta de entrada en cada ejecución, lo que rompe con usuarios simultáneos.
- Procesa carpetas y escribe CSV a disco; el sistema necesita una función que reciba una imagen y devuelva un resultado.
- Si YOLO no detecta nada, clasifica la imagen completa como si fuera un nódulo.
- Carga los pesos de PyTorch con `torch.load` sin restringir su contenido, lo que solo es seguro con archivos de confianza.
- Mezcla TensorFlow y PyTorch, así que corre mejor como servicio aparte con sus propias dependencias.

**Requisitos del servicio de IA (RIA).**

| ID | Requisito | Origen | Prio |
| --- | --- | --- | --- |
| RIA-01 | Empaquetar el flujo como servicio Python independiente que recibe una imagen y devuelve un resultado estructurado y las imágenes derivadas | D (CA-06) | M |
| RIA-02 | Reescribir `base.py` sin rutas fijas ni variables globales mutables; configuración por variables de entorno | D (CA-06) | M |
| RIA-03 | Procesar cada solicitud en un espacio propio, sin borrar carpetas compartidas, para que dos usuarios no se pisen | D (CA-06) | M |
| RIA-04 | Cargar los tres modelos una sola vez al iniciar y exponer un chequeo de salud que confirma que están listos | D (CA-19) | M |
| RIA-05 | Registrar en cada inferencia la huella de los tres archivos de pesos y los umbrales usados | D (CA-09, CA-12) | M |
| RIA-06 | Contrato de salida versionado por nódulo: caja, confianza del detector, origen de la máscara, probabilidades, clase y región analizada | D (CA-07) | M |
| RIA-07 | Prueba de regresión: con imágenes de ejemplo, el servicio da los mismos resultados que `app.py` original | D (CA-18) | M |
| RIA-08 | Funcionar sin GPU y medir el tiempo por imagen en el equipo de la demostración | D (CA-19) | M |
| RIA-09 | Guardar la anotación XML y las máscaras en el almacenamiento S3 y asociarlas a la inferencia | D (CA-02) | S |
| RIA-10 | Reutilizar la generación del PDF de `app.py` (encabezado ESPOCH y SOLCA, imágenes, probabilidades) como base del reporte | D (CA-14) | S |
| RIA-11 | Cargar los pesos solo desde una ubicación de confianza y con carga restringida cuando la librería lo permita | D (CA-13) | S |
| RIA-12 | `app.py` queda como herramienta de laboratorio; el producto no usa Streamlit | D (CA-01) | M |

## Actores y roles

El anteproyecto nombra tres tipos de usuario (médicos, investigadores y administradores) y dos servicios internos (modelo de IA y OCR); los roles del repo coinciden.

| Actor | Rol en el sistema | Qué necesita hacer | Origen |
| --- | --- | --- | --- |
| Médico | `doctor` | Registrar pacientes y fichas, cargar imágenes y documentos, revisar lo que extrae el OCR, lanzar inferencias, consultar resultados y reportes | A |
| Investigador | `researcher` | Trabajar con datos desidentificados, revisar métricas, comparar resultados, auditar predicciones y analizar errores | A |
| Administrador | `admin` | Gestionar usuarios, roles y permisos, revisar la bitácora de auditoría y los ajustes del sistema | A |
| Servicio de IA | Interno | Recibir una imagen preprocesada y devolver clase, probabilidad y artefactos | A |
| Servicio de OCR | Interno | Recibir un PDF o imagen y devolver texto y campos con confianza | A |
| Visitante público | Sin sesión | Ver el portal y la lista pública de proyectos | P (portal público, no está aprobado) |

Los 10 participantes de la evaluación de usabilidad se toman de estos grupos, y los administradores también participan (decisión 4 de la última sección).

## Requisitos funcionales

Los requisitos con origen A o D son el piso para defender el trabajo; los P son decisiones tuyas. Van en 11 grupos, de lo transversal a lo específico del dominio; el diseño tiene su propia sección más abajo.

### Autenticación y sesión (RF-AUT)

| ID | Requisito | Origen | Prio |
| --- | --- | --- | --- |
| RF-AUT-01 | El usuario inicia sesión con correo y contraseña y el servidor mantiene la sesión con una cookie HttpOnly | D (CA-11) | M |
| RF-AUT-02 | El rol activo sale solo de la sesión del servidor y solo entre los roles asignados al usuario; no existe selector libre de rol | D (CA-11) | M |
| RF-AUT-03 | El cierre de sesión invalida la sesión en el servidor | D (CA-11) | M |
| RF-AUT-04 | Las rutas del frontend se protegen por rol y el acceso denegado muestra un mensaje claro | D (CA-11) | M |
| RF-AUT-05 | La sesión expira por inactividad con un tiempo configurable | P | S |
| RF-AUT-06 | Tras varios intentos fallidos se bloquea la cuenta por un tiempo | P | S |
| RF-AUT-07 | El usuario cambia su contraseña y sus datos de perfil | P | S |
| RF-AUT-08 | El administrador restablece la contraseña de un usuario sin depender de correo externo | P | C |

### Administración (RF-ADM)

| ID | Requisito | Origen | Prio |
| --- | --- | --- | --- |
| RF-ADM-01 | Crear, editar, activar y desactivar usuarios con rol e institución | A (CA-11) | M |
| RF-ADM-02 | Gestionar roles y asignar permisos a cada rol mediante una matriz | A (CA-11) | M |
| RF-ADM-03 | Cada endpoint exige el permiso del rol y registra la denegación | D (CA-11) | M |
| RF-ADM-04 | Desactivar un usuario conserva su historial y sus registros | D (CA-12) | M |
| RF-ADM-05 | Gestionar instituciones | P | S |
| RF-ADM-06 | Editar ajustes no sensibles del sistema sin exponer secretos, con registro del cambio | P | C |
| RF-ADM-07 | Tablero del administrador con volumen de datos, actividad reciente y estado del sistema | P | C |
| RF-ADM-08 | Asignar a un usuario más de un rol (por ejemplo administrador y médico) y cambiar de rol activo dentro de la sesión, con registro de cada cambio | D (CA-11, CA-12) | S |

### Auditoría (RF-AUD)

| ID | Requisito | Origen | Prio |
| --- | --- | --- | --- |
| RF-AUD-01 | Registrar inicio y cierre de sesión e intentos fallidos, con usuario, hora y origen | A (CA-12) | M |
| RF-AUD-02 | Registrar la consulta de pacientes, fichas, documentos e imágenes | A (CA-12) | M |
| RF-AUD-03 | Registrar cada carga de documentos e imágenes | A (CA-12) | M |
| RF-AUD-04 | Registrar cada ejecución de inferencia con modelo, versión y resultado | A (CA-12) | M |
| RF-AUD-05 | Registrar cada exportación de reportes, datos y datasets | A (CA-12) | M |
| RF-AUD-06 | Registrar cambios de usuarios, roles, permisos y ajustes del sistema | D (CA-11, CA-12) | M |
| RF-AUD-07 | Registrar los accesos denegados | D (CA-12) | M |
| RF-AUD-08 | La bitácora no se puede editar ni borrar desde la aplicación | D (CA-12) | M |
| RF-AUD-09 | La bitácora guarda referencias al paciente, no datos clínicos ni identificadores directos | D (CA-13) | M |
| RF-AUD-10 | El administrador filtra la bitácora por usuario, acción, fecha y recurso, y la exporta; esa exportación también queda registrada | D (CA-12) | S |
| RF-AUD-11 | Integridad verificable de la bitácora con encadenamiento de huellas | P | C |

### Pacientes y casos (RF-PAC)

| ID | Requisito | Origen | Prio |
| --- | --- | --- | --- |
| RF-PAC-01 | Registrar un paciente con identificador interno y solo los datos mínimos necesarios | A (CA-03) | M |
| RF-PAC-02 | Los datos que identifican al paciente se guardan separados de los clínicos y cifrados | D (CA-13) | M |
| RF-PAC-03 | Consultar pacientes con búsqueda y filtros, limitados a lo que el rol permite | A (CA-03) | M |
| RF-PAC-04 | Actualizar los datos del paciente conservando el historial de cambios | A (CA-03) | M |
| RF-PAC-05 | Crear casos por paciente; un caso agrupa ficha, documentos, imágenes e inferencias | D (CA-03) | M |
| RF-PAC-06 | Registrar y retirar el consentimiento del paciente para inferencia e investigación | D (CA-13) | M |
| RF-PAC-07 | Sin consentimiento vigente no se ejecuta inferencia ni se incluye al paciente en datasets de investigación | D (CA-13) | M |
| RF-PAC-08 | Archivar un paciente sin perder su historial; la eliminación exige permiso y queda registrada | D (CA-12) | S |
| RF-PAC-09 | Avisar de posibles pacientes duplicados al registrar | P | S |
| RF-PAC-10 | Definir qué pacientes ve cada médico (por institución o por asignación) | P | S |

### Ficha clínica (RF-CLI)

| ID | Requisito | Origen | Prio |
| --- | --- | --- | --- |
| RF-CLI-01 | Registrar la ficha clínica del caso: antecedentes, síntomas y exploración | A (CA-03) | M |
| RF-CLI-02 | Registrar laboratorio relevante (TSH, T3, T4) con unidad y fecha | D (CA-03) | M |
| RF-CLI-03 | Registrar hallazgos de ecografía (TI-RADS, tamaño del nódulo, lateralidad) y citología (Bethesda) | D (CA-03) | M |
| RF-CLI-04 | Validar rangos y formatos de cada campo con mensajes claros | D (CA-03) | M |
| RF-CLI-05 | Versionar la ficha: cada cambio guarda quién, cuándo y qué cambió | D (CA-12) | M |
| RF-CLI-06 | Los campos extraídos por OCR entran a la ficha solo después de que el médico los confirma | D (CA-04) | M |
| RF-CLI-07 | Ver la cronología del caso con fichas, documentos e inferencias | P | S |
| RF-CLI-08 | Cerrar una ficha para bloquear ediciones | P | C |
| RF-CLI-09 | La ficha se organiza en secciones: consulta, laboratorio, ecografía, PAAF y Bethesda, antecedentes y diagnóstico con CIE-10 | D (CA-03) | M |
| RF-CLI-10 | Los datos de la ficha no entran al modelo de IA; el modelo recibe solo la imagen | D (CA-08, CA-09) | M |
| RF-CLI-11 | El resultado histopatológico o la categoría Bethesda de la ficha sirve de referencia para auditar la predicción | D (CA-10) | M |

**Datos que acompañan la imagen.** El modelo de IA solo recibe la imagen. Los datos de la ficha sirven para el contexto del médico, el reporte y la auditoría de la predicción, y son lo que el OCR debe leer de las fichas en PDF. Esta es la lista de campos, tomada del modelo de datos de la referencia:

| Sección | Campos | Los lee el OCR | Prio |
| --- | --- | --- | --- |
| Consulta | tipo (consulta, control, urgencia, teleconsulta), fecha, notas clínicas | No | M |
| Laboratorio | TSH, T3, T4, laboratorio, fecha | TSH, T3 y T4 (M); laboratorio y fecha (S) | M |
| Ecografía | tamaño del nódulo en mm, lateralidad, TI-RADS, hallazgos | Tamaño, lateralidad y TI-RADS (M); hallazgos (C) | M |
| PAAF y citología | PAAF realizada, fecha, categoría Bethesda, resultado histopatológico | Bethesda (M); histopatología (S) | M |
| Antecedentes | antecedentes familiares de cáncer, exposición a radiación, plan de seguimiento | Antecedentes (C) | S |
| Diagnóstico | código CIE-10, descripción, tipo (presuntivo, confirmado, descartado) | CIE-10 (S) | M |

### Documentos y OCR (RF-DOC)

| ID | Requisito | Origen | Prio |
| --- | --- | --- | --- |
| RF-DOC-01 | Cargar fichas en PDF o imagen y asociarlas a un paciente y a un caso | A (CA-03) | M |
| RF-DOC-02 | Validar tipo, tamaño y contenido del archivo antes de aceptarlo; el rechazo explica el motivo | D (CA-13) | M |
| RF-DOC-03 | Guardar el archivo en almacenamiento compatible con S3 y en la base solo metadatos y ubicación | A (CA-02) | M |
| RF-DOC-04 | Calcular la huella del archivo para detectar duplicados y comprobar integridad | D (CA-02) | S |
| RF-DOC-05 | Extraer texto y campos con OCR local, sin enviar nada a servicios externos | A (CA-04) | M |
| RF-DOC-06 | El OCR corre en segundo plano y el usuario ve su estado: en cola, procesando, listo o con error | D (CA-04) | M |
| RF-DOC-07 | Mostrar los campos extraídos con su confianza junto al documento original para corregirlos | D (CA-04) | M |
| RF-DOC-08 | Conservar el texto crudo del OCR y el valor corregido por el médico | D (CA-04) | S |
| RF-DOC-09 | Visualizar y descargar documentos con permiso del rol y registro del acceso | A (CA-12) | M |
| RF-DOC-10 | Medir la calidad del OCR (campos correctos sobre campos esperados) con fichas de muestra | D (CA-04, CA-18) | S |
| RF-DOC-11 | Reintentar un OCR fallido sin volver a cargar el archivo | P | S |
| RF-DOC-12 | Avisar cuando el escaneo tiene baja calidad antes de procesarlo | P | C |

### Imágenes ecográficas (RF-IMG)

| ID | Requisito | Origen | Prio |
| --- | --- | --- | --- |
| RF-IMG-01 | Cargar imágenes ecográficas en los formatos que acepta el modelo | A (CA-03, CA-05) | M |
| RF-IMG-02 | Validar formato, dimensiones y legibilidad; rechazar con motivo | A (CA-06) | M |
| RF-IMG-03 | Quitar metadatos con datos personales (EXIF, DICOM) antes de guardar o enviar al modelo | D (CA-13) | M |
| RF-IMG-04 | Preprocesar la imagen para el modelo sin alterar el original | A (CA-06) | M |
| RF-IMG-05 | Asociar varias imágenes a un caso y elegir cuál se usa en la inferencia | A (CA-05) | S |
| RF-IMG-06 | Visor con zoom y ajuste de brillo y contraste | D (CA-03) | S |
| RF-IMG-07 | Marcar regiones de interés sobre la imagen | P | C |

### Inferencia (RF-INF)

| ID | Requisito | Origen | Prio |
| --- | --- | --- | --- |
| RF-INF-01 | El médico elige paciente, caso e imagen y ejecuta la inferencia | A (CA-05) | M |
| RF-INF-02 | La API valida, preprocesa, llama al modelo OPTIMUS-THY y devuelve el resultado | A (CA-06) | M |
| RF-INF-03 | El resultado muestra, por cada nódulo detectado, la clase benigno o maligno con su probabilidad; si el detector no encuentra nódulos, muestra «normal (sin nódulo detectado)» | A (CA-07) | M |
| RF-INF-04 | Todo resultado lleva un aviso visible: es apoyo, no diagnóstico definitivo; en pantalla, reporte y exportaciones | A (CA-08) | M |
| RF-INF-05 | Guardar cada resultado con versión del modelo, parámetros, fecha, usuario e imagen de entrada | D (CA-09, CA-12) | M |
| RF-INF-06 | Ejecución con estado visible, tiempo máximo y manejo de errores | D (CA-06) | M |
| RF-INF-07 | Si el modelo no responde, el sistema lo dice y no inventa un resultado | D (CA-09) | M |
| RF-INF-08 | Consultar el historial de inferencias de un caso | A (CA-05) | M |
| RF-INF-09 | El médico registra su propia conclusión, separada de la predicción, para poder auditarla después | D (CA-08, CA-10) | S |
| RF-INF-10 | El modelo vive detrás de una interfaz fija y su versión queda registrada | D (CA-09) | S |
| RF-INF-11 | Mostrar una explicación visual con Grad-CAM; el modelo actual no la entrega | P | C |
| RF-INF-12 | Mostrar por nódulo la imagen original, la caja del detector, la máscara final, la región analizada y la superposición con la predicción | A (CA-05) | M |
| RF-INF-13 | Una imagen puede tener hasta 3 nódulos; cada uno recibe su caja, su máscara y su clasificación | D (CA-05) | M |
| RF-INF-14 | Si el detector no encuentra nódulo, el sistema no clasifica la imagen completa como si fuera un nódulo y lo informa | D (CA-07, CA-08) | M |

### Reportes (RF-REP)

| ID | Requisito | Origen | Prio |
| --- | --- | --- | --- |
| RF-REP-01 | Generar un reporte PDF por inferencia con datos mínimos del paciente, imagen, resultado, confianza, versión del modelo, fecha y usuario | A (CA-14) | M |
| RF-REP-02 | El reporte incluye el aviso de apoyo, no de diagnóstico | A (CA-08) | M |
| RF-REP-03 | Consultar resultados guardados con filtros por paciente, fecha y clase | A (CA-14) | M |
| RF-REP-04 | Descargar el reporte con permiso del rol y registro de la descarga | A (CA-12) | M |
| RF-REP-05 | Reporte consolidado de un caso | P | C |
| RF-REP-06 | Identificador único verificable en cada reporte | P | C |

### Investigación y evaluación (RF-INV)

| ID | Requisito | Origen | Prio |
| --- | --- | --- | --- |
| RF-INV-01 | El investigador consulta datasets desidentificados construidos a partir de casos con consentimiento | A (CA-10) | M |
| RF-INV-02 | Desidentificar antes de ofrecer datos: quitar identificadores directos y generalizar fechas y edades | D (CA-13) | M |
| RF-INV-03 | El investigador nunca ve datos que identifiquen al paciente | D (CA-13) | M |
| RF-INV-04 | Calcular métricas del modelo: sensibilidad, especificidad, precisión, F1, AUC y matriz de confusión | A (CA-10) | M |
| RF-INV-05 | Comparar resultados entre versiones del modelo o entre conjuntos de datos | A (CA-10) | M |
| RF-INV-06 | Auditar predicciones individuales: predicción, referencia clínica y diferencia | A (CA-10) | M |
| RF-INV-07 | Análisis de errores: falsos positivos y negativos con filtros y listado | A (CA-10) | M |
| RF-INV-08 | Exportar datos y métricas desidentificados con permiso y registro | A (CA-10, CA-12) | M |
| RF-INV-09 | Definir cohortes con filtros por fecha, clase, TI-RADS y otros campos | D (CA-10) | S |
| RF-INV-10 | Gráficos de evaluación: curva ROC y distribución de probabilidades | P | S |
| RF-INV-11 | Guardar parámetros y versión de datos de cada análisis para repetirlo | P | C |
| RF-INV-12 | Importar datasets externos desidentificados para evaluar el modelo | P | C |

### Portal público (RF-PUB)

No está en ningún módulo aprobado. Queda fuera hasta que decidas (ver la última sección).

| ID | Requisito | Origen | Prio |
| --- | --- | --- | --- |
| RF-PUB-01 | Página pública con la descripción del proyecto | P | W |
| RF-PUB-02 | Gestionar el contenido público desde un panel | P | W |

## Diseño y sistema de diseño

El anteproyecto no habla de diseño visual, pero lo pediste de forma explícita: hacerlo bien y con un sistema de diseño propio. Estos requisitos son de origen U. También sostienen la medición de usabilidad (CA-17), porque un sistema mal diseñado no sale bien en el UnUQ.

| ID | Requisito | Origen | Prio |
| --- | --- | --- | --- |
| RDS-01 | Principios de diseño y dirección visual escritos: clínico, sobrio, legible y con jerarquía clara | U | M |
| RDS-02 | Tokens de diseño: color con roles semánticos (éxito, alerta, error, información), tipografía, espaciado, radios, sombras y movimiento | U | M |
| RDS-03 | Colores propios para las clases normal, benigno y maligno que no se confundan con éxito o error y no dependan solo del color | U | M |
| RDS-04 | Tema claro y tema oscuro construidos sobre los mismos tokens | U | S |
| RDS-05 | Biblioteca de componentes base: botón, campo, selector, tabla, tarjeta, modal, aviso, pestañas, navegación, paginación | U | M |
| RDS-06 | Patrones clínicos: tarjeta de paciente, ficha, resultado de IA con confianza, aviso de apoyo, visor de imagen, campo OCR con confianza y línea de tiempo | U | M |
| RDS-07 | Estados de carga, vacío y error definidos y usados en cada pantalla | U | M |
| RDS-08 | Cada componente documentado con sus estados (normal, foco, deshabilitado, error, carga) en un catálogo navegable | U | S |
| RDS-09 | Accesibilidad WCAG 2.2 AA: contraste, foco visible, uso completo con teclado, etiquetas y lectores de pantalla | U | M |
| RDS-10 | Diseño adaptable: escritorio y tableta cómodos, móvil al menos para consultar | U | S |
| RDS-11 | Contenido en español claro, con glosario de términos clínicos y mensajes de error que dicen qué hacer | U | M |
| RDS-12 | Pantallas clave diseñadas antes de implementarlas: flujos del médico, del investigador y del administrador | U | S |
| RDS-13 | Ninguna pantalla usa colores ni espaciados sueltos; solo tokens, verificado automáticamente | U | S |
| RDS-14 | Identidad visual propia de OPTIMUS-THY: nombre, logo y paleta | U | C |
| RDS-15 | Pruebas visuales de regresión de los componentes | P | C |

## Seguridad, privacidad y cumplimiento legal

Este grupo amplía los RNF-SEG y RNF-PRI. El sistema trata datos de salud, que la ley ecuatoriana pone entre las categorías especiales, así que la seguridad es parte del diseño y no un añadido. Una aclaración importante: no soy abogado, y esto es un mapa de trabajo, no asesoría legal. Valídalo con tu director o con un asesor jurídico de la ESPOCH.

### Marco legal que aplica

| Norma | Qué exige en lo que toca a este sistema | Dónde se cubre |
| --- | --- | --- |
| Ley Orgánica de Protección de Datos Personales (LOPDP), art. 10 | Principios: licitud, lealtad, transparencia, finalidad, minimización, proporcionalidad, confidencialidad, exactitud, conservación limitada, seguridad y responsabilidad proactiva | Todos los grupos RS |
| LOPDP, arts. 7 y 8 | El consentimiento debe ser libre, específico, informado e inequívoco, y se puede revocar en cualquier momento sin efectos retroactivos | RS-LEG, RS-DER |
| LOPDP, arts. 4, 25 y 26 | Los datos de salud son sensibles. Su tratamiento está prohibido salvo excepciones como el consentimiento explícito o la investigación científica | RS-LEG-03 |
| LOPDP, arts. 30 a 32 | Según el texto consultado: anonimizar o seudonimizar los datos de salud cuando sea posible, y usarlos para investigación científica solo si están anonimizados o con autorización de la Autoridad | RS-ANO |
| LOPDP, arts. 12 a 20 | Derechos de información, acceso, rectificación, eliminación, oposición, portabilidad, suspensión y explicación de decisiones automatizadas. Acceso, rectificación, eliminación y oposición se responden en 15 días | RS-DER |
| LOPDP, arts. 37 a 41 | Medidas de seguridad proporcionales al riesgo, con cifrado y seudonimización; protección desde el diseño y por defecto; análisis de riesgos | RS-ACC, RS-CIF, RS-APP |
| LOPDP, arts. 42 y 48 a 50 | Evaluación de impacto previa si hay decisiones automatizadas o tratamiento a gran escala de categorías especiales; delegado de protección de datos en ese mismo caso | RS-LEG-05, RS-LEG-06 |
| LOPDP, arts. 43 y 46 | Vulneraciones: el encargado avisa al responsable en 2 días, el responsable a la autoridad en 5 días y a los titulares en 3 días si hay riesgo para sus derechos | RS-INC |
| Reglamento General de la LOPDP (Decreto Ejecutivo 904, 6 de noviembre de 2023) | Desarrolla delegado, responsables conjuntos, transferencias internacionales y procedimiento de reclamos | RS-LEG |
| Norma técnica de notificación de vulneraciones (Resolución SPDP-SPD-2026-0040-R, 9 de septiembre de 2026) | Reporte en el Sistema Nacional de Registro de Datos Personales; omitirlo es infracción grave | RS-INC-04 |
| Acuerdo Ministerial 4889 (CEISH) | La investigación con seres humanos o muestras biológicas la aprueba un comité de ética; el consentimiento es escrito, con fecha y firma, y se protege la confidencialidad | RS-LEG-09 |
| Normas sanitarias sobre la historia clínica | Confidencialidad de la historia clínica y derechos del paciente. No verifiqué los artículos exactos; pide a tu director o a SOLCA que te los señalen | RS-LEG-12 |

### Cumplimiento y gobierno (RS-LEG)

| ID | Requisito | Origen | Prio |
| --- | --- | --- | --- |
| RS-LEG-01 | Mapa de cumplimiento: cada obligación de la tabla anterior enlazada con el requisito que la cubre y su evidencia | D (CA-13) | M |
| RS-LEG-02 | Registro de tratamientos: qué datos, para qué finalidad, con qué base de licitud, quién accede y cuánto se conservan | D (CA-13) | M |
| RS-LEG-03 | Base de licitud documentada: consentimiento explícito del paciente para el tratamiento de sus datos de salud | D (CA-13) | M |
| RS-LEG-04 | Texto de consentimiento claro, con finalidades separadas (atención e inferencia por un lado, investigación por otro), revocable y con fecha y versión | D (CA-13) | M |
| RS-LEG-05 | Evaluación de impacto en protección de datos escrita antes de tratar datos reales | D (CA-13) | S |
| RS-LEG-06 | Responsable de protección de datos del proyecto designado, con su contacto visible | P | S |
| RS-LEG-07 | Aviso de privacidad visible para pacientes y usuarios: quién trata los datos, para qué, por cuánto tiempo y cómo ejercer sus derechos | D (CA-13) | S |
| RS-LEG-08 | Acuerdo de confidencialidad firmado por cada usuario con acceso a datos | D (CA-13) | S |
| RS-LEG-09 | Antes de usar datos reales de pacientes: aprobación de un comité de ética (CEISH) y convenio con la institución de salud | D (CA-13) | M |
| RS-LEG-10 | Ningún dato sale de la infraestructura propia: sin servicios externos de OCR, IA, analítica ni almacenamiento | A (CA-04, CA-13) | M |
| RS-LEG-11 | La tesis declara que el sistema opera con datos sintéticos y qué falta para un uso real | D (CA-13) | S |
| RS-LEG-12 | Confirmar con tu director o con SOLCA qué normas sanitarias sobre historia clínica aplican y añadirlas al mapa de cumplimiento | P | S |

### Derechos de los titulares (RS-DER)

| ID | Requisito | Origen | Prio |
| --- | --- | --- | --- |
| RS-DER-01 | Acceso: obtener una copia de los datos de un paciente y de las inferencias hechas con sus imágenes, dentro de 15 días | D (CA-13) | S |
| RS-DER-02 | Rectificación: corregir datos inexactos conservando el historial del cambio | D (CA-13) | M |
| RS-DER-03 | Eliminación: borrar o anonimizar los datos de un paciente a solicitud, salvo la historia clínica que deba conservarse por ley, dejando constancia | D (CA-13) | S |
| RS-DER-04 | Oposición y retiro del consentimiento con efecto desde ese momento y exclusión de los datasets de investigación futuros | D (CA-13) | M |
| RS-DER-05 | Portabilidad: exportar los datos de un paciente en formato estructurado y de lectura mecánica | D (CA-13) | C |
| RS-DER-06 | Decisiones automatizadas: explicar cómo se obtuvo la predicción y dejar claro que la decisión es del médico | D (CA-08) | M |
| RS-DER-07 | Registro de cada solicitud de derechos con su fecha, responsable y plazo de respuesta | D (CA-12) | S |

### Anonimización y seudonimización (RS-ANO)

| ID | Requisito | Origen | Prio |
| --- | --- | --- | --- |
| RS-ANO-01 | Seudonimización por defecto: toda la aplicación usa el código interno del paciente y los identificadores directos viven en una tabla aparte | D (CA-13) | M |
| RS-ANO-02 | La clave que relaciona el código con la persona se guarda separada y solo la ve un rol autorizado | D (CA-13) | M |
| RS-ANO-03 | Datasets de investigación sin nombre, cédula, contacto, dirección ni número de historia; fechas desplazadas o reducidas a mes y año; edades en rangos | D (CA-10, CA-13) | M |
| RS-ANO-04 | Imágenes: quitar metadatos (EXIF, DICOM) y detectar con OCR texto incrustado en la imagen, como nombres o fechas, para taparlo antes de guardarla o compartirla | D (CA-13) | M |
| RS-ANO-05 | Documentos para investigación con los datos personales tapados antes de usarse | D (CA-13) | S |
| RS-ANO-06 | Medir el riesgo de reidentificación del dataset: ninguna combinación de edad, sexo, institución y fecha identifica a menos de 5 personas (k-anonimato con k = 5) | P | S |
| RS-ANO-07 | Nombres de archivo y rutas sin datos personales | D (CA-13) | M |
| RS-ANO-08 | Los reportes y exportaciones para investigación no contienen identificadores | D (CA-13) | M |
| RS-ANO-09 | Cada dataset exportado trae una ficha técnica de qué se anonimizó y cómo, y la exportación queda en la bitácora | D (CA-12) | S |

### Autenticación y control de acceso (RS-ACC)

| ID | Requisito | Origen | Prio |
| --- | --- | --- | --- |
| RS-ACC-01 | Contraseñas de al menos 12 caracteres, comprobadas contra listas de contraseñas filtradas | P | S |
| RS-ACC-02 | Segundo factor de autenticación (código de un solo uso) obligatorio para administradores y opcional para el resto | P | S |
| RS-ACC-03 | Mínimo privilegio: cada rol tiene solo los permisos necesarios y se revisan antes de la entrega | D (CA-11) | M |
| RS-ACC-04 | Control de acceso por objeto: un usuario no puede leer casos ni pacientes que no le corresponden, aunque cambie un identificador en la URL | D (CA-11) | M |
| RS-ACC-05 | Separación de funciones: el rol de administrador solo no ve datos clínicos | D (CA-11) | M |
| RS-ACC-06 | Sesión con identificador nuevo en cada inicio, expiración por inactividad y cierre remoto de todas las sesiones | D (CA-11) | S |
| RS-ACC-07 | Cuentas de servicio (IA, OCR, almacenamiento) con credenciales propias y permisos mínimos | D (CA-06) | M |
| RS-ACC-08 | Baja inmediata de un usuario que deja de necesitar acceso | D (CA-11) | S |
| RS-ACC-09 | Acceso excepcional a un paciente fuera de los asignados, con justificación escrita y registro | P | C |

### Cifrado, archivos y respaldos (RS-CIF)

| ID | Requisito | Origen | Prio |
| --- | --- | --- | --- |
| RS-CIF-01 | TLS 1.2 o superior en todo el tráfico, incluido el que va entre servicios, o red interna aislada | D (CA-13) | M |
| RS-CIF-02 | Cifrado en reposo de la base de datos, del almacenamiento de archivos y de los respaldos | D (CA-13) | M |
| RS-CIF-03 | Claves fuera del repositorio, separadas por función y rotables | D (CA-13) | M |
| RS-CIF-04 | Descarga de archivos con enlaces firmados de corta duración; el almacenamiento nunca es público | D (CA-02) | M |
| RS-CIF-05 | Respaldos cifrados, con una copia fuera del equipo principal y restauración probada | A (CA-20) | M |
| RS-CIF-06 | Archivos cargados revisados: tipo real, tamaño, rechazo de ejecutables y PDF con scripts | D (CA-13) | M |
| RS-CIF-07 | Borrado seguro de archivos eliminados o vencidos | D (CA-13) | S |

### Seguridad de la aplicación (RS-APP)

| ID | Requisito | Origen | Prio |
| --- | --- | --- | --- |
| RS-APP-01 | Lista de verificación OWASP ASVS nivel 2 y revisión del OWASP Top 10 antes de la entrega | P | S |
| RS-APP-02 | Defensa contra inyección SQL, XSS, CSRF, SSRF y recorrido de rutas | D (CA-13) | M |
| RS-APP-03 | Cabeceras de seguridad (CSP, HSTS, X-Content-Type-Options, frame-ancestors) y CORS restrictivo | D (CA-13) | M |
| RS-APP-04 | Errores sin detalles internos para el usuario; el detalle va solo a los logs | D (CA-13) | M |
| RS-APP-05 | Validación de toda entrada en el servidor | D (CA-06) | M |
| RS-APP-06 | Dependencias con versiones fijas, escaneo de vulnerabilidades y lista de componentes | P | S |
| RS-APP-07 | Análisis estático de código y escaneo de secretos en la integración continua | D (CA-21) | S |
| RS-APP-08 | Pruebas de seguridad con una herramienta como OWASP ZAP, con informe | P | S |
| RS-APP-09 | Carga segura de los pesos del modelo, solo desde una ubicación de confianza | D (CA-09) | S |
| RS-APP-10 | Límite de peticiones y de tamaño, en especial en la inferencia, que es costosa | D (CA-06) | S |

### Monitoreo e incidentes (RS-INC)

| ID | Requisito | Origen | Prio |
| --- | --- | --- | --- |
| RS-INC-01 | Bitácora de seguridad con inicios fallidos, cambios de permisos y accesos denegados, sin editarse (ver RF-AUD) | D (CA-12) | M |
| RS-INC-02 | Alertas ante patrones raros: muchos fallos de acceso, descargas masivas o exportaciones fuera de horario | P | S |
| RS-INC-03 | Plan de respuesta a incidentes escrito: detectar, contener, evaluar, notificar y corregir | D (CA-13) | M |
| RS-INC-04 | Plantilla de notificación con los plazos legales: 2 días al responsable, 5 días a la autoridad y 3 días a los titulares si hay riesgo | D (CA-13) | S |
| RS-INC-05 | Registro de incidentes y lecciones aprendidas | D (CA-13) | C |
| RS-INC-06 | Simulacro de un incidente con evidencia | P | C |

### Retención y ciclo de vida de los datos (RS-RET)

| ID | Requisito | Origen | Prio |
| --- | --- | --- | --- |
| RS-RET-01 | Plazo de conservación definido por tipo de dato: historia clínica, imágenes, bitácora y respaldos | D (CA-13) | S |
| RS-RET-02 | Borrado o anonimización al vencer el plazo | D (CA-13) | S |
| RS-RET-03 | Datos de desarrollo y pruebas separados de los de uso real; nunca se copian datos reales a desarrollo | D (CA-13) | M |

### IA responsable (RS-IA)

| ID | Requisito | Origen | Prio |
| --- | --- | --- | --- |
| RS-IA-01 | Validar que la imagen es una ecografía de tiroides antes de inferir y avisar si parece otra cosa | D (CA-06, CA-08) | S |
| RS-IA-02 | Documentar límites del modelo: datos con los que se entrenó, población y usos no recomendados | D (CA-08) | S |
| RS-IA-03 | Las inferencias y los datos del sistema no se usan para reentrenar el modelo | A (CA-09) | M |
| RS-IA-04 | Verificar al iniciar la huella de los pesos y registrar cualquier cambio | D (CA-09) | S |

### Infraestructura (RS-INF)

| ID | Requisito | Origen | Prio |
| --- | --- | --- | --- |
| RS-INF-01 | Solo el proxy inverso queda expuesto; base de datos, almacenamiento, IA y OCR sin puertos públicos | D (CA-19) | M |
| RS-INF-02 | Contenedores sin permisos de administrador, imágenes mínimas y sin secretos dentro | D (CA-19) | S |
| RS-INF-03 | Servidor actualizado, con cortafuegos y solo los servicios necesarios | D (CA-19) | S |
| RS-INF-04 | Hora sincronizada en todos los servicios para que la bitácora sea confiable | D (CA-12) | C |

## Requisitos no funcionales

Las cifras de rendimiento son propuestas mías (origen P); el anteproyecto no fija ninguna. Hay que confirmarlas con el modelo y el OCR reales.

| ID | Requisito | Origen | Prio |
| --- | --- | --- | --- |
| RNF-SEG-01 | Contraseñas guardadas con un hash robusto (Argon2 o bcrypt), nunca en claro | D (CA-11) | M |
| RNF-SEG-02 | Tráfico cifrado con TLS entre navegador y servidor, también en la demostración local | D (CA-13) | M |
| RNF-SEG-03 | Cookies de sesión HttpOnly y SameSite, con protección contra CSRF | D (CA-11) | M |
| RNF-SEG-04 | La autorización se comprueba en el servidor en cada endpoint, nunca solo en la interfaz | D (CA-11) | M |
| RNF-SEG-05 | Datos que identifican al paciente cifrados en reposo, con la clave fuera del repositorio | D (CA-13) | M |
| RNF-SEG-06 | Secretos fuera del repositorio, con escaneo de secretos en la integración continua | D (CA-13) | M |
| RNF-SEG-07 | Validación estricta de entradas y límite de peticiones en la API | D (CA-06) | S |
| RNF-SEG-08 | Escaneo de vulnerabilidades en las dependencias | P | S |
| RNF-PRI-01 | Datos simulados o anonimizados en desarrollo, pruebas y demostraciones; ningún dato real en el repositorio | A (CA-13) | M |
| RNF-PRI-02 | Minimización: cada función pide solo los datos que necesita | D (CA-13) | M |
| RNF-PRI-03 | Mapa de cumplimiento de los principios de la LOPDP: finalidad, consentimiento, minimización y seguridad | D (CA-13) | S |
| RNF-PRI-04 | Los logs de la aplicación no contienen datos personales ni clínicos | D (CA-13) | M |
| RNF-PRI-05 | Plazos de retención y borrado definidos | P | C |
| RNF-REN-01 | Las pantallas de consulta responden en menos de 2 segundos en el entorno local con el volumen de prueba | P | S |
| RNF-REN-02 | Una inferencia entrega resultado en un tiempo máximo que se fija tras medirlo en la laptop sin GPU de la demostración (meta inicial: 60 segundos) | P | S |
| RNF-REN-03 | El OCR de una ficha de una página termina en menos de 60 segundos | P | S |
| RNF-REN-04 | Se aceptan archivos de hasta 20 MB | P | S |
| RNF-USA-01 | Los flujos principales se completan sin ayuda y se miden con el UnUQ de 22 ítems | A (CA-17) | M |
| RNF-USA-02 | Meta de puntuación del UnUQ fijada antes de la evaluación: 70 o más («Bueno» en la escala del artículo; la meta es propuesta mía) | D (CA-17) | S |
| RNF-USA-03 | Tareas de prueba definidas para médico, investigador y administrador | D (CA-17) | M |
| RNF-CAL-01 | Pruebas unitarias, de integración y de extremo a extremo en la integración continua; un cambio que las rompe no se fusiona | D (CA-18, CA-21) | M |
| RNF-CAL-02 | Migraciones de base de datos versionadas y reproducibles | D (CA-02) | M |
| RNF-CAL-03 | Un pull request por historia, con revisión y mensajes de commit claros | D (CA-21) | M |
| RNF-CAL-04 | Arquitectura y decisiones importantes documentadas (diagramas y ADR) | D (CA-01) | S |
| RNF-CAL-05 | Contrato OpenAPI versionado y verificado en la integración continua | P | S |
| RNF-CON-01 | Respaldos periódicos de base de datos y archivos, con restauración probada | A (CA-20) | M |
| RNF-CON-02 | Si el OCR o el modelo fallan, el sistema sigue funcionando, lo informa y permite reintentar | D (CA-19) | M |
| RNF-CON-03 | Logs estructurados y chequeos de salud de cada servicio | P | S |

## Datos, integración y despliegue

| ID | Requisito | Origen | Prio |
| --- | --- | --- | --- |
| RD-01 | Modelo de datos documentado con diagrama entidad-relación | D (CA-02) | M |
| RD-02 | PostgreSQL con integridad referencial y migraciones | A (CA-02) | M |
| RD-03 | Archivos en almacenamiento compatible con S3, con nombres opacos; la base guarda solo metadatos y ubicación | A (CA-02) | M |
| RD-04 | Generador reproducible de datos sintéticos con casos benignos, malignos y sin nódulo detectado, para desarrollo, pruebas y demostración | A (CA-13) | M |
| RD-05 | Conjunto de fichas de muestra con valores esperados para medir el OCR | D (CA-04) | S |
| RD-06 | Catálogo de campos clínicos y sus codificaciones (TI-RADS, Bethesda) | D (CA-03) | S |
| RD-07 | Borrado lógico y historial no destructivo donde corresponda | D (CA-12) | S |
| RD-08 | Versiones de modelo y de datasets registradas | D (CA-09) | S |
| RI-01 | Un solo comando levanta backend, frontend, base de datos, almacenamiento y OCR en el entorno local | A (CA-19) | M |
| RI-02 | Variables de entorno documentadas, con un ejemplo sin secretos | D (CA-19) | M |
| RI-03 | Respaldo y restauración documentados y probados | A (CA-20) | M |
| RI-04 | Integración con el modelo existente mediante un contrato versionado de entrada y salida | A (CA-06, CA-09) | M |
| RI-05 | Integración con el motor de OCR local mediante un contrato versionado | A (CA-04) | M |
| RI-06 | Pruebas de integración entre API y modelo, API y OCR, API y almacenamiento | A (CA-18) | M |
| RI-07 | Integración continua en GitHub: formato, tipos, pruebas y construcción | D (CA-21) | M |
| RI-08 | Imágenes de contenedor reproducibles | D (CA-19) | S |
| RI-09 | Despliegue fuera del entorno local, en servidor institucional o nube | P | C |
| RD-09 | Conjunto sintético emparejado: cada imagen de ejemplo recibe un paciente sintético con una ficha coherente con su diagnóstico de referencia | D (CA-13) | M |
| RD-10 | Cada ficha sintética en dos versiones: PDF digital con texto y PDF escaneado con ruido e inclinación, para probar el OCR | D (CA-04) | M |
| RD-11 | Al menos tres plantillas de ficha y variaciones al escribir los valores (coma o punto, con o sin unidad) | D (CA-04) | S |
| RD-12 | Confirmar y documentar que las imágenes del proyecto están anonimizadas y que se pueden usar en este sistema; ningún dato real de paciente en el repositorio | D (CA-13) | M |

## Proceso del trabajo de titulación

| ID | Requisito | Origen | Prio |
| --- | --- | --- | --- |
| RP-01 | Tablero Kanban con los estados pendiente, en proceso, revisión y finalizado; cada historia es una tarjeta | A (CA-15) | M |
| RP-02 | Cada tarjeta enlaza su requisito, su historia y su pull request | D (CA-15, CA-16) | S |
| RP-03 | Historias de usuario con criterios de aceptación verificables | A (CA-16) | M |
| RP-04 | Matriz de trazabilidad: compromiso, requisito, historia y prueba | D (CA-16, CA-18) | M |
| RP-05 | Matriz de pruebas funcionales y de integración con evidencias | A (CA-18) | M |
| RP-06 | Registro de errores encontrados y cómo se resolvieron | A (CA-18) | M |
| RP-07 | Aplicar el UnUQ a 10 participantes con tareas definidas y consentimiento informado | A (CA-17) | M |
| RP-08 | Calcular la puntuación del UnUQ de 0 a 100 (suma de ítems recodificados por 100/88, con 5 puntos Likert) y analizarla por sus 7 atributos | A (CA-17) | M |
| RP-09 | Hitos del cronograma: aprobar requerimientos, validar diseño, completar integración, entrega final y sustentación | A (Gantt) | M |
| RP-10 | Capturas y datos del sistema como evidencia para el capítulo de resultados | D (CA-18) | S |

## Restricciones, supuestos y fuera de alcance

**Restricciones aprobadas.**

- Stack: React, Python, PostgreSQL y almacenamiento compatible con S3.
- OCR local, sin servicios externos.
- El sistema consume el modelo existente; no lo entrena ni lo modifica.
- Datos simulados o anonimizados en desarrollo y pruebas.
- Entrega el 23 de diciembre de 2026, con trabajo del 13 de octubre al 23 de diciembre.

**Supuestos que debes confirmar.**

- Dispones de los tres archivos de pesos (best\_yolo.pt, best\_bgaunet.keras y best\_swin.pth) y de imágenes de ejemplo.
- Habrá fichas clínicas de muestra, simuladas o anonimizadas, para probar el OCR.
- Habrá 10 participantes para el UnUQ.
- El equipo de desarrollo tiene una máquina o servidor local capaz de correr el OCR y el modelo.

**Fuera de alcance.**

- Entrenar o reentrenar modelos.
- Emitir diagnósticos definitivos; el sistema solo apoya.
- Uso clínico real y datos de pacientes reales.
- Integración con historias clínicas de hospitales, HL7 o PACS.
- Aplicación móvil nativa.
- Portal público y CMS, salvo que decidas lo contrario.

## Inconsistencias y decisiones

Resolví estos puntos con tu fecha y con mis recomendaciones; cambia los que quieras. Los puntos 2 y 3 dependen de un dato que solo tú puedes conseguir.

| # | Asunto | Qué dice el anteproyecto | Decisión |
| --- | --- | --- | --- |
| 1 | Fecha de entrega | El Gantt termina en octubre de 2026 | Periodo real: del 13 de octubre al 23 de diciembre de 2026, dato tuyo. Desde hoy (20 de octubre) quedan 9 semanas. El Gantt del anteproyecto queda desactualizado; conviene avisar a tu director |
| 2 | Clases de salida del modelo | El texto dice normal, benigno o maligno (4.1.1) | Resuelto con el código: el clasificador es binario (benigno o maligno) y devuelve las dos probabilidades. Confirmado por ti: «normal» significa que el detector no encuentra ningún nódulo, sin clasificar la imagen completa. Falta el visto bueno de tu director |
| 3 | Disponibilidad del modelo real | Se consume el modelo existente | El modelo es el flujo de app.py y base.py (YOLO11, MGAC, BGAU-Net y Swin Transformer de dos ramas). Recibidos los tres archivos de pesos: best\_yolo.pt, best\_bgaunet.keras y best\_swin.pth |
| 4 | Participantes del UnUQ | El capítulo 5 nombra médicos, investigadores y administradores; el compromiso es 10 médicos e investigadores | Los administradores participan en el UnUQ (decisión tuya). Los 10 evaluadores incluyen médicos, investigadores y administradores, cada uno con tareas de su rol |
| 5 | Norma de usabilidad | UnUQ en 4.4.8 y objetivo 3; ISO/IEC 25023 solo en la actividad 22 del Gantt | UnUQ es el instrumento. El artículo integra ISO/IEC 25010, 25062 y 9241-11 y no menciona la 25023. Se usa la puntuación del artículo y se corrige la mención con tu director |
| 6 | Asistencia local | El Gantt (actividad 19) habla de integrar asistencia local; el texto no la define | Ningún objetivo ni módulo la pide, pero el Gantt (actividad 19) la nombra. Se incluye lo mínimo, como HU-120: un asistente local que guía al médico paso a paso en el uso de la plataforma, con el contenido de la guía de HT-025 y sin servicios externos (6 horas). Si tu director confirma que el anteproyecto no la exige, HU-120 sale del plan |
| 7 | Portal público y CMS | No está en ningún módulo aprobado | Fuera de alcance |
| 8 | Qué ve el administrador | Administra usuarios, roles y auditoría | Con solo el rol de administrador no accede a datos clínicos. Si necesita verlos, se le asigna además el rol de médico o investigador y actúa con ese rol; cada cambio de rol activo queda en la bitácora |
| 9 | Alcance de datasets de investigación | Datasets desidentificados | Solo los generados por el propio sistema con consentimiento; la importación externa (RF-INV-12) queda como C |
| 10 | Uso del repo de referencia | Ninguno | Solo como insumo de ideas y datos de referencia; todo el código se escribe de nuevo |
| 11 | Dónde se construye | Tu primer pedido fue hacer pull requests en el repo de referencia | Resuelto: repo nuevo llamado optimus; el de referencia queda solo para consulta |
| 12 | Motor de OCR | OCR local, GLM OCR u otra alternativa (4.4.7) | Tesseract con español y PyMuPDF para PDF con texto, más reglas de extracción por campo. Los modelos de OCR basados en visión suelen necesitar GPU para ser rápidos y tu laptop no tiene; el anteproyecto permite otra alternativa. Se mide la calidad con las fichas sintéticas |
| 13 | Origen de las imágenes | Datos simulados o anonimizados en desarrollo y pruebas (4.4.2) | Tienes imágenes de cáncer de tiroides y de otros casos, y confirmaste que están anonimizadas (sin datos). Solo falta dejar por escrito su origen y revisar una muestra por si traen texto grabado (HT-094). Los pacientes y las fichas se generan sintéticos y se emparejan con las imágenes (RD-09) |
| 14 | Equipo de la demostración | Entorno local (5.2.1) | Laptop sin GPU: la inferencia corre en CPU y se mide el tiempo desde la primera semana (RIA-08) |
| 15 | Cumplimiento legal con datos reales | Privacidad y confidencialidad desde el diseño (4.2.1, 4.4.2) | El sistema se construye cumpliendo la ley, pero se prueba con datos sintéticos. Usar datos reales exige antes el convenio con la institución, la aprobación de un CEISH y la evaluación de impacto; la tesis lo declara como límite |
