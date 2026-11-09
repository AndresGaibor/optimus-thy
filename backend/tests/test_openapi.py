"""El contrato publicado coincide con la app."""

from __future__ import annotations

import json
from pathlib import Path

from app.main import app

CONTRACT = Path(__file__).resolve().parents[2] / "contracts" / "openapi.json"


def test_health_in_openapi() -> None:
    assert app.openapi()["paths"]["/health"]["get"]["operationId"] == "health"


def test_paths_match_contract() -> None:
    contract = json.loads(CONTRACT.read_text())
    assert set(app.openapi()["paths"]) == set(contract["paths"])
