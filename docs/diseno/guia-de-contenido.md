# Guía de contenido y glosario clínico (HT-025)

Reglas de redacción para la interfaz de OPTIMUS-THY. Cubre RDS-11: contenido en
español claro, glosario de términos clínicos y mensajes de error que dicen qué
hacer. Los términos salen de las pantallas y del sistema de diseño que ya
existen; no se inventó vocabulario nuevo.

La guía no cambia el significado clínico de nada: fija cómo se escribe lo que la
aplicación ya muestra.

## 1. Glosario

Definición en una línea y el término exacto que debe verse en pantalla. Cuando la
interfaz usa una variante (una columna, una insignia o un título), se escribe esa
variante, no un sinónimo.

| Término | Definición en una línea | Término exacto en pantalla |
| --- | --- | --- |
| Paciente | Persona atendida, identificada en la interfaz por su código interno y nunca por nombre o cédula. | `Paciente`; en el listado, la columna `Código`. |
| Código | Identificador aleatorio del paciente que sustituye a sus datos personales. | `Código` (columna y campo de detalle). |
| Caso | Episodio asistencial de un paciente que agrupa ficha, documentos, imágenes e inferencias. | `Caso clínico` como título; `Casos` en las tablas. |
| Ficha clínica | Registro estructurado de la consulta: laboratorio, ecografía, PAAF y Bethesda, antecedentes y diagnóstico. | `Fichas clínicas`; `Ficha` en la columna; `Nueva ficha clínica demo` en el diálogo. |
| Nódulo | Hallazgo focal en la glándula tiroides. | `Nódulo`; `Nódulo 1`, `Nódulo 2`; `Tamaño del nódulo (mm)`. |
| Normal | Sin nódulo detectado en el estudio. | `Normal: sin nódulo detectado.` (con `Normal` en negrita). |
| Benigno | Hallazgo sin características sugestivas de malignidad, según criterio clínico. | `Benigno` (etiqueta y estadística). |
| Maligno | Hallazgo sugestivo de malignidad según criterio clínico y estudios complementarios. | `Maligno` (etiqueta y estadística). |
| TI-RADS | Clasificación ecográfica del nódulo tiroideo en categorías de 1 a 5. | `TI-RADS`; la insignia lo compone como `TI-RADS 4`; el campo acepta `1` a `5`. |
| Bethesda | Categoría citológica de la punción aspirativa, de I a VI. | `Categoría Bethesda`; valores `I` a `VI` y `No realizada`. |
| PAAF | Punción aspiración con aguja fina para obtener citología del nódulo. | `PAAF y Bethesda` (título de sección). |
| CIE-10 | Clasificación internacional de enfermedades usada para el diagnóstico registrado. | `Diagnóstico (CIE-10)` y `Código CIE-10`. |
| OCR | Lectura automática del texto de un documento, que el profesional revisa campo por campo. | `OCR`; estados `En cola`, `Procesando`, `Listo`, `Error`; aviso `Lectura OCR ilustrativa`. |
| Inferencia | Resultado del modelo de IA sobre una imagen; es apoyo, no diagnóstico. | `Inferencia de IA` (título); `Inferencias` (pestaña y estadística). |
| Resultado | Salida del modelo para una imagen: clase, confianza e incertidumbre. | `Resultado` (columna); `Resultado de la inferencia`; `Resultados de IA` (pantalla). |
| Confianza | Valor que el modelo asigna a su clasificación, en porcentaje; es ilustrativo. | `Confianza`; `Confianza ilustrativa`; `Confianza media ilustrativa`. |
| Incertidumbre | Complemento de la confianza del modelo; en la interfaz es un valor ilustrativo. | `Incertidumbre: {valor}%`. |
| Decisión médica | Conclusión del profesional responsable, separada del resultado de la IA. | `Conclusión del médico`; nunca `decisión de la IA`. |
| Reporte | Documento de apoyo con el resultado y la conclusión profesional. | `Reporte de apoyo`. |
| Consentimiento | Autorización informada de la persona para el uso de sus datos o para participar en la evaluación. | `Consentimiento informado`. |
| UnUQ | Instrumento académico de usabilidad con 22 ítems, 7 atributos y 10 evaluadores; no es funcionalidad del producto. | `Evaluación UnUQ`; `cuestionario UnUQ`; `Resultado UnUQ`. |
| Cohorte | Agrupación de casos para análisis; en el catálogo es sintética. | `Cohortes`. |
| Dataset | Conjunto de datos preparado para investigación. | `Datasets sintéticos`; `Dataset` en la columna. |

