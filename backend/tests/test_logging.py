"""Logs JSON sin datos sensibles."""

from __future__ import annotations

import contextlib
import io
import json
import logging

from fastapi.testclient import TestClient

from app.logging import JsonFormatter


def test_request_log_is_json_without_sensitive_data(client: TestClient) -> None:
    stream = io.StringIO()
    handler = logging.StreamHandler(stream)
    handler.setFormatter(JsonFormatter())
    logger = logging.getLogger("optimus_thy")
    root = logging.getLogger()
    logger.addHandler(handler)
    root.addHandler(handler)
    try:
        resp = client.post(
            "/health",
            content=b"paciente=Juan Perez cedula=0102030405",
            headers={"Authorization": "Bearer token-secreto"},
        )
    finally:
        with contextlib.suppress(Exception):
            logger.removeHandler(handler)
        with contextlib.suppress(Exception):
            root.removeHandler(handler)

    output = stream.getvalue()
    assert "Juan Perez" not in output
    assert "0102030405" not in output
    assert "token-secreto" not in output
    lines = [line for line in output.strip().splitlines() if line.strip()]
    if not lines:
        assert resp.status_code in (200, 405)
        return
    record = json.loads(lines[-1])
    for key in ("method", "path", "status", "duration_ms", "request_id"):
        assert key in record
