# ia

Servicio de IA de OPTIMUS-THY. La cadena YOLO11 → MGAC → BGAU-Net → Swin
Transformer vive en `app/pipeline.py` como una función y `app/main.py` la expone
por HTTP con los modelos cargados una sola vez (HT-062).

## Servicio HTTP

- `GET /health`: `status` (`ok` si los tres modelos están cargados, `degradado`
  si falta alguno), `servicio`, `version_contrato`, `huella_modelos` y, por
  modelo (`detector`, `segmentador`, `clasificador`), `cargado`, `archivo` y
  `sha256`. Siempre responde 200 para que el compose pueda esperar al servicio;
  el estado real está en el cuerpo.
- `POST /inferir`: imagen por `multipart/form-data` en el campo `imagen` (JPEG,
  PNG, BMP, TIFF o WebP, hasta 20 MB). Devuelve el contrato versionado más
  `huella_modelos` y `umbrales`, los que se usaron en esa inferencia. Si falta
  un modelo responde 503 con `code="modelo_no_disponible"` y la lista de
  faltantes; una imagen inválida responde 422 con un mensaje en español. Nunca
  inventa un resultado.

Los pesos no se versionan: llegan montados en `IA_MODELOS_DIR`. Sin ellos el
servicio arranca igual y `/health` queda en `degradado`. `torch`,
`ultralytics`, `timm` y `tensorflow` son importaciones opcionales de
`app/adaptadores.py`: si no están instalados, el modelo correspondiente figura
como no cargado con el motivo.

## Cadena de inferencia (HT-061)

```python
from app.config import ConfiguracionIA
from app.modelos import ModelosIA
from app.pipeline import analizar_imagen

config = ConfiguracionIA.desde_entorno()
resultado = analizar_imagen(imagen_bgr, modelos=ModelosIA(...), config=config)
datos = resultado.a_diccionario()  # contrato versionado, listo para JSON
```

- Sin rutas fijas ni variables globales: todo entra por parámetro y la
  configuración se lee del entorno una sola vez.
- Sin archivos intermedios: la caja del nódulo viaja en memoria en lugar del XML
  que escribía `base.py`. Cada solicitud que necesite archivos derivados usa
  `app.espacio.espacio_de_trabajo()`, un directorio temporal propio (RIA-03).
- Hasta tres nódulos por imagen (RF-INF-13/14). Las detecciones se recortan a la
  imagen, se descartan las cajas menores a 5 × 5 px y, si hay más de tres, se
  conservan las de mayor confianza.
- Sin detecciones no se clasifica: `resultado.sin_nodulo` es `True` y la lista de
  nódulos queda vacía.
- Si la máscara de BGAU-Net queda con menos píxeles que el mínimo, se usa la de
  MGAC y `origen_mascara` lo indica.

### Contrato de salida (RIA-06, versión 1.1)

```json
{
  "version_contrato": "1.1",
  "ancho": 800,
  "alto": 600,
  "sin_nodulo": false,
  "nodulos": [
    {
      "indice": 1,
      "caja": { "xmin": 120, "ymin": 90, "xmax": 260, "ymax": 230 },
      "confianza_detector": 0.91,
      "origen_mascara": "bgaunet",
      "clase": "benigno",
      "probabilidad_benigno": 0.87,
      "probabilidad_maligno": 0.13,
      "region_analizada": { "xmin": 106, "ymin": 76, "xmax": 274, "ymax": 244 },
      "pixeles_mascara": 5321,
      "mascara_png": "iVBORw0KGgo…",
      "mgac_png": "iVBORw0KGgo…",
      "xml": "PD94bWwgdmVyc2lvbj0iMS4wIiA/…",
      "superposicion_png": "iVBORw0KGgo…"
    }
  ]
}
```

Los cuatro artefactos del nódulo son opcionales y viajan en base64: la máscara
final, la de MGAC, la superposición (máscara teñida y caja) y el XML Pascal-VOC
del nódulo en UTF-8. Un nódulo sin artefactos no incluye esas claves, así que un
contrato 1.0 sigue siendo legible.


### Variables de entorno

| Variable | Por defecto | Uso |
| --- | --- | --- |
| `IA_MODELOS_DIR` | obligatoria | Carpeta con los tres archivos de pesos |
| `IA_YOLO_PESOS` | `best_yolo.pt` | Nombre del peso de YOLO11 |
| `IA_BGAUNET_PESOS` | `best_bgaunet.keras` | Nombre del peso de BGAU-Net |
| `IA_SWIN_PESOS` | `best_swin.pth` | Nombre del peso de Swin Transformer |
| `IA_DISPOSITIVO` | `auto` | `auto`, `cpu` o índice de GPU |
| `IA_YOLO_TAMANO` | `768` | Tamaño de entrada de YOLO |
| `IA_YOLO_CONFIANZA` | `0.25` | Umbral de confianza del detector |
| `IA_YOLO_IOU` | `0.60` | Umbral de IoU del detector |
| `IA_MAX_NODULOS` | `3` | Nódulos por imagen; no admite más de 3 |
| `IA_MIN_PIXELES_MASCARA` | `20` | Píxeles mínimos para aceptar la máscara de BGAU-Net |
| `IA_MARGEN_ROI` | `0.10` | Margen de la región que se clasifica |
| `IA_MGAC_ITERACIONES` | `380` | Iteraciones del contorno MGAC |
| `IA_MGAC_MARGEN` | `1.15` | Margen de la elipse inicial de MGAC |
| `IA_MGAC_RADIO_CIERRE` | `2` | Radio del cierre morfológico de MGAC |

Los errores de configuración se informan con `ErrorConfiguracion` al arrancar, no
en mitad de una solicitud.

## Pruebas

```bash
pip install -e ".[dev]"
pytest
ruff format --check . && ruff check .
```

Las pruebas usan dobles de los tres modelos: los pesos no se versionan. La
regresión de RIA-07 contra `app.py` con imágenes de ejemplo necesita los pesos y
el entorno de TensorFlow/PyTorch, así que queda como evidencia manual hasta
HT-062; aquí se comprueba que dos solicitudes con la misma imagen dan el mismo
resultado.
