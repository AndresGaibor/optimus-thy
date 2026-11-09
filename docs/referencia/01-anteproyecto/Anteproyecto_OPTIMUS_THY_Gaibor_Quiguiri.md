# Anteproyecto del trabajo de grado

**Escuela Superior Politécnica de Chimborazo**  
**Facultad de Informática y Electrónica**  
**Carrera Software**

**Título:** Desarrollo de un sistema web que permita la gestión de datos clínicos, utilizando un modelo de inteligencia artificial desarrollado en el proyecto OPTIMUS-THY

- **Presentado por:** Daniel Floresmilo Quiguiri Quezada y Andrés Alexander Gaibor Apunte.
- **Director(a):** Diego Fernando Avila Pesantez.
- **Opción:** Trabajo de Titulación.
- **Modalidad seleccionada:** Proyecto Técnico.
- **Otras opciones del formulario:** Emprendimiento; Artículo (sin marcar).
- **Fecha de presentación:** 29/04/2026.
- **Lugar:** Riobamba – Ecuador.

> Nota de conversión: se conserva el contenido y la numeración del documento original, incluidas sus denominaciones y posibles inconsistencias. Las firmas se transcriben como información textual; este Markdown no conserva ni valida las firmas electrónicas. El cronograma, incluido como imagen en el PDF, se transcribe con las etiquetas visibles y periodos aproximados; las etiquetas truncadas se conservan con puntos suspensivos.

## 1. TÍTULO DE LA PROPUESTA DEL TRABAJO DE GRADO

Desarrollo de un sistema web que permita la gestión de datos clínicos, utilizando un modelo de inteligencia artificial desarrollado en el proyecto OPTIMUS-THY.

## 2. LÍNEAS Y PROGRAMAS DE INVESTIGACIÓN – ESPOCH

**Línea:** Tecnologías de la Información y la Comunicación (TIC).

| Programa | Seleccionado |
| --- | --- |
| Tecnología e Innovación Educativa | |
| Sistemas de Información | |
| Software | X |
| Inteligencia Artificial | X |
| Ciberseguridad | |
| Ciencia de Datos | |

## 3. INFORMACIÓN GENERAL

### 3.1. PROPONENTE(S):

- NOMBRE: Daniel Floresmilo Quiguiri Quezada
- CÉDULA: 1650141094
- CÓDIGO: 7270
- E-MAIL INSTITUCIONAL: daniel.quiguiri@espoch.edu.ec
- TELÉFONO: 0995183207
- NOMBRE: Andrés Alexander Gaibor Apunte
- CÉDULA: 1250583836
- CÓDIGO: 7255
- E-MAIL INSTITUCIONAL: andresa.gaibor@espoch.edu.ec
- TELÉFONO: 0994284430

### 3.2. DIRECTOR(a) DEL TRABAJO DE GRADO:

- NOMBRE: Diego Fernando Avila Pesantez
- CÉDULA: 0602515538
- E-MAIL INSTITUCIONAL: davila@espoch.edu.ec

### 3.3. EMPRESA / INSTITUCIÓN DONDE SE APLICARÁ EL TRABAJO:

Trabajo: Proyecto OPTIMUS-THY – Escuela Superior Politécnica de Chimborazo

## 4. FORMULACIÓN GENERAL DEL TRABAJO DE GRADO

### 4.1. PLANTEAMIENTO DEL PROBLEMA

#### 4.1.1. ANTECEDENTES