Reglas del glosario:

- Un término, una escritura. No se alterna `nódulo` con `nodulo`, ni `TI-RADS`
  con `TIRADS`, ni `Bethesda` con `bethesda` a media frase.
- Las siglas se expanden la primera vez que aparecen en una pantalla o en un
  documento: `PAAF`, `OCR`, `CIE-10`, `UnUQ`.
- `Normal`, `Benigno` y `Maligno` llevan mayúscula inicial cuando son etiqueta,
  y siempre van acompañados de texto además del color.

## 2. Tono

Voz única para médico, investigador y administrador. Cambia el vocabulario
técnico de cada rol, no el trato.

- **Segunda persona formal, en presente.** Se escribe «usted»: `Revise`,
  `Inténtelo`, `Elija`, `Vuelva`. No se usa «tú», «vosotros» ni el impersonal
  «se debe».
- **Frases breves, una idea por frase.** El aviso, la acción y el plazo van en
  oraciones separadas. Si una frase necesita dos comas para entenderse, se
  parte.
- **Sin jerga interna.** No aparecen `endpoint`, `payload`, `request`, `token`,
  `JSON`, `SQL`, `null`, `backend`, `frontend`, códigos HTTP ni nombres de
  archivos del servidor. El detalle técnico se queda en el registro del servidor;
  la interfaz no muestra trazas, SQL ni rutas, como ya hace
  `frontend/src/components/ErrorScreen.tsx`.
- **Sin promesas de diagnóstico.** La IA «sugiere», «apoya» u «orienta»; la
  decisión es del profesional. Se escribe `La IA apoya la lectura; la
  interpretación y decisión corresponden al profesional.`
  (`frontend/src/screens/doctor/AIInferenceScreen.tsx`), no «la IA diagnosticó».
- **Sin culpar a quien usa el sistema.** El texto guía sin reprochar, como pide
  la guía del catálogo en
  `frontend/src/design-system/quality/Contenido.stories.tsx`. Se describe el
  hecho y se ofrece la salida; no se escribe «Corrige tu error».
- **Español de Ecuador, sin anglicismos innecesarios.** `correo` y no `email`;
  `contraseña` y no `password`; `archivo` y no `fichero`; `enlace` y no `link`;
  `aplicación` y no `app` en texto visible. Las siglas clínicas se conservan
  porque son el término de la especialidad.
- **Los datos son sintéticos y se dice una vez.** La divulgación vive en la
  Introducción y las Convenciones del catálogo (`PRODUCT.md`); no se repite en
  cada pantalla. Las notas de apoyo («apoyo, no diagnóstico») sí van junto a
  inferencias e informes.

## 3. Regla de errores y mensajes de acción

Todo mensaje de error dice **qué pasó** y **qué hacer ahora**. Si el problema
depende de un tercero o del tiempo, se añade **cuándo volver a intentarlo** o
**a quién acudir**. La acción va en el mismo lugar del error, no en otra
pantalla.

Estructura: `[qué pasó]. [qué hacer]. [plazo o a quién acudir, si aplica].`

### Ejemplos reales

1. **Bloqueo de cuenta.** En `backend/app/auth/routes.py` el mensaje es:
   «Demasiados intentos fallidos. La cuenta está bloqueada temporalmente; vuelve
   a intentarlo en {minutos} min.» Dice el hecho (bloqueo), la acción
   (intentar de nuevo) y el plazo. Es el modelo a seguir; solo falta pasarlo a
   «vuelva a intentarlo» para cumplir la regla de trato formal.

2. **Error al cargar un caso.** En
   `frontend/src/screens/doctor/CaseDetailScreen.tsx`:
   «No se pudo cargar el caso. Revisa tu conexión e inténtalo de nuevo. Si el
   problema continúa, vuelve al listado de pacientes.» Dice el hecho, ofrece una
   acción inmediata y una segunda salida si el problema persiste. También debe
   pasar a `Revise su conexión e inténtelo de nuevo`.

### Contraejemplo

En `backend/app/main.py` el manejador de validación responde «Datos de entrada
inválidos». No dice qué campo falló ni qué hacer. Es exactamente lo que la regla
prohíbe: describe un estado interno y deja a la persona sin salida. El mensaje
correcto sería el del formulario, que nombra el campo y el valor admitido, como
en `frontend/src/screens/doctor/FichaRangosForm.tsx`:
«TI-RADS solo acepta valores 1, 2, 3, 4 o 5.»

