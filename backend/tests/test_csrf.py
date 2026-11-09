"""Pruebas de rechazo de Origin en requests que cambian estado (ADR-015)."""

from __future__ import annotations

from fastapi.testclient import TestClient


def test_logout_origin_ajeno_forbidden(client: TestClient) -> None:
    r = client.post("/auth/logout", headers={"Origin": "https://evil.example"})
    assert r.status_code == 403
    assert r.json().get("error", {}).get("code") == "origin_forbidden"


def test_logout_origin_permitido(client: TestClient) -> None:
    r = client.post("/auth/logout", headers={"Origin": "http://testserver"})
    assert r.status_code == 204


def test_logout_sin_origin(client: TestClient) -> None:
    r = client.post("/auth/logout")
    assert r.status_code == 204