El cáncer de tiroides es una enfermedad que requiere procesos de diagnóstico y seguimiento apoyados en información clínica organizada y confiable. En la práctica médica, la evaluación de este tipo de cáncer puede relacionarse con datos del paciente, antecedentes, resultados de laboratorio, fichas clínicas e imágenes de ecografía tiroidea. Esta información permite al médico tener una visión más completa del caso y tomar mejores decisiones durante el análisis del paciente (Xi et al., 2022). En los últimos años, la inteligencia artificial ha empezado a utilizarse como una herramienta de apoyo en el área de la salud, especialmente en tareas relacionadas con el análisis de imágenes médicas, clasificación de patrones y generación de predicciones (Obuchowicz et al., 2024). En el caso del cáncer de tiroides, un modelo de IA puede analizar una imagen de ultrasonido o ecografía tiroidea y generar una salida preliminar, como normal, benigno o maligno, acompañada de una probabilidad o nivel de confianza (Nagendra et al., 2023). Sin embargo, para que este tipo de modelo pueda ser usado por un médico o investigador, no basta con tener el archivo del modelo, sino que se necesita una plataforma que permita cargar los datos, procesarlos y visualizar los resultados El proyecto OPTIMUS-THY plantea el uso de herramientas computacionales inteligentes para apoyar el análisis, detección y seguimiento del cáncer de tiroides. Dentro de este proyecto se requiere gestionar datos clínicos, imágenes médicas y resultados generados por modelos de inteligencia artificial. Por ello, se vuelve necesario contar con un sistema web que permita organizar esta información y servir como un medio de conexión entre los usuarios y el modelo de IA que será proporcionado por el proyecto. Actualmente, el manejo de datos clínicos e imágenes médicas puede realizarse mediante carpetas locales, documentos independientes, hojas de cálculo o procesos manuales. Esta forma de trabajo dificulta el seguimiento de cada caso, aumenta el riesgo de errores y limita la consulta rápida de resultados anteriores. Además, cuando los datos se encuentran dispersos, resulta más complicado relacionar una ficha clínica, una imagen ecográfica y una predicción generada por inteligencia artificial. Por lo tanto, el problema principal se relaciona con la falta de una plataforma web integrada que permita gestionar datos clínicos dentro del proyecto OPTIMUS-THY y consumir de manera ordenada un modelo de inteligencia artificial existente. La ausencia de esta solución limita el uso práctico del modelo, dificulta la organización de la información y reduce la eficiencia del flujo de trabajo de médicos, investigadores y administradores.

#### 4.1.2. FORMULACIÓN DEL PROBLEMA

¿Cómo desarrollar un sistema web que permita la gestión de datos clínicos, utilizando un modelo de inteligencia artificial en el proyecto OPTIMUS-THY?

#### 4.1.3. SISTEMATIZACIÓN DEL PROBLEMA

- ¿Cuáles son los requerimientos para automatizar el sistema web de gestión de datos clínicos, imágenes médicas, documentos médicos e inferencias de inteligencia artificial en el proyecto OPTIMUS-THY?
- ¿Cómo implementar el sistema web para la gestión de datos clínicos e integración del modelo de inteligencia artificial desarrollado en el proyecto OPTIMUS-THY, utilizando la metodología Kanban?
- ¿Cómo consumir un modelo de inteligencia artificial desde Python?
- ¿Cómo incorporar un OCR local para la extracción de información desde fichas clínicas digitalizadas?
- ¿De qué manera el cuestionario UnUQ permite evaluar la usabilidad del sistema web?

### 4.2. JUSTIFICACIÓN

#### 4.2.1. JUSTIFICACIÓN TEÓRICA

El desarrollo de sistemas web aplicados a la salud permite mejorar la organización, consulta y procesamiento de información clínica. En un entorno donde se manejan datos de pacientes, imágenes médicas, documentos y resultados de análisis, es necesario contar con una estructura tecnológica que facilite el acceso ordenado a la información y mantenga la trazabilidad de los procesos realizados. Desde el punto de vista teórico, este trabajo se sustenta en los sistemas de información, el desarrollo de software, las bases de datos, el procesamiento de imágenes, el OCR (Reconocimiento Óptico de Caracteres) y la integración de modelos de inteligencia artificial. Estos componentes permiten construir una plataforma capaz de recibir información, procesarla mediante servicios internos, almacenarla y presentar resultados útiles para el usuario final. La Inteligencia Artificial aplicada al análisis médico puede ser utilizada como una herramienta de apoyo al criterio profesional. En este trabajo, el aporte no se centra en crear un nuevo modelo, sino en integrar un modelo existente dentro de un sistema web funcional. Esta integración requiere comprender el flujo de entrada de datos, preprocesamiento de imágenes, inferencia, almacenamiento y visualización de resultados. También se justifica el uso de un enfoque local para el OCR debido a que el sistema está orientado a un contexto de gestión de datos clínicos. Aunque durante el desarrollo se utilicen datos simulados, la plataforma debe considerar desde su diseño buenas prácticas de privacidad y confidencialidad. Enviar documentos clínicos, imágenes médicas o consultas relacionadas con pacientes a servicios externos podría representar un riesgo para la protección de la información. Con esto, se fortalece la confidencialidad de la información clínica.

