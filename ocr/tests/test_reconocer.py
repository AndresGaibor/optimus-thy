"""Pruebas de /reconocer: contrato 1.1, rechazos y errores sin detalles internos."""

from __future__ import annotations

import base64

import pytest
from fastapi.testclient import TestClient

from app.main import Configuracion, _construir_motor, crear_app
from app.motores import ErrorMotorOcr
from tests.conftest import MotorFalso, motor_fijo

PDF = b"%PDF-1.4\n% ficha sintetica de prueba\n%%EOF\n"
PNG = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
)


def test_reconocer_pdf_devuelve_el_contrato() -> None:
    motor = MotorFalso()
    with TestClient(crear_app(motor_fijo(motor))) as cliente:
        respuesta = cliente.post(
            "/reconocer", files={"documento": ("ficha.pdf", PDF, "application/pdf")}
        )

    assert respuesta.status_code == 200
    cuerpo = respuesta.json()
    # El orden de claves es parte del contrato 1.1.
    assert list(cuerpo) == [
        "version_contrato",
        "motor",
        "modelo",
        "huella_modelo",
        "paginas",
        "texto_markdown",
        "bloques",
        "campos",
        "avisos",
    ]
    assert cuerpo["version_contrato"] == "1.1"
    assert cuerpo["paginas"] == 1
    assert cuerpo["bloques"] == [
        {
            "pagina": 1,
            "orden": 0,
            "etiqueta": "text",
            "texto": "TSH 2,5 mU/L",
            "bbox": [0.1, 0.2, 0.5, 0.25],
            "confianza": None,
        }
    ]
    assert cuerpo["campos"] == [
        {
            "nombre": "tsh",
            "valor": "2.5",
            "texto_origen": "TSH 2,5 mU/L",
            "confianza": None,
            "revisar": False,
        }
    ]
    assert cuerpo["avisos"] == [
        "aviso de prueba",
        "1 campo sin confianza del motor",
    ]
    assert motor.llamadas == [(PDF, "application/pdf")]


def test_reconocer_imagen_pasa_el_tipo_del_archivo() -> None:
    motor = MotorFalso()
    with TestClient(crear_app(motor_fijo(motor))) as cliente:
        respuesta = cliente.post("/reconocer", files={"documento": ("ficha.png", PNG, "image/png")})

    assert respuesta.status_code == 200
    assert motor.llamadas == [(PNG, "image/png")]


def test_tipo_se_deduce_de_la_extension_si_viene_generico() -> None:
    motor = MotorFalso()
    with TestClient(crear_app(motor_fijo(motor))) as cliente:
        respuesta = cliente.post(
            "/reconocer",
            files={"documento": ("ficha.jpeg", PNG, "application/octet-stream")},
        )

    assert respuesta.status_code == 200
    assert motor.llamadas[0][1] == "image/jpeg"


def test_tipo_no_admitido_responde_415() -> None:
    motor = MotorFalso()
    with TestClient(crear_app(motor_fijo(motor))) as cliente:
        respuesta = cliente.post(
            "/reconocer", files={"documento": ("ficha.txt", b"hola", "text/plain")}
        )

    assert respuesta.status_code == 415
    assert respuesta.json() == {"detail": "tipo de documento no admitido"}
    assert motor.llamadas == []


def test_documento_demasiado_grande_responde_413(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("OCR_MAX_BYTES", "1024")
    motor = MotorFalso()
    with TestClient(crear_app(motor_fijo(motor))) as cliente:
        respuesta = cliente.post(
            "/reconocer", files={"documento": ("ficha.pdf", b"x" * 4096, "application/pdf")}
        )

    assert respuesta.status_code == 413
    assert respuesta.json() == {"detail": "el documento supera el tamaño máximo admitido"}
    assert motor.llamadas == []


def test_documento_vacio_responde_422() -> None:
    motor = MotorFalso()
    with TestClient(crear_app(motor_fijo(motor))) as cliente:
        respuesta = cliente.post(
            "/reconocer", files={"documento": ("ficha.pdf", b"", "application/pdf")}
        )

    assert respuesta.status_code == 422
    assert respuesta.json() == {"detail": "el documento está vacío"}


def test_motor_no_disponible_responde_503_sin_detalles() -> None:
    motor = MotorFalso(error=ErrorMotorOcr("falta /opt/secreto/pesos"))
    with TestClient(crear_app(motor_fijo(motor))) as cliente:
        respuesta = cliente.post(
            "/reconocer", files={"documento": ("ficha.pdf", PDF, "application/pdf")}
        )

    assert respuesta.status_code == 503
    assert respuesta.json() == {"detail": "el motor de OCR no está disponible"}
    assert "secreto" not in respuesta.text


def test_fallo_del_motor_responde_500_sin_detalles() -> None:
    motor = MotorFalso(error=RuntimeError("Traceback en /srv/interno/widgets.py"))
    with TestClient(crear_app(motor_fijo(motor))) as cliente:
        respuesta = cliente.post(
            "/reconocer", files={"documento": ("ficha.pdf", PDF, "application/pdf")}
        )

    assert respuesta.status_code == 500
    assert respuesta.json() == {"detail": "no se pudo procesar el documento"}
    assert "Traceback" not in respuesta.text


def test_maximo_por_defecto_confianza_y_api_externa_apagada() -> None:
    configuracion = Configuracion.desde_entorno()
    assert configuracion.motor == "glm"
    assert configuracion.max_bytes == 20 * 1024 * 1024
    assert configuracion.confianza_minima == 0.60
    assert configuracion.permitir_api_externa is False


def test_la_clave_solo_pasa_al_motor_con_la_bandera_encendida(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("OCR_GLM_API_KEY", "sk-prueba")

    assert _construir_motor(Configuracion.desde_entorno()).modo == "local"

    monkeypatch.setenv("OCR_PERMITIR_API_EXTERNA", "true")
    assert _construir_motor(Configuracion.desde_entorno()).modo == "api"
