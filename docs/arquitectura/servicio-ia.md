# Servicio de IA: pesos y montaje (HT-061, HT-062)

Servicio HTTP de `ia/` que recibe una ecografía y devuelve los nódulos del
contrato 1.1, con huella de los pesos y umbrales usados. El contrato y las
variables de entorno se detallan en [`ia/README.md`](../../ia/README.md); esta
página cubre lo que el servicio **no** trae en la imagen: los pesos y el stack de
inferencia.

## Los tres archivos que necesita

| Archivo | Modelo | Rol en la cadena | Tamaño |
| --- | --- | --- | --- |
| `best_yolo.pt` | YOLO11 | Detección de nódulos (cajas candidatas) | 38,7 MB |
| `best_bgaunet.keras` | BGAU-Net | Segmentación de la máscara dentro de la caja | 25,4 MB |
| `best_swin.pth` | Swin Transformer (tiny, `swin_tiny_patch4_window7_224.ms_in22k_ft_in1k`) | Clasificación benigno/maligno del nódulo | 327,2 MB |

Los nombres se pueden cambiar con `IA_YOLO_PESOS`, `IA_BGAUNET_PESOS` e
`IA_SWIN_PESOS`, pero los tres archivos deben estar en la misma carpeta
(`IA_MODELOS_DIR`). El servicio recorre la cadena YOLO → MGAC → BGAU-Net → Swin;
si falta uno, ese modelo figura como no cargado y `/inferir` responde 503 en vez
de inventar un resultado.

La huella que devuelve `/health` (`huella_modelos`) es el SHA-256 del inventario
nombre + tamaño + contenido de los pesos presentes, de modo que un cambio de
pesos se puede registrar junto a cada inferencia.

## De dónde salen

Del paquete de inferencia del estudio (IDI-086), el mismo que alimentaba el
`app.py` de Streamlit:

```
IDI-086_inference_complete/
└── models/
    ├── best_yolo.pt
    ├── best_bgaunet.keras
    └── best_swin.pth
```

`docs/referencia/06-codigo-ia-existente/base.py` fija esas tres rutas en el
código original.

Los pesos **no se versionan**: `*.pt`, `*.pth` y `*.keras` están en `.gitignore`,
ningún binario entra en el historial de git y no se copian en la imagen, se
montan de solo lectura. Viven como assets de la release **privada**
`modelos-idi-086-v1` de este mismo repositorio (hasta 2 GB por archivo), y en el
repo solo quedan:

| Pieza | Qué hace |
| --- | --- |
| `ia/modelos.sha256` | SHA-256 de los tres binarios, un archivo por línea (`sha256  nombre`) |
| `ia/scripts/descargar_modelos.py` | Descarga cada asset y verifica tamaño y SHA-256 |
| `make modelos` | Envuelve lo anterior con destino `var/modelos` |

```bash
gh auth login   # la release es privada: sin sesión de GitHub no se descarga
make modelos    # 410 MB en var/modelos, verificado contra ia/modelos.sha256
```

El script es idempotente: si un archivo ya está y su hash coincide, no lo vuelve
a bajar. Usa `gh` cuando está instalado y autenticado; si no, `urllib` con
`GITHUB_TOKEN` (o `GH_TOKEN`); `--base-url` apunta a un espejo propio y
`--destino` cambia la carpeta. Sale con 3 si algún hash no coincide, 1 si falla
la descarga y 2 si los argumentos no son válidos.

`make modelos` **no** forma parte de `make check`: descargar 410 MB no puede ser
parte de la integración continua, que trabaja sin pesos y en modo degradado.

Comprobación manual del manifiesto en la carpeta de destino:

```bash
cd var/modelos && sha256sum -c ../../ia/modelos.sha256
```

La huella que publica `/health` (`huella_modelos`) no es el hash de cada archivo,
sino el del inventario de los presentes; los SHA-256 por archivo son los de
`ia/modelos.sha256`.

## Cómo se montan

### En local (sin Docker)

```bash
python3.12 -m venv .venv-ia
.venv-ia/bin/pip install -r ia/requirements-modelos.txt   # torch, tensorflow, ultralytics, timm
.venv-ia/bin/pip install -e ia

cd ia
IA_MODELOS_DIR=../var/modelos \
IA_DISPOSITIVO=cpu \
  ../.venv-ia/bin/uvicorn app.main:app --host 127.0.0.1 --port 8002
```