#### 4.2.2. JUSTIFICACIÓN APLICATIVA

La implementación del sistema web permitirá disponer de una plataforma centralizada para el proyecto OPTIMUS-THY. A través de esta solución, los usuarios podrán registrar datos clínicos, cargar imágenes ecográficas, procesar fichas mediante OCR, solicitar inferencias al modelo de IA y consultar los resultados desde una misma interfaz.

- Módulo de Gestión Clínica y Documental: El sistema integra directamente el registro de pacientes, fichas clínicas, documentos médicos e imágenes asociadas a cada caso. Este módulo centraliza la información clínica en un solo entorno, permitiendo que el usuario consulte y actualice los datos de manera organizada. Asimismo, incorpora la carga de archivos clínicos y el apoyo de OCR local para extraer información desde documentos digitalizados, reduciendo la dependencia de procesos manuales y mejorando la disponibilidad de los datos para su posterior análisis.
- Módulo de Inferencia y Resultados de Inteligencia Artificial: Se justifica por la necesidad de utilizar el modelo de inteligencia artificial dentro de una interfaz accesible para el usuario final. Este módulo permitirá cargar estudios clínicos, seleccionar pacientes y ejecutar inferencias sobre imágenes médicas o documentos asociados, mostrando posteriormente el resultado, el nivel de confianza y los reportes generados. De esta forma, el sistema facilitará el uso del modelo de IA como herramienta de apoyo para el análisis clínico, sin reemplazar el criterio del profesional de la salud.
- Módulo de Investigación y Evaluación de Modelos: Este módulo se justifica por la necesidad de brindar a los investigadores un entorno controlado para el análisis de datos desidentificados y la evaluación del rendimiento de los modelos de IA. A través de este componente, será posible revisar métricas, comparar resultados, auditar predicciones, analizar errores y consultar datasets anonimizados. Su incorporación permitirá fortalecer el seguimiento investigativo del proyecto OPTIMUS-THY y aportar evidencia sobre el comportamiento de los modelos utilizados en la plataforma.
- Módulo de Administración y Seguridad: Por la necesidad de mantener un control de acceso al sistema y proteger la información gestionada en la plataforma, este módulo permitirá administrar usuarios, roles y permisos. Además de registrar las acciones realizadas dentro del sistema, como accesos, consultas, cargas de documentos, ejecuciones de inferencia y exportación de información.

Su función es garantizar la trazabilidad de las operaciones, reforzar la seguridad de los datos clínicos y mantener un entorno organizado de acuerdo con el perfil de cada usuario.

### 4.3. OBJETIVOS

#### 4.3.1. OBJETIVO GENERAL

Desarrollar un sistema web que permita la gestión de datos clínicos, integrando el consumo de un modelo de inteligencia artificial existente en el proyecto OPTIMUS-THY.

#### 4.3.2. OBJETIVOS ESPECÍFICOS

- Analizar los requerimientos del sistema web para la gestión de datos clínicos, imágenes ecográficas tiroideas, documentos clínicos y resultados de inferencia del modelo existente.
- Implementar un sistema web para el registro, procesamiento mediante OCR local, almacenamiento y consulta de información clínica, integrando el consumo del modelo existente mediante la metodología Kanban.
- Evaluar la usabilidad del sistema web desarrollado para la gestión de la información clínica y la consulta de resultados de inferencia, utilizando el cuestionario UNUQ.

### 4.4. MARCO TEÓRICO

#### 4.4.1. Descripción del objeto de estudio

El objeto de estudio del presente trabajo es el desarrollo de un sistema web para la gestión de datos clínicos dentro del proyecto OPTIMUS-THY. La plataforma se orienta a centralizar información relacionada con pacientes, fichas clínicas, imágenes ecográficas tiroideas, inferencias de inteligencia artificial y reportes de apoyo. El sistema no busca reemplazar el criterio médico, sino facilitar la organización de información y permitir el consumo de un modelo de IA existente dentro de la plataforma web. Por esta razón, el trabajo se ubica dentro del desarrollo de software aplicado a la salud y combina componentes de interfaz web, lógica de servidor, base de datos, almacenamiento de archivos y OCR.

#### 4.4.2. Gestión de datos clínicos

