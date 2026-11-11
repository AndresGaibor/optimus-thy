# Fichas sintéticas de prueba del OCR (HT-091, HT-092 y HT-093)

Fichas inventadas, generadas por un script reproducible, para probar la extracción
de campos del OCR y, más adelante, medir su exactitud. No describen personas ni
casos clínicos reales y no se guardan en el repositorio: se regeneran cuando hacen
falta.

## Qué genera

`backend/scripts/generar_fixtures_fichas.py` escribe en el directorio de destino:

| Archivo | Qué es |
| --- | --- |
| `ficha-digital-coma-con-unidad.pdf` | Ficha en tabla; valores con coma decimal y unidad (`TSH 2,5 mU/L`) |
| `ficha-digital-punto-con-unidad.pdf` | Ficha en tabla; valores con punto decimal y unidad (`2.5 mU/L`) |
| `ficha-digital-punto-sin-unidad.pdf` | Ficha en formulario; valores con punto decimal y sin unidad (`0.8`) |
| `*-escaneado.png` | La misma página con ruido, manchas y una inclinación de ±1,8°: una por PDF |
| `referencia.json` | Valor correcto de cada campo en cada ficha |

Cada ficha lleva la misma estructura de campos clínicos:

- identificación sintética (código `SINT-000N`, nombre «Paciente Sintético NN» y el
  aviso de que el documento es una prueba);
- TSH, T3 y T4 con su unidad y la fecha del laboratorio;
- tamaño del nódulo, lateralidad, TI-RADS y Bethesda.

Los siete campos que se medirán son `tsh`, `t3`, `t4`, `tamano_nodulo_mm`,
`lateralidad`, `tirads` y `bethesda`. En `referencia.json` cada campo trae `tipo`,
`valor` (normalizado, con punto decimal), `texto` (lo que queda impreso: separador
y unidad según el diseño) y, cuando aplica, `unidad` y `fecha`.

El diseño «sin unidad» omite la unidad solo en los valores de laboratorio; el
tamaño del nódulo conserva `mm` porque la cifra no significa nada sin ella.

## Cómo se regenera

```bash
cd backend
python -m scripts.generar_fixtures_fichas --destino var/fixtures-fichas
```

Opciones: `--destino` (por defecto `var/fixtures-fichas`, ignorado por git) y
`--semilla` (por defecto `2026`). La semilla alimenta el ruido y la inclinación de
los escaneados; los valores clínicos son fijos en el código.

Determinismo: la misma semilla escribe los mismos bytes. El PDF de Pillow sella la
fecha de creación con el reloj del sistema, así que el script la sustituye por una
constante antes de guardar. Dos ejecuciones, incluso en procesos distintos,
producen archivos idénticos.

## Para qué sirve

- HT-091: tres plantillas con variaciones de escritura de los valores.
- HT-092: versión escaneada de cada ficha, con ruido e inclinación reproducibles.
- HT-093: `referencia.json` como conjunto de referencia para medir la exactitud
  por campo cuando el servicio de OCR y las reglas de extracción estén
  implementados (HT-040, HT-041 y HT-043).

El servicio de OCR de `ocr/` ya implementa `POST /reconocer` con contrato 1.0
(ver `docs/arquitectura/servicio-ocr.md`); lo que falta es la medición de
exactitud por campo (HT-043) y las reglas de extracción (HT-041). Mientras tanto
estas fichas son el material de entrada y la verdad de referencia. Cualquier
informe de exactitud debe declarar que los datos son sintéticos (RS-LEG-11).

Las pruebas que cubren el generador están en
`backend/tests/test_fixtures_fichas.py`.
