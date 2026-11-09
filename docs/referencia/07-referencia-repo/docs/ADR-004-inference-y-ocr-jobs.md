# ADR-004: Inference y OCR Jobs

**Fecha:** 2024-09-23
**Status:** Aceptado
**Decisor:** Equipo OPTIMUS-THY

## Contexto y Problemática

OPTIMUS-THY procesa imágenes médicas con modelos de IA (DINOv3) y extrae texto de documentos clínicos via OCR. Estos procesos son:

- **Long-running:** No suitable para ejecución en request HTTP síncrono
- **Resource-intensive:** Requieren GPU/CPU significativo
- **Failure-prone:** Pueden fallar por problemas de modelo, imágenes corruptas, etc.
- **Critical:** Resultados afectan decisiones médicas

## Decisión

**Jobs asíncronos con exclusión mutua a nivel de base de datos y procesamiento in-process**

### Alternativas Consideradas

1. **Cola dedicada (RQ/Celery):** Descartado - adds complexity, single point of failure
2. **Worker separado:** Descartado - adds deployment complexity
3. **BackgroundTasks FastAPI:** Descartado - no durability on restart
4. **In-process con lock DB:** Elegido - simple, durable, consistent

## Tipos de Jobs

### InferenceJob

Procesamiento de ROI (Region of Interest) con modelo DINOv3 para predicción de malignidad.

```python
# Modelo: InferenceJob
- patient_id, roi_id, study_id, case_id
- status: pending → processing → completed | failed
- model_name: "dinov3_vitl16" | "mock_runner"
- model_version: "dinov3-thyroid-v1.0"
- threshold_used: 0.38 (canonical)
- result: InferenceResultRecord (1:1)
- artifacts: InferenceArtifact[] (1:N)
```

### OCRJob

Extracción de texto de documentos clínicos escaneados.

```python
# Modelo: OCRJob
- document_id, patient_id, case_id
- status: pending → processing → completed | failed
- engine_name: "local_clinical_runner"
- full_text: texto extraído
- global_confidence: score
- fields: OCRFieldResult[]
- reviews: OCRHumanReview[] (correcciones humanas)
```

## Flujo de InferenceJob

```
┌──────────────┐     ┌──────────────┐     ┌──────────────────┐
│   Request    │────▶│    Job       │────▶│    Worker        │
│   HTTP       │     │   Created   │     │  (Background)    │
│  /jobs POST   │     │  pending    │     │                  │
└──────────────┘     └──────────────┘     └────────┬─────────┘
                                                    │
                     ┌──────────────────────────────┘
                     │ 1. Lock atómico (UPDATE WHERE status=pending)
                     │ 2. Download ROI crop from S3
                     │ 3. Run DINOv3 inference
                     │ 4. Store artifacts in S3
                     │ 5. Persist result record
                     │ 6. Update status = completed
                     ▼
              ┌──────────────────┐
              │   artifacts/     │
              │ inference/{job_id}│
              │ ├── heatmap_overlay.png
              │ └── inference_report.json
              └──────────────────┘
```

## Estados y Transiciones

```
                    ┌─────────────┐
                    │   pending   │◀──────────────────┐
                    └──────┬──────┘                   │
                           │ worker picks up          │
                           ▼                          │
                    ┌─────────────┐                   │
              ┌────▶│ processing  │──────┐            │
              │     └─────────────┘      │            │
              │                          │ error      │ retry
              │                          ▼            │
              │                   ┌─────────────┐     │
              │                   │   failed    │─────┘
              │                   └─────────────┘  (if retries < max)
              │
              │ success
              ▼
       ┌─────────────┐
       │  completed  │
       └─────────────┘
```

## Exclusión Mutua (Mutex)

Para evitar ejecución concurrente del mismo job:

```python
# Lock atómico en DB
UPDATE inference_jobs
SET status = 'processing', worker_id = $1, locked_at = NOW()
WHERE id = $2 AND status = 'pending'
RETURNING id

# Si rowcount == 0: otro worker ya lo tomó o ya terminó
```

## Recuperación de Jobs Huerfanos

Jobs en estado `processing` por más de 15 minutos se consideran stale:

```python
UPDATE inference_jobs
SET status = 'pending', worker_id = NULL, locked_at = NULL
WHERE status = 'processing'
  AND locked_at < NOW() - INTERVAL '15 minutes'
  AND retries < max_retries
```

## Artefactos de Inference

### heatmap_overlay.png

Imagen PNG con overlay de calor (Grad-CAM) superpuesto al ROI.

Path en S3: `inference/{job_id}/{uuid}.png`

### inference_report.json

Reporte estructurado del inference:

```json
{
  "report_id": "uuid",
  "job_id": "uuid",
  "patient_id": "uuid",
  "model_name": "dinov3_vitl16",
  "model_version": "dinov3-thyroid-v1.0",
  "prediction": "BENIGN" | "MALIGNANT",
  "probability": 0.85,
  "is_malignant": false,
  "confidence_score": 0.82,
  "processing_time_ms": 1234.56,
  "threshold_used": 0.38,
  "overlay_available": true,
  "inference_timestamp": "2024-09-23T..."
}
```

## Rate Limiting

| Endpoint | Límite | Justificación |
|----------|--------|---------------|
| `POST /api/v1/jobs` | 10/min/user | Prevenir abuse de GPU |
| `POST /auth/login` | 5/min/IP | OWASP standard |

## Worker en Proceso

El worker corre en el mismo proceso que la API:

```python
# app/application/services/inference_service.py
class InferenceExecutionService:
    async def execute_job_by_id(job_id, worker_id=None):
        # Ejecuta en thread pool para no bloquear async
        await asyncio.to_thread(self._execute_sync, job_id)
```

Para escalar horizontalmente, se puede extraer a servicio separado (TES-161 OCI profile).

## OCR Engine

El motor OCR actual `local_clinical_runner` es un runner local que:

1. Recibe documento (imagen/PDF)
2. Extrae texto con engine disponible (Tesseract, etc.)
3. Parsea campos clínicos estructurados
4. Retorna confidence scores

## Human Review de OCR

Resultados OCR pueden ser corregidos por humanos:

```python
# OCRHumanReview
- field_name: nombre del campo corregido
- original_value: valor extraído por OCR
- corrected_value: corrección humana
- reviewed_by_id: usuario que corregió
```

## Métricas de Observabilidad

- `inference_jobs_pending_total`
- `inference_jobs_processing_total`
- `inference_jobs_completed_total`
- `inference_jobs_failed_total`
- `inference_processing_time_seconds`

Ver [ADR-006: Observabilidad](./ADR-006-observabilidad.md)

## References

- [FastAPI BackgroundTasks](https://fastapi.tiangolo.com/tutorial/background-tasks/)
- [SQLAlchemy Async](https://docs.sqlalchemy.org/en/20/async.html)