La gestión de datos clínicos consiste en registrar, almacenar, consultar y proteger información relacionada con la atención o evaluación de pacientes. En el contexto del cáncer de tiroides, estos datos pueden incluir antecedentes, observaciones médicas, resultados de laboratorio, documentos clínicos, imágenes de ecografía y resultados de predicción. Una gestión adecuada ayuda a mantener la trazabilidad de cada caso y facilita que los usuarios consulten información relevante de manera ordenada (Barbieri et al., 2023). En este proyecto se trabajará con datos simulados para reducir riesgos durante el desarrollo y las pruebas.

#### 4.4.3. Sistemas web en salud

Un sistema web en salud facilita la administración de información médica mediante una aplicación accesible desde un navegador. Este tipo de solución optimiza la centralización de datos, la interacción entre usuarios y el acceso a funcionalidades desde una interfaz gráfica. Para el presente trabajo se utilizará React en el frontend y Python en el backend. Esta separación permite organizar la capa visual, la lógica de negocio y los servicios encargados de consumir el modelo de IA.

#### 4.4.4. Imágenes ecográficas tiroideas

Las imágenes ecográficas tiroideas posibilitan la observación de la glándula tiroides y evaluar la presencia de nódulos u otras alteraciones (Ha et al., 2024). Estas pueden servir como entrada para modelos de inteligencia artificial orientados a clasificar casos como normales, benignos o malignos.

#### 4.4.5. Inteligencia artificial aplicada al apoyo diagnóstico

La inteligencia artificial ayuda a desarrollar sistemas capaces de reconocer patrones, clasificar información y generar predicciones. En el área médica, puede utilizarse como herramienta de apoyo para analizar imágenes o datos clínicos. En este trabajo se utilizará un modelo existente proporcionado por OPTIMUS-THY. El sistema solo realizará su consumo, almacenando los resultados para su visualización y consulta. La predicción generada no será considerada un diagnóstico definitivo, sino un apoyo para el usuario autorizado.

#### 4.4.6. API en Python para consumo del modelo

Una API permite que diferentes componentes de software se comuniquen entre sí. En este proyecto, la API en Python recibirá las solicitudes de inferencia, validará la imagen, aplicará el preprocesamiento necesario, enviará la entrada al modelo y devolverá el resultado al sistema web. Python es adecuado para este tipo de integración porque cuenta con soporte para procesamiento de imágenes, manejo de datos e integración con modelos de inteligencia artificial.

#### 4.4.7. OCR local para documentos clínicos

El reconocimiento óptico de caracteres (OCR) hace posible extraer texto desde documentos digitalizados o imágenes escaneadas (Hsu et al., 2022). En este proyecto, el OCR local se utilizará para apoyar el procesamiento de fichas clínicas en PDF o imágenes. El uso de una herramienta local como GLM OCR u otra alternativa similar permite mantener el control sobre los documentos procesados y reducir la dependencia de servicios externos.

#### 4.4.8. UNUQ

Es una herramienta que nos proporciona un Cuestionario Unificado de Usabilidad que integra los estándares ISO/IEC 25010, 25062 y 9241-11, se combina con la heurística de Jakob Nielsen y escalas de usabilidad bien establecidas. UnUQ define 7 atributos que fueron identificados mediante un análisis de agrupamiento de métricas de usabilidad. Es diseñado como un solo instrumento con 22 elementos que nos permite evaluar aspectos de usabilidad, eficacia, eficiencia, la satisfacción, el aprendizaje, la accesibilidad, la usabilidad general y la aceptación. Su objetivo es unificar estándares, cuestionarios y métodos de evaluación de usabilidad. (Avila-Pesantez et al., 2026)

#### 4.4.9. Base de datos y almacenamiento de archivos

La base de datos dará lugar al almacenamiento estructurado de la información de los usuarios como: roles, datos clínicos, documentos, imágenes, solicitudes de inferencia y resultados del modelo. Para esto se utilizará PostgreSQL por su estabilidad y soporte para información relacional. Las imágenes y documentos se almacenarán en un repositorio local de archivos, con posibilidad de utilizar RustFS o una alternativa compatible debido a que comparte la API de S3, por lo que facilita el desarrollo y a su vez nos permite desplegar de manera local. La base de datos guardará los metadatos y la ubicación de los archivos, evitando almacenar archivos pesados directamente en las tablas.

### 4.5. TEMARIO TENTATIVO DESGLOSADO, CAPÍTULOS, SUBCAPÍTULOS

