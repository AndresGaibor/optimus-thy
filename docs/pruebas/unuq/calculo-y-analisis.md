# Cálculo y análisis

## Registro

Cada evaluador ocupa una fila de `hoja-de-respuestas.csv`: `codigo,rol,fecha,S1..S22`. Se registran las respuestas tal como se dieron, de 1 a 5, sin invertir nada a mano.

## Puntuación

1. **Contribución por ítem**, rango 0–4:
   - ítems positivos: `respuesta − 1`
   - ítems invertidos (S3, S6, S8, S13, S16, S18, S22): `5 − respuesta`
2. **Suma** de las 22 contribuciones: rango 0–88.
3. **Puntuación UnUQ** = `suma × 100 / 88`, redondeada al entero. Es la normalización del artículo: el máximo bruto es 88 porque son 22 ítems con 4 puntos útiles cada uno.

Comprobaciones: todas las respuestas en 3 dan 50; todo en 5 da 68; todo en 1 da 32; el extremo favorable (5 en los positivos y 1 en los invertidos) da 100.

## Desglose por los siete atributos

Cada atributo agrupa sus ítems (3 o 4), se promedia la contribución en escala 0–4 y se lleva a 0–100 con `promedio × 25`. Todos los atributos pesan 1/7. El agrupamiento:

| Atributo | Ítems |
| --- | --- |
| Efectividad | S1, S2, S3 |
| Eficiencia | S4, S5, S6 |
| Satisfacción | S7, S8, S9 |
| Aprendizaje y memoria | S10, S11, S12, S13 |
| Accesibilidad | S14, S15, S16 |
| Usabilidad | S17, S18, S19 |
| Aceptación | S20, S21, S22 |

## Escala descriptiva (artículo, tabla 7)

| Puntuación | Adjetivo | Interpretación |
| --- | --- | --- |
| 85–100 | Excelente | Usabilidad sobresaliente; los usuarios quieren seguir usándolo |
| 70–84 | Buena | Usabilidad percibida alta; práctico y cómodo para la mayoría |
| 50–69 | Aceptable | Usabilidad suficiente con problemas menores |
| 30–49 | Deficiente | Usabilidad limitada; obstáculos que afectan la experiencia |
| 0–29 | Inaceptable | Deficiencia grave; puede requerir rediseño |

La meta de referencia del producto es ≥ 70.

## Qué informar

- Puntuación por evaluador, media, mediana, mínimo y máximo de los diez.
- Media por atributo con su desviación o rango, y el atributo más bajo como foco de mejora.
- Tareas: cuántas se completaron, cuántas con ayuda y cuáles fallaron; las ayudas son evidencia cualitativa.
- Comentarios anónimos por código de evaluador.
- Desviaciones de la muestra (por ejemplo, menos de 4 médicos) y cualquier ítem omitido.

## Reproducir el cálculo con la implementación

La función `calcularPuntajeUnuq` de `frontend/src/screens/fixtures/unuq-extra.ts` aplica esta misma fórmula y tiene pruebas en `unuq-extra.test.ts`; sirve para verificar la hoja antes de publicar cifras.

```sh
cd frontend && bunx vitest run --project=app src/screens/fixtures/unuq-extra.test.ts
```
