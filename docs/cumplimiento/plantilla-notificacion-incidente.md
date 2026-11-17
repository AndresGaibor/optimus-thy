# Plantilla de notificación de incidentes (HT-081, RS-INC-04)

Tres plantillas para avisar de una vulneración de datos personales con los
plazos que fija el catálogo de requisitos. El procedimiento que decide cuándo se
usan está en [plan-respuesta-incidentes.md](plan-respuesta-incidentes.md).

**No es asesoría legal.** Los plazos y la autoridad son los que cita
`docs/referencia/04-requisitos/catalogo-de-requisitos.md`. Cada texto se revisa
con la **Dirección de tesis y asesoría jurídica** antes de enviarse. **Sin datos
personales reales:** se escriben códigos de paciente y de caso, nunca nombres,
cédulas, direcciones ni números de historia.

## Plazos

| Plantilla | De quién a quién | Plazo | Norma citada por el catálogo |
| --- | --- | --- | --- |
| A | Del encargado al responsable | 2 días | LOPDP, arts. 43 y 46 |
| B | Del responsable a la autoridad de protección de datos personales, con reporte en el Sistema Nacional de Registro de Datos Personales | 5 días | LOPDP, arts. 43 y 46; Resolución SPDP-SPD-2026-0040-R (9 de septiembre de 2026) |
| C | Del responsable a los titulares, solo si hay riesgo para sus derechos | 3 días | LOPDP, arts. 43 y 46 |

El catálogo advierte que omitir el reporte en el Sistema Nacional de Registro de
Datos Personales es infracción grave. También deja tres cosas sin precisar, y
**este documento no las inventa**: si los días son hábiles o calendario, desde
qué hecho se cuentan y quién firma. Eso lo cierra la Dirección de tesis con
asesoría jurídica antes del primer uso con datos reales.

## Reglas de uso

- Una plantilla por incidente; no se reutiliza ni se copia de un incidente
  anterior sin revisar todos los campos.
- Lo que no se sepa se escribe «en investigación». No se rellena con supuestos.
- El número de titulares es aproximado; nunca se adjunta la lista de personas.
- Cada envío se anota en la tabla «Registro de envíos» y en el documento del
  incidente, con fecha, hora, destinatario y acuse.
- Firma un rol, no una persona concreta. El proyecto todavía no tiene designado
  por escrito al responsable de protección de datos (RS-LEG-06 pendiente).
- Ningún texto sale sin la aprobación de la Dirección de tesis.

## Plantilla A — Notificación al responsable o al encargado (2 días)

El catálogo solo fija el plazo del encargado al responsable; no enumera el
contenido de este aviso. Los campos son una propuesta del proyecto para que el
aviso sirva de insumo al reporte posterior.

| Campo | Qué se escribe |
| --- | --- |
| Identificador del incidente | `INC-AAAA-MM-DD-nn` |
| Fecha y hora en que se conoció | Con zona horaria |
| Quién lo detectó y cómo | Rol y fuente (bitácora, reporte interno, salud del servicio, respaldo) |
| Sistemas afectados | Servicio, contenedor, tabla u objeto concreto |
| Descripción del hecho | Qué pasó, en dos o tres frases, sin datos personales |
| Categorías de datos | Identidad, ficha clínica, imagen, documento, consentimiento |
| Número aproximado de titulares | Número; nunca la lista |
| Causa conocida o probable | O «en investigación» |
| Medidas de contención aplicadas | Con hora y efecto |
| Evaluación preliminar del riesgo | Con el motivo; la calificación final la hace la Dirección de tesis |
| ¿Se notificará a la autoridad? | Sí / no / pendiente de evaluación |
| Contacto técnico | Rol y canal institucional |
| Fecha y hora de este aviso | La del envío efectivo |

## Plantilla B — Notificación a la autoridad (5 días)

Canal: **Sistema Nacional de Registro de Datos Personales**, conforme a la
Resolución SPDP-SPD-2026-0040-R. El plazo es de 5 días según el catálogo.