- Portada
- Derechos del Autor
- Declaración de Autenticidad y Cesión de Derechos de Autor
- Certificación de Dirección del Trabajo de Titulación
- Dedicatoria
- Agradecimiento
- Índice de Contenido
- Índice de Tablas
- Índice de Ilustraciones
- Índice de Anexos
- Resumen
- Abstract
- Introducción
- CAPÍTULO I
- 1. DIAGNÓSTICO DEL PROBLEMA
- 1.1 Planteamiento del problema
- 1.2 Justificación
- 1.3 Objetivos
- CAPÍTULO II
- 2. MARCO TEÓRICO
- 2.1 Antecedentes
- 2.2 Referencias teóricas
- CAPÍTULO III
- 3. MARCO METODOLÓGICO
- 3.1 Tipo de investigación
- 3.1.1 Enfoque
- 3.1.2 Alcance
- 3.2 Métodos
- 3.3 Técnicas
- 3.4 Proceso de investigación
- CAPÍTULO IV
- 4. DESARROLLO DEL SISTEMA
- 4.1 Análisis de requerimientos
- 4.2 Diseño de arquitectura
- 4.3 Diseño de base de datos
- 4.4 Implementación del sistema
- 4.5 Integración del modelo de inteligencia artificial
- CAPÍTULO V
- 5. ANÁLISIS E INTERPRETACIÓN DE RESULTADOS
- 5.1 Pruebas funcionales
- 5.2 Pruebas de integración
- 5.3 Resultados obtenidos
- CONCLUSIONES
- RECOMENDACIONES
- BIBLIOGRAFÍA
- ANEXOS

## 5. EJECUCIÓN DEL TRABAJO DE GRADO

### 5.1. DISEÑO DEL TRABAJO

#### 5.1.1. TIPO DE ESTUDIO

El presente trabajo técnico será de tipo aplicado y tecnológico, debido a que se busca desarrollar una solución informática orientada a la gestión de datos clínicos, imágenes ecográficas tiroideas, documentos clínicos y resultados de inferencia originados por un modelo de inteligencia artificial existente dentro del proyecto OPTIMUS-THY. Es aplicativo debido a que propone una solución práctica ante una necesidad específica del proyecto, mediante el desarrollo de un sistema web que permita registrar, almacenar y consultar información clínica, además, permitirá integrar el consumo de un modelo existente para la obtención de resultados y consulta de inferencia. Es tecnológico ya que contempla el diseño e implementación de un producto de software, con la integración de componentes como interfaz web, base de datos, almacenamiento de archivos, back-end, consumo del modelo existente. El enfoque será cuantitativo para el levantamiento de requerimientos funcionales y no funcionales, considerando los procesos de gestión de datos clínicos, imágenes ecográficas tiroideas, documentos clínicos y resultados de inferencia. El componente cuantitativo se verá reflejado en la evaluación del nivel de usabilidad del sistema web, mediante un instrumento de evaluación basado en el cuestionario UNUQ. Para el desarrollo del sistema web se utilizará la metodología ágil Kanban, ya que permite visualizar el avance de tareas de forma continua y adaptarse a cambios durante el desarrollo. Las actividades se organizarán en estados como pendiente, en proceso, revisión y finalizado, facilitando el control del trabajo de los proponentes.

#### 5.1.2. MÉTODOS Y TÉCNICAS

Los métodos y técnicas se aplicarán de acuerdo con los objetivos específicos planteados, permitiendo relacionar cada actividad del proyecto con una fuente de información y una forma de verificación.

| Objetivos | Método | Técnicas | Fuente |
| --- | --- | --- | --- |
| Obj. 1: Analizar los requerimientos del sistema web para la gestión de datos clínicos, imágenes ecográficas tiroideas, documentos clínicos y resultados de inferencia del modelo existente. | Analítico | Revisión documental, entrevistas, levantamiento de requerimientos, historias de usuarios y criterios de aceptación | Documentación del proyecto OPTIMUS-THY, medios, investigadores, administradores y documentación técnica del modelo existente |
| Obj. 2: Implementar un sistema web para el registro, procesamiento mediante OCR local, almacenamiento y consulta de información clínica, integrando el consumo del modelo existente mediante la metodología Kanban. | Metodología Kanban | Diseño de arquitectura, diseño de base de datos, prototipado de interfaces, programación frontend/backend, implementación de OCR local, integración del modelo existente y control de tareas mediante tablero Kanban. | Requerimientos levantados, documentación técnica de React, Python, PostgreSQL, documentación del OCR local, repositorio del proyecto y modelo proporcionado por OPTIMUS-THY. |
| Obj. 3: Evaluar la usabilidad del sistema web desarrollado para la gestión de información clínica y consulta de resultados de inferencia, mediante el cuestionario UNUQ. | Descriptivo | Aplicación del cuestionario. | Médicos, investigadores y administradores participantes; cuestionario UNUQ; |

