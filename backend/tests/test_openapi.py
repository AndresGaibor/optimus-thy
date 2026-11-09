"""El contrato publicado coincide con la app."""

from __future__ import annotations

import json
from pathlib import Path

from app.config import get_settings
from app.main import app

CONTRACT = Path(__file__).resolve().parents[2] / "contracts" / "openapi.json"


def test_health_in_openapi() -> None:
    assert app.openapi()["paths"]["/health"]["get"]["operationId"] == "health"


def test_paths_match_contract() -> None:
    contract = _load_contract()
    assert set(app.openapi()["paths"]) == set(contract["paths"])


def _load_contract() -> dict:
    return json.loads(CONTRACT.read_text())


def test_session_cookie_security_scheme() -> None:
    contract = _load_contract()
    scheme = contract["components"]["securitySchemes"]["SessionCookie"]
    assert scheme["type"] == "apiKey"
    assert scheme["in"] == "cookie"
    assert scheme["name"] == get_settings().session_cookie_name


def test_pacientes_get_requires_session_cookie() -> None:
    contract = _load_contract()
    # Ruta protegida existente (requiere permiso sesión).
    operation = contract["paths"]["/pacientes"]["get"]
    assert {"SessionCookie": []} in operation["security"]


def test_openapi_has_no_secrets() -> None:
    text = CONTRACT.read_text()
    for secret in ("password_hash", "session_token", "token_hash"):
        assert secret not in text