**El catálogo no enumera los campos que exige el formulario oficial de la
autoridad**, así que aquí no se presentan como obligatorios. La tabla recoge el
contenido mínimo que el proyecto necesita para poder reportar; antes del primer
envío real hay que contrastarlo con el formulario vigente y añadir lo que pida.

| Campo | Qué se escribe |
| --- | --- |
| Identificador del incidente | `INC-AAAA-MM-DD-nn` |
| Entidad que reporta | Nombre institucional de quien reporta; la figura de responsable y encargado del tratamiento aún no está definida por escrito |
| Contacto para el reporte | Rol y canal institucional; sin datos personales en esta plantilla |
| Fecha en que se conoció el incidente | Con zona horaria |
| Fecha del incidente | O «en investigación» |
| Tipo | Acceso no autorizado, divulgación, alteración, pérdida o indisponibilidad |
| Descripción | Qué pasó, en lenguaje claro y sin datos personales |
| Categorías de datos afectadas | Identidad, ficha clínica, imagen, documento, consentimiento |
| Número aproximado de titulares | Número; nunca la lista |
| Sistemas afectados | Servicio, tabla, almacenamiento |
| Causa | Conocida o «en investigación» |
| Medidas adoptadas | Contención y corrección, con fechas |
| Riesgo evaluado | Alto, medio o bajo con el motivo que dio la Dirección de tesis; el catálogo no fija escala |
| Notificación a los titulares | Sí / no y fecha (3 días si hay riesgo) |
| Estado | Abierto, contenido o cerrado |
| Seguimiento | Rol responsable y fecha de la próxima revisión |
| Campos del formulario oficial | Pendiente de completar con la autoridad antes del primer envío real |

## Plantilla C — Comunicación a los titulares (3 días, si hay riesgo)

Solo se envía si la evaluación concluye que hay riesgo para los derechos de los
titulares, y con el texto aprobado por la Dirección de tesis. Lenguaje claro: sin
tecnicismos, sin siglas y sin prometer nada que no esté decidido (por ejemplo,
compensaciones).

| Campo | Qué se escribe |
| --- | --- |
| Identificador del incidente | `INC-AAAA-MM-DD-nn` |
| Fecha del incidente | La que se conoce; si no, «en investigación» |
| Qué pasó | Una frase, en lenguaje corriente |
| Qué datos se vieron afectados | Categorías, no contenidos |
| Qué no se vio afectado | Solo si está verificado |
| Qué se hizo y qué falta | Medidas de contención y corrección, con fechas |
| Riesgo para la persona | Explicado sin minimizar ni exagerar |
| Qué puede hacer | Medidas concretas y proporcionadas al riesgo |
| Canal de contacto | Institucional, no un dato personal del equipo |
| Cómo ejercer sus derechos | Canal para acceso, rectificación, eliminación y oposición; el catálogo fija 15 días para responder esas solicitudes |
| Firma | Rol responsable, no una persona concreta |

Texto base para rellenar:

> Asunto: información sobre un incidente que afectó tus datos
>
> Hola:
>
> Te escribimos para informarte de un incidente ocurrido el «fecha»: «qué pasó,
> en una frase».
> Los datos afectados fueron «categorías». «Qué no se vio afectado, si está
> verificado.»
>
> Desde que lo supimos «qué hicimos», y «qué falta».
>
> Por lo que sabemos hasta hoy, el riesgo para ti es «explicación en lenguaje
> claro». Para reducirlo, te recomendamos «medidas concretas».
>
> Si tienes dudas o quieres ejercer tus derechos, escribe a «canal
> institucional».
>
> Atentamente,
> «rol responsable»

## Registro de envíos

| Plantilla | Fecha y hora | Destinatario (rol) | Medio | Acuse | Responsable del envío |
| --- | --- | --- | --- | --- | --- |
| A / B / C | | | | | |

Esta tabla forma parte del documento del incidente y se custodia con él. El
registro de incidentes dentro del sistema (RS-INC-05) todavía no existe, así que
no hay dónde consultarla en la aplicación.

## Revisión

La Dirección de tesis, con asesoría jurídica, revisa y aprueba: los plazos, el
contenido de cada plantilla, la calificación del riesgo y el texto que reciben
los titulares. Este documento no afirma que esa revisión ya ocurrió.
