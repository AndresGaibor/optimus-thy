"""Servicio OCR mínimo (placeholder). Expone /health y queda listo para crecer."""

from fastapi import FastAPI

app = FastAPI(title="optimus-ocr", version="0.1.0")


@app.get("/health")
def health() -> dict[str, str]:
    """Chequeo de salud: el coordinador y el compose lo usan para esperar al servicio."""
    return {"status": "ok", "service": "ocr"}
