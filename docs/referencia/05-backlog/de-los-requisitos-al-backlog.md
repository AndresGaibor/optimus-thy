# OPTIMUS: de los requisitos al backlog

Oct 20, 2026 · @Andres Gaibor

## Cómo se llega al backlog

El backlog sale de una cadena de diez pasos. Los dos primeros ya están hechos en el [catálogo de requisitos](https://claude.ai/code/artifact/e74ff596-8a60-47b4-bc51-9ccfa1f1effa); los demás se construyen aquí, en este orden, para que cada historia tenga detrás un requisito y delante un criterio de aceptación.

| # | Paso | Qué produce | Dónde | Estado |
| --- | --- | --- | --- | --- |
| 1 | Requisitos | 21 compromisos aprobados y cerca de 400 requisitos con origen y prioridad | Catálogo | Hecho |
| 2 | Decisiones sobre inconsistencias | 15 decisiones; falta confirmar 4 con tu director | Catálogo | Hecho, con 4 por confirmar |
| 3 | Glosario y modelo del dominio | Las entidades del sistema y cómo se relacionan | Sección 2 | En este documento |
| 4 | Personas y recorridos | Qué hace cada rol, paso a paso | Sección 3 | En este documento |
| 5 | Mapa de historias | Los pasos de cada recorrido contra lo que entra en cada entrega | Sección 4 | En este documento |
| 6 | Decisiones de arquitectura | Qué se decide antes de escribir código | Sección 5 | En este documento |
| 7 | Reglas de trabajo | Definición de listo y de hecho, estimación, ramas y pull requests | Sección 6 | En este documento |
| 8 | Épicas e historias | Historias de usuario y técnicas con criterios | Secciones 7 y 8 | En este documento |
| 9 | Capacidad y plan | Qué se espera terminar en cada tramo y dónde está la línea de corte | Sección 9 | En este documento |
| 10 | Tablero Kanban y primeros PRs | Tarjetas en el repositorio `optimus` y el primer pull request | Repositorio | Siguiente |

Quedan dos puntos por confirmar con tu director: que «normal» equivale a «sin nódulo detectado» y la corrección de la mención a la ISO/IEC 25023. La asistencia local no se construye, porque el cronograma es referencial, y los administradores ya quedaron dentro de la muestra del UnUQ.

## Glosario y modelo del dominio

Antes de escribir historias hay que fijar las palabras. Si «caso» significa una cosa en una historia y otra en la siguiente, el código sale con dos tablas para lo mismo. Cada término de abajo es una entidad del sistema (una tabla en PostgreSQL) o un concepto que aparece en los criterios de aceptación.

### Entidades del núcleo clínico

| Término | Qué es | Reglas que importan |
| --- | --- | --- |
| Usuario | Persona con cuenta. Puede tener varios roles asignados | Solo el administrador asigna roles. Todo cambio queda en auditoría |
| Rol | Administrador, médico o investigador | El rol activo se elige al iniciar sesión y puede cambiarse; cada cambio se audita |
| Paciente | Persona atendida, identificada dentro del sistema por un seudónimo | Los datos de identidad se guardan cifrados y separados de los datos clínicos |
| Caso | Un episodio de estudio de un paciente: reune ficha, documentos, imágenes e inferencias | Es la unidad de trabajo del médico. Un paciente puede tener varios casos |
| Ficha clínica | Campos estructurados del caso: TSH, T3, T4, tamaño del nódulo, lateralidad, TI-RADS, Bethesda, fecha de laboratorio, histopatología, CIE-10 | Cada campo guarda su origen: digitado por el médico o extraído por OCR y confirmado |
| Documento | Archivo cargado al caso (informe de laboratorio, informe de ecografía, PDF escaneado) | Se guarda en el almacenamiento S3 local con hash y versión. Nunca se sobrescribe |
| Extracción OCR | Un valor propuesto por el OCR para un campo de la ficha, con su confianza | Nada pasa a la ficha sin que un médico lo confirme o corrija |
| Imagen | Ecografía cargada al caso (JPG, PNG o DICOM convertido) | Se normaliza, se le quita todo metadato y se comprueba que no tenga texto grabado con datos personales |
| Inferencia | Una ejecución del pipeline de IA sobre una imagen | Guarda versión de cada modelo, hash de los pesos, parámetros y tiempos por etapa. Es inmutable |
| Nódulo detectado | Cada región que YOLO propone (hasta 3 por imagen) con su caja, confianza, máscara y clasificación | Si YOLO no detecta ninguno, el resultado es «sin nódulo detectado» (el supuesto de «normal») |
| Resultado | Lectura de la inferencia: benigno o maligno con probabilidades, o sin nódulo | Es un apoyo a la decisión. La interfaz siempre lo presenta como tal |
| Informe | PDF generado del caso con logos ESPOCH y SOLCA, ficha, imagen anotada y resultado | Se versiona y lleva la marca de que lo emitió un sistema de apoyo |
| Decisión médica | Lo que el médico concluye tras ver el resultado: acepta, corrige o descarta | Se guarda aparte de la inferencia. Alimenta la evaluación del modelo |

### Entidades de investigación

| Término | Qué es | Reglas que importan |
| --- | --- | --- |
| Dataset | Conjunto de imágenes y datos anonimizados que un investigador arma a partir de casos | Solo contiene datos que ya pasaron por la anonimización. Es una versión fija y reproducible |
| Modelo registrado | Versión de un modelo (YOLO, BGAU-Net o Swin) con sus pesos, hash y métricas de entrenamiento | Solo un modelo marcado como activo se usa en producción. El cambio de modelo activo se audita |
| Experimento | Evaluación de un modelo registrado contra un dataset | Registra métricas (exactitud, sensibilidad, especificidad, AUC, Dice) y es repetible |
| Publicación | Resultado agregado y anonimizado que el investigador exporta | Pasa por una revisión antes de salir. No contiene datos de pacientes individuales |
| Respuesta UnUQ | Cuestionario de 22 ítems contestado por un médico o investigador | Se calcula el puntaje (suma recodificada por 100 sobre 88). Meta de 70 o más |

### Entidades de seguridad y cumplimiento

| Término | Qué es | Reglas que importan |
| --- | --- | --- |
| Evento de auditoría | Registro de quién hizo qué, sobre qué y cuándo | Solo se agrega. Nadie, ni el administrador, puede editarlo o borrarlo |
| Consentimiento y base legal | Registro de la base que permite tratar los datos de un paciente (consentimiento, atención de salud, investigación con anonimización) | Se exige antes de usar un caso para investigación |
| Solicitud de derechos | Pedido de acceso, rectificación, eliminación u oposición de un titular | La LOPDP da 15 días para responder. El sistema lleva el plazo |
| Incidente | Brecha o sospecha de brecha de seguridad | La LOPDP exige avisar en plazos cortos. El sistema lleva el registro y el reloj |
| Retención | Plazo por tipo de dato tras el cual se anonimiza o elimina | Lo ejecuta una tarea programada, no una persona |

### Palabras que se prestan a confusión

- **Anonimizar** significa que no hay forma razonable de volver a la persona. **Seudonimizar** significa que sí la hay, con una clave aparte. El caso clínico usa seudónimo; el dataset usa anonimización.
- **Normal** no es una clase del modelo. Es el nombre que se le da a «sin nódulo detectado» (decisión 2 del catálogo).
- **Resultado** es lo que dice la IA. **Decisión médica** es lo que decide la persona. Nunca se mezclan en una misma columna.
- **Tramo** es una ventana de unas dos semanas (S1 a S5) para ordenar lo que se espera terminar y comparar con la capacidad. La metodología es Kanban: no hay lotes cerrados, cada historia se jala al tablero cuando hay espacio. El último tramo cierra el 23 de diciembre.

### Cómo se relacionan

Un **usuario** tiene uno o más **roles**. Un **paciente** tiene uno o más **casos**. Un **caso** tiene una **ficha**, varios **documentos** y varias **imágenes**. De cada documento salen **extracciones OCR**; de cada imagen, una o más **inferencias**; de cada inferencia, de cero a tres **nódulos** y un **resultado**, y del conjunto sale el **informe**. Sobre el resultado el médico deja su **decisión**. Del lado de investigación, los casos con base legal alimentan un **dataset** anonimizado; un **modelo registrado** se evalúa sobre un dataset en un **experimento**, y los experimentos respaldan la **publicación**. Todo lo anterior escribe **eventos de auditoría**.

## Personas y recorridos

Cada historia de usuario nace de un paso en el recorrido de alguien. Hay cuatro personas: tres usan el sistema y una lo evalúa. Los recorridos de abajo son el hilo del que cuelgan las historias de la sección 8.

### Las personas

| Persona | Quién es | Qué necesita | Qué la frustra |
| --- | --- | --- | --- |
| Dra. Elena, médica | Especialista que atiende casos de tiroides en SOLCA | Pasar de un informe de laboratorio y una ecografía a una ficha completa y una segunda lectura, en pocos minutos | Digitar a mano los mismos valores; no saber por qué la IA dijo lo que dijo |
| Dr. Mateo, investigador | Mide y compara modelos para la tesis y publicaciones | Un dataset limpio y reproducible, y métricas comparables entre versiones del modelo | Datos con nombres de pacientes; resultados que no se pueden repetir |
| Marcela, administradora | Responsable de cuentas, roles, seguridad y cumplimiento | Dar y quitar accesos con rastro, atender solicitudes de pacientes a tiempo, ver qué pasó si algo falla | Enterarse tarde de un acceso indebido; tener que pedir ayuda a un programador para todo |
| Evaluador de la tesis | Director y tribunal de ESPOCH | Ver que cada compromiso aprobado funciona y tiene evidencia | Promesas sin pruebas; una demostración que depende de la suerte |

Los nombres son ficticios y sirven para hablar de ellos sin ambigüedad. Marcela, por decisión de la sección de roles, no ve datos clínicos con su rol de administradora. Si necesita ver un caso, cambia a su rol de médica o investigadora y el cambio queda auditado.

### Recorrido 1: de un caso nuevo a un informe (Elena)

1. Inicia sesión con su cuenta y, si tiene más de un rol, elige el activo.
2. Registra o busca al paciente por su seudónimo y abre un caso nuevo.
3. Sube el informe de laboratorio (PDF o foto). El sistema lee el documento con OCR y propone TSH, T3, T4 y fecha.
4. Revisa cada valor propuesto junto al documento original, corrige lo que esté mal y confirma. Completa a mano tamaño, lateralidad, TI-RADS, Bethesda e histopatología.
5. Sube la ecografía. El sistema la valida y la limpia de metadatos.
6. Pide la inferencia. Ve la imagen con los nódulos marcados, la máscara, la clase y las probabilidades, y el tiempo que tomó.
7. Registra su decisión: acepta, corrige o descarta el resultado, con una nota (HU-073; si no hay espacio, anota su conclusión en la ficha).
8. Genera el informe PDF y lo descarga. El caso queda cerrado y versionado.

**Caminos alternos que deben tener historia:** el OCR no lee nada (se digita todo); la imagen tiene texto grabado con datos personales (se rechaza o se recorta); YOLO no detecta nódulo (resultado «sin nódulo detectado», sin clasificar); la sesión caduca a mitad de la carga (el borrador no se pierde).

### Recorrido 2: de casos a una evaluación de modelo (Mateo)

1. Inicia sesión con rol de investigador.
2. Filtra casos que tengan base legal para investigación y pide armar un dataset.
3. El sistema anonimiza (quita seudónimos, metadatos y fechas exactas), muestra un resumen y congela la versión.
4. Elige un modelo registrado y lanza un experimento sobre el dataset.
5. Ve las métricas, las matrices de confusión y los casos donde falló.
6. Compara dos versiones del modelo.
7. Exporta un resultado agregado para su publicación, que pasa por revisión.
8. Contesta el cuestionario UnUQ cuando se lo pide el sistema.

### Recorrido 3: de una solicitud a su cierre (Marcela)

1. Inicia sesión con rol de administradora.
2. Crea la cuenta de un nuevo médico, le asigna el rol y el sistema le exige cambiar la contraseña temporal en su primer ingreso.
3. Recibe la solicitud de un paciente que pide eliminar sus datos. El sistema abre un plazo de 15 días.
4. Revisa qué datos existen, qué se puede eliminar y qué debe conservarse por norma, y resuelve con una justificación.
5. Consulta la auditoría de la semana y filtra por usuario o acción.
6. Ante un acceso sospechoso, abre un incidente; el sistema le muestra los plazos de aviso.
7. Activa un modelo nuevo como modelo vigente. El cambio se audita.

### Recorrido 4: de la evidencia a la nota (evaluador)

1. Abre el tablero Kanban y ve las tarjetas por columna.
2. Recorre la matriz de trazabilidad: cada compromiso aprobado lleva a sus historias, sus pruebas y su evidencia.
3. Mira una demostración del flujo completo en un entorno estable con datos de prueba.
4. Lee los resultados de las pruebas funcionales y de integración y el resultado del UnUQ.

Este cuarto recorrido es el que justifica historias que no son de producto, como la matriz de pruebas, el entorno de demostración y la evidencia, y por eso no se pueden recortar sin tocar un compromiso aprobado.

## Mapa de historias

El mapa pone los pasos de los recorridos en filas y el tiempo en columnas. Sirve para ver dos cosas: que no falta ningún paso y que cada tramo deja algo que se puede usar de punta a punta, no piezas sueltas. Los identificadores son las historias de la sección 8 (HU es historia de usuario, HT es historia técnica).

| Épica | S1 (13 a 26 oct) | S2 (27 oct a 9 nov) | S3 (10 a 23 nov) | S4 (24 nov a 7 dic) | S5 (8 a 23 dic) | S5 si hay espacio | Después |
| --- | --- | --- | --- | --- | --- | --- | --- |
| E00 Fundación técnica | HT-001, HT-002, HT-003, HT-004, HT-005, HT-008 | HT-006, HT-007, HT-011 | HT-010, HT-012 |  | HT-013 |  | HT-009, HT-014 |
| E01 Diseño | HT-020 | HT-021, HT-024 | HT-022, HT-025 |  | HT-023, HU-021 |  | HT-026, HT-027 |
| E02 Acceso y sesión |  | HU-001, HU-002 | HU-003 | HU-004, HU-005 |  |  | HU-006, HU-007, HU-008 |
| E03 Usuarios y roles |  | HU-010, HU-011, HU-012 | HU-013 |  |  |  | HU-014, HU-015, HU-016 |
| E04 Auditoría |  | HT-030 |  | HU-020 |  |  | HU-022, HT-031 |
| E05 Pacientes y casos |  |  | HU-030, HU-031, HU-033, HU-034, HU-035 |  | HU-032 |  | HU-036, HU-037, HU-038, HU-039 |
| E06 Ficha clínica |  |  | HU-040, HU-041 |  | HU-042 |  | HU-043, HU-044 |
| E07 Documentos y OCR |  |  |  | HU-050, HU-051, HU-052, HU-053, HT-040, HT-041, HT-043 |  |  | HU-054, HU-055, HT-042, HT-044 |
| E08 Ecografías |  |  | HU-060, HT-050 | HT-051 |  |  | HU-061, HU-062 |
| E09 Inferencia con IA |  | HT-061, HT-062 | HT-063 | HT-064, HU-070, HU-071, HU-072 |  | HU-073 | HT-065, HU-074, HT-066 |
| E10 Informes |  |  |  | HU-080, HU-081, HU-082 |  |  | HU-083 |
| E11 Investigación |  |  |  |  | HU-090, HT-070, HU-091, HU-092, HU-093, HU-094, HU-095 |  | HT-071, HU-096, HU-097 |
| E12 Seguridad y cumplimiento |  |  | HT-080 |  | HT-081, HT-082 | HT-084, HU-100 | HT-083, HT-085, HT-086 |
| E13 Datos sintéticos | HT-094 | HT-090 | HT-091, HT-092, HT-093 |  |  |  |  |
| E14 Pruebas y entrega |  | HT-100 |  |  | HT-101, HT-102, HT-103, HT-105, HU-110 |  | HT-104, HT-106 |

### Qué se puede hacer al final de cada tramo

- **S1 (13 a 26 oct).** Nada para un médico todavía. Repositorio, entorno de un comando, integración continua, esqueletos de backend y frontend, tablero Kanban, tokens de diseño y la comprobación de que los tres modelos cargan en CPU.
- **S2 (27 oct a 9 nov).** Se puede iniciar sesión, un administrador crea usuarios y roles, y todo queda en auditoría. El servicio de IA ya responde a una llamada, aunque aún sin pantalla. Hay sistema de componentes y las pantallas clave diseñadas.
- **S3 (10 a 23 nov).** Un médico registra pacientes, consentimiento y casos, llena la ficha clínica y sube una ecografía limpia de metadatos. La API ya llama al servicio de IA y guarda el resultado. Es el primer hito de integración: si algo del modelo falla, se descubre aquí.
- **S4 (24 nov a 7 dic).** Primer recorrido completo con pantalla: ejecutar la inferencia, ver el resultado por nódulo, el historial y el informe PDF. Entra el OCR con revisión lado a lado y la bitácora consultable.
- **S5 (8 a 23 dic).** Investigación con datasets anonimizados y métricas, defensas y respaldo, pruebas de integración y de extremo a extremo, UnUQ con los diez evaluadores y entrega.

### Qué revela el mapa

La carga se concentra en S3, S4 y S5. S1 es corto porque solo cuenta desde el 20 de octubre: la primera semana del plazo ya pasó sin código. El primer recorrido completo con pantalla cae en S4, a unas dos semanas de la entrega, por eso las pruebas de integración de S3 (API con IA) son la señal temprana más importante del plan. La sección 9 detalla la capacidad y dónde cortar.

## Decisiones de arquitectura

Hay decisiones que, si se toman tarde, obligan a rehacer lo ya construido. Estas se fijan en el tramo 1, quedan escritas en este documento (convertirlas en registros formales es HT-014, que queda para después) y respetan lo aprobado en el anteproyecto: React, Python, PostgreSQL, almacenamiento compatible con S3, OCR local, Git y GitHub. Lo que sigue es mi recomendación; cada fila dice qué se descarta y por qué, para que puedas objetar con datos.

| # | Decisión | Recomendación | Por qué | Qué se descarta |
| --- | --- | --- | --- | --- |
| A1 | Organización del código | Un solo repositorio `optimus` con carpetas frontend, backend, ia, ocr, docs e infra | Un solo pull request puede tocar API e interfaz a la vez; un solo lugar para la integración continua | Varios repositorios: más fricción para dos personas |
| A2 | Backend | FastAPI con SQLAlchemy y Alembic | Tipado, OpenAPI automático y mismo lenguaje que los modelos | Django: más pesado de lo que hace falta |
| A3 | Frontend | React con TypeScript y Vite; cliente de API generado desde OpenAPI | El contrato entre pantalla y API se verifica al compilar | JavaScript sin tipos |
| A4 | Sistema de diseño | Tokens como variables CSS, componentes propios sobre primitivas accesibles y un catálogo navegable | Se cumple el requisito de diseño sin atarse a una librería visual | Una librería de componentes completa con su estilo por defecto |
| A5 | Servicio de IA | Contenedor aparte, con una API interna que recibe una imagen y devuelve el resultado en JSON; los modelos se cargan una vez al arrancar | Aisla TensorFlow y PyTorch del backend y permite reiniciar uno sin el otro; reemplaza el `app.py` de Streamlit | Cargar los modelos dentro de la API web: arranque lento y dependencias que chocan |
| A6 | Qué se rehace de `base.py` | Se conserva la lógica del pipeline (YOLO, XML, MGAC, BGAU-Net, Swin). Se eliminan rutas fijas de Windows y variables globales mutables; los pesos se cargan con `weights_only` y su hash se comprueba | Es lo que mejora seguridad y reproducibilidad sin tocar lo que ya funciona | Reescribir el pipeline: riesgo sin beneficio |
| A7 | Trabajos largos | Cola de trabajos en PostgreSQL con un proceso trabajador | OCR e inferencia no deben bloquear una petición; un servicio menos que operar | Redis o RabbitMQ: otra pieza más en una laptop |
| A8 | OCR | Servicio propio con PyMuPDF para PDF digital y Tesseract en español para escaneos, con reglas para extraer cada campo | Sin GPU, sin nube, gratis y explicable. La confianza de cada campo decide si se marca para revisión | OCR con modelos grandes: exige GPU |
| A9 | Archivos | Almacén compatible con S3 (RustFS o MinIO), buckets privados, nombres por hash, URL firmadas de corta vida | Lo aprobado; el cliente nunca ve la ruta real | Guardar archivos en la base de datos |
| A10 | Identidad del paciente | Tabla de identidad cifrada y aparte; el resto del sistema usa solo un seudónimo | Un volcado de la tabla clínica no revela quién es nadie | Todo en una misma tabla |
| A11 | Autenticación | Sesiones en el servidor con cookie `HttpOnly` y contraseñas con Argon2; segundo factor para el administrador (HU-007) si queda capacidad, después del tramo 5 | Revocar una sesión es inmediato; no hay tokens que robar del navegador | JWT en almacenamiento local |
| A12 | Autorización | Permisos por rol comprobados en el servidor en cada endpoint, más filtro por institución; el rol activo viaja en la sesión | Cumple la regla de que el administrador no ve datos clínicos | Ocultar botones en la interfaz como única defensa |
| A13 | Auditoría | Tabla de solo inserción; el usuario de base de datos de la aplicación no tiene permiso de modificar ni borrar | La inmutabilidad la garantiza la base, no la aplicación | Registro en archivos de texto |
| A14 | Despliegue | Docker Compose en una laptop sin GPU, con proxy inverso y TLS; un comando para levantar todo | Es lo que se puede demostrar el 23 de diciembre sin depender de internet | Kubernetes: sin sentido a esta escala |
| A15 | Pruebas | pytest para backend, Vitest para componentes y Playwright para recorridos completos; la matriz del anteproyecto se alimenta de estos resultados | Evidencia automática para el capítulo de resultados | Solo pruebas manuales |
| A16 | Datos de prueba | Generador sintético de pacientes y fichas (PDF digital y escaneado) con etiqueta conocida; nunca datos reales en desarrollo | Cumple la ley y permite medir el OCR contra una verdad conocida | Usar casos reales de SOLCA en el entorno de desarrollo |

### Decisiones que no son técnicas pero bloquean

Estas dependen de ti y de tu director. No frenan el tramo 1, pero sí el tramo 3.

1. Imágenes: ya confirmaste que están anonimizadas; HT-094 solo revisa una muestra en busca de texto grabado y deja por escrito su origen.
2. Pedir el visto bueno de tu director a que «normal» significa «sin nódulo detectado» (decisión 2 del catálogo); tú ya lo confirmaste.
3. La «asistencia local» no se construye: el cronograma es referencial y solo la nombra en la actividad 19. La ayuda al médico queda en los mensajes claros y el glosario (HU-021, HT-025) (decisión 6).
4. Definir quiénes serán los diez evaluadores del UnUQ y cuándo estarán disponibles; la fecha cae en el tramo 5.

## Reglas de trabajo

Estas reglas hacen que una tarjeta del tablero y un pull request signifiquen lo mismo para todos. Son pocas a propósito: si hay demasiadas, nadie las cumple.

### El tablero

Usa los cuatro estados aprobados en el anteproyecto: **Pendiente**, **En proceso**, **Revisión** y **Finalizado**. Reglas del tablero:

- Una tarjeta por historia. El título lleva el identificador (por ejemplo HU-052) y la tarjeta enlaza su pull request.
- Máximo dos tarjetas en proceso por persona. Terminar antes que empezar.
- Una tarjeta pasa a Finalizado solo cuando cumple la definición de hecho, no cuando el código está escrito.
- Cada tarjeta tiene etiqueta de épica, de prioridad (M, S, C) y de tramo.

### Definición de listo (para empezar una historia)

1. Tiene un requisito o un compromiso aprobado detrás, y el identificador está escrito.
2. Sus criterios de aceptación son verificables: alguien puede decir «se cumple» o «no se cumple» sin opinar.
3. Se puede terminar en pocos días y tiene como máximo 8 horas. Si pasa de 8, se parte.
4. Sus dependencias están resueltas o tienen fecha.
5. Si toca pantallas, el diseño existe en el catálogo de componentes.

### Definición de hecho (para cerrar una historia)

1. El código está en la rama principal mediante un pull request aprobado.
2. La integración continua pasa: formato, tipos, pruebas y análisis de dependencias.
3. Los criterios de aceptación tienen al menos una prueba automatizada o, si no es posible, un caso en la matriz de pruebas con evidencia.
4. Las acciones que modifican datos escriben auditoría.
5. Si toca datos personales, no registra datos personales en los logs y respeta la fila correspondiente del mapa normativo.
6. La interfaz usa solo tokens y componentes del sistema de diseño, tiene estados de carga, vacío y error, y se maneja con teclado.
7. La documentación mínima está al día: README, contrato de la API o decisión de arquitectura.
8. La matriz de trazabilidad enlaza el compromiso aprobado con esta historia y con su evidencia.

### Estimación

Se estima en horas de trabajo concentrado, con la escala 1, 2, 3, 5 y 8 horas, **incluyendo pruebas y revisión**. Las cifras suponen que el código y las pruebas se generan con ayuda de IA y que el equipo las revisa; por eso son la mitad de lo que tomaría sin esa ayuda. Es una convención para poder sumar y compararlo con la capacidad, no una promesa. Si una historia sale de más de 8 horas, no se estima: se parte. Cada dos semanas se compara lo estimado con lo que se terminó y se corrige el factor.

### Prioridad

MoSCoW como en el catálogo: **M** (debe, sin esto no se cumple un compromiso aprobado), **S** (debería), **C** (podría) y **W** (no ahora). La línea de corte de la sección 9 se traza siempre entre M y S: si el tiempo no alcanza, se recorta de abajo hacia arriba.

### Ramas, commits y pull requests

| Elemento | Regla |
| --- | --- |
| Rama principal | `main`, protegida: solo recibe cambios por pull request con la integración continua en verde |
| Nombre de rama | `tipo/ID-descripcion-corta`, por ejemplo `feat/HU-052-revision-ocr` |
| Tipos | `feat`, `fix`, `docs`, `test`, `refactor`, `chore`, `ci` |
| Commits | Mensaje corto en imperativo con el identificador, por ejemplo `feat(ocr): revisar campos lado a lado (HU-052)`. Commits pequeños y que compilen |
| Tamaño del PR | Una historia por pull request. Idealmente menos de 400 líneas; si es más, se parte en pasos que se puedan revisar |
| Descripción del PR | Plantilla con: historia y requisito que cubre, qué cambia, cómo se probó, capturas si toca pantallas, riesgos de seguridad y datos |
| Revisión | Otra persona revisa; si trabajas solo, esperas a que pase la integración continua y te lees el diff antes de aprobar |
| Integración | Squash merge para que la historia quede como un solo commit en `main` |
| Secretos | Nunca en el repositorio. Hay análisis automático de secretos en la integración continua |

Los commits y las descripciones de PR que hace Claude terminan con las líneas de atribución de la sesión.

### Cómo fluye el trabajo en Kanban

La metodología es Kanban, la aprobada en el anteproyecto. No hay sprints ni compromisos de lote: el trabajo fluye por el tablero y se mide ese flujo.

| Práctica | Cómo se aplica aquí |
| --- | --- |
| Visualizar | Tablero con las columnas Pendiente, En proceso, Revisión y Finalizado. Cada historia es una tarjeta con su identificador, épica, prioridad, horas y tramo |
| Limitar el trabajo en curso | En proceso: máximo 2 por persona (4 en total). Revisión: máximo 3. Si una columna está llena, nadie jala nada nuevo: se ayuda a vaciarla |
| Jalar, no empujar | Al liberarse espacio, se toma la tarjeta de Pendiente que esté más arriba. El orden de Pendiente es el orden del plan: primero lo obligatorio (M), luego lo deseable (S) |
| Políticas explícitas | Las definiciones de listo y de hecho de arriba son las reglas de entrada a En proceso y de salida a Finalizado. Se escriben en el tablero |
| Atender lo urgente | Un error que bloquea el flujo de punta a punta pasa al frente con etiqueta de urgente. No puede haber más de uno a la vez |
| Medir el flujo | Cada semana se registra el tiempo de ciclo (de En proceso a Finalizado) y las tarjetas terminadas. Sirven para ajustar el plan y como evidencia en el capítulo de resultados |
| Mejorar | Revisión semanal de 30 minutos: qué se trabó, qué columna se llenó, qué cambiar en las políticas |

### Cadencias

- **Diaria (15 minutos):** qué está trabado y qué se jala hoy.
- **Semanal:** revisión del flujo y de la matriz de trazabilidad.
- **Cada dos semanas:** reabastecimiento. Se revisa el plan por tramos con la capacidad real y se decide qué sube o baja en Pendiente. Aquí también se corrige el factor de estimación.
- **Al cierre de un tramo:** demostración de lo que funciona de punta a punta, con el tutor si es posible.

## Épicas

Una épica agrupa historias que, juntas, dan una capacidad completa. Son 15, para un total de 119 historias: 61 de usuario (HU) y 58 técnicas (HT). Las horas son la estimación de la sección 6 e incluyen pruebas y revisión.

| Épica | Nombre | HU | HT | Horas M | Horas S | Horas C | Total |
| --- | --- | --- | --- | --- | --- | --- | --- |
| E00 | Fundación técnica | 0 | 14 | 34 | 4 | 0 | 38 |
| E01 | Sistema de diseño y experiencia | 1 | 8 | 19 | 3 | 0 | 22 |
| E02 | Acceso y sesión | 8 | 0 | 8 | 5 | 1 | 14 |
| E03 | Administración de usuarios y roles | 7 | 0 | 10 | 1 | 3 | 14 |
| E04 | Auditoría | 2 | 2 | 8 | 1 | 2 | 11 |
| E05 | Pacientes, consentimiento y casos | 10 | 0 | 13 | 7 | 0 | 20 |
| E06 | Ficha clínica | 5 | 0 | 9 | 2 | 1 | 12 |
| E07 | Documentos y OCR | 6 | 5 | 20 | 4 | 1 | 25 |
| E08 | Imágenes ecográficas | 3 | 2 | 8 | 3 | 0 | 11 |
| E09 | Servicio de IA e inferencia | 5 | 6 | 26 | 5 | 3 | 34 |
| E10 | Reportes | 4 | 0 | 8 | 0 | 2 | 10 |
| E11 | Investigación y evaluación | 8 | 2 | 17 | 7 | 0 | 24 |
| E12 | Seguridad y cumplimiento legal | 1 | 7 | 7 | 8 | 2 | 17 |
| E13 | Datos sintéticos | 0 | 5 | 8 | 0 | 0 | 8 |
| E14 | Calidad, usabilidad y entrega | 1 | 7 | 19 | 4 | 0 | 23 |
| **Total** |  | **61** | **58** | **214** | **54** | **15** | **283** |

Tres lecturas del cuadro:

1. **E09 es la épica más arriesgada** (34 horas), porque depende de modelos que no escribimos.
2. **E12 tiene casi toda su carga en prioridad S.** Es la tensión más importante del plan: la ley pide más de lo que se compromete como obligatorio, y la sección 10 explica qué se cubre con documentación y qué queda como limitación declarada.
3. **Las 214 horas obligatorias (M) usan menos de la mitad de la capacidad.** La capacidad estimada es de 446 horas; la sección 9 muestra el detalle.

### E00 Fundación técnica

Lo que hay que tener antes de que exista la primera pantalla: repositorio, entorno de un comando, integración continua, base de datos, almacenamiento, trabajos en segundo plano y tablero Kanban. Es trabajo técnico sin usuario final, pero cada historia de las demás épicas se apoya en estas.

**14 historias, 38 horas (34 obligatorias). Compromisos que sostiene: CA-01, CA-02, CA-04, CA-06, CA-13, CA-15, CA-16, CA-18, CA-19, CA-20, CA-21.**

| ID | Historia | Criterios de aceptación | Cubre | Prio, horas, tramo | Depende de |
| --- | --- | --- | --- | --- | --- |
| HT-001 | Crear el repositorio `optimus` con carpetas frontend, backend, ia, ocr, docs e infra, README, plantillas de pull request e issues y ramas protegidas | Repositorio creado en GitHub; la rama principal solo recibe cambios por pull request con integración continua en verde; la plantilla de pull request pide el requisito que cubre | CA-21, RNF-CAL-03 | M · 2 h · S1 | - |
| HT-002 | Entorno local de un solo comando con Docker Compose: frontend, API, PostgreSQL, almacenamiento S3 compatible, OCR e IA | Un comando levanta todo en una laptop sin GPU; el README explica los pasos; variables de ejemplo sin secretos; cada servicio tiene chequeo de salud | CA-19, RI-01, RI-02, RNF-CON-03 | M · 5 h · S1 | HT-001 |
| HT-003 | Integración continua en GitHub Actions | Cada pull request corre formato, tipos, pruebas y construcción; escaneo de secretos y de dependencias; un pull request con fallos no se fusiona | RI-07, RNF-CAL-01, RS-APP-06, RS-APP-07 | M · 3 h · S1 | HT-001 |
| HT-004 | Esqueleto del backend en Python (FastAPI, SQLAlchemy, Alembic) con configuración, logs estructurados y manejo de errores | Endpoint de salud; los errores no muestran detalles internos; los logs son JSON sin datos personales ni clínicos; las migraciones corren desde cero | RNF-CAL-02, RNF-CON-03, RS-APP-04, RNF-PRI-04 | M · 3 h · S1 | HT-001 |
| HT-005 | Esqueleto del frontend en React con enrutado, cliente de API tipado y manejo de sesión | Navegación base por rol; el cliente se genera desde el contrato de la API; pantallas de carga y error por defecto | CA-01 | M · 3 h · S1 | HT-001 |
| HT-008 | Tablero Kanban en GitHub Projects con los cuatro estados aprobados y todas estas historias como tarjetas | Columnas pendiente, en proceso, revisión y finalizado; cada tarjeta enlaza requisito, historia y pull request; el historial se puede exportar como evidencia | RP-01, RP-02 | M · 1 h · S1 | HT-001 |
| HT-006 | Modelo de datos v1 con migraciones y diagrama entidad-relación | Tablas de usuarios, roles, permisos, pacientes con identificadores aparte, casos, fichas, documentos, imágenes, OCR, inferencias, consentimientos y auditoría; diagrama en docs; migración reproducible | RD-01, RD-02, RS-ANO-01 | M · 5 h · S2 | HT-004 |
| HT-007 | Almacenamiento de archivos compatible con S3 con buckets privados, nombres opacos y enlaces firmados | Subir y bajar archivos solo con enlace firmado de corta duración; los nombres no contienen datos personales; la base guarda solo metadatos y ubicación | RD-03, RS-CIF-04, RS-ANO-07 | M · 3 h · S2 | HT-002 |
| HT-011 | Cifrado en reposo y gestión de claves | Los datos que identifican al paciente se guardan cifrados con una clave fuera del repositorio; almacenamiento y respaldos cifrados | RNF-SEG-05, RS-CIF-02, RS-CIF-03 | M · 2 h · S2 | HT-006 |
| HT-010 | Trabajos en segundo plano con estados y reintentos | Estados en cola, procesando, listo y error; tiempo máximo por trabajo; reintento manual; un fallo no tumba el sistema | RF-DOC-06, RF-INF-06, RNF-CON-02 | M · 2 h · S3 | HT-004 |
| HT-012 | Proxy inverso con TLS y cabeceras de seguridad, con solo el proxy expuesto | Base de datos, almacenamiento, IA y OCR sin puertos públicos; HSTS, CSP y CORS restrictivo; comprobado con un escaneo de puertos | RS-CIF-01, RS-APP-03, RS-INF-01 | M · 2 h · S3 | HT-002 |
| HT-013 | Respaldo automático y restauración probada | Respaldo cifrado de base de datos y archivos; restauración probada en un entorno limpio con guion y evidencia | RI-03, RNF-CON-01, RS-CIF-05 | M · 3 h · S5 | HT-007 |
| HT-009 | Contrato OpenAPI versionado y verificado en la integración continua | La integración continua falla si el contrato cambia sin subir la versión | RNF-CAL-05 | S · 2 h · Después | HT-004 |
| HT-014 | Documentación de arquitectura y decisiones (ADR) | Diagrama de contexto y de despliegue; un ADR por cada decisión importante | RNF-CAL-04 | S · 2 h · Después | - |

### E01 Sistema de diseño y experiencia

El sistema de diseño que pediste hacer bien: principios, tokens, componentes, patrones clínicos, accesibilidad y el diseño de las pantallas clave antes de construirlas. Nada de colores o espaciados sueltos en el código.

**9 historias, 22 horas (19 obligatorias). Compromisos que sostiene: CA-08, CA-17.**

| ID | Historia | Criterios de aceptación | Cubre | Prio, horas, tramo | Depende de |
| --- | --- | --- | --- | --- | --- |
| HT-020 | Principios de diseño y tokens (color, tipografía, espaciado, radios, sombras, movimiento) en tema claro y oscuro | Los tokens son la única fuente de estilo; colores propios para normal, benigno y maligno que no dependen solo del color; temas claro y oscuro sobre los mismos tokens | RDS-01, RDS-02, RDS-03, RDS-04 | M · 3 h · S1 | - |
| HT-021 | Biblioteca de componentes base con catálogo navegable | Botón, campo, selector, tabla, tarjeta, modal, aviso, pestañas, navegación y paginación; cada uno documentado con sus estados normal, foco, deshabilitado, error y carga | RDS-05, RDS-08 | M · 5 h · S2 | HT-020 |
| HT-024 | Diseño de las pantallas clave antes de construirlas | Flujos del médico, del investigador y del administrador diseñados y revisados contigo antes de implementarlos | RDS-12 | M · 3 h · S2 | - |
| HT-022 | Patrones clínicos reutilizables | Tarjeta de paciente, resultado de IA con confianza, aviso de apoyo, campo OCR con confianza, visor de imagen y línea de tiempo, cada uno en el catálogo | RDS-06 | M · 3 h · S3 | HT-021 |
| HT-025 | Guía de contenido en español y glosario clínico | Glosario de términos, tono de los mensajes y regla de que cada error diga qué hacer | RDS-11 | M · 1 h · S3 | - |
| HT-023 | Accesibilidad WCAG 2.2 AA en el sistema de diseño | Pruebas automáticas de accesibilidad en la integración continua sin errores graves; todo funciona con teclado; contraste verificado | RDS-09 | M · 2 h · S5 | HT-021 |
| HU-021 | Como usuario, quiero estados claros de carga, vacío y error en cada pantalla para saber qué está pasando | Cada pantalla define los tres estados; los mensajes están en español y dicen qué hacer | RDS-07, RDS-11 | M · 2 h · S5 | HT-021 |
| HT-026 | Regla automática que impide colores y espaciados sueltos | La verificación falla si una pantalla usa un valor que no sea un token | RDS-13 | S · 1 h · Después | HT-020 |
| HT-027 | Diseño adaptable para escritorio, tableta y consulta en móvil | Los flujos principales se usan sin desplazamiento horizontal en tableta; la consulta funciona en móvil | RDS-10 | S · 2 h · Después | - |

### E02 Acceso y sesión

Entrar y salir del sistema con seguridad, elegir el rol activo y proteger la sesión.

**8 historias, 14 horas (8 obligatorias). Compromisos que sostiene: CA-11, CA-12.**

| ID | Historia | Criterios de aceptación | Cubre | Prio, horas, tramo | Depende de |
| --- | --- | --- | --- | --- | --- |
| HU-001 | Como usuario, quiero iniciar sesión con mi correo y contraseña para entrar solo a lo que mi rol permite | Sesión por cookie HttpOnly y SameSite; credenciales incorrectas muestran un mensaje que no revela cuál falló; las rutas se protegen por rol y el acceso denegado explica el motivo | RF-AUT-01, RF-AUT-04, RNF-SEG-02, RNF-SEG-03 | M · 3 h · S2 | HT-005, HT-006 |
| HU-002 | Como usuario, quiero cerrar sesión para que nadie use mi cuenta después | La sesión se invalida en el servidor; al volver atrás no se ven datos | RF-AUT-03 | M · 1 h · S2 | HU-001 |
| HU-003 | Como usuario con más de un rol, quiero elegir mi rol activo entre los que tengo asignados para trabajar como médico o investigador sin cambiar de cuenta | Solo ofrece los roles asignados; el servidor aplica el rol activo; cada cambio queda en la bitácora; no existe un selector libre | RF-AUT-02, RF-ADM-08, RS-ACC-05 | M · 2 h · S3 | HU-001, HU-012 |
| HU-004 | Como administrador, quiero que una cuenta se bloquee un tiempo tras varios intentos fallidos para frenar el adivinado de contraseñas | Bloqueo con tiempo configurable; cada intento queda registrado; el usuario recibe un aviso claro | RF-AUT-06 | M · 1 h · S4 | HU-001 |
| HU-005 | Como usuario, quiero que mi sesión expire por inactividad para proteger los datos si me alejo | Tiempo configurable; aviso antes de expirar; al volver pide iniciar sesión | RF-AUT-05, RS-ACC-06 | M · 1 h · S4 | HU-001 |
| HU-006 | Como usuario, quiero cambiar mi contraseña y mis datos de perfil con una política de contraseñas robusta | Mínimo 12 caracteres y comprobación contra listas de contraseñas filtradas; la sesión se renueva al cambiarla | RF-AUT-07, RS-ACC-01 | S · 2 h · Después | HU-001 |
| HU-007 | Como administrador, quiero un segundo factor de autenticación para proteger las cuentas con más poder | Código de un solo uso obligatorio para administradores y opcional para el resto; códigos de recuperación | RS-ACC-02 | S · 3 h · Después | HU-001 |
| HU-008 | Como administrador, quiero restablecer la contraseña de un usuario sin depender de correo externo | El restablecimiento exige un cambio en el siguiente inicio de sesión y queda registrado | RF-AUT-08 | C · 1 h · Después | HU-010 |

### E03 Administración de usuarios y roles

Quién puede hacer qué: usuarios, roles, varios roles por persona y permisos comprobados en el servidor. El administrador, solo con su rol, no ve datos clínicos.

**7 historias, 14 horas (10 obligatorias). Compromisos que sostiene: CA-11, CA-12.**

| ID | Historia | Criterios de aceptación | Cubre | Prio, horas, tramo | Depende de |
| --- | --- | --- | --- | --- | --- |
| HU-010 | Como administrador, quiero crear, editar, activar y desactivar usuarios con su rol e institución para controlar quién entra | Desactivar conserva el historial y los registros; el correo es único; cada cambio queda en la bitácora | RF-ADM-01, RF-ADM-04, RS-ACC-08 | M · 3 h · S2 | HU-001 |
| HU-011 | Como administrador, quiero gestionar roles y asignar permisos con una matriz para aplicar el mínimo privilegio | La matriz es visible y editable; los tres roles base (médico, investigador, administrador) existen; los cambios quedan registrados | RF-ADM-02, RS-ACC-03 | M · 3 h · S2 | HU-010 |
| HU-012 | Como administrador, quiero asignar a un usuario más de un rol para que, si lo necesita, también actúe como médico o investigador | Con solo el rol de administrador no se ven datos clínicos; con otro rol asignado se ven únicamente al activarlo | RF-ADM-08, RS-ACC-05 | M · 1 h · S2 | HU-011 |
| HU-013 | Como administrador, quiero que cada operación exija el permiso del rol y que las denegaciones queden registradas | Pruebas automáticas que llaman cada endpoint con cada rol; el acceso a un objeto de otro paciente se rechaza; la denegación genera un evento de auditoría | RF-ADM-03, RS-ACC-04 | M · 3 h · S3 | HU-011 |
| HU-014 | Como administrador, quiero gestionar instituciones para asociar usuarios y pacientes | Crear, editar y desactivar instituciones; un usuario pertenece a una | RF-ADM-05 | S · 1 h · Después | HU-010 |
| HU-015 | Como administrador, quiero un tablero con el volumen de datos, la actividad reciente y el estado del sistema | Cifras reales de la base de datos y de los servicios, sin datos simulados | RF-ADM-07 | C · 2 h · Después | HU-020 |
| HU-016 | Como administrador, quiero editar ajustes no sensibles del sistema sin exponer secretos | Los secretos no se muestran; cada cambio queda registrado | RF-ADM-06 | C · 1 h · Después | - |

### E04 Auditoría

Un registro que nadie puede alterar de quién hizo qué, y la forma de consultarlo.

**4 historias, 11 horas (8 obligatorias). Compromisos que sostiene: CA-12.**

| ID | Historia | Criterios de aceptación | Cubre | Prio, horas, tramo | Depende de |
| --- | --- | --- | --- | --- | --- |
| HT-030 | Servicio de auditoría de solo escritura que registra sesión, consultas, cargas, inferencias, exportaciones, cambios de usuarios y roles, y denegaciones | Hay un evento por cada acción que cita el anteproyecto; solo referencias, nunca datos clínicos; no se puede editar ni borrar desde la aplicación; la hora está sincronizada | RF-AUD-01 a RF-AUD-09, RS-INC-01 | M · 5 h · S2 | HT-006 |
| HU-020 | Como administrador, quiero consultar la bitácora y filtrarla por usuario, acción, fecha y recurso | Filtros combinables y paginación; responde en menos de 2 segundos con el volumen de prueba | RF-AUD-10 | M · 3 h · S4 | HT-030 |
| HT-031 | Integridad verificable de la bitácora con encadenamiento de huellas | Una herramienta detecta si se alteró un evento | RF-AUD-11 | C · 2 h · Después | HT-030 |
| HU-022 | Como administrador, quiero exportar la bitácora y que esa exportación también quede registrada | El archivo respeta los filtros aplicados; la exportación genera su propio evento | RF-AUD-10 | S · 1 h · Después | HU-020 |

### E05 Pacientes, consentimiento y casos

Registrar pacientes con los datos mínimos, su consentimiento y los casos que agrupan el trabajo clínico.

**10 historias, 20 horas (13 obligatorias). Compromisos que sostiene: CA-03, CA-11, CA-12, CA-13.**

| ID | Historia | Criterios de aceptación | Cubre | Prio, horas, tramo | Depende de |
| --- | --- | --- | --- | --- | --- |
| HU-030 | Como médico, quiero registrar un paciente con solo los datos mínimos necesarios para empezar su atención | Se genera un código interno; los identificadores directos van en una tabla aparte y cifrados; solo se piden los campos necesarios | RF-PAC-01, RF-PAC-02, RNF-PRI-02 | M · 3 h · S3 | HT-011, HU-013 |
| HU-031 | Como médico, quiero buscar y consultar mis pacientes con filtros | Búsqueda por código y filtros; solo veo lo que mi rol permite; cada consulta queda en la bitácora | RF-PAC-03, RF-AUD-02 | M · 2 h · S3 | HU-030 |
| HU-033 | Como médico, quiero abrir un caso por paciente que agrupe ficha, documentos, imágenes e inferencias | Un paciente puede tener varios casos; el caso muestra todo su contenido | RF-PAC-05 | M · 2 h · S3 | HU-030 |
| HU-034 | Como médico, quiero registrar y retirar el consentimiento del paciente con finalidades separadas para atender y para investigar | El texto tiene versión y fecha; el retiro tiene efecto desde ese momento; ambos quedan registrados | RF-PAC-06, RS-LEG-04, RS-DER-04 | M · 3 h · S3 | HU-030, HT-080 |
| HU-035 | Como médico, quiero que el sistema impida inferir o incluir a un paciente en investigación sin consentimiento vigente | El botón de inferencia aparece desactivado con una explicación; el paciente no aparece en datasets sin consentimiento de investigación | RF-PAC-07 | M · 1 h · S3 | HU-034 |
| HU-032 | Como médico, quiero corregir los datos de un paciente conservando el historial de cambios | Cada cambio guarda quién, cuándo y qué cambió | RF-PAC-04, RS-DER-02 | M · 2 h · S5 | HU-030 |
| HU-036 | Como médico, quiero ver solo los pacientes de mi institución o de mi asignación | La regla se aplica en el servidor; un paciente de otra institución devuelve acceso denegado | RF-PAC-10, RS-ACC-04 | S · 2 h · Después | HU-014 |
| HU-037 | Como médico, quiero archivar un paciente sin perder su historial | El paciente archivado deja de aparecer en las listas pero se conserva; eliminar exige permiso y queda registrado | RF-PAC-08, RS-DER-03 | S · 2 h · Después | HU-030 |
| HU-038 | Como médico, quiero un aviso de posible duplicado al registrar un paciente | Compara por datos no identificables o por el identificador de la institución | RF-PAC-09 | S · 1 h · Después | HU-030 |
| HU-039 | Como médico, quiero exportar los datos de un paciente en formato estructurado cuando lo solicita | Entrega datos y resultados de inferencia en JSON o CSV; la exportación queda registrada | RS-DER-01, RS-DER-05 | S · 2 h · Después | HU-033 |

### E06 Ficha clínica

La ficha clínica estructurada (TSH, T3, T4, nódulo, TI-RADS, Bethesda y demás), con validaciones e historial de cambios.

**5 historias, 12 horas (9 obligatorias). Compromisos que sostiene: CA-03, CA-12.**

| ID | Historia | Criterios de aceptación | Cubre | Prio, horas, tramo | Depende de |
| --- | --- | --- | --- | --- | --- |
| HU-040 | Como médico, quiero registrar la ficha clínica por secciones: consulta, laboratorio, ecografía, PAAF y Bethesda, antecedentes y diagnóstico con CIE-10 | Todas las secciones se guardan y se muestran; los campos siguen el catálogo; la ficha pertenece a un caso | RF-CLI-01, RF-CLI-02, RF-CLI-03, RF-CLI-09 | M · 5 h · S3 | HU-033 |
| HU-041 | Como médico, quiero validaciones con mensajes claros para no guardar valores imposibles | Rangos de TSH, T3, T4 y tamaño configurables; TI-RADS y Bethesda solo aceptan valores válidos; mensajes en español | RF-CLI-04 | M · 2 h · S3 | HU-040 |
| HU-042 | Como médico, quiero ver quién cambió la ficha, cuándo y qué cambió | Las versiones se pueden consultar y comparar | RF-CLI-05 | M · 2 h · S5 | HU-040 |
| HU-043 | Como médico, quiero ver la cronología de un caso | Línea de tiempo con fichas, documentos e inferencias en orden | RF-CLI-07 | S · 2 h · Después | HU-040 |
| HU-044 | Como médico, quiero cerrar una ficha para bloquear ediciones | Una ficha cerrada solo se reabre con un permiso y queda registrado | RF-CLI-08 | C · 1 h · Después | HU-040 |

### E07 Documentos y OCR

Cargar documentos, leerlos con OCR local y que el médico revise lado a lado lo que el OCR propone antes de que pase a la ficha.

**11 historias, 25 horas (20 obligatorias). Compromisos que sostiene: CA-02, CA-03, CA-04, CA-12, CA-18, CA-19.**

| ID | Historia | Criterios de aceptación | Cubre | Prio, horas, tramo | Depende de |
| --- | --- | --- | --- | --- | --- |
| HT-040 | Servicio de OCR local con contrato versionado (Tesseract en español y PyMuPDF para PDF con texto) | Recibe un PDF o una imagen y devuelve texto, campos y confianza; no hace llamadas a internet; funciona en CPU | RF-DOC-05, RI-05 | M · 5 h · S4 | HT-002 |
| HT-041 | Extracción de campos por reglas con normalización de unidades y decimales | TSH, T3, T4, tamaño del nódulo, lateralidad, TI-RADS y Bethesda con confianza por campo; coma o punto decimal; pruebas con las variaciones de las plantillas | RF-DOC-05 | M · 3 h · S4 | HT-040, HT-091 |
| HT-043 | Medición de la calidad del OCR con fichas de muestra | Informe repetible con la exactitud por campo sobre las fichas digitales y las escaneadas; la meta se fija antes de medir | RF-DOC-10, RD-05 | M · 2 h · S4 | HT-041, HT-093 |
| HU-050 | Como médico, quiero cargar una ficha en PDF o imagen asociada a un paciente y a un caso | Acepta PDF y las imágenes permitidas; rechaza tipos no permitidos y archivos dañados explicando el motivo; guarda en almacenamiento privado; la carga queda en la bitácora | RF-DOC-01, RF-DOC-02, RF-DOC-03, RS-CIF-06 | M · 3 h · S4 | HT-007, HU-033 |
| HU-051 | Como médico, quiero ver el estado del OCR para saber cuándo puedo revisar la ficha | Estados en cola, procesando, listo y error; el error dice el motivo; se actualiza sin recargar la página | RF-DOC-06 | M · 1 h · S4 | HT-010, HU-050 |
| HU-052 | Como médico, quiero revisar lado a lado los campos que leyó el OCR con su confianza y corregirlos antes de aceptarlos en la ficha | El documento original aparece junto a los campos; los de baja confianza se resaltan; nada entra a la ficha sin mi confirmación; se guardan el valor leído y el corregido | RF-DOC-07, RF-DOC-08, RF-CLI-06 | M · 5 h · S4 | HT-041, HT-022, HU-040 |
| HU-053 | Como médico, quiero visualizar y descargar documentos según mi permiso | La descarga usa un enlace firmado; cada acceso queda en la bitácora | RF-DOC-09 | M · 1 h · S4 | HU-050 |
| HT-042 | Campos adicionales del OCR: fecha de laboratorio, histopatología y CIE-10 | Se extraen con confianza y se muestran en la revisión | RF-DOC-05 | S · 2 h · Después | HT-041 |
| HT-044 | Huella del archivo y detección de duplicados | Una ficha idéntica ya cargada se avisa al usuario | RF-DOC-04 | S · 1 h · Después | HU-050 |
| HU-054 | Como médico, quiero reintentar un OCR fallido sin volver a subir el archivo | El reintento reutiliza el archivo guardado y conserva el historial de intentos | RF-DOC-11 | S · 1 h · Después | HU-051 |
| HU-055 | Como médico, quiero un aviso cuando un escaneo tiene baja calidad antes de procesarlo | Mide nitidez y contraste y avisa con un umbral configurable | RF-DOC-12 | C · 1 h · Después | HU-050 |

### E08 Imágenes ecográficas

Cargar la ecografía, limpiarla de metadatos y de texto grabado, y verla.

**5 historias, 11 horas (8 obligatorias). Compromisos que sostiene: CA-03, CA-05, CA-06, CA-13.**

| ID | Historia | Criterios de aceptación | Cubre | Prio, horas, tramo | Depende de |
| --- | --- | --- | --- | --- | --- |
| HT-050 | Limpieza de metadatos de las imágenes | La copia guardada no trae EXIF ni DICOM con datos personales | RF-IMG-03, RS-ANO-04 | M · 2 h · S3 | HU-060 |
| HU-060 | Como médico, quiero cargar la imagen ecográfica de un caso y que el sistema la valide | Formatos aceptados definidos; dimensiones mínimas; imagen ilegible rechazada con motivo; el original se conserva intacto | RF-IMG-01, RF-IMG-02, RF-IMG-04 | M · 3 h · S3 | HT-007, HU-033 |
| HT-051 | Detección y ocultación de texto incrustado en la ecografía, como nombres o fechas | Un OCR sobre la imagen marca las zonas con texto sospechoso; se tapan o se envían a revisión; la zona del nódulo no se altera | RS-ANO-04 | M · 3 h · S4 | HT-040, HT-050 |
| HU-061 | Como médico, quiero acercar la imagen y ajustar brillo y contraste | Zoom, desplazamiento, brillo y contraste sin alterar el archivo original | RF-IMG-06 | S · 2 h · Después | HT-022 |
| HU-062 | Como médico, quiero asociar varias imágenes a un caso y elegir cuál se usa | La inferencia indica con qué imagen se hizo | RF-IMG-05 | S · 1 h · Después | HU-060 |

### E09 Servicio de IA e inferencia

Convertir el pipeline de `base.py` en un servicio, conectarlo a la API y mostrar al médico el resultado por nódulo.

**11 historias, 34 horas (26 obligatorias). Compromisos que sostiene: CA-05, CA-06, CA-07, CA-08, CA-09, CA-10, CA-12, CA-19.**

| ID | Historia | Criterios de aceptación | Cubre | Prio, horas, tramo | Depende de |
| --- | --- | --- | --- | --- | --- |
| HT-061 | Servicio de IA: convertir `base.py` en una función que recibe una imagen y devuelve un resultado, sin rutas fijas ni variables globales | Configuración por variables de entorno; cada solicitud en su propio espacio; con imágenes de ejemplo da los mismos resultados que `app.py`; hasta 3 nódulos por imagen | RIA-01, RIA-02, RIA-03, RIA-06, RIA-07 | M · 8 h · S2 | - |
| HT-062 | Carga única de modelos, chequeo de salud y registro de versión | Los modelos se cargan una vez; la salud confirma los tres; la huella de los pesos y los umbrales quedan guardados en cada inferencia | RIA-04, RIA-05, RF-INF-10, RS-IA-04 | M · 2 h · S2 | HT-061 |
| HT-063 | Integración de la API con el servicio de IA | Tiempo máximo y errores manejados; si el servicio no responde se informa y no se inventa un resultado; se guardan resultado, XML, máscaras y superposición en el almacenamiento | RF-INF-02, RF-INF-05, RF-INF-06, RF-INF-07, RIA-09 | M · 5 h · S3 | HT-061, HT-010, HT-007 |
| HT-064 | Resultado «normal» cuando no hay nódulo detectado, sin clasificar la imagen completa | Sin detección devuelve «normal (sin nódulo detectado)» con aviso; con varias detecciones, un resultado por nódulo | RF-INF-03, RF-INF-13, RF-INF-14 | M · 2 h · S4 | HT-063 |
| HU-070 | Como médico, quiero elegir paciente, caso e imagen y ejecutar la inferencia | Solo con consentimiento vigente; muestra el estado; queda en la bitácora | RF-INF-01 | M · 3 h · S4 | HT-063, HU-035, HU-060 |
| HU-071 | Como médico, quiero ver por cada nódulo la clase, la probabilidad, la caja, la máscara, la región analizada y la superposición, con el aviso de que es apoyo y no diagnóstico | El aviso está siempre visible; clase y probabilidad se muestran también con texto, no solo con color; incluye todas las imágenes derivadas; sigue el sistema de diseño | RF-INF-03, RF-INF-04, RF-INF-12, RDS-03 | M · 5 h · S4 | HU-070, HT-022 |
| HU-072 | Como médico, quiero ver el historial de inferencias de un caso | Lista ordenada con fecha, imagen, resultado y versión del modelo | RF-INF-08 | M · 1 h · S4 | HU-070 |
| HU-073 | Como médico, quiero registrar mi propia conclusión aparte de la predicción | La conclusión se guarda separada, con fecha y autor; sirve de referencia para la auditoría | RF-INF-09 | S · 2 h · S5 si hay espacio | HU-071 |
| HT-065 | Validar que la imagen sea una ecografía tiroidea antes de inferir | Una imagen que no lo parece avisa al médico antes de gastar la inferencia | RS-IA-01 | S · 2 h · Después | HT-063 |
| HT-066 | Explicación visual con Grad-CAM | Solo si el equipo del modelo la entrega; el modelo actual no la incluye | RF-INF-11 | C · 3 h · Después | - |
| HU-074 | Como médico, quiero entender cómo se obtiene la predicción y cuáles son sus límites | Texto breve del flujo del modelo y de sus límites, accesible desde el resultado | RS-DER-06, RS-IA-02 | S · 1 h · Después | HU-071 |

### E10 Reportes

El informe PDF por inferencia con logos de ESPOCH y SOLCA, y la consulta de resultados guardados.

**4 historias, 10 horas (8 obligatorias). Compromisos que sostiene: CA-08, CA-12, CA-14.**

| ID | Historia | Criterios de aceptación | Cubre | Prio, horas, tramo | Depende de |
| --- | --- | --- | --- | --- | --- |
| HU-080 | Como médico, quiero generar un reporte PDF por inferencia con los datos mínimos del paciente, las imágenes, el resultado, la confianza, la versión del modelo y el aviso de apoyo | Reutiliza el reporte de `app.py` con encabezado ESPOCH y SOLCA; incluye el aviso; no incluye datos innecesarios del paciente | RF-REP-01, RF-REP-02, RIA-10 | M · 5 h · S4 | HU-071 |
| HU-081 | Como médico, quiero consultar los resultados guardados con filtros por paciente, fecha y clase | Filtros combinables y paginación | RF-REP-03 | M · 2 h · S4 | HU-072 |
| HU-082 | Como médico, quiero descargar el reporte y que la descarga quede registrada | El evento incluye usuario, reporte y hora | RF-REP-04 | M · 1 h · S4 | HU-080 |
| HU-083 | Como médico, quiero un reporte consolidado de un caso con un identificador verificable | Reúne todas las inferencias del caso; el identificador permite comprobar su autenticidad | RF-REP-05, RF-REP-06 | C · 2 h · Después | HU-080 |

### E11 Investigación y evaluación

Datasets anonimizados, métricas del modelo contra la referencia, comparación de conjuntos y auditoría de errores.

**10 historias, 24 horas (17 obligatorias). Compromisos que sostiene: CA-10, CA-12, CA-13.**

| ID | Historia | Criterios de aceptación | Cubre | Prio, horas, tramo | Depende de |
| --- | --- | --- | --- | --- | --- |
| HT-070 | Proceso de anonimización de datasets | Quita identificadores directos, desplaza fechas y agrupa edades; genera la ficha técnica del dataset; pruebas que verifican que no quedan identificadores | RF-INV-02, RS-ANO-03, RS-ANO-08, RS-ANO-09 | M · 3 h · S5 | HU-035 |
| HU-090 | Como investigador, quiero consultar datasets anonimizados construidos a partir de casos con consentimiento | Solo casos con consentimiento de investigación; ningún identificador visible; cada consulta queda en la bitácora | RF-INV-01, RF-INV-03 | M · 3 h · S5 | HT-070 |
| HU-091 | Como investigador, quiero calcular las métricas del modelo contra la referencia clínica | Sensibilidad, especificidad, precisión, F1, AUC y matriz de confusión; la referencia sale de la histopatología o del Bethesda; resultados reproducibles | RF-INV-04, RF-CLI-11 | M · 3 h · S5 | HU-090, HU-072 |
| HU-092 | Como investigador, quiero comparar resultados entre conjuntos de datos o versiones del modelo | Muestra las métricas lado a lado para dos selecciones | RF-INV-05 | M · 2 h · S5 | HU-091 |
| HU-093 | Como investigador, quiero auditar predicciones individuales | Muestra la predicción, la referencia clínica y la diferencia, con filtros | RF-INV-06 | M · 2 h · S5 | HU-091 |
| HU-094 | Como investigador, quiero analizar los errores del modelo | Lista de falsos positivos y falsos negativos con filtros | RF-INV-07 | M · 2 h · S5 | HU-091 |
| HU-095 | Como investigador, quiero exportar datos y métricas anonimizados | Exige permiso del rol; la exportación queda registrada; incluye la ficha técnica | RF-INV-08 | M · 2 h · S5 | HU-091, HT-070 |
| HT-071 | Medición del riesgo de reidentificación con k-anonimato (k = 5) | Informa las combinaciones de edad, sexo, institución y fecha que identifican a menos de 5 personas y las suprime | RS-ANO-06 | S · 2 h · Después | HT-070 |
| HU-096 | Como investigador, quiero definir cohortes con filtros por fecha, clase, TI-RADS y otros campos | Las cohortes se guardan y se reutilizan en las métricas | RF-INV-09 | S · 3 h · Después | HU-091 |
| HU-097 | Como investigador, quiero ver la curva ROC y la distribución de probabilidades | Gráficos accesibles con tabla equivalente | RF-INV-10 | S · 2 h · Después | HU-091 |

### E12 Seguridad y cumplimiento legal

Los entregables y defensas que hacen cumplir la LOPDP y la seguridad: documentos de cumplimiento, defensas de la aplicación, pruebas, retención, derechos de los titulares y plan de incidentes.

**8 historias, 17 horas (7 obligatorias). Compromisos que sostiene: CA-06, CA-12, CA-13, CA-18.**

| ID | Historia | Criterios de aceptación | Cubre | Prio, horas, tramo | Depende de |
| --- | --- | --- | --- | --- | --- |
| HT-080 | Documentos de cumplimiento: mapa normativo, registro de tratamientos, texto de consentimiento y aviso de privacidad | Cada obligación legal enlazada con su requisito y su evidencia; los textos revisados por tu director | RS-LEG-01, RS-LEG-02, RS-LEG-03, RS-LEG-04, RS-LEG-07, RS-LEG-10 | M · 3 h · S3 | - |
| HT-081 | Plan de respuesta a incidentes y plantilla de notificación con los plazos legales | Pasos para detectar, contener, evaluar y notificar; plantilla para la autoridad y para los titulares | RS-INC-03, RS-INC-04 | M · 1 h · S5 | - |
| HT-082 | Defensas de la aplicación contra inyección, XSS, CSRF, SSRF y recorrido de rutas, con límites de peticiones | Pruebas que intentan cada ataque y fallan; límite de peticiones y de tamaño en la inferencia | RS-APP-02, RS-APP-05, RS-APP-10 | M · 3 h · S5 | HT-004 |
| HT-084 | Evaluación de impacto en protección de datos | Documento escrito antes de tratar datos reales, con riesgos y medidas | RS-LEG-05 | S · 2 h · S5 si hay espacio | HT-080 |
| HU-100 | Como administrador, quiero registrar las solicitudes de derechos de los titulares con su plazo de respuesta | Cada solicitud guarda fecha, tipo, responsable y plazo de 15 días | RS-DER-07 | S · 1 h · S5 si hay espacio | HU-020 |
| HT-083 | Pruebas de seguridad con informe | OWASP ZAP, pruebas de permisos por rol y de acceso a objetos de otros; informe con los hallazgos corregidos | RS-APP-01, RS-APP-08, RS-ACC-04 | S · 3 h · Después | HT-082 |
| HT-085 | Retención y borrado de datos, y separación entre entornos | Plazos por tipo de dato; borrado o anonimización al vencer; nunca se copian datos reales a desarrollo | RS-RET-01, RS-RET-02, RS-RET-03 | S · 2 h · Después | - |
| HT-086 | Alertas ante patrones raros de uso | Aviso ante muchos fallos de acceso, descargas masivas o exportaciones fuera de horario | RS-INC-02 | C · 2 h · Después | HT-030 |

### E13 Datos sintéticos

Pacientes y fichas sintéticas con la verdad conocida, para desarrollar y medir el OCR sin tocar datos reales.

**5 historias, 8 horas (8 obligatorias). Compromisos que sostiene: CA-04, CA-13.**

| ID | Historia | Criterios de aceptación | Cubre | Prio, horas, tramo | Depende de |
| --- | --- | --- | --- | --- | --- |
| HT-094 | Revisar una muestra de las imágenes anonimizadas del proyecto y registrar su origen y permiso de uso | Muestra revisada sin texto ni datos personales grabados; origen y permiso de uso documentados en docs | RD-12, RS-LEG-09 | M · 1 h · S1 | - |
| HT-090 | Generador reproducible de pacientes y fichas coherentes con la etiqueta, emparejados con las imágenes del proyecto | La misma semilla da el mismo resultado; hay casos benignos, malignos y sin nódulo; ninguna persona real; las fichas son coherentes con el diagnóstico de referencia | RD-04, RD-09 | M · 3 h · S2 | - |
| HT-091 | Fichas PDF digitales con tres plantillas y variaciones al escribir los valores | Tres diseños de ficha; coma o punto decimal, con o sin unidad | RD-10, RD-11 | M · 2 h · S3 | HT-090 |
| HT-092 | Versiones escaneadas de las fichas con ruido e inclinación | Cada ficha tiene su versión escaneada reproducible | RD-10 | M · 1 h · S3 | HT-091 |
| HT-093 | Conjunto de referencia con los valores esperados de cada ficha | Un archivo con el valor correcto de cada campo, usado para medir el OCR | RD-05 | M · 1 h · S3 | HT-091 |

### E14 Calidad, usabilidad y entrega

Matriz de pruebas, pruebas de integración y de extremo a extremo, medición de usabilidad con el UnUQ y evidencias para la tesis.

**8 historias, 23 horas (19 obligatorias). Compromisos que sostiene: CA-05, CA-16, CA-17, CA-18, CA-19.**

| ID | Historia | Criterios de aceptación | Cubre | Prio, horas, tramo | Depende de |
| --- | --- | --- | --- | --- | --- |
| HT-100 | Estructura de la matriz de pruebas y del registro de errores | Una fila por requisito M con caso de prueba, resultado, evidencia y error asociado | RP-05, RP-06 | M · 1 h · S2 | - |
| HT-101 | Pruebas de integración entre API y modelo, API y OCR, y API y almacenamiento | Corren en la integración continua con servicios reales o contenedores de prueba; sus resultados entran a la matriz | RI-06 | M · 3 h · S5 | HT-063, HT-040, HT-007 |
| HT-102 | Ejecución completa de la matriz de pruebas con evidencias y corrección de errores | Todas las pruebas M ejecutadas; evidencias guardadas; errores críticos corregidos | RP-05, RP-06 | M · 3 h · S5 | HT-100 |
| HT-103 | Prueba de extremo a extremo: el médico sube ficha e imagen, corre la inferencia y genera el reporte; el investigador consulta métricas | Automatizada con Playwright y corre en la integración continua | CA-05 | M · 3 h · S5 | - |
| HT-105 | Matriz de trazabilidad actualizada: compromiso, requisito, historia y prueba | Cada compromiso aprobado enlaza a historias con pruebas aprobadas | RP-04 | M · 1 h · S5 | - |
| HU-110 | Como tesista, quiero medir la usabilidad con el UnUQ con 10 evaluadores (médicos, investigadores y administradores) para cumplir el objetivo 3 | Tareas definidas por rol (médico, investigador y administrador); consentimiento informado; 22 ítems en escala de 5 puntos; puntuación de 0 a 100 con la fórmula del artículo; análisis por los 7 atributos; meta de 70 o más | RP-07, RP-08, RNF-USA-01 a RNF-USA-03 | M · 8 h · S5 | - |
| HT-104 | Medición de rendimiento en la laptop de la demostración | Tiempos de consulta, OCR e inferencia medidos y comparados con las metas | RNF-REN-01 a RNF-REN-04 | S · 2 h · Después | - |
| HT-106 | Evidencias para los capítulos de resultados | Capturas, datos y tablas guardados y citables | RP-10 | S · 2 h · Después | - |

## Capacidad y plan por tramos

Kanban no promete lotes, pero la entrega del 23 de diciembre es una fecha fija. Por eso el plan por tramos es una estimación de hasta dónde se llega, y la línea de corte dice qué se sacrifica primero si el flujo real es más lento.

### Cuánto cabe

El plazo de implementación va del 13 de octubre al 23 de diciembre de 2026. Supuestos: dos personas, unas 30 horas por semana cada una, y un 80 % de ese tiempo dedicado a construir (el resto son reuniones, revisiones, la redacción de la tesis e imprevistos). Todo se estima y se mide en horas, y las estimaciones suponen que el código y las pruebas se generan con ayuda de IA. **La semana del 13 al 19 de octubre ya pasó sin código, así que no cuenta como capacidad**: quedan unas 9,3 semanas.

| Tramo | Fechas | Semanas útiles | Capacidad en horas | Obligatorio (M) | Margen | Si hay espacio (S) |
| --- | --- | --- | --- | --- | --- | --- |
| S1 | 13 a 26 oct | 1 (desde el 20) | 48 | 21 | +27 | 0 |
| S2 | 27 oct a 9 nov | 2 | 96 | 48 | +48 | 0 |
| S3 | 10 a 23 nov | 2 | 96 | 48 | +48 | 0 |
| S4 | 24 nov a 7 dic | 2 | 96 | 47 | +49 | 0 |
| S5 | 8 a 23 dic | 2,3 | 110 | 50 | +60 | 5 |
| Total |  | 9,3 | 446 | 214 | +232 | 5 |

**Lectura honesta:** lo obligatorio ocupa el 48 % de la capacidad. La otra mitad es colchón para lo que la IA no acelere (la integración con los modelos, el OCR con fichas reales, la depuración) y para los retrasos de terceros, como los evaluadores o la respuesta del director. Si el flujo medido en las primeras dos semanas muestra que la IA ayuda menos de lo supuesto, se corrige el factor antes de S3. Las historias de prioridad S que hoy están en «Después» se pueden traer al tablero cuando haya holgura. Si ya construiste algo en la primera semana, dime qué y subo la capacidad de S1.

### Qué entra en cada tramo

| Tramo | Historias obligatorias | Meta del tramo |
| --- | --- | --- |
| S1 | HT-001, 002, 003, 004, 005, 008, 020, 060, 094 | Repositorio y entorno listos, esqueletos de backend y frontend, tokens de diseño y modelos verificados en CPU |
| S2 | HT-006, 007, 011, 021, 024, 030, 061, 062, 090, 100; HU-001, 002, 010, 011, 012 | Sesión, roles, auditoría, almacenamiento cifrado, componentes y el servicio de IA respondiendo |
| S3 | HT-010, 012, 022, 025, 050, 063, 080, 091, 092, 093; HU-003, 013, 030, 031, 033, 034, 035, 040, 041, 060 | **Integración:** pacientes, consentimiento, ficha, ecografía y la API llamando a la IA |
| S4 | HT-040, 041, 043, 051, 064; HU-004, 005, 020, 050, 051, 052, 053, 070, 071, 072, 080, 081, 082 | **Primer recorrido completo con pantalla:** inferencia, resultado, informe, OCR con revisión y bitácora |
| S5 | HT-013, 023, 070, 081, 082, 101, 102, 103, 105; HU-021, 032, 042, 090, 091, 092, 093, 094, 095, 110 | Investigación, pruebas completas, UnUQ y entrega |

### La línea de corte

La línea separa tres zonas. Se recorta siempre de abajo hacia arriba.

1. **Por encima de la línea (M, 214 horas).** Sin esto no se cumple un compromiso aprobado. No se recorta; si no cabe, se avisa al director.
2. **Entre la línea y la meta (S marcadas «S5 si hay espacio», 5 horas).** HU-073, HU-100 y HT-084. Se hacen solo si el último tramo va holgado.
3. **Debajo de la línea (Después, 64 horas).** No se planifican. No son necesarias para un compromiso aprobado, o cumplen una exigencia derivada que se puede cubrir con documentación.

### Qué queda fuera y cómo se declara

| Tema | Historias | Consecuencia | Cómo se declara en la tesis |
| --- | --- | --- | --- |
| Seguridad de cuentas | HU-006, HU-007, HU-008 | Sin segundo factor ni política de contraseñas configurable | Limitación y trabajo futuro; HU-001 exige 12 caracteres como mínimo |
| Ámbito por institución | HU-014, HU-036 | Una sola institución en el sistema | Alcance: la demostración es con SOLCA |
| Derechos del paciente | HU-037, HU-038, HU-039 | Exportar o archivar un paciente se hace a mano por el administrador | Procedimiento escrito en HT-080 |
| Ficha | HU-043, HU-044 | Sin línea de tiempo ni cierre de ficha | Trabajo futuro |
| OCR extra | HT-042, HT-044, HU-054, HU-055 | Fecha de laboratorio, histopatología y CIE-10 se digitan; sin reintento ni aviso de calidad | La exactitud del OCR se mide solo en los siete campos principales |
| Imagen | HU-061, HU-062, HT-065 | Sin zoom, sin varias imágenes por caso, sin validar el tipo de imagen | Limitación; el médico elige la imagen |
| Explicación del modelo | HU-074, HT-066 | Sin explicación visual ni texto de límites | El aviso de apoyo cubre lo mínimo |
| Investigación extra | HT-071, HU-096, HU-097 | Sin k-anonimato medido, sin cohortes ni curva ROC | La matriz de confusión y las métricas cubren el compromiso |
| Retención y borrado | HT-085 | Sin tarea automática de retención | Los plazos quedan escritos en HT-080 y no se usan datos reales en desarrollo |
| Pruebas de seguridad | HT-083 | Sin informe de pruebas de seguridad con OWASP ZAP | Las defensas de HT-082 llevan sus propias pruebas automáticas; el informe queda como trabajo futuro |
| Operación | HT-009, 014, 026, 027, 031, 086, 104, 106; HU-015, 016, 022, 083 | Menos automatización y evidencia pulida | Este documento hace de registro de decisiones |

### Qué se corta primero si el flujo es lento

En este orden, de menor a mayor daño: las 5 horas de «S5 si hay espacio»; HU-021 y HT-023 (estados y accesibilidad, que se bajan de «completo» a «lo crítico»); HT-013 (respaldo automatizado, que pasa a manual documentado); HU-004 y HU-005 (bloqueo y expiración de sesión, 2 horas en total, pero son seguridad básica). No se corta nada del recorrido de punta a punta (E05 a E10), porque es lo que se evalúa.

## Riesgos

Los riesgos están ordenados por cuánto dañarían la entrega del 23 de diciembre. La última columna dice qué se hace, no solo qué se teme.

| # | Riesgo | Probabilidad | Impacto | Señal temprana | Respuesta |
| --- | --- | --- | --- | --- | --- |
| R1 | La capacidad real es menor que la estimada y lo obligatorio no cabe | Alta | Alto | Tiempo de ciclo mayor que lo estimado en las dos primeras semanas | Medir el flujo desde el día 1; en el reabastecimiento del 9 de noviembre bajar la línea de corte y hablar con el director |
| R2 | Los modelos son lentos en CPU o no dan los mismos resultados que `app.py` | Media | Alto | Primera integración de HT-061 en la laptop de la demostración | Medir al integrar HT-061, antes de construir encima; si pasa de un minuto por imagen, procesar en segundo plano y mostrar el estado; pedir al equipo del modelo una versión más ligera |
| R3 | TensorFlow y PyTorch juntos pesan mucho o entran en conflicto | Media | Medio | La construcción de la imagen del servicio de IA falla o supera varios GB | Versiones fijas, un contenedor propio y, si hace falta, dos procesos separados dentro del servicio |
| R4 | El OCR lee mal los escaneos reales | Alta | Medio | La exactitud en fichas escaneadas sintéticas es baja | La revisión lado a lado es obligatoria, así que el OCR acelera y no decide; fijar la meta de exactitud antes de medir; pedir 3 a 5 fichas reales anonimizadas de muestra |
| R5 | Las fichas reales de SOLCA no se parecen a las plantillas sintéticas | Media | Medio | Al probar con fichas de muestra reales | Diseñar el extractor por reglas editables, no por posiciones fijas |
| R6 | «Normal» no significa «sin nódulo detectado» para tu director | Media | Medio | Respuesta del director | Tú ya confirmaste que «normal» es «sin nódulo detectado»; falta el visto bueno del director. Un cambio costaría unas 2 horas en HT-064 y en la pantalla del resultado |
| R7 | Los 10 evaluadores del UnUQ no están disponibles al final | Media | Alto | Sin fechas confirmadas al inicio del tramo 3 | Agendar desde ya; el sistema debe estar estable al final del tramo 4; preparar tareas y consentimiento por adelantado |
| R8 | La ley pide más de lo que cabe | Alta | Medio | La cuenta de E12 sigue en prioridad S | Cubrir con documentación en HT-080, no usar datos reales en desarrollo y declarar el resto como limitación. Esto no es asesoría legal: que lo revise tu director o el delegado de protección de datos |
| R9 | El director exige una asistencia local aunque el Gantt es referencial | Baja | Medio | Revisión del texto con el director | Agregar una historia de ayuda contextual de unas 5 horas, que cabe en el colchón |
| R10 | El diseño consume más tiempo del previsto | Media | Medio | La biblioteca de componentes pasa de 10 componentes en el tramo 2 | Limitar el tramo 1 a los tokens y el tramo 2 a 10 componentes y 3 pantallas diseñadas; los demás componentes se construyen cuando una historia los pide |
| R11 | Una sola persona conoce una parte crítica | Media | Medio | Un solo autor en un módulo durante semanas | Revisión cruzada de pull requests y README de cada servicio |
| R12 | Los pesos de los modelos (343 MB y otros) no caben en el repositorio | Alta | Bajo | El primer commit con pesos falla | Almacenarlos fuera del repositorio con su huella; el entorno los descarga de un almacenamiento propio |
| R13 | Las imágenes traen texto grabado con datos personales | Baja | Alto | La muestra de HT-094 muestra texto | HT-051 lo detecta y lo oculta; si el problema es grande, pasa a M con mayor prioridad |
| R14 | El alcance cambia por pedido del director o del tribunal | Media | Medio | Cambios de redacción del anteproyecto | Kanban lo permite: la tarjeta nueva entra en Pendiente y se negocia qué sale |

## Matriz de trazabilidad

Cada uno de los 21 compromisos aprobados (CA) lleva a las historias que lo cumplen. Las obligatorias (M) son las que garantizan el compromiso; las demás lo refuerzan. Esta matriz es la base de HT-105, que la completa con la prueba y la evidencia de cada fila.

| Compromiso | Qué dice | Historias obligatorias | Historias que lo refuerzan |
| --- | --- | --- | --- |
| CA-01 | Frontend en React y backend en Python | HT-004, HT-005 | HT-014 |
| CA-02 | PostgreSQL y almacenamiento compatible con S3 | HT-006, HT-007 | HT-044 |
| CA-03 | Módulo de gestión clínica y documental | HU-030, HU-031, HU-032, HU-033, HU-040, HU-041, HU-050, HU-053, HU-060 | HU-038, HU-043, HU-044, HU-061 |
| CA-04 | OCR local para fichas en PDF o imagen | HT-010, HU-050, HU-051, HU-052, HT-040, HT-041, HT-043, HT-091, HT-092, HT-093 | HU-054, HU-055, HT-042 |
| CA-05 | Módulo de inferencia | HU-070, HU-071, HU-072, HT-103 | HU-062 |
| CA-06 | API en Python que valida, preprocesa, llama al modelo y devuelve el resultado | HT-010, HU-060, HT-061, HT-063, HT-082 | HT-009 |
| CA-07 | Salida normal, benigno o maligno con confianza | HT-064, HU-071 | - |
| CA-08 | La predicción es apoyo, nunca diagnóstico | HT-022, HU-071, HU-080 | HT-065, HU-073, HU-074, HT-066 |
| CA-09 | Se usa el modelo existente de OPTIMUS-THY | HT-061, HT-062, HT-063 | - |
| CA-10 | Módulo de investigación | HU-090, HT-070, HU-091, HU-092, HU-093, HU-094, HU-095 | HU-073, HU-096, HU-097 |
| CA-11 | Usuarios, roles y permisos | HU-001, HU-002, HU-003, HU-004, HU-005, HU-010, HU-011, HU-012, HU-013 | HU-006, HU-007, HU-008, HU-014, HU-015, HU-016, HU-036 |
| CA-12 | Registro de acciones | HU-001, HU-003, HU-010, HU-013, HT-030, HU-020, HU-031, HU-042, HU-050, HU-053, HT-062, HU-070, HU-082, HU-090, HU-095 | HU-022, HT-031, HU-100, HT-086 |
| CA-13 | Datos simulados o anonimizados; privacidad desde el diseño | HT-011, HT-012, HU-030, HU-034, HU-035, HT-050, HT-051, HT-070, HT-080, HT-081, HT-082, HT-090, HT-091, HT-094 | HU-037, HU-039, HT-071, HT-083, HT-084, HT-085, HU-100 |
| CA-14 | Reportes y consulta de resultados | HU-080, HU-081, HU-082 | HU-083 |
| CA-15 | Kanban con cuatro estados | HT-008 | - |
| CA-16 | Requisitos con historias y criterios de aceptación | HT-008, HT-105 | - |
| CA-17 | Usabilidad con UnUQ, 22 ítems, 10 evaluadores | HT-020, HT-021, HT-022, HT-023, HT-024, HT-025, HU-021, HU-110 | HT-026, HT-027 |
| CA-18 | Pruebas funcionales y de integración con matrices y evidencias | HT-003, HT-043, HT-100, HT-101, HT-102 | HT-083, HT-106 |
| CA-19 | Entorno local que ejecuta todo | HT-002, HT-012, HT-040 | HT-104 |
| CA-20 | Respaldos de imágenes, documentos y base de datos | HT-013 | - |
| CA-21 | Git y GitHub | HT-001, HT-003 | - |

Todos los compromisos tienen al menos una historia obligatoria. Ningún compromiso depende solo de historias que estén bajo la línea de corte.

El CA-16 (requisitos con historias y criterios) se cumple con este documento y con el catálogo; HT-105 solo lo mantiene al día.

## Siguientes pasos

Con esto se cierran los pasos 1 a 9 de la cadena. Lo que sigue es el paso 10: pasar del papel al repositorio. Quedaron resueltos en esta versión: «normal» significa «sin nódulo detectado» (falta el visto bueno del director), los administradores participan en el UnUQ, la asistencia local no se construye porque el cronograma es referencial, las estimaciones suponen trabajo con IA, todavía no hay código (la capacidad de S1 ya lo asume) y quienes construyen son Andrés Gaibor y Daniel Quiguiri.

### Lo que haremos a continuación

1. **Crear el repositorio `optimus`** en GitHub, con la estructura de HT-001 y las ramas protegidas.
2. **Cargar el tablero Kanban** (HT-008): una tarjeta por historia, con los cuatro estados aprobados, etiquetas de épica, prioridad y tramo, y las 214 horas obligatorias arriba en Pendiente.
3. **Abrir los primeros pull requests**, uno por historia y en este orden: HT-001 (estructura), HT-002 (entorno de un comando), HT-003 (integración continua), HT-004 (backend), HT-005 (frontend), HT-020 (tokens de diseño) y HT-094 (revisión de imágenes).
4. **Cada pull request** llevará su historia, sus criterios de aceptación y las pruebas que los demuestran, como dicen las reglas de la sección 6.

### Lo que necesito de ti

| # | Pendiente | Para qué | Cuándo hace falta |
| --- | --- | --- | --- |
| 1 | Visto bueno de tu director a que «normal» significa «sin nódulo detectado» | HT-064 y la pantalla del resultado | Antes de S3 |
| 2 | Una lista con los diez evaluadores y sus fechas | HU-110 | Antes de S3 |
| 3 | Entre 3 y 5 fichas de laboratorio reales, anonimizadas | HT-041 y HT-043 | Antes de S4 |
| 4 | Confirmar que Andrés Gaibor y Daniel Quiguiri tienen acceso al repositorio nuevo, y quién revisa cada pull request | Revisión cruzada y asignación de tarjetas | Antes de abrir el repositorio |

### Lo que puedes revisar ahora

- El **catálogo de requisitos** es la fuente de lo aprobado y de lo derivado. Cualquier historia que te parezca de más o de menos, se discute contra él.
- La **línea de corte** de la sección 9 es la decisión más importante del documento. Si no estás de acuerdo con algo que queda abajo, dime cuál y qué sale a cambio.
- Las **decisiones de arquitectura** de la sección 5 se pueden objetar fila por fila.
