# Almacenamiento de archivos (HT-007)

Implementado en `backend/app/storage/s3.py`, sobre el servicio `storage` del
compose (MinIO, compatible con S3). Cumple RD-03, RS-CIF-04 y RS-ANO-07.

## Reglas

| Regla | Cómo se cumple |
| --- | --- |
| Bucket siempre privado | Se crea sin ACL y se le aplica `BlockPublicAcls`, `IgnorePublicAcls`, `BlockPublicPolicy` y `RestrictPublicBuckets` |
| Solo lectura por enlace firmado | `generate_presigned_link` es el único camino de descarga; no existe URL pública |
| Enlace de corta duración | 3600 s por defecto, configurable entre 60 s y 24 h (`S3_PRESIGNED_SECONDS`) |
| Nombres sin datos personales | La clave es `prefijo/AAAA/MM/DD/<uuid4>.ext`; nunca se usa el nombre original del archivo |
| La base guarda solo metadatos | `documents`, `medical_images` e `inference_artifacts` guardan bucket, clave, tipo, tamaño y SHA-256 |
| Integridad | El SHA-256 se calcula al subir y viaja en los metadatos del objeto |
| Cifrado en reposo | `ServerSideEncryption=AES256` en cada `put_object` |

## Prefijos permitidos

El prefijo lo elige el servidor, no el usuario, y se valida con una expresión
regular (minúsculas, dígitos, `_`, `-` y `/`; sin `..`):

```
patients/{id}/images
patients/{id}/documents
patients/{id}/rois
inference/{job_id}
```

## Claves opacas

```python
build_object_key("patients/abc12345/images", "PNG")
# patients/abc12345/images/2026/11/03/6f1c...c9.png
```

- Extensión normalizada y limitada a `[a-z0-9]{1,8}`: `../passwd` o `a.b` se
  rechazan, así que la clave nunca sale de su prefijo.
- El identificador es un UUID v4 en hexadecimal: dos archivos con el mismo
  nombre original no colisionan.
- La ruta no contiene nombre, cédula ni fecha de nacimiento: solo el UUID
  interno del paciente, que ya es una referencia.

## API del adaptador

```python
storage = get_storage()
guardado = storage.put_object(
    content=png_bytes,
    content_type="image/png",
    prefix=f"patients/{patient_id}/images",
    extension="png",
)
enlace = storage.generate_presigned_link(guardado.key)   # 1 hora
storage.delete_object(guardado.key)
```

`StoredObject` devuelve exactamente lo que se guarda en la base: `bucket`, `key`,
`size_bytes`, `sha256` y `content_type`. No incluye URL, a propósito.

## Errores

Todo fallo del cliente se convierte en `StorageError` con un mensaje genérico
(«No se pudo guardar el archivo»), sin bucket, clave ni detalle del proveedor.
El detalle queda en el log del servidor, nunca en la respuesta.

## Configuración

| Variable | Valor por defecto | Uso |
| --- | --- | --- |
| `S3_ENDPOINT` | `http://storage:9000` | Endpoint interno del compose |
| `S3_ACCESS_KEY` / `S3_SECRET_KEY` | `cambiar-en-local` | Credenciales del bucket, fuera del repositorio en producción |
| `S3_BUCKET` | `optimus` | Bucket principal |
| `S3_REGION` | `us-east-1` | Región de firma |
| `S3_PRESIGNED_SECONDS` | `3600` | Vigencia de los enlaces, validada entre 60 s y 24 h |

Firma `s3v4` con direccionamiento por ruta, que es lo que exige MinIO.

## Pruebas

`backend/tests/test_storage.py` usa un cliente en memoria (sin red ni MinIO) y
comprueba: clave opaca y distinta por archivo, rechazo de extensiones y prefijos
peligrosos, cifrado del lado del servidor y SHA-256 al subir, ausencia de ACL
pública, que los metadatos no incluyen enlace, la vigencia de los enlaces
firmados, el bloqueo público del bucket, que un error del cliente no filtra
detalles y el rango válido de vigencia en la configuración.

## Pendiente en otras tarjetas

- HT-050: limpieza de metadatos EXIF de las imágenes.
- HT-013: respaldo y restauración del bucket.
- HU-060 y HU-050: usar el adaptador al subir ecografías y fichas.
