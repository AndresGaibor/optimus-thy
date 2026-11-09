# ADR-006: Observabilidad

**Fecha:** 2024-09-23
**Status:** Aceptado
**Decisor:** Equipo OPTIMUS-THY

## Contexto y Problemática

Producción de sistemas médicos requiere:

- **Logging estructurado** para debugging
- **Request tracing** para debugging distribuido
- **Métricas** para monitoreo de salud
- **Auditoría** de accesos y operaciones sensibles

## Decisión

**Logging JSON estructurado + Request ID Middleware + Prometheus metrics endpoint**

## Logging Estructurado

### Formato JSON

Todos los logs son JSON para consumo por agregadores (ELK, Datadog, CloudWatch):

```json
{
  "timestamp": "2024-09-23T14:30:00.000Z",
  "level": "INFO",
  "logger": "app",
  "message": "request_completed",
  "method": "POST",
  "path": "/api/v1/patients",
  "status_code": 201,
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "duration_ms": 45
}
```

### Custom JSON Formatter

```python
# app/core/logging_config.py
class JSONFormatter(logging.Formatter):
    def format(self, record: LogRecord) -> str:
        log_data = {
            "timestamp": datetime.fromtimestamp(record.created, tz=UTC).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        # Extra fields from record.__dict__
        for key, value in record.__dict__.items():
            if key not in STANDARD_ATTRS:
                log_data[key] = value
        return json.dumps(log_data)
```

### Configuración via Environment

```bash
LOG_LEVEL=INFO  # DEBUG, INFO, WARNING, ERROR
LOG_FORMAT=json # Solo JSON soportado actualmente
```

## Request ID Middleware

Cada request HTTP recibe un Request ID para trazabilidad:

```python
# app/api/middlewares/request_id.py
class RequestIDMiddleware:
    async def dispatch(self, request: Request, call_next):
        request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        request.state.request_id = request_id
        request_id_var.set(request_id)  # ContextVar para logging
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response
```

### Propagación

- **Request entrante:** Header `X-Request-ID` o UUID generado
- **Response:** Header `X-Request-ID` incluído
- **Logging:** Request ID disponible via `request_id_var.get()`
- **Base de datos:** Campo `request_id` en `audit_events`

## Métricas Prometheus

### Endpoint

`GET /metrics` - Expone métricas en formato Prometheus

### Métricas Implementadas

#### HTTP Request Metrics

```
http_requests_total{method, path, status_code}
http_request_duration_seconds{method, path}
```

#### Inference Metrics

```
inference_jobs_pending_total
inference_jobs_processing_total
inference_jobs_completed_total
inference_jobs_failed_total
inference_processing_time_seconds
```

#### OCR Metrics

```
ocr_jobs_pending_total
ocr_jobs_processing_total
ocr_jobs_completed_total
ocr_jobs_failed_total
```

#### Business Metrics

```
active_sessions_total
patients_total
inference_requests_total
```

### Implementación

```python
# app/api/routes/metrics.py
@router.get("/metrics")
async def metrics():
    # Usa prometheus_client o custom implementation
    return Response(content=generate_prometheus_output(), media_type="text/plain")
```

## Auditoría (Audit Events)

Todos los eventos sensibles se registran en `audit_events`:

### Eventos Auditados

| Acción | Módulo | Detalles |
|--------|--------|----------|
| `LOGIN_SUCCESS` | AUTH | Login exitoso |
| `LOGIN_FAILED` | AUTH | Intento fallido |
| `LOGIN_FAILED_INACTIVE` | AUTH | Usuario inactivo |
| `LOGOUT` | AUTH | Logout |
| `ACCESS_DENIED` | RBAC | Acceso denegado por rol |
| `PII_ACCESS` | PATIENT | Acceso a PII |

### Modelo AuditEvent

```python
class AuditEvent(Base):
    user_id: UUID | None
    user_name: str | None
    user_role: str | None
    action: str  # LOGIN_SUCCESS, ACCESS_DENIED, etc.
    module: str  # AUTH, RBAC, PATIENT, etc.
    details: str | None
    ip_address: str | None
    request_id: str | None
    created_at: datetime
```

## Request Logging

### Log Request Start

```python
logger.info(
    "request_started",
    extra={
        "method": request.method,
        "path": request.url.path,
        "query_params": str(request.query_params),
        "request_id": request_id,
    }
)
```

### Log Request Complete

```python
logger.info(
    "request_completed",
    extra={
        "method": request.method,
        "path": request.url.path,
        "status_code": response.status_code,
        "request_id": request_id,
    }
)
```

## Exception Handling

### Validation Errors

```python
logger.warning(
    "validation_error",
    extra={
        "request_id": request_id,
        "path": request.url.path,
        "errors": exc.errors(),
    }
)
```

### HTTP Errors

```python
logger.warning(
    "http_error",
    extra={
        "request_id": request_id,
        "status_code": exc.status_code,
        "detail": exc.detail,
    }
)
```

### Unhandled Exceptions

```python
logger.error(
    "unhandled_exception",
    extra={
        "request_id": request_id,
        "exception": str(exc),
    },
    exc_info=exc  # Include stack trace
)
```

## OWASP Security Logging

| Control OWASP | Implementación |
|---------------|----------------|
| A09 - Security Logging | JSON structured logging + audit_events |
| A09 - Detection | Request ID tracing |

## Health Checks

| Endpoint | Verifica |
|----------|----------|
| `GET /health` | Service alive |
| `GET /health/ready` | DB + S3 connectivity |

## Log Levels

| Level | Uso |
|-------|-----|
| DEBUG | Development, troubleshooting |
| INFO | Request logs, business events |
| WARNING | Validation errors, rate limits |
| ERROR | Exceptions, failed operations |
| CRITICAL | Catastrophic failures |

## External Integration

### ELK Stack

Logs JSON pueden ser enviados directamente a Logstash o Firehose.

### CloudWatch

Configurar CloudWatch Logs con JSON parser.

### Datadog

Datadog agent parsea JSON logs automáticamente.

## Consideraciones de Privacidad

- **NO se loguean:** Passwords, PII, tokens de sesión
- **SI se loguean:** User ID (no PII), request IDs, paths, status codes
- **Auditoría PII:** Solo en `audit_events` con justificación

## Referencias

- [Prometheus Metrics](https://prometheus.io/docs/concepts/metric_types/)
- [OWASP Logging](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html)
- [JSON Logging](https://www.structured-logging.com/)
