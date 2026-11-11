# Medición de la calidad del OCR (HT-043)

- Fecha de ejecución: 2026-11-10
- Contrato del servicio OCR: `1.1`
- Motor medido: `tesseract`
- Directorio de fichas: `/tmp/fichas`

## Meta (fijada antes de medir)

Se fija antes de ejecutar la medición y antes de observar los resultados:

- **Exactitud por campo ≥ 0,90** sobre las fichas digitales (PDF).
- **Cero campos incorrectos sin marcar como `revisar`** en las fichas digitales.

Esta meta se declara de forma previa a la medición; los resultados de este informe son la primera observación registrada con este script sobre el conjunto de referencia indicado.

## Método

1. Se generan las fichas sintéticas y su referencia con `backend/scripts/generar_fixtures_fichas.py` (HT-093), que produce tres fichas digitales (PDF), sus versiones escaneadas (PNG) y `referencia.json` con los valores esperados normalizados.
2. El script `ocr/scripts/medir_calidad.py` recorre las fichas digitales (`archivo_pdf`) del directorio, envía cada PDF a `/reconocer` con el motor indicado y compara la respuesta campo a campo contra `referencia.json`.
3. Campos medidos (7): `tsh`, `t3`, `t4`, `tamano_nodulo_mm`, `lateralidad`, `tirads`, `bethesda`.
4. Normalización para comparar: se admiten coma y punto como separador decimal; la comparación numérica es exacta sobre el valor numérico; la comparación textual no distingue mayúsculas/minúsculas.
5. Por cada comparación se registra: acierto, fallo (valor distinto) o ausente (el motor no devolvió el campo). En los fallos se anota si el campo venía marcado con `revisar=true`.
6. Todos los números y tablas de este informe son calculados por el script a partir de esa ejecución.

## Comandos

```bash
# 1) Generar las fichas sintéticas de referencia
cd backend && .venv/bin/python scripts/generar_fixtures_fichas.py --destino /tmp/fichas

# 2) Ejecutar la medición con Tesseract y escribir el informe
cd ocr && .venv/bin/python scripts/medir_calidad.py /tmp/fichas --motor tesseract --salida docs/pruebas/medicion-ocr.md --fecha 2026-11-10
```

## Resultados por campo

| Campo | Aciertos | Fallos | Ausentes | Fallos marcados `revisar` | Fallos sin `revisar` | Exactitud |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| TSH | 3 | 0 | 0 | 0 | 0 | 1.00 |
| T3 | 2 | 0 | 1 | 0 | 1 | 0.67 |
| T4 | 2 | 0 | 1 | 0 | 1 | 0.67 |
| Tamaño del nódulo (mm) | 3 | 0 | 0 | 0 | 0 | 1.00 |
| Lateralidad | 3 | 0 | 0 | 0 | 0 | 1.00 |
| TI-RADS | 3 | 0 | 0 | 0 | 0 | 1.00 |
| Bethesda | 2 | 0 | 1 | 0 | 1 | 0.67 |

## Resultados por ficha

| Ficha | Archivo (PDF) | Aciertos | Fallos | Ausentes | Fallos sin `revisar` | Exactitud |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| Ficha 01 · tabla, coma decimal con unidad | `ficha-digital-coma-con-unidad.pdf` | 7 | 0 | 0 | 0 | 1.00 |
| Ficha 02 · tabla, punto decimal con unidad | `ficha-digital-punto-con-unidad.pdf` | 7 | 0 | 0 | 0 | 1.00 |
| Ficha 03 · formulario, punto decimal sin unidad | `ficha-digital-punto-sin-unidad.pdf` | 4 | 0 | 3 | 3 | 0.57 |

## Resumen

- Aciertos / total: **18/21** (exactitud global 0.8571).
- Fallos: **0** · Ausentes: **3**.
- Fallos marcados `revisar`: **0/3** (cobertura de `revisar` sobre fallos/ausentes: 0/3).
- Fallos/ausentes sin `revisar`: **3**.

## Detalle de fallos y ausencias

| Ficha | Campo | Esperado | Obtenido | `revisar` | Causa |
| --- | --- | --- | --- | --- | --- |
| Ficha 03 · formulario, punto decimal sin unidad | T3 | `1.4` | — (ausente) | — | el motor no devolvió el valor |
| Ficha 03 · formulario, punto decimal sin unidad | T4 | `9.1` | — (ausente) | — | el motor no devolvió el valor |
| Ficha 03 · formulario, punto decimal sin unidad | Bethesda | `II` | — (ausente) | — | el motor no devolvió el valor |

## GLM-OCR: por qué no se mide a escala en este host

No se incluye una corrida completa con `--motor glm` en este host por costo de cómputo, no por falta de integración:

- **Entorno:** host `arm64`, ejecución en CPU (sin aceleración GPU).
- **Tiempo observado:** ≈ **1,1 s por token** generado; una página de ficha tarda entre **6 y 15 minutos** en reconocerse (según la cantidad de texto/bloques).
- **Impacto:** medir el conjunto de referencia completo con GLM-OCR en CPU implica decenas de minutos por corrida, lo que impide iterar y dejar evidencia reproducible en el mismo ciclo que la medición con Tesseract.

**Qué haría falta para medirlo a escala:** ejecutar el servicio OCR con GLM-OCR sobre **GPU** y servir el modelo mediante **vLLM** (u otro servidor de inferencia con batching y kernels GPU). Con ese despliegue el tiempo por página baja a un rango interactivo y la misma medición (`ocr/scripts/medir_calidad.py --motor glm ...`) puede correrse sobre el conjunto completo y registrarse con el mismo formato de informe.

## Reproducibilidad

- El informe se regenera ejecutando el script con los mismos argumentos y el mismo `--fecha`; el contenido es determinista salvo la fecha indicada.
- La referencia de fichas es sintética (sin datos personales) y reproducible con la semilla documentada por el generador.
