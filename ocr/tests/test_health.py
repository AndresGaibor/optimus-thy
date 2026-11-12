"""Pruebas de /health: estado ``ok``, ``degradado`` y el motivo."""

from __future__ import annotations

from importlib.machinery import ModuleSpec
from typing import Any

import pytest
from fastapi.testclient import TestClient

from app import motores
from app.main import crear_app
from tests.conftest import MotorFalso, motor_fijo

CAMPOS_OK = {
    "status",
    "servicio",
    "motor",
    "modelo",
    "modelo_cargado",
    "version_contrato",
}


def test_health_ok() -> None:
    with TestClient(crear_app(motor_fijo(MotorFalso()))) as cliente:
        respuesta = cliente.get("/health")

    assert respuesta.status_code == 200
    assert respuesta.json() == {
        "status": "ok",
        "servicio": "ocr",
        "motor": "falso",
        "modelo": "modelo-de-prueba",
        "modelo_cargado": True,
        "version_contrato": "1.1",
    }
    assert set(respuesta.json()) == CAMPOS_OK


def test_health_degradado_lleva_el_motivo() -> None:
    motor = MotorFalso(motivo="el binario tesseract no está instalado")
    with TestClient(crear_app(motor_fijo(motor))) as cliente:
        cuerpo = cliente.get("/health").json()

    assert cuerpo["status"] == "degradado"
    assert cuerpo["modelo_cargado"] is False
    assert cuerpo["detalle"] == "el binario tesseract no está instalado"
    assert set(cuerpo) == CAMPOS_OK | {"detalle"}


def test_glm_sin_paquete_arranca_degradado(monkeypatch: pytest.MonkeyPatch) -> None:
    original = motores.importlib.util.find_spec

    def find_spec(nombre: str, *argumentos: Any, **opciones: Any) -> ModuleSpec | None:
        if nombre == "glmocr":
            return None
        return original(nombre, *argumentos, **opciones)

    monkeypatch.setattr(motores.importlib.util, "find_spec", find_spec)

    with TestClient(crear_app()) as cliente:  # OCR_MOTOR por defecto: glm
        cuerpo = cliente.get("/health").json()

    assert cuerpo["status"] == "degradado"
    assert cuerpo["motor"] == "glm-ocr"
    assert cuerpo["modelo"] == "zai-org/GLM-OCR"
    assert "glmocr" in cuerpo["detalle"]


def test_tesseract_sin_binario_arranca_degradado(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("OCR_MOTOR", "tesseract")
    monkeypatch.setattr(motores, "_modulo_instalado", lambda *nombres: True)
    monkeypatch.setattr(motores.shutil, "which", lambda nombre: None)

    with TestClient(crear_app()) as cliente:
        cuerpo = cliente.get("/health").json()

    assert cuerpo["status"] == "degradado"
    assert cuerpo["motor"] == "tesseract"
    assert "tesseract" in cuerpo["detalle"]


def test_motor_desconocido_no_tumba_el_servicio(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("OCR_MOTOR", "magia")

    with TestClient(crear_app()) as cliente:
        cuerpo = cliente.get("/health").json()

    assert cuerpo["status"] == "degradado"
    assert cuerpo["motor"] == "magia"
    assert "OCR_MOTOR" in cuerpo["detalle"]
    assert cuerpo["version_contrato"] == "1.1"


def test_al_apagar_se_cierra_el_motor() -> None:
    class MotorCerrable(MotorFalso):
        cerrado = False

        def cerrar(self) -> None:
            self.cerrado = True

    motor = MotorCerrable()
    with TestClient(crear_app(motor_fijo(motor))):
        pass

    assert motor.cerrado is True