**Descripción de la matriz**

Objetivo. 1: Se empleará el método analítico para identificar y organizar las funcionalidades necesarias del sistema web. Mediante revisión documental, entrevistas e historias de usuario, se definirán los requerimientos funcionales y no funcionales relacionados con la gestión de datos clínicos y imágenes ecográficas tiroideas.

Objetivo. 2: Se empleará la metodología Kanban, con el propósito de mantener un flujo de trabajo continuo. Esto permitirá implementar los módulos principales del sistema, como el registro de información clínica, almacenamiento de archivos, consulta de datos, procesamiento de documentos mediante OCR local, integración del modelo existente y visualización de resultados.

Objetivo. 3: Se utilizará el método descriptivo para medir el nivel de facilidad de uso del sistema web desarrollado. Para ello, se definirán tareas principales de interacción con la plataforma y se aplicará la herramienta UNUQ, considerando la participación de los usuarios definidos para el proyecto.

#### 5.1.3. INSTRUMENTOS

Para la recolección de información y el desarrollo del sistema se utilizarán guías de entrevista, fichas de levantamiento de requerimientos, historias de usuario, criterios de aceptación, tablero Kanban y matrices de pruebas funcionales. Como herramientas de desarrollo se utilizarán React para el frontend, Python para el backend y consumo del modelo, PostgreSQL para la base de datos, GitHub para el control de versiones y un repositorio local de archivos para almacenar imágenes y documentos. Para el procesamiento de fichas clínicas se utilizará OCR local. Para la evaluación se emplearán casos de prueba, matriz de resultados, registro de errores y evidencias de ejecución. Estos instrumentos permitirán comprobar que los módulos principales funcionen correctamente.

#### 5.1.4. POBLACIÓN Y MUESTRA

Población: La población del presente trabajo estará conformada por 10 médicos e investigadores vinculados al proyecto OPTIMUS-THY, quienes podrán interactuar con el sistema web para la gestión de información clínica, consulta de imágenes ecográficas tiroideas, revisión de documentos clínicos y visualización de resultados de inferencia generados por el modelo de inteligencia artificial existente. Muestra: Debido a que la población es pequeña, la muestra será equivalente a la población total. Por lo tanto, se trabajará con los 10 médicos e investigadores disponibles para la evaluación de la usabilidad del sistema web.

### 5.2. RECURSOS NECESARIOS

#### 5.2.1. HARDWARE

- Computadoras personales de los proponentes para el desarrollo y pruebas del sistema.
- Servidor local o entorno de pruebas para ejecutar el backend, el frontend, la base de datos y el OCR.
- Dispositivo de almacenamiento externo o repositorio local para respaldos de imágenes, documentos y base de datos.

#### 5.2.2. SOFTWARE

- Sistema operativo Windows o Linux para el ambiente de desarrollo.
- Python para backend, API, procesamiento de imágenes, OCR
- React para el desarrollo de la interfaz gráfica.
- PostgreSQL para la gestión de datos del sistema.
- Repositorio local de archivos para las imágenes, documentos y modelos no activos.
- Git y GitHub con el propósito de llevar un control de versiones.
- Herramienta de tablero Kanban para la organización de tareas.

#### 5.2.3. MATERIALES

- Material de oficina para apuntes, revisiones y planificación.
- Documentación técnica de las herramientas utilizadas.
- Bibliografía científica y técnica relacionada con sistemas web, datos clínicos e inteligencia artificial.

#### 5.2.4. OTROS

- Datos anonimizados o simulados para pruebas del sistema.
- Documentación del modelo de inteligencia artificial entregado por OPTIMUS-THY.
- Acceso a reuniones de revisión con los responsables del proyecto.
- Conexión a internet para investigación, sincronización de repositorios y descarga de dependencias.

