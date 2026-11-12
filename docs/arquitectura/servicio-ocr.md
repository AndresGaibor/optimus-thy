# Servicio de OCR local (HT-040)

Servicio HTTP de `ocr/` que recibe una ficha en PDF, JPG o PNG y devuelve texto,
bloques y confianza. El código arranca con `OCR_MOTOR=glm`, es decir **GLM-OCR**
con los pesos abiertos (`zai-org/GLM-OCR`, licencia MIT, BF16, ~1,325 B
parámetros); la alternativa ligera es **Tesseract** en español. GLM-OCR necesita
un servidor de inferencia aparte y, en un host sin GPU, tarda minutos por página
(«Qué cuesta en CPU»); ahí conviene `OCR_MOTOR=tesseract`. Salvo que se permita
expresamente la API hospedada, nada sale del equipo (CA-04, RF-DOC-05, RI-05).

## Contrato 1.1

`GET /health` → `{status, servicio, motor, modelo, modelo_cargado, version_contrato}`
y, cuando `status` es `degradado`, un `detalle` con el motivo (por ejemplo «el
paquete glmocr no está instalado»). `modelo_cargado` significa que el motor y sus
pesos están presentes, no que estén en memoria.

`POST /reconocer` (multipart, campo `documento`):

```json
{
  "version_contrato": "1.1",
  "motor": "glm-ocr",
  "modelo": "zai-org/GLM-OCR",
  "huella_modelo": "<sha256 o null>",
  "paginas": 1,
  "texto_markdown": "# Ficha clínica...",
  "bloques": [
    {"pagina": 1, "orden": 0, "etiqueta": "text", "texto": "TSH 2,5 mU/L",
     "bbox": [0.12, 0.34, 0.56, 0.38], "confianza": null}
  ],
  "campos": [
    {"nombre": "tsh", "valor": "2.5", "texto_origen": "TSH 2,5 mU/L",
     "confianza": null, "revisar": false}
  ],
  "avisos": ["1 campo sin confianza del motor"]
}
```

- `bbox` es `[x1, y1, x2, y2]` normalizada 0..1, o `null` si el motor no la da.
- `confianza` va en 0..1 por bloque. GLM-OCR no la reporta: con ese motor es
  `null` y el aviso correspondiente viaja en `avisos`. Tesseract sí la reporta y
  se rellena con la media de sus palabras.
- `etiqueta` ∈ `text`, `table`, `formula`, `image`.
- `huella_modelo` identifica los pesos desplegados: sha256 del inventario de
  archivos (ruta relativa y tamaño) del directorio de pesos con GLM-OCR, y sha256
  de la versión del binario con Tesseract. Es `null` si no hay pesos locales.
- Rechazos: tipo no admitido → 415, más de `OCR_MAX_BYTES` (20 MB) → 413,
  documento vacío → 422, motor no disponible → 503, fallo del motor → 500. Los
  mensajes de error no incluyen rutas ni trazas.

## Campos que reconoce

`campos` solo trae los valores encontrados, cada uno con `nombre`, `valor`,
`texto_origen`, `confianza` (la del bloque del motor, `null` si no la reporta) y
`revisar` (conviene confirmarlo). Una confianza por debajo de
`OCR_CONFIANZA_MINIMA` (0,60 por defecto) marca el campo.

|Campo|Qué reconoce|Qué lo hace dudoso|
| --- | --- | --- |
| `tsh`, `t3`, `t4` | Número con coma o punto decimal, con o sin unidad (mU/L, ng/mL, ng/dL…), en la línea de la etiqueta o en el bloque siguiente | Confianza del motor por debajo del mínimo; valor fuera del rango sensato (TSH 0–100, T3 0–20, T4 0–30) |
| `fecha_laboratorio` | Fecha de laboratorio o de muestra en `dd/mm/aaaa`, `aaaa-mm-dd` o `dd-mm-aaaa`; se normaliza a `aaaa-mm-dd` | Fecha imposible (por ejemplo 45/13/2026) o confianza baja; si falta el año el campo no aparece |
| `tamano_nodulo_mm`, `lateralidad`, `tirads`, `bethesda` | Tamaño en mm (los cm se convierten), lateralidad lóbulo derecho, izquierdo o istmo, TI-RADS 1–5 y Bethesda I–VI en cifra o romano | Token ambiguo del motor (una `l` suelta no se convierte en romano y el campo no aparece); valor fuera de la escala; confianza baja |
| `histopatologia` | Carcinoma papilar (con variantes folicular y de células altas), folicular, medular, anaplásico o indiferenciado, bocio (multinodular, coloide), adenoma folicular, tiroiditis de Hashimoto o linfocítica e hiperplasia; devuelve el nombre canónico en español | Sin etiqueta cerca (`Diagnóstico`, `AP`, biopsia, `Conclusión`); dos diagnósticos distintos en el texto: se entrega uno y se marca, no se promedian |
| `cie10` | Código con forma `[A-Z][0-9]{2}(\.[0-9A-Z]{1,2})?` junto a `CIE`, `CIE-10`, `dx` o `diagnóstico`, o de rango tiroideo (`C73`, `E04`–`E06`, `D34`) | Código fuera de esos rangos (se entrega marcado); sin etiqueta y fuera de rango no se toma; un código de morfología como `M8140/3` nunca se toma por CIE-10 |
| `codigo`, `paciente` | Código interno tras `CÓDIGO` y nombre tras `Paciente` o `Nombre del paciente` | Confianza baja del motor, o dos valores distintos del mismo campo en el documento |

