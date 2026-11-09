"""Exporta el contrato OpenAPI a ../contracts/openapi.json."""

from __future__ import annotations

import json
from pathlib import Path

from app.main import app

TARGET = Path(__file__).resolve().parents[2] / "contracts" / "openapi.json"

if __name__ == "__main__":
    TARGET.write_text(json.dumps(app.openapi(), indent=2, ensure_ascii=False) + "\n")