### 5.3 CRONOGRAMA TENTATIVO (GANTT)

![Cronograma original completo, con escala semanal, barras, hitos y dependencias](assets/cronograma.png)

El gráfico original abarca de mayo a octubre de 2026. Los periodos de la tabla son aproximaciones visuales, no fechas exactas de inicio o fin. Los hitos están indicados en la columna «Tipo».

| ID | Actividad visible en el gráfico | Periodo aproximado de 2026 | Tipo |
| --- | --- | --- | --- |
| 1 | Gantt ∣ Proyecto OPTIMUS-THY | Mayo–octubre | Resumen |
| 2 | Revisión bibliográfica y análisis del contexto | Mayo–junio | Actividad |
| 3 | Levantamiento de requerimientos funcionale… | Mayo–junio | Actividad |
| 4 | Definir historias de usuario y criterios de ace… | Junio–julio | Actividad |
| 5 | Aprobar requerimientos | Julio | Hito |
| 6 | Organizar tablero Kanban y priorizar backlog | Junio–julio | Actividad |
| 7 | Diseñar arquitectura y base de datos | Julio–agosto | Actividad |
| 8 | Prototipar interfaces principales | Julio–agosto | Actividad |
| 9 | Validar diseño del sistema | Agosto | Hito |
| 10 | Implementar autenticación, usuarios y permi… | Agosto | Actividad |
| 11 | Implementar gestión clínica y documental | Agosto–septiembre | Actividad |
| 12 | Gestionar imágenes ecográficas y documen… | Agosto | Actividad |
| 13 | Integrar OCR local para fichas clínicas | Agosto | Actividad |
| 14 | Consumir modelo de IA existente | Septiembre–octubre | Actividad |
| 15 | Implementar inferencia y resultados de IA | Septiembre–octubre | Actividad |
| 16 | Generar reportes y consulta de resultados | Septiembre | Actividad |
| 17 | Implementar módulo de investigación desi… | Septiembre–octubre | Actividad |
| 18 | Configurar administración, seguridad y audit… | Agosto–septiembre | Actividad |
| 19 | Integrar asistencia local y validar interfaz | Septiembre–octubre | Actividad |
| 20 | Completar integración general del sistema | Octubre | Hito |
| 21 | Ejecutar pruebas funcionales y de integración | Octubre | Actividad |
| 22 | Evaluar usabilidad según ISO/IEC 25023 | Octubre | Actividad |
| 23 | Entrega final y sustentación | Octubre | Hito |

### 5.5 PRESUPUESTO

| Categoría | Descripción | Cantidad | Costo unitario (USD) | Costo total (USD) |
| --- | --- | --- | --- | --- |
| Software | Herramientas de desarrollo: Python, React, PostgreSQL, Git y librerías de software libre. | 1 | $0 | $0 |
| Software | Servicios de diseño, documentación y gestión de tareas en versiones gratuitas. | 1 | $0 | $0 |
| Hardware | Computadoras personales para desarrollo y pruebas. | 2 | $0 | $0 |
| Hardware | Disco externo o almacenamiento adicional para respaldos del proyecto. | 1 | $80 | $80 |
| Infraestructura | Internet para investigación, sincronización de repositorios y pruebas. | 5 meses | $25 | $125 |
| Infraestructura | Energía eléctrica estimada durante el desarrollo. | 5 meses | $15 | $75 |
| Otros gastos | Transporte para tutorías, reuniones y revisiones. | 4 meses | $20 | $80 |
| Otros gastos | Impresiones, anillados y papelería. | 1 | $50 | $50 |
| Otros gastos | Reserva para pruebas de despliegue local, dominio o servicio temporal. | 1 | $60 | $60 |
| **Total** | | | | **$470** |

### 5.6. FUENTE DE FINANCIAMIENTO

El financiamiento del presente trabajo será cubierto mediante recursos propios de los proponentes. Se utilizarán herramientas de software libre y equipos personales para reducir costos. En caso de requerirse recursos adicionales para pruebas, estos podrán gestionarse mediante el ambiente disponible dentro del proyecto OPTIMUS-THY, previa autorización de los responsables correspondientes.

## 6. REFERENCIAS BIBLIOGRÁFICAS