`histopatologia` y `cie10` no cambian el marcador de `docs/pruebas/medicion-ocr.md`:
`referencia.json` mide siete campos y no trae esos dos, así que la medición sigue
en 18/21.

## Variables de entorno

| Variable | Por defecto | Qué hace |
| --- | --- | --- |
| `OCR_MOTOR` | `glm` | `glm` o `tesseract`; cualquier otro valor deja el servicio en `degradado` |
| `OCR_MODELO_DIR` | — | Ruta local con los pesos de `zai-org/GLM-OCR`. Los carga el servidor de inferencia, no el SDK; el servicio solo comprueba que la carpeta exista y calcula su huella |
| `OCR_MODELO_LAYOUT_DIR` | — | Ruta local con los pesos del detector de layout (`PP-DocLayoutV3`), que sí carga el SDK en proceso; sin ella se buscan en la caché de Hugging Face |
| `OCR_MAX_BYTES` | `20971520` | Tamaño máximo aceptado (20 MB) |
| `OCR_CONFIANZA_MINIMA` | `0.60` | Confianza mínima (0..1); por debajo, el campo se marca para revisión |
| `OCR_PERMITIR_API_EXTERNA` | `false` | Habilita la API hospedada de GLM-OCR (ver privacidad) |
| `OCR_GLM_API_KEY` | — | Clave de Zhipu; solo se usa si la bandera anterior está encendida |
| `OCR_GLM_API_URL` | la del SDK | Endpoint alternativo de la API, p. ej. `https://api.z.ai/api/paas/v4/layout_parsing` |
| `OCR_GLM_API_HOST` / `OCR_GLM_API_PORT` | `127.0.0.1` / `8080` | Servidor de inferencia local del modo sin API |

## GLM-OCR: pesos y servidor local

El SDK `glmocr` **no carga el modelo**: hace el análisis de layout y llama a un
servidor de inferencia compatible con OpenAI que sirve `zai-org/GLM-OCR` en el
propio equipo. La llamada que hace el servicio (`ocr/app/motores.py`):

```python
import glmocr

with glmocr.GlmOcr(
    mode="selfhosted",           # nunca MaaS si no se permite la API
    ocr_api_host="127.0.0.1",
    ocr_api_port=8080,
    model="glm-ocr",
    layout_device="cpu",
    _dotted={"pipeline.layout.model_dir": "/srv/modelos/pp-doclayout"},
) as parser:
    resultado = parser.parse(pdf_bytes)   # acepta bytes, rutas y URLs
    resultado.markdown_result             # Markdown
    resultado.json_result                 # páginas → bloques con bbox_2d 0..1000
```

Pasos:

1. Instalar el motor: `pip install -r ocr/requirements-glm.txt` (trae
   `glmocr[selfhosted]`: torch, transformers, PyMuPDF…). En x86_64 sin GPU,
   instalar antes `torch` desde `https://download.pytorch.org/whl/cpu` para no
   bajar ~2,5 GB de CUDA.
2. Descargar los pesos `zai-org/GLM-OCR` (Hugging Face o ModelScope) en el equipo
   donde corre el servidor de inferencia.
3. Servirlos:
   - Con GPU: `vllm serve zai-org/GLM-OCR --port 8080 --served-model-name glm-ocr`.
     vLLM **no** sirve para arm64 ni para CPU.
   - En CPU (o macOS con Apple Silicon): Ollama o mlx-vlm; ambos se configuran
     con el SDK (`pipeline.ocr_api.api_mode: ollama_generate`).
