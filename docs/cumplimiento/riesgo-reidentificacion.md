# HT-071 · Riesgo de reidentificación con k-anonimato

## Alcance y conclusión

Este informe describe el control implementado en los datasets de investigación y el análisis que aún falta para estimar riesgo empírico. El `k` almacenado hoy representa el mínimo de casos del conjunto solicitado; el código no calcula ni demuestra que cada combinación de atributos publicada tenga al menos `k` filas. Por tanto, el control existente no debe interpretarse como garantía de k-anonimato efectivo. (`backend/app/api/datasets.py:37-38,235-258`; `backend/app/models/datasets.py:57-60`.)

No se ejecutó consulta sobre un dataset real ni sobre un contenedor; la consulta reproducible se especifica abajo. No se dispone aquí de una medición empírica para informar.

## Qué se publica y qué queda fuera

- El API expone metadatos del dataset y filas de `CasoAnonimizadoOut`; el listado devuelve solo resúmenes y el detalle añade las filas serializadas (`backend/app/api/datasets.py:73-114,185-205,290-335`).
- Cada fila publicada contiene `sujeto`, edad agrupada, mes del caso, meses y valores/unidades de TSH, T3 y T4, tamaño del nódulo, lateralidad, TI-RADS, Bethesda, CIE-10, tipo de diagnóstico y tipo de consulta (`backend/app/api/datasets.py:73-94`; `backend/app/investigacion/anonimizacion.py:130-156`). Los campos clínicos se conservan aunque algunos no se generalicen.
- Se excluyen del payload los nombres, apellidos, documento, fecha exacta de nacimiento, códigos de paciente y caso, institución, contacto y dirección; el módulo declara que no los copia y que el endpoint no los selecciona para la respuesta (`backend/app/investigacion/anonimizacion.py:5-8`). El vínculo interno `caso_id` se conserva en `datasets_casos`, pero no se serializa; la fila API se forma desde `sujeto` y `datos` (`backend/app/models/datasets.py:3-7,69-85`; `backend/app/api/datasets.py:198-205`).
- `sujeto` es un seudónimo aleatorio nuevo por dataset, no derivado del caso (`backend/app/investigacion/anonimizacion.py:9-11,161-163`). Es seudonimización, no anonimización irreversible: el acceso interno conserva la relación con el caso.
- El resumen expone también `criterios` y la huella del conjunto, además de otros metadatos (`backend/app/api/datasets.py:97-105,185-195`). Deben considerarse parte de la superficie publicada y revisarse al preparar una difusión; el código no cuantifica su riesgo.

## Variables cuasi-identificadoras y transformaciones

La fecha y la edad son cuasi-identificadores evidentes. Los valores clínicos y códigos también pueden actuar como cuasi-identificadores al combinarse con ellos o con información externa. El mapper conserva sus valores numéricos/códigos en lugar de generalizarlos (`backend/app/investigacion/anonimizacion.py:84-97,130-146`).

