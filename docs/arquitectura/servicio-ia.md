# Servicio de IA: pesos y montaje

Servicio HTTP de `ia/` que recibe una ecografía y devuelve los nódulos del contrato 1.1 (clase, caja, máscara, XML y superposición), con huella de los pesos y umbrales usados. Los pesos no viajan dentro de la imagen: viven en un volumen compartido y el administrador los puede reemplazar desde la aplicación.

## Los tres archivos que necesita

| Archivo | Modelo | Rol en la cadena | Tamaño |
| --- | --- | --- | --- |
| `best_yolo.pt` | YOLO11 | Detección de nódulos (cajas candidatas) | 40,5 MB |
| `best_bgaunet.keras` | BGAU-Net | Segmentación de la máscara dentro de la caja | 26,6 MB |
| `best_swin.pth` | Swin Transformer (tiny) | Clasificación benigno/maligno del nódulo | 343 MB |

El servicio lee la carpeta `IA_MODELOS_DIR`; si falta un archivo, ese modelo figura como no cargado y `/inferir` responde 503 en vez de inventar un resultado. `/health` devuelve la huella combinada de los pesos presentes.

## Carga desde la aplicación

1. El administrador sube un `.zip` con los tres archivos a `POST /modelos-ia`.
2. El backend valida nombres, tamaño y rutas, y calcula el SHA-256 de cada archivo y una huella combinada.
3. La versión queda registrada en `modelos_ia` con su `ruta_pesos` e inactiva.
4. `POST /modelos-ia/{id}/activar` desactiva el resto, activa esta y llama a `POST /recargar?version=<nombre>/<versión>` del servicio de IA.
5. Si la recarga falla, la activación anterior se restaura y el administrador ve el motivo.

La carpeta se comparte por volumen: `backend` escribe en `MODELOS_DIR` y `ia` lo monta de solo lectura en `IA_MODELOS_DIR`. No hay rutas fijas en el código.

## Flujo de una ecografía

1. `POST /casos/{caso_id}/imagenes` valida el archivo por contenido, recodifica la imagen sin EXIF/ICC/texto y guarda la copia saneada con el SHA-256 de esa copia.
2. `POST /trabajos` con `{"tipo": "inferencia", "payload": {"imagen_id": "<uuid>"}}` encola el trabajo.
3. El worker lee la imagen del almacenamiento, llama a `POST /inferir` del servicio de IA y decodifica el contrato 1.1.
4. En una sola transacción guarda la inferencia, sus nódulos (clase, probabilidades, región, píxeles) y los artefactos: máscara, MGAC, XML, superposición y el contrato crudo.

El operativo no detecta texto incrustado en la imagen: esa comprobación requiere OCR y el operativo no lo incorpora (ADR-020). El saneo cubre los metadatos del archivo.

## Arranque con pesos ya presentes

```bash
IA_MODELOS_DIR=./var/modelos docker compose up -d --build ia
```

O en `.env`:

```
IA_MODELOS_DIR=/ruta/a/modelos
IA_INSTALAR_MODELOS=true
```

`IA_INSTALAR_MODELOS=true` instala `ia/requirements-modelos.txt` dentro de la imagen (`torch`, `tensorflow`, `ultralytics`, `timm`). Sin esa bandera la imagen queda ligera y el servicio arranca en degradado, que es el modo del build por defecto y del CI.

## Qué pasa sin pesos

| Situación | `/health` y `/recargar` | `/inferir` |
| --- | --- | --- |
| Carpeta vacía o incompleta | `degradado`, `faltantes` con los modelos ausentes | 503 `modelo_no_disponible` |
| Stack de inferencia no instalado | `degradado`, detalle «Falta la librería …» | 503 |
| Tres archivos y librerías presentes | `ok` con `huella_modelos` | 200 con el contrato |

## Entorno medido

- Python 3.12, Linux `aarch64`, sin GPU.
- Carga de los tres modelos: 25,8 – 34,6 s.
- Inferencia completa de `0000.jpg` (314 × 402): 11,8 – 13,2 s en CPU.
- Corrida real del 16-11 en este servidor: `/health` `ok`, huella `a74d0422…`, inferencia en 11,8 s. El detector devolvió dos cajas; la de mayor confianza coincide con el XML de referencia (`78,96–218,239`, benigno 1.0) y la segunda queda justo en el umbral de 0,25, que es el valor configurado.
- Para no saturar memoria: `OMP_NUM_THREADS=2 TF_NUM_INTRAOP_THREADS=2 TF_NUM_INTEROP_THREADS=2 MKL_NUM_THREADS=2`.

## Verificación

```bash
cd ia && pytest tests -q
docker compose exec ia python -c "import urllib.request,json; d=json.load(urllib.request.urlopen('http://localhost:8002/health')); print(d['status'], d['faltantes'])"
```