4. Bajar `PP-DocLayoutV3` aparte y apuntar `OCR_MODELO_LAYOUT_DIR` a esa
   carpeta para que el SDK no tenga que descargarla. `OCR_MODELO_DIR` apunta a
   los pesos de `zai-org/GLM-OCR`, que son los que sirve el servidor de
   inferencia del paso 3 y que el SDK nunca abre.

El servicio arranca `HF_HUB_OFFLINE=1`, `TRANSFORMERS_OFFLINE=1` y
`HF_DATASETS_OFFLINE=1` antes de crear el parser: si los pesos del layout no
están en disco, el motor falla y el servicio responde 503; nunca descarga.

### Montar los pesos en Docker Compose

El compose monta una carpeta del host en `/modelos` (solo lectura) y fija
`OCR_MODELO_DIR=/modelos/glm-ocr` dentro del contenedor:

| Pieza | Valor | Variable de `.env` |
| --- | --- | --- |
| `build.args.INSTALAR_GLM` | `false` por defecto | `OCR_INSTALAR_GLM` |
| `environment.OCR_MOTOR` | `glm` por defecto | `OCR_MOTOR` (`glm` o `tesseract`) |
| `environment.OCR_MODELO_DIR` | `/modelos/glm-ocr` (fijo; pesos del OCR) | — |
| `environment.OCR_MAX_BYTES` | `20971520` | `OCR_MAX_BYTES` |
| `environment.OCR_PERMITIR_API_EXTERNA` | `false` | `OCR_PERMITIR_API_EXTERNA` |
| `volumes` | `${OCR_MODELOS_DIR:-./var/modelos-glm}:/modelos:ro` | `OCR_MODELOS_DIR` (ruta del host) |

```bash
mkdir -p var/modelos-glm/glm-ocr
# /modelos/glm-ocr: pesos de zai-org/GLM-OCR (model.safetensors, config.json,
# tokenizer…); /modelos/glm-ocr-layout: detector PP-DocLayoutV3
OCR_INSTALAR_GLM=true docker compose up -d --build ocr
docker compose exec ocr python -c "import urllib.request,json; print(json.load(urllib.request.urlopen('http://localhost:8001/health')))"
```

`OCR_INSTALAR_GLM=true` instala `.[glm]` (el SDK con torch) dentro de la imagen;
sin la bandera el build queda ligero y el motor glm no está disponible, así que
`/health` sale `degradado` con «el paquete glmocr no está instalado». Los pesos
tampoco entran en la imagen: `var/modelos-glm/` está en `.gitignore`.

`OCR_MODELO_DIR=/modelos/glm-ocr` contiene los pesos del modelo de completado
(`zai-org/GLM-OCR`), pero el SDK no los abre: solo comprueba que la carpeta
exista y calcula la huella. Quien los carga es el servidor de inferencia, un
proceso aparte en `OCR_GLM_API_HOST:OCR_GLM_API_PORT`, por defecto
`127.0.0.1:8080`; dentro del contenedor ese `127.0.0.1` es el propio contenedor,
así que hay que apuntar `OCR_GLM_API_HOST` al host o al servicio que sirva el
modelo. Sin ese servidor, `/health` queda `degradado` («no hay servidor de
inferencia…») y `/reconocer` responde 503.

El detector de layout sí lo carga el SDK en proceso, y el compose no define
`OCR_MODELO_LAYOUT_DIR`: con los pesos en `/modelos/glm-ocr-layout` hay que
añadir esa variable al servicio; sin ella el SDK los busca en la caché de
Hugging Face y, con `HF_HUB_OFFLINE=1`, falla.

## Qué cuesta en CPU (medido)

Medición sobre este host: Linux arm64, 4 núcleos, sin GPU. Pesos desplegados
`zai-org/GLM-OCR` (`model.safetensors`, 2 650 579 464 bytes, sha256
`a16eb0de98d199293371c560f95f83130d2a2c9612449df16839f08ff9498815`, la del
archivo; `huella_modelo` es la del inventario del directorio) en
`/home/ubuntu/modelos/glm-ocr/`, y el detector de layout `PP-DocLayoutV3`
(128 MB) aparte en `/home/ubuntu/modelos/glm-ocr-layout/`.

| Operación | Entrada | Tiempo | Nota |
| --- | --- | --- | --- |
| Carga del modelo | — | 24,3 s | 16–50 s según la carga de la CPU |
| Recorte de cabecera | 1240×300; 496 tokens de entrada, 83 de salida | 59,3 s | |
| Banda de tabla | 1240×900; 1420 de entrada, 155 de salida | 170,8 s en proceso; 309,8 s por HTTP concurrente | El prefill no domina: ≈1,1 s por token generado |
| Página completa | 1240×1754; 2784 tokens de entrada | Cortada a los 268 s sin terminar | No se obtuvo salida |
| Memoria pico | — | 7,04 GB | RSS estable 5,4 GB, sin swap |
| Página completa por el pipeline del SDK | Layout 21,7 s + 5–6 recortes | 6–15 min | Estimación a partir de las filas anteriores |

