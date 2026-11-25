# HT-071 · Riesgo de reidentificación con k-anonimato

## Alcance y conclusión

Este informe describe el control implementado en los datasets de investigación y el análisis residual de riesgo. El hueco de control por clase de equivalencia queda resuelto: al crear, el endpoint comprueba que cada combinación de atributos de baja cardinalidad alcance `k`, rechaza clases pequeñas y devuelve `k_efectivo`, el mínimo por clase. Esto no demuestra anonimización irreversible ni elimina el riesgo por atributos sensibles o información externa. (`backend/app/api/datasets.py`; `backend/app/investigacion/anonimizacion.py`.)

No se ejecutó consulta sobre un dataset real ni sobre un contenedor; la consulta reproducible se especifica abajo. No se dispone aquí de una medición empírica para informar.

## Qué se publica y qué queda fuera

- El API expone metadatos del dataset y filas de `CasoAnonimizadoOut`; el listado devuelve solo resúmenes y el detalle añade las filas serializadas (`backend/app/api/datasets.py:73-114,185-205,290-335`).
- Cada fila publicada contiene `sujeto`, edad agrupada, mes del caso, meses y valores/unidades de TSH, T3 y T4, tamaño del nódulo, lateralidad, TI-RADS, Bethesda, CIE-10, tipo de diagnóstico y tipo de consulta (`backend/app/api/datasets.py:73-94`; `backend/app/investigacion/anonimizacion.py:130-156`). Los campos clínicos se conservan aunque algunos no se generalicen.
- Se excluyen del payload los nombres, apellidos, documento, fecha exacta de nacimiento, códigos de paciente y caso, institución, contacto y dirección; el módulo declara que no los copia y que el endpoint no los selecciona para la respuesta (`backend/app/investigacion/anonimizacion.py:5-8`). El vínculo interno `caso_id` se conserva en `datasets_casos`, pero no se serializa; la fila API se forma desde `sujeto` y `datos` (`backend/app/models/datasets.py:3-7,69-85`; `backend/app/api/datasets.py:198-205`).
- `sujeto` es un seudónimo aleatorio nuevo por dataset, no derivado del caso (`backend/app/investigacion/anonimizacion.py:9-11,161-163`). Es seudonimización, no anonimización irreversible: el acceso interno conserva la relación con el caso.
- El resumen expone también `criterios` y la huella del conjunto, además de otros metadatos (`backend/app/api/datasets.py:97-105,185-195`). Deben considerarse parte de la superficie publicada y revisarse al preparar una difusión; el código no cuantifica su riesgo.

## Variables cuasi-identificadoras y transformaciones

La clave del control incluye edad agrupada (`edad_rango`), meses desplazados (`mes_caso`, `mes_tsh`, `mes_t3`, `mes_t4`) y categorías clínicas (`lateralidad`, `tirads`, `bethesda`, `cie10`, `tipo_diagnostico`, `tipo_consulta`). La fila actual no publica sexo. `tsh`, `t3`, `t4` y `tamano_nodulo_mm` son atributos sensibles, no cuasi-identificadores de esta clave; se conservan sin generalizar y su riesgo de inferencia permanece como residual.

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

El endpoint fija `K_MINIMO = 5`; rechaza con `k_insuficiente` una solicitud cuyo `k` sea inferior al umbral y con `conjunto_insuficiente` si los casos filtrados son menos que el `k` solicitado. Después agrupa por los cuasi-identificadores descritos arriba: si alguna clase tiene menos de `k` filas responde `k_no_alcanzado` indicando solo cuántas clases incumplen; si todas cumplen, expone `k_efectivo` como su mínimo. El modelo sigue reforzando `k >= 5` y `total_casos >= k` (`backend/app/api/datasets.py`; `backend/app/models/datasets.py:57-60`).

El `k_efectivo` del endpoint se calcula agrupando por los atributos de baja cardinalidad publicados, excluyendo `sujeto` y los atributos sensibles. Esta consulta reproduce el cálculo para auditar un dataset concreto; no ejecuta ni reemplaza una evaluación contextual de riesgo:

```sql
WITH clases AS (
    SELECT datos->>'edad_rango' AS edad_rango,
           datos->>'mes_caso' AS mes_caso,
           datos->>'mes_tsh' AS mes_tsh,
           datos->>'mes_t3' AS mes_t3,
           datos->>'mes_t4' AS mes_t4,
           datos->>'lateralidad' AS lateralidad,
           datos->>'tirads' AS tirads,
           datos->>'bethesda' AS bethesda,
           datos->>'cie10' AS cie10,
           datos->>'tipo_diagnostico' AS tipo_diagnostico,
           datos->>'tipo_consulta' AS tipo_consulta,
           COUNT(*) AS n
    FROM datasets_casos
    WHERE dataset_id = :dataset_id
    GROUP BY datos->>'edad_rango', datos->>'mes_caso',
             datos->>'mes_tsh', datos->>'mes_t3', datos->>'mes_t4',
             datos->>'lateralidad', datos->>'tirads', datos->>'bethesda',
             datos->>'cie10', datos->>'tipo_diagnostico', datos->>'tipo_consulta'
)
SELECT MIN(n) AS k_efectivo,
       COUNT(*) AS numero_clases,
       COUNT(*) FILTER (WHERE n < :k_publicado) AS clases_bajo_k
FROM clases;
```

