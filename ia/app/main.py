"""Servicio de IA mínimo (placeholder). Expone /health hasta integrar modelos."""

from fastapi import FastAPI

app = FastAPI(title="optimus-ia", version="0.1.0")


@app.get("/health")
def health() -> dict[str, str]:
    """Chequeo de salud: el coordinador y el compose lo usan para esperar al servicio."""
    return {"status": "ok", "service": "ia"}