El SDK en `mode="selfhosted"` no ejecuta el modelo: habla HTTP contra
`/v1/chat/completions`, así que necesita un servidor OpenAI-compatible (vLLM,
SGLang, Ollama o MLX) sirviendo los pesos. En este host no hay ninguno: vLLM no
publica rueda para arm64 sin GPU, y el SDK no carga los pesos por su cuenta.

| Vía | Estado | Ritmo | Comentario |
| --- | --- | --- | --- |
| GPU + vLLM | Lo que el SDK espera; no disponible en este host | 1,86 páginas/s según el model card de GLM-OCR | `vllm serve zai-org/GLM-OCR`; vLLM no publica rueda arm64 sin GPU |
| Cuantización dinámica int8 | No medida | — | El cuello es el tiempo, no la memoria (7,04 GB); bf16 no ayuda porque el Neoverse N1 de esta máquina no tiene `bf16` ni `i8mm` |
| Tesseract | Funciona hoy | 17 bloques, confianza ≈0,94, menos de 1 s por ficha | Hosts sin GPU |

`OCR_MOTOR` decide el motor: `glm` cuando hay servidor de inferencia sobre GPU,
`tesseract` en cualquier host sin GPU. Con `glm`, `OCR_MODELO_DIR` apunta a los
pesos del OCR (los del servidor) y `OCR_MODELO_LAYOUT_DIR` al detector de layout
(el único que el SDK abre). Un `OCR_MOTOR=glm` sin servidor deja `/health`
`degradado` y `/reconocer` en 503.

### Calidad del texto

En los recortes (cabecera y banda de tabla) se leyeron bien los 7 campos de
`referencia.json`; los valores registrados fueron TSH 2,5 mU/L, T3 1,15 ng/mL,
T4 8,2 ng/dL, tamaño 12,0 mm, lateralidad lóbulo derecho, TI-RADS 4, Bethesda V
y fecha 2026-03-14, con coma decimal y unidades intactas. La fidelidad carácter
a carácter no está medida: eso es HT-043.

## Tesseract (alternativa ligera)

`OCR_MOTOR=tesseract` usa PyMuPDF para rasterizar a 200 ppp y `pytesseract` con
`lang="spa"`. Necesita el binario del sistema y los extras de Python:

```bash
sudo apt-get install -y tesseract-ocr tesseract-ocr-spa   # en la imagen de ocr/ ya viene
pip install -e ".[tesseract]"                             # pymupdf, pytesseract, pillow
```

Devuelve un bloque por línea, con la confianza media de sus palabras y la caja de
la línea normalizada por el tamaño de la página. En un host sin GPU es el motor
que conviene: mismo equipo, menos de un segundo por ficha frente a los minutos de
GLM-OCR. Se elige con `OCR_MOTOR=tesseract`; el valor por defecto del código es
`glm`.

## Levantar y probar

```bash
cd ocr
pip install -e ".[tesseract,dev]"      # o -r requirements-glm.txt para GLM-OCR
uvicorn app.main:app --host 127.0.0.1 --port 8001

curl -s localhost:8001/health
curl -s -F "documento=@/tmp/fichas/ficha-digital-punto-con-unidad.pdf" \
     localhost:8001/reconocer
```

Las fichas sintéticas se generan con `backend/scripts/generar_fixtures_fichas.py`
(ver `docs/datos/fixtures-de-prueba.md`). En Docker Compose el servicio sigue sin
puertos públicos (RS-INF-01) y su healthcheck solo mira que `/health` responda
200, así que un `degradado` es visible pero no tumba el arranque.

Pruebas: `cd ocr && pytest -q`. Usan dobles del motor, de `glmocr`, de
`pytesseract` y de PyMuPDF, de modo que corren sin pesos ni binarios.

## Privacidad

Con `OCR_PERMITIR_API_EXTERNA=true` y `OCR_GLM_API_KEY`, el documento se envía a
la API de Zhipu (servidores fuera del país: Singapur/China) y deja de cumplir
RS-LEG-10 y el CA-04. Esa configuración solo vale para pruebas con material
sintético; con fichas de pacientes está prohibida. Cuando está activa, cada
respuesta lo recuerda en `avisos`.