`IA_DISPOSITIVO` acepta `auto` (GPU si existe, si no CPU), `cpu` o el índice de
una GPU (`0`). El entorno real de este proyecto es CPU.

### En Docker Compose

`docker-compose.yml` monta una carpeta del host en `/modelos` (solo lectura) y
fija dentro del contenedor `IA_MODELOS_DIR=/modelos`:

| Pieza | Valor | Variable de `.env` |
| --- | --- | --- |
| `build.args.INSTALAR_MODELOS` | `false` por defecto | `IA_INSTALAR_MODELOS` |
| `environment.IA_MODELOS_DIR` | `/modelos` (fijo) | — |
| `environment.IA_DISPOSITIVO` | `cpu` por defecto | `IA_DISPOSITIVO` |
| `volumes` | `${IA_MODELOS_DIR:-./var/modelos}:/modelos:ro` | `IA_MODELOS_DIR` (ruta del host) |

Con los pesos en el repo, en una carpeta ignorada por git:

```bash
make modelos   # deja y verifica los tres pesos en var/modelos
IA_INSTALAR_MODELOS=true docker compose up -d --build ia
```

O apuntando a otra carpeta con los pesos ya descargados, sin duplicarlos (ponlo
en `.env`):

```
IA_MODELOS_DIR=/ruta/a/modelos
IA_INSTALAR_MODELOS=true
```

`IA_INSTALAR_MODELOS=true` instala `ia/requirements-modelos.txt` dentro de la
imagen. Sin esa bandera la imagen queda ligera (~2 GB menos) y el servicio
arranca en degradado, que es el modo del build por defecto y del CI.

Comprobación:

```bash
docker compose exec ia python -c "import urllib.request,json; d=json.load(urllib.request.urlopen('http://localhost:8002/health')); print(d['status'], d['faltantes'])"
# ok []
```

## Qué pasa sin pesos

`IA_MODELOS_DIR` siempre está definida en el compose, así que el arranque no
falla por configuración; lo que falta se informa modelo por modelo:

| Situación | `/health` | `/inferir` |
| --- | --- | --- |
| Sin la variable (ejecución manual fuera del compose) | `status: "degradado"`, los tres modelos sin cargar y `faltantes` con los tres nombres | 503 `modelo_no_disponible` |
| Carpeta vacía o con archivos faltantes | `degradado`, `faltantes` lista solo los que faltan y cada modelo trae el detalle «Falta el archivo de pesos …» | 503 con la lista de faltantes |
| Stack de inferencia no instalado | `degradado`, detalle «Falta la librería …» (p. ej. `ultralytics`) | 503 |
| Los tres archivos presentes y librerías instaladas | `ok`, con `huella_modelos` | 200 con el contrato |

`/health` responde siempre 200 para que el healthcheck del compose espere al
servicio; el estado real está en el cuerpo. Un `degradado` no tumba `make up`.

## Entorno real medido

- Python 3.12.14, Linux `aarch64` (arm64), **sin GPU**: todo en CPU.
- `ia/requirements-modelos.txt`: 78 pines del entorno que funcionó —
  `torch==2.14.1+cpu` y `torchvision==0.29.1+cpu` (índice
  `https://download.pytorch.org/whl/cpu`), `tensorflow==2.21.0`,
  `ultralytics==8.4.209`, `timm==1.0.31`, `keras==3.15.1`, `numpy==2.5.4`,
  `opencv-python-headless==5.0.0.93`.
- El `.keras` abre con Keras 3.15.1 / TensorFlow 2.21 sin tocar el cargador
  (`custom_objects` + `compile=False`).
- Para no saturar la memoria del equipo conviene acotar los hilos antes de
  arrancar: `OMP_NUM_THREADS=2 TF_NUM_INTRAOP_THREADS=2
  TF_NUM_INTEROP_THREADS=2 MKL_NUM_THREADS=2`.

Tiempos medidos en este equipo con los pesos reales, `dispositivo="cpu"` y dos
hilos (arranque en frío, incluye la importación de torch/TensorFlow):

| Medida | Rango |
| --- | --- |
| Carga de los tres modelos (`cargar_modelos`) | 25,8 – 34,6 s |
| Inferencia completa de `0000.jpg` (314 × 402) | 11,8 – 13,2 s |

La variación alta se debe a que el equipo tenía la swap casi agotada; con
memoria libre la carga se acerca al extremo bajo. La inferencia escala con el
tamaño de la imagen (`IA_YOLO_TAMANO=768` es el tamaño de entrada del detector,
no el de la ecografía).