**Excepción justificada:** en el inicio de sesión la API responde «Credenciales
inválidas» a propósito, para no revelar si el correo existe
(`backend/app/auth/routes.py`). La excepción no exime de la regla: la interfaz
que muestra ese texto (`frontend/src/pages/LoginPage.tsx`) debe añadir la acción
(«Revise el correo y la contraseña, o recupere el acceso») sin revelar cuál de
los dos falló.

### Cómo se escribe un error

- Título corto que nombra el hecho: `No se pudo cargar el caso`, `Archivo
  dañado`, `Baja calidad del escaneo`.
- Cuerpo con la acción en imperativo formal y, si hay varias, en orden:
  `Revise…`, `Elija…`, `Vuelva…`.
- Un solo botón principal: `Reintentar`, `Reemplazar archivo`, `Volver al
  listado`.
- Sin números HTTP, sin rutas, sin nombres de tablas ni de servicios.
- En campos, el error va junto al campo, con `aria-describedby` y el valor
  admitido escrito (`TI-RADS solo acepta valores 1, 2, 3, 4 o 5.`).
- En confirmaciones destructivas se explica la consecuencia y se ofrece
  cancelar, como en
  `frontend/src/design-system/quality/Contenido.stories.tsx`.

## 4. Regla «Normal = sin nódulo detectado»

Así está decidido en el repositorio:

- `PRODUCT.md`: «Normal» significa «sin nódulo detectado».
- `docs/referencia/00-decisiones-de-la-conversacion.md`, decisión 3 de la
  sección 5: confirmado, **falta el visto bueno del director**; el riesgo R6 de
  `docs/referencia/05-backlog/de-los-requisitos-al-backlog.md` lo repite.
- `frontend/src/design-system/inicio/Introduction.mdx` y
  `frontend/src/design-system/quality/Contenido.stories.tsx` lo declaran como
  regla del catálogo.

Cómo se aplica:

1. Cuando el resultado no detecta nódulo, la interfaz escribe exactamente
   `Normal: sin nódulo detectado.`, con `Normal` en negrita. Así se hace en
   `frontend/src/screens/doctor/ResultsList.tsx`,
   `frontend/src/screens/doctor/ResultReportDialog.tsx`,
   `frontend/src/screens/doctor/AIInferenceScreen.tsx` y
   `frontend/src/screens/doctor/PatientDetailScreen.tsx`.
2. Nunca se escribe `Normal` solo, ni `estudio normal`, ni `sano`, ni
   `sin hallazgos`, porque se puede leer como diagnóstico del paciente y no como
   ausencia de nódulo en esa imagen.
3. La equivalencia se mantiene en informes, visores y notas de apoyo. Si no hay
   nódulo, el visor no dibuja marcas de hallazgo y lo explica
   (`Sin nódulo detectado: el visor no incluye ninguna marca de hallazgo.`).
4. La regla describe el hallazgo, no la salud de la persona. No se traduce a
   «paciente normal» en ningún texto.

Esta equivalencia está pendiente del visto bueno del director; la guía la aplica
tal como está decidida, sin presentarla como aprobada.

## Pendientes de normalización

Hallazgos reales al revisar los textos actuales. No se corrigieron aquí porque
esta historia entrega la guía, no el cambio de todas las cadenas:

- Varias cadenas están en segunda persona informal y deben pasar a «usted»:
  `frontend/src/screens/doctor/CaseDetailScreen.tsx`,
  `frontend/src/screens/doctor/DocumentUploadDialog.tsx`,
  `frontend/src/screens/doctor/FichaRangosForm.tsx` («Corrige los campos
  marcados», «Verifica el valor»),
  `frontend/src/screens/doctor/ResultReportDialog.tsx` («Escribe la conclusión
  profesional…»), `frontend/src/components/ErrorScreen.tsx` («Inténtalo de
  nuevo») y `backend/app/auth/routes.py`.
- `frontend/src/design-system/quality/Contenido.stories.tsx` habla de «TR1 a
  TR5», mientras que el formulario valida `1` a `5`
  (`frontend/src/screens/doctor/FichaRangosForm.tsx`) y la insignia muestra
  `TI-RADS 4` (`frontend/src/design-system/components/molecules/TiradsBadge.tsx`).
  Conviene unificar en «TI-RADS 1 a 5».
- El inicio de sesión muestra el mensaje de la API sin añadir la acción
  (`frontend/src/pages/LoginPage.tsx`).
