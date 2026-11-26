# Kit de evaluación UnUQ

Material versionado para medir la usabilidad percibida de OPTIMUS-THY con el instrumento UnUQ del artículo de referencia (`docs/referencia/03-articulo-UnUQ/paper_UnUQ.md`). Sustituye el uso de la pantalla de demostración como registro de respuestas: la pantalla enseña el instrumento con datos sintéticos; la sesión real se registra en `hoja-de-respuestas.csv`.

## Qué contiene

| Archivo | Para qué |
| --- | --- |
| `consentimiento-informado.md` | Hoja que firma cada evaluador antes de empezar |
| `tareas-por-rol.md` | Tareas guiadas según el rol del evaluador |
| `cuestionario-22-items.md` | Los 22 ítems del artículo, con escala y clave de inversión |
| `hoja-de-respuestas.csv` | Plantilla sin datos personales, una fila por evaluador |
| `calculo-y-analisis.md` | Fórmula, normalización, escala descriptiva y qué informar |

## Composición de la muestra

Diez evaluadores: 4 médicos, 3 investigadores y 3 administradores. Se mantiene la proporción del protocolo del producto; si un rol no consigue evaluadores, se anota la desviación en el informe y no se reasigna en silencio.

## Orden de la sesión (30–40 min por evaluador)

1. Leer y firmar `consentimiento-informado.md`. Se guarda la firma en papel aparte; el CSV solo lleva el código del evaluador.
2. Introducir el propósito en dos frases: se evalúa la usabilidad percibida del sistema, no su desempeño clínico; no hay respuestas correctas.
3. Aplicar las tareas del rol según `tareas-por-rol.md`, con el sistema real y datos sintéticos de demostración. El evaluador puede pensar en voz alta; el facilitador no explica la interfaz salvo bloqueo total, y anota cada ayuda.
4. Entregar `cuestionario-22-items.md` y responder sin prisa. El evaluador puede releer los ítems.
5. Registrar las respuestas en `hoja-de-respuestas.csv` con el código del evaluador y la fecha.
6. Agradecer y cerrar; no se comparten puntuaciones individuales.

## Reglas

- Sin datos de pacientes ni información clínica real en la sesión, el CSV ni las notas.
- Código de evaluador asignado por el tesista (`E01`…`E10`); la tabla de correspondencia código–persona vive fuera del repositorio.
- Un ítem se responde una sola vez; si el evaluador duda, se registra el valor elegido y el comentario aparte, no se corrige después.
- Las respuestas no se modifican para mejorar el resultado; los ítems negativos se invierten al calcular, no al registrar.