| Campo original | Campo publicado | Transformación implementada | Granularidad resultante |
| --- | --- | --- | --- |
| Fecha de nacimiento cifrada y fecha de creación del caso | `edad_rango` | Calcula edad a la fecha del caso y agrupa por decenios; edades desde 80 se agrupan en `80+` (`backend/app/investigacion/anonimizacion.py:70-81,100-107,155`). | 10 años; categoría abierta `80+`. |
| Fecha/hora de creación del caso | `mes_caso` | Desplazamiento determinista de 0–364 días ligado al caso mediante HMAC y clave de instalación; después trunca a `AAAA-MM` (`backend/app/investigacion/anonimizacion.py:43-55,58-67,156`). | Mes del año desplazado; no se publica el día. |
| Fecha de TSH | `mes_tsh` | Mismo desplazamiento determinista del caso y truncamiento a `AAAA-MM` (`backend/app/investigacion/anonimizacion.py:58-67,130-133`). | Mes. |
| Fecha de T3 | `mes_t3` | Mismo desplazamiento determinista del caso y truncamiento a `AAAA-MM` (`backend/app/investigacion/anonimizacion.py:58-67,134-136`). | Mes. |
| Fecha de T4 | `mes_t4` | Mismo desplazamiento determinista del caso y truncamiento a `AAAA-MM` (`backend/app/investigacion/anonimizacion.py:58-67,137-139`). | Mes. |
| Valores de TSH, T3 y T4 | `tsh`, `t3`, `t4` | Conversión a número `float`; no hay redondeo ni agrupación (`backend/app/investigacion/anonimizacion.py:84-85,131-139`). | Valor numérico conservado. |
| Unidades de TSH, T3 y T4 | `tsh_unidad`, `t3_unidad`, `t4_unidad` | Conserva el texto si cumple el patrón permitido; de lo contrario devuelve `null` (`backend/app/investigacion/anonimizacion.py:46,94-97,131-139`). | Unidad textual original válida. |
| Tamaño de nódulo | `tamano_nodulo_mm` | Conversión a número `float`, sin redondeo o intervalos (`backend/app/investigacion/anonimizacion.py:84-85,140`). | Valor numérico conservado. |
| Lateralidad, TI-RADS, Bethesda, CIE-10, tipo de diagnóstico y tipo de consulta | Mismos campos | Conserva el valor si cumple el patrón alfanumérico/código permitido; de lo contrario devuelve `null` (`backend/app/investigacion/anonimizacion.py:45,88-92,141-146`). | Código/categoría original válida; no se agrupa. |
| Identidad y códigos directos de persona/caso | No se publican | No se copian a la fila de respuesta (`backend/app/investigacion/anonimizacion.py:5-8,150-158`). | Excluidos del payload; el vínculo de caso subsiste solo en almacenamiento interno (`backend/app/models/datasets.py:69-85`). |

`_mes` aplica el mismo desplazamiento por caso a las fechas de caso y laboratorio. Esto mantiene relaciones temporales aproximadas dentro del caso; no equivale a eliminar información temporal (`backend/app/investigacion/anonimizacion.py:12-16,53-67`).

## Qué significa `k` y cómo medir el efectivo

El endpoint fija `K_MINIMO = 5`; rechaza con `k_insuficiente` una solicitud cuyo parámetro `k` sea inferior al umbral y con `conjunto_insuficiente` si el número de casos filtrados es menor que el `k` solicitado (`backend/app/api/datasets.py:37-38,235-249`). El modelo de datos refuerza `k >= 5` y `total_casos >= k` con restricciones `CheckConstraint` (`backend/app/models/datasets.py:57-60`). Estas reglas limitan el tamaño global, no las frecuencias de cada perfil de atributos.

Para medir el k efectivo de un dataset concreto, se debe agrupar por todos los atributos anonimizados de `datos` y excluir `sujeto`, que es un identificador aleatorio por fila/dataset. Como `datos` es el JSONB de atributos clínicos almacenado por fila (`backend/app/models/datasets.py:69-85`), esta consulta obtiene el tamaño de cada clase de equivalencia de payload y su mínimo:

```sql
WITH clases AS (
    SELECT datos, COUNT(*) AS n
    FROM datasets_casos
    WHERE dataset_id = :dataset_id
    GROUP BY datos
)
SELECT MIN(n) AS k_efectivo,
       COUNT(*) AS numero_clases,
       COUNT(*) FILTER (WHERE n < :k_publicado) AS clases_bajo_k
FROM clases;
```

Ejecutar con parámetros enlazados `dataset_id` (UUID del dataset) y `k_publicado` (su `datasets.k`) en una sesión con acceso a la base de datos. La agrupación por `datos` incluye todos los valores publicados, incluidos nulos y los campos clínicos que podrían singularizar a alguien; no incluye el seudónimo por fila. Un resultado menor que el `k` publicado significa que el umbral del endpoint no se satisface para todas las clases. La consulta describe el cálculo pendiente; no se ejecutó ni se obtuvo salida real.

## Riesgos residuales y mitigación

