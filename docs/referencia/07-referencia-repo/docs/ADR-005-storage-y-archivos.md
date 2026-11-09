# ADR-005: Storage y Archivos

**Fecha:** 2024-09-23
**Status:** Aceptado
**Decisor:** Equipo OPTIMUS-THY

## Contexto y Problemática

OPTIMUS-THY maneja diversos tipos de archivos:

- **Imágenes médicas:** Ecografías tiroideas (DICOM, PNG, JPEG)
- **Documentos clínicos:** PDF, imágenes de fichas escaneadas
- **Recortes ROI:** Porciones de imágenes para inferencia
- **Artefactos de IA:** Heatmaps, reportes de inferencia
- **Modelos ML:** Pesos DINOv3 (grandes, readonly)

Todos requieren almacenamiento durable, acceso controlado y lifecycle management.

## Decisión

**MinIO (S3-compatible Object Storage) como almacenamiento principal**

## Buckets Configurados

| Bucket | Propósito | Acceso |
|--------|-----------|--------|
| `optimus-thy-files` | Almacenamiento principal | Productivo |
| `optimus-thy-test` | Tests automatizados | Aislamiento tests |

## Object Storage Adapter

```python
# app/infrastructure/storage/s3.py
class S3ObjectStorage(ObjectStoragePort):
    """Adaptador S3-compatible (MinIO, AWS S3, OCI)"""

    async def put_object(content, content_type, prefix, extension, bucket)
    async def get_object(object_key, bucket)
    async def head_object(object_key, bucket) -> StoredFileMetadata
    async def delete_object(object_key, bucket) -> bool
    async def generate_presigned_url(object_key, expires_in_seconds, bucket)
```

## Path Patterns

### Imágenes Médicas

```
patients/{patient_id}/images/{year}/{month}/{uuid}.{ext}
```

Ejemplo: `patients/abc123/images/2024/09/550e8400-e29b-41d4-a716-446655440000.png`

### Recortes ROI

```
patients/{patient_id}/rois/{roi_id}/{uuid}.png
```

### Documentos Clínicos

```
patients/{patient_id}/documents/{year}/{month}/{uuid}.{ext}
```

### Artefactos de Inferencia

```
inference/{job_id}/{uuid}.{png|json}
```

Ejemplo: `inference/def456/heatmap_overlay.png`

### Thumbnails y Previews

```
patients/{patient_id}/thumbs/{image_id}_thumb.jpg
patients/{patient_id}/previews/{image_id}_preview.jpg
```

## Safe Key Generation

Para evitar colisiones y información sensible en paths:

```python
def _generate_safe_key(prefix, extension) -> str:
    now = datetime.now(UTC)
    date_segment = now.strftime("%Y/%m/%d")
    random_id = uuid.uuid4().hex  # UUID v4
    ext = f".{extension.lstrip('.')}" if extension else ""
    return f"{prefix}/{date_segment}/{random_id}{ext}"
```

**Nota:** El prefijo aún contiene información de contexto (e.g., `patients/{id}`), pero el nombre del archivo es un UUID aleatorio.

## Presigned URLs

Acceso a archivos no es directo. Se usan presigned URLs:

```python
# Generate URL válida por 1 hora
url = storage.generate_presigned_url(
    object_key="patients/abc123/images/2024/09/550e8400.png",
    expires_in_seconds=3600,
    bucket="optimus-thy-files"
)
```

| Característica | Valor |
|----------------|-------|
| Expiración default | 3600 segundos (1 hora) |
| Método | GET (download) |
| bucket | optimus-thy-files |

## Checksums

Todos los objetos almacenan SHA-256 para integridad:

```python
# En put_object
sha256_hash = hashlib.sha256(content).hexdigest()

# Metadata del objeto
Metadata={"sha256": sha256_hash}
```

## Content Types Comunes

| Tipo | Content-Type | Extensiones |
|------|-------------|-------------|
| Imagen médica | `image/jpeg`, `image/png` | .jpg, .png |
| DICOM | `application/dicom` | .dcm |
| PDF | `application/pdf` | .pdf |
| Reporte IA | `application/json` | .json |
| Heatmap | `image/png` | .png |

## Lifecycle Management

### Imágenes Médicas

- **Retención:** Indefinida (requerimiento médico legal)
- **Eliminación:** Solo vía baja de paciente (cascade)
- **Archivado:** No implementado aún (future)

### Recortes ROI

- **Retención:** Duración del caso clínico + 7 años
- **Eliminación:** Cascade con MedicalImageROI

### Artefactos de Inferencia

- **Retención:** Duración del InferenceJob relacionado
- **Eliminación:** Cascade con InferenceArtifact

### Logs de Backup

Ver [infra/backup/README.md](../infra/backup/README.md)

## Volume Mounts (Docker)

```yaml
# docker-compose.yml
volumes:
  models_data:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: ${MODELS_PATH:-./models}  # /opt/optimus-thy/models

  uploads_data:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: ${UPLOADS_PATH:-./uploads}  # /opt/optimus-thy/uploads
```

## External Mounts (Producción)

### Model Weights (`/opt/optimus-thy/models`)

DINOv3 model files (readonly en container):

```
/opt/optimus-thy/models/
└── dinov3/
    ├── config.json
    ├── pytorch_model.bin
    └── ...
```

### Upload Storage (`/opt/optimus-thy/uploads`)

Uploads temporales y persistentes:

```
/opt/optimus-thy/uploads/
├── studies/
│   └── {study_id}/
│       └── images/
└── temp/
```

## S3 Configuration

```python
# Configuración del cliente boto3
client = boto3.client(
    "s3",
    endpoint_url=settings.S3_ENDPOINT_URL,
    aws_access_key_id=settings.S3_ACCESS_KEY,
    aws_secret_access_key=settings.S3_SECRET_KEY,
    region_name=settings.S3_REGION,
    config=Config(
        signature_version="s3v4",
        s3={"addressing_style": "path"},  # Para MinIO compatibility
    ),
)
```

## Security

| Control | Implementación |
|---------|----------------|
| Bucket público | **NUNCA** |
| Acceso archivos | Solo via presigned URLs |
| Expiración URLs | 1 hora default |
| Integridad | SHA-256 checksum en metadata |
| SSRF prevention | URLs generadas server-side, no user-controlled paths |

## OWASP Compliance

| Control | Implementación |
|---------|----------------|
| A01 - Broken Access Control | Presigned URLs con expiración |
| A05 - Security Misconfiguration | Bucket nunca público |
| A10 - SSRF Prevention | Paths no derivan de user input directo |

## Referencias

- [MinIO](https://min.io/)
- [boto3 S3](https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/s3.html)
- [Presigned URLs](https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-presigned-urls.html)