Avila-Pesantez, D., Hernandez-Ambato, J., Isa-Jara, R., & Avila, L. M. (2026). UnUQ: A Next-Generation Usability Evaluation Questionnaire Integrating ISO Standards and User-Validated Scales. En M. Botto Tobar, O. S. Gómez, R. Lozada, A. Díaz Cadena, R. Nair, & W. Luna-Encalada (Eds.), Trends in Artificial Intelligence, and Computer Engineering (Vol. 1868, pp. 79-92). Springer Nature Switzerland. https://doi.org/10.1007/978-3-032-19382-7_6

Barbieri, C., Neri, L., Stuard, S., Mari, F., & Martín-Guerrero, J. D. (2023). From electronic health records to clinical management systems: How the digital transformation can support healthcare services. Clinical Kidney Journal, 16(11), 1878-1884. https://doi.org/10.1093/ckj/sfad168

Ha, E. J., Lee, J. H., Lee, D. H., Moon, J., Lee, H., Kim, Y. N., Kim, M., Na, D. G., & Kim, J. (2024). Artificial Intelligence Model Assisting Thyroid Nodule Diagnosis and Management: A Multicenter Diagnostic Study. The Journal of Clinical Endocrinology & Metabolism, 109(2), 527-535. https://doi.org/10.1210/clinem/dgad503

Hsu, E., Malagaris, I., Kuo, Y.-F., Sultana, R., & Roberts, K. (2022). Deep learning-based NLP data pipeline for EHR-scanned document information extraction. JAMIA Open, 5(2), ooac045. https://doi.org/10.1093/jamiaopen/ooac045

Nagendra, L., Pappachan, J. M., & Fernandez, C. J. (2023). Artificial intelligence in the diagnosis of thyroid cancer: Recent advances and future directions. WArtificial Intelligence in Cancer, 4(1), 1-10. https://doi.org/10.35713/aic.v4.i1.1

Obuchowicz, R., Strzelecki, M., & Piórkowski, A. (2024). Clinical Applications of Artificial Intelligence in Medical Imaging and Image Processing—A Review. Cancers, 16(10), 1870. https://doi.org/10.3390/cancers16101870

Xi, N. M., Wang, L., & Yang, C. (2022). Improving the diagnosis of thyroid cancer by machine learning and clinical data. Scientific Reports, 12(1), 11143. https://doi.org/10.1038/s41598-022-15342-z

## Firmas

| Nombre | Rol | Cédula |
| --- | --- | --- |
| Daniel Floresmilo Quiguiri Quezada | Proponente | 1650141094 |
| Andrés Alexander Gaibor Apunte | Proponente | 1250583836 |
| Diego Fernando Avila Pesantez | Director del trabajo de grado | 0602515538 |

En el PDF constan los tres bloques «Firmado electrónicamente por» con los nombres correspondientes y la indicación «Validar únicamente en FirmaEC».

## Anexo de conservación visual: las 15 páginas originales

Estas imágenes permiten revisar todos los elementos visuales, logos, marcas de agua, tablas, cronograma y bloques de firma tal como aparecen en el PDF. Los archivos de imagen están incluidos en el paquete ZIP; mantener la carpeta `assets` junto a este Markdown. El PDF original firmado también está incluido, sin modificación, como `original_firmado.pdf`.

### Página 1

![Página 1 del documento original](assets/pagina_01.png)

### Página 2

![Página 2 del documento original](assets/pagina_02.png)

### Página 3

![Página 3 del documento original](assets/pagina_03.png)

### Página 4

![Página 4 del documento original](assets/pagina_04.png)

### Página 5

![Página 5 del documento original](assets/pagina_05.png)

### Página 6

![Página 6 del documento original](assets/pagina_06.png)

### Página 7

![Página 7 del documento original](assets/pagina_07.png)

### Página 8

![Página 8 del documento original](assets/pagina_08.png)

### Página 9

![Página 9 del documento original](assets/pagina_09.png)

### Página 10

![Página 10 del documento original](assets/pagina_10.png)

### Página 11

![Página 11 del documento original](assets/pagina_11.png)

### Página 12

![Página 12 del documento original](assets/pagina_12.png)

### Página 13

![Página 13 del documento original](assets/pagina_13.png)

### Página 14

![Página 14 del documento original](assets/pagina_14.png)

### Página 15

![Página 15 del documento original](assets/pagina_15.png)

