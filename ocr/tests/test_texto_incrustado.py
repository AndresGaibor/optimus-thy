"""Pruebas de /texto-incrustado: detección de texto incrustado (HT-051)."""

from __future__ import annotations

import io

import pytest
from fastapi.testclient import TestClient

from app.contrato import BloqueOcr, DocumentoOcr
from app.main import crear_app
from app.motores import AVISO_SIN_CONFIANZA, ErrorMotorOcr, MotorTesseract
from tests.conftest import MotorFalso, motor_fijo

PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 32
PDF = b"%PDF-1.4\n% ficha sintetica de prueba\n%%EOF\n"


def _png_con_texto() -> bytes:
    pil = pytest.importorskip("PIL.Image")
    draw_mod = pytest.importorskip("PIL.ImageDraw")
    imagen = pil.new("RGB", (320, 160), "white")
    dibujo = draw_mod.Draw(imagen)
    dibujo.text((10, 10), "PACIENTE 123", fill="black")
    salida = io.BytesIO()
    imagen.save(salida, format="PNG")
    return salida.getvalue()


def test_texto_incrustado_devuelve_regiones_y_detectado() -> None:
    documento = DocumentoOcr(
        motor="falso",
        modelo="modelo-de-prueba",
        huella_modelo=None,
        paginas=1,
        texto_markdown="",
        bloques=(
            BloqueOcr(
                pagina=1,
                orden=0,
                etiqueta="text",
                texto="PACIENTE 123",
                bbox=(0.1, 0.1, 0.4, 0.2),
                confianza=0.95,
            ),
        ),
    )
    motor = MotorFalso(documento=documento)
    with TestClient(crear_app(motor_fijo(motor))) as cliente:
        respuesta = cliente.post(
            "/texto-incrustado", files={"imagen": ("eco.png", PNG, "image/png")}
        )

    assert respuesta.status_code == 200
    cuerpo = respuesta.json()
    assert cuerpo["version_contrato"] == "1.1"
    assert cuerpo["motor"] == "falso"
    assert cuerpo["detectado"] is True
    assert cuerpo["regiones"] == [
        {"bbox": [0.1, 0.1, 0.4, 0.2], "texto": "PACIENTE 123", "confianza": 0.95}
    ]
    assert "campos" not in cuerpo
    assert motor.llamadas == [(PNG, "image/png")]
    assert motor.texto_incrustado == [True]


def test_texto_incrustado_sin_bloques_no_detecta() -> None:
    documento = DocumentoOcr(
        motor="falso",
        modelo="modelo-de-prueba",
        huella_modelo=None,
        paginas=1,
        texto_markdown="",
        bloques=(),
    )
    motor = MotorFalso(documento=documento)
    with TestClient(crear_app(motor_fijo(motor))) as cliente:
        respuesta = cliente.post(
            "/texto-incrustado", files={"imagen": ("eco.png", PNG, "image/png")}
        )

    assert respuesta.status_code == 200
    assert respuesta.json() == {
        "version_contrato": "1.1",
        "motor": "falso",
        "regiones": [],
        "detectado": False,
    }


def test_texto_incrustado_rechaza_pdf_y_tipo_no_admitido() -> None:
    motor = MotorFalso()
    with TestClient(crear_app(motor_fijo(motor))) as cliente:
        pdf = cliente.post(
            "/texto-incrustado", files={"imagen": ("eco.pdf", PDF, "application/pdf")}
        )
        texto = cliente.post(
            "/texto-incrustado", files={"imagen": ("eco.txt", b"hola", "text/plain")}
        )

    assert pdf.status_code == 415
    assert texto.status_code == 415
    assert motor.llamadas == []


def test_texto_incrustado_respeta_tamano_y_errores() -> None:
    motor = MotorFalso()
    with TestClient(crear_app(motor_fijo(motor))) as cliente:
        vacio = cliente.post("/texto-incrustado", files={"imagen": ("eco.png", b"", "image/png")})
    assert vacio.status_code == 422

    motor_error = MotorFalso(error=ErrorMotorOcr("secreto"))
    with TestClient(crear_app(motor_fijo(motor_error))) as cliente:
        caido = cliente.post("/texto-incrustado", files={"imagen": ("eco.png", PNG, "image/png")})
    assert caido.status_code == 503
    assert "secreto" not in caido.text


def test_texto_incrustado_incluye_aviso_del_motor() -> None:
    documento = DocumentoOcr(
        motor="glm-ocr",
        modelo="zai-org/GLM-OCR",
        huella_modelo=None,
        paginas=1,
        texto_markdown="x",
        bloques=(
            BloqueOcr(
                pagina=1,
                orden=0,
                etiqueta="text",
                texto="PACIENTE",
                bbox=(0.1, 0.1, 0.4, 0.2),
                confianza=None,
            ),
        ),
        avisos=(AVISO_SIN_CONFIANZA,),
    )
    motor = MotorFalso(documento=documento)
    with TestClient(crear_app(motor_fijo(motor))) as cliente:
        respuesta = cliente.post(
            "/texto-incrustado", files={"imagen": ("eco.png", PNG, "image/png")}
        )

    cuerpo = respuesta.json()
    assert cuerpo["detectado"] is True
    assert cuerpo["regiones"][0]["confianza"] is None
    assert AVISO_SIN_CONFIANZA in cuerpo["avisos"]


def test_tesseract_detecta_texto_en_imagen_sintetica(monkeypatch: pytest.MonkeyPatch) -> None:
    pytest.importorskip("pytesseract")
    pytest.importorskip("PIL.Image")
    motor = MotorTesseract()

    def datos(_imagen: object, _idioma: str, _config: str = "") -> dict[str, list[object]]:
        return {
            "text": ["PACIENTE", "123"],
            "conf": [95, 90],
            "left": [10, 120],
            "top": [10, 10],
            "width": [100, 40],
            "height": [20, 20],
            "block_num": [1, 1],
            "par_num": [1, 1],
            "line_num": [1, 1],
        }

    monkeypatch.setattr(motor, "disponible", lambda: None)
    monkeypatch.setattr(
        "app.motores._paginas_de", lambda *_a, **_k: [type("I", (), {"size": (320, 160)})()]
    )
    monkeypatch.setattr("app.motores._datos_de_tesseract", datos)
    monkeypatch.setattr(motor, "_huella_del_binario", lambda: None)

    contenido = _png_con_texto()
    with TestClient(crear_app(motor_fijo(motor))) as cliente:
        respuesta = cliente.post(
            "/texto-incrustado", files={"imagen": ("eco.png", contenido, "image/png")}
        )

    assert respuesta.status_code == 200
    cuerpo = respuesta.json()
    assert cuerpo["motor"] == "tesseract"
    assert cuerpo["detectado"] is True
    assert [region["texto"] for region in cuerpo["regiones"]] == ["PACIENTE", "123"]
    assert cuerpo["regiones"][0]["confianza"] == pytest.approx(0.95)
    assert cuerpo["regiones"][1]["confianza"] == pytest.approx(0.9)
    assert all(region["bbox"] is not None for region in cuerpo["regiones"])