Ejecutar con parámetros enlazados `dataset_id` (UUID del dataset) y `k_publicado` (su `datasets.k`) en una sesión con acceso a la base de datos. La agrupación coincide con la clave del endpoint: incluye nulos y categorías/momentos desplazados, pero no `sujeto`, valores hormonales ni tamaño del nódulo. No se ejecutó ni se obtuvo salida real.

## Riesgos residuales y mitigación

1. **Atributos sensibles y clínicos conservados.** Diagnósticos, códigos, clasificaciones y valores de laboratorio pueden revelar información sensible; algunos valores numéricos exactos o códigos poco frecuentes pueden también singularizar una fila. La función los convierte o filtra, pero no los generaliza (`backend/app/investigacion/anonimizacion.py:84-97,130-146`). Antes de una publicación concreta, calcular frecuencias por payload y evaluar el riesgo de inferencia; suprimir o agrupar atributos raros y reducir precisión cuando el análisis lo justifique.
2. **Unicidad por combinación.** Edad agrupada, meses y categorías clínicas aún pueden formar perfiles raros o únicos. El endpoint ahora rechaza toda creación con clases bajo el umbral y devuelve el mínimo efectivo, pero la garantía solo abarca la clave de baja cardinalidad indicada (`backend/app/api/datasets.py`). Los atributos sensibles excluidos de esa clave pueden facilitar inferencia o singularización; revisar su riesgo antes de distribuir una versión.
3. **Series temporales.** Los meses desplazados conservan orden/intervalos aproximados y el mismo desplazamiento se aplica a fechas de un caso; fechas y resultados sucesivos pueden permitir enlace con fuentes externas o revelar evolución clínica (`backend/app/investigacion/anonimizacion.py:12-16,53-67,130-139`). Revisar el riesgo de enlace en el contexto de publicación; considerar agregación temporal, reducción de precisión o exclusión de la secuencia cuando sea necesario.
4. **Enlace y metadatos.** Aunque el seudónimo cambia por dataset, fechas, valores y `criterios` pueden facilitar enlace entre conjuntos o con fuentes externas (`backend/app/investigacion/anonimizacion.py:9-16,161-163`; `backend/app/api/datasets.py:97-105,185-195`). Evaluar también los metadatos y la combinación de datasets, no solo una exportación aislada.

Estas son medidas de reducción de riesgo propuestas, no una afirmación de cumplimiento legal o de anonimización irreversible. La autorización y condiciones de publicación requieren revisión del contexto y, cuando corresponda, revisión legal.

## Evidencia de pruebas existentes

Las pruebas demuestran controles funcionales, pero no sustituyen la medición de k efectivo sobre datos reales:

- `test_crear_dataset_solo_con_consentimiento_de_investigacion` comprueba una cohorte con `k_efectivo` válido y persistencia de la huella (`backend/tests/test_datasets.py`).
- `test_clases_con_k_suficiente_incluyen_k_efectivo` verifica dos clases suficientes y el mínimo informado.
- `test_clase_bajo_k_es_422_sin_exponer_valores` comprueba `k_no_alcanzado`, el número de clases incumplidas y que no se revelan sus valores.
- `test_k_menor_que_cinco_es_422` y `test_conjunto_menor_que_k_es_422` cubren los umbrales existentes.
- Las pruebas de anonimización, consulta y permisos siguen comprobando campos publicados, listado/detalle y controles de acceso (`backend/tests/test_datasets.py`).

Las pruebas son sintéticas: no calculan el riesgo de reidentificación en datos reales ni evalúan inferencia a partir de atributos sensibles o fuentes externas.

## Pendiente para medir riesgo sobre datos reales

Para cerrar la evaluación empírica falta seleccionar una versión concreta del dataset (identificador, filtros y fecha de generación), ejecutar la consulta anterior con acceso a la base de datos de esa instalación, conservar la salida y revisar las clases raras junto con el contexto de destinatarios y fuentes externas. También falta acordar medidas de publicación para atributos clínicos y secuencias temporales. Hasta completar ese análisis, `k_efectivo` demuestra el mínimo sobre la clave publicada de baja cardinalidad, no cumplimiento legal ni ausencia de riesgo residual.