1. **Atributos sensibles y clínicos conservados.** Diagnósticos, códigos, clasificaciones y valores de laboratorio pueden revelar información sensible; algunos valores numéricos exactos o códigos poco frecuentes pueden también singularizar una fila. La función los convierte o filtra, pero no los generaliza (`backend/app/investigacion/anonimizacion.py:84-97,130-146`). Antes de una publicación concreta, calcular frecuencias por payload y evaluar el riesgo de inferencia; suprimir o agrupar atributos raros y reducir precisión cuando el análisis lo justifique.
2. **Unicidad por combinación.** Agrupar edad en decenios y fechas a mes no garantiza que la combinación de edad, cronología y variables clínicas no sea única. El control actual solo compara cantidad total con `k`, no frecuencias de equivalencia (`backend/app/api/datasets.py:243-258`; `backend/app/models/datasets.py:57-60`). Ejecutar la consulta anterior por versión y no distribuir una versión con clases por debajo del umbral que se adopte.
3. **Series temporales.** Los meses desplazados conservan orden/intervalos aproximados y el mismo desplazamiento se aplica a fechas de un caso; fechas y resultados sucesivos pueden permitir enlace con fuentes externas o revelar evolución clínica (`backend/app/investigacion/anonimizacion.py:12-16,53-67,130-139`). Revisar el riesgo de enlace en el contexto de publicación; considerar agregación temporal, reducción de precisión o exclusión de la secuencia cuando sea necesario.
4. **Enlace y metadatos.** Aunque el seudónimo cambia por dataset, fechas, valores y `criterios` pueden facilitar enlace entre conjuntos o con fuentes externas (`backend/app/investigacion/anonimizacion.py:9-16,161-163`; `backend/app/api/datasets.py:97-105,185-195`). Evaluar también los metadatos y la combinación de datasets, no solo una exportación aislada.

Estas son medidas de reducción de riesgo propuestas, no una afirmación de cumplimiento legal o de anonimización irreversible. La autorización y condiciones de publicación requieren revisión del contexto y, cuando corresponda, revisión legal.

## Evidencia de pruebas existentes

Las pruebas demuestran controles funcionales, pero no sustituyen la medición de k efectivo sobre datos reales:

- `test_crear_dataset_solo_con_consentimiento_de_investigacion` valida el conjunto de cinco casos, `k=5` y persistencia de la huella (`backend/tests/test_datasets.py:151-163`).
- `test_k_menor_que_cinco_es_422` y `test_conjunto_menor_que_k_es_422` comprueban el rechazo del valor de `k` bajo el mínimo y del conjunto menor que el umbral (`backend/tests/test_datasets.py:198-222`).
- `test_anonimizacion_campo_a_campo` comprueba campos permitidos, exclusión de identificadores directos, edad/meses, campos clínicos y sujetos distintos (`backend/tests/test_datasets.py:238-297`).
- `test_listar_datasets` y `test_detalle_dataset` comprueban que el listado no incluye las filas y que el detalle las incluye (`backend/tests/test_datasets.py:166-195`).
- `test_sin_permiso_responde_403` y `test_sin_sesion_responde_401` comprueban controles de acceso a los endpoints (`backend/tests/test_datasets.py:225-235`).

Ninguna de estas pruebas calcula frecuencias de combinaciones o verifica un mínimo de `k` para cada clase de equivalencia (`backend/tests/test_datasets.py:151-356`).

## Pendiente para medir riesgo sobre datos reales

Para cerrar la medición falta seleccionar una versión concreta del dataset (identificador, filtros y fecha de generación), ejecutar la consulta anterior con acceso al contenedor/base de datos de esa instalación, conservar la salida y revisar las clases raras junto con el contexto de destinatarios y fuentes externas. También falta acordar umbrales y medidas de publicación para atributos clínicos y secuencias temporales. Mientras no exista ese análisis, `k` debe describirse como tamaño mínimo de cohorte solicitado, no como valor de k-anonimato efectivo demostrado.
