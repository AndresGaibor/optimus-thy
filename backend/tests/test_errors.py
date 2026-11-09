"""Errores: sin detalles internos y con request_id."""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.testclient import TestClient


def test_unhandled_exception_returns_generic_500(bare_app: FastAPI) -> None:
    @bare_app.get("/boom")
    async def boom() -> None:
        raise RuntimeError("secreto-interno SELECT * FROM pacientes")

    response = TestClient(bare_app, raise_server_exceptions=False).get(
        "/boom", headers={"X-Request-ID": "req-123"}
    )
    body = response.json()
    assert response.status_code == 500
    assert body == {
        "error": {"code": "internal_error", "message": "Error interno"},
        "request_id": "req-123",
    }
    assert "secreto-interno" not in response.text
    assert "Traceback" not in response.text


def test_validation_error_uses_own_format(bare_app: FastAPI) -> None:
    @bare_app.get("/num")
    async def num(n: int) -> dict[str, int]:
        return {"n": n}

    response = TestClient(bare_app).get("/num", params={"n": "no-es-numero"})
    body = response.json()
    assert response.status_code == 422
    assert body["error"]["code"] == "validation_error"
    assert "request_id" in body
    assert "no-es-numero" not in response.text
