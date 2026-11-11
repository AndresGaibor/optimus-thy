"""Pruebas de los motores con dobles: sin glmocr, sin Tesseract y sin red."""

from __future__ import annotations

import hashlib
import io
import os
import random
import shutil
import socket
import sys
import types
from collections.abc import Iterator
from importlib.machinery import ModuleSpec
from typing import Any

import httpx
import pytest

from app import motores
from app.motores import (
    AVISO_API_EXTERNA,
    AVISO_SIN_CONFIANZA,
    ErrorMotorOcr,
    MotorGlmOcr,
    MotorTesseract,
)

PDF = b"%PDF-1.4\n% ficha sintetica de prueba\n%%EOF\n"
PNG = (
    b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00"
    b"\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00"
    b"\x00\x00IEND\xaeB`\x82"
)
MARKDOWN = "# Ficha clínica sintética\n\n| TSH | 2,5 mU/L |\n"

# Lo que devuelve el SDK: una lista de páginas y, en cada página, regiones con
# `label`, `content` y `bbox_2d` normalizada 0..1000.
JSON_GLM: list[list[dict[str, Any]]] = [
    [
        {
            "index": 0,
            "label": "text",
            "content": "FICHA CLÍNICA SINTÉTICA",
            "bbox_2d": [120, 340, 560, 380],
        },
        {
            "index": 1,
            "label": "table",
            "content": "TSH | 2,5 mU/L",
            "bbox_2d": [80, 500, 1160, 900],
        },
        {"index": 2, "label": "titulo", "content": "Etiqueta desconocida", "bbox_2d": None},
        {"index": 3, "label": "image", "content": "   ", "bbox_2d": [0, 0, 10, 10]},
    ],
    [
        {"index": 0, "label": "formula", "content": "x^2", "bbox_2d": [10, 10, 20, 20]},
    ],
]


class _Resultado:
    def __init__(self, markdown: str, json_result: list[Any]) -> None:
        self.markdown_result = markdown
        self.json_result = json_result


class _Parser:
    def __init__(self, resultado: _Resultado) -> None:
        self.resultado = resultado
        self.documentos: list[bytes] = []
        self.cerrado = False

    def __enter__(self) -> _Parser:
        return self

    def __exit__(self, *excepcion: object) -> bool:
        return False

    def close(self) -> None:
        self.cerrado = True

    def parse(self, documento: bytes) -> _Resultado:
        self.documentos.append(documento)
        return self.resultado


class _ImagenFalsa:
    """Sustituto de una página: el motor de Tesseract solo usa ``size``."""

    def __init__(self, tamano: tuple[int, int]) -> None:
        self.size = tamano


@pytest.fixture
def glmocr_falso(monkeypatch: pytest.MonkeyPatch) -> dict[str, Any]:
    """Instala un ``glmocr`` mínimo en ``sys.modules`` y devuelve su registro."""
    registro: dict[str, Any] = {"resultado": _Resultado(MARKDOWN, JSON_GLM)}

    def GlmOcr(**opciones: Any) -> _Parser:  # el nombre es el del SDK
        registro["opciones"] = opciones
        parser = _Parser(registro["resultado"])
        registro["parser"] = parser
        return parser

    modulo = types.ModuleType("glmocr")
    modulo.GlmOcr = GlmOcr
    modulo.__spec__ = ModuleSpec("glmocr", loader=None)
    monkeypatch.setitem(sys.modules, "glmocr", modulo)
    return registro


@pytest.fixture
def servidor_local() -> Iterator[tuple[str, int]]:
    """Socket escuchando en 127.0.0.1, para que la sonda del motor lo vea abierto."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as servidor:
        servidor.bind(("127.0.0.1", 0))
        servidor.listen()
        yield ("127.0.0.1", servidor.getsockname()[1])


def _pesos(tmp_path: Any) -> Any:
    carpeta = tmp_path / "glm-ocr"
    carpeta.mkdir()
    (carpeta / "config.json").write_bytes(b"{}")
    (carpeta / "model.safetensors").write_bytes(b"x" * 32)
    return carpeta


def test_glm_local_usa_selfhosted_y_no_la_api(
    glmocr_falso: dict[str, Any], servidor_local: tuple[str, int], tmp_path: Any
) -> None:
    pesos = _pesos(tmp_path)
    motor = MotorGlmOcr(modelo_dir=pesos, servidor=servidor_local)

    assert motor.disponible() is None
    documento = motor.reconocer(PDF, "application/pdf")

    opciones = glmocr_falso["opciones"]
    assert opciones["mode"] == "selfhosted"
    assert "api_key" not in opciones
    assert opciones["ocr_api_host"] == servidor_local[0]
    assert opciones["ocr_api_port"] == servidor_local[1]
    assert opciones["model"] == "glm-ocr"
    assert opciones["layout_device"] == "cpu"
    assert opciones["_dotted"] == {"pipeline.ocr_api.connect_timeout": 5}
    assert glmocr_falso["parser"].documentos == [PDF]

    assert documento.motor == "glm-ocr"
    assert documento.modelo == "zai-org/GLM-OCR"
    assert documento.paginas == 2
    assert documento.texto_markdown == MARKDOWN
    assert [bloque.etiqueta for bloque in documento.bloques] == [
        "text",
        "table",
        "text",
        "formula",
    ]
    assert [bloque.orden for bloque in documento.bloques] == [0, 1, 2, 3]
    assert [bloque.pagina for bloque in documento.bloques] == [1, 1, 1, 2]
    assert documento.bloques[0].bbox == (0.12, 0.34, 0.56, 0.38)
    assert documento.bloques[2].bbox is None
    assert all(bloque.confianza is None for bloque in documento.bloques)
    assert documento.avisos == (AVISO_SIN_CONFIANZA,)

    esperado = hashlib.sha256()
    for archivo in sorted(pesos.rglob("*")):
        if archivo.is_file():
            relativo = archivo.relative_to(pesos).as_posix()
            esperado.update(f"{relativo}\0{archivo.stat().st_size}\n".encode())
    assert documento.huella_modelo == esperado.hexdigest()


def test_glm_layout_dir_apunta_al_detector_no_a_los_pesos_del_ocr(
    glmocr_falso: dict[str, Any], servidor_local: tuple[str, int], tmp_path: Any
) -> None:
    pesos = _pesos(tmp_path)
    layout = tmp_path / "pp-doclayout"
    layout.mkdir()

    motor = MotorGlmOcr(modelo_dir=pesos, layout_dir=layout, servidor=servidor_local)
    motor.reconocer(PDF, "application/pdf")

    puntuales = glmocr_falso["opciones"]["_dotted"]
    assert puntuales["pipeline.layout.model_dir"] == str(layout)
    # Los pesos de GLM-OCR los carga el servidor de inferencia, no el SDK.
    assert str(pesos) not in puntuales.values()


def test_glm_sin_pesos_de_layout_queda_degradado(
    glmocr_falso: dict[str, Any], servidor_local: tuple[str, int], tmp_path: Any
) -> None:
    motor = MotorGlmOcr(layout_dir=tmp_path / "no-existe", servidor=servidor_local)

    motivo = motor.disponible()

    assert motivo is not None
    assert "OCR_MODELO_LAYOUT_DIR" in motivo


def test_glm_local_no_sale_a_la_red(
    monkeypatch: pytest.MonkeyPatch,
    glmocr_falso: dict[str, Any],
    servidor_local: tuple[str, int],
) -> None:
    def prohibido(*argumentos: object, **opciones: object) -> None:
        raise AssertionError("el servicio intentó salir a la red")

    for nombre in ("get", "post", "put", "request"):
        monkeypatch.setattr(httpx, nombre, prohibido)
    monkeypatch.setattr(httpx.Client, "request", prohibido)
    monkeypatch.setattr(httpx.AsyncClient, "request", prohibido)

    documento = MotorGlmOcr(servidor=servidor_local).reconocer(PDF, "application/pdf")

    assert documento.paginas == 2
    # Los pesos no se descargan: si no están en disco, el motor falla en vez de bajar.
    assert os.environ["HF_HUB_OFFLINE"] == "1"
    assert os.environ["TRANSFORMERS_OFFLINE"] == "1"


def test_glm_no_hereda_maas_del_entorno(
    monkeypatch: pytest.MonkeyPatch,
    glmocr_falso: dict[str, Any],
    servidor_local: tuple[str, int],
) -> None:
    monkeypatch.setenv("ZHIPU_API_KEY", "sk-de-otra-cosa")
    monkeypatch.setenv("GLMOCR_MODE", "maas")

    MotorGlmOcr(servidor=servidor_local).reconocer(PDF, "application/pdf")

    opciones = glmocr_falso["opciones"]
    assert opciones["mode"] == "selfhosted"
    assert "api_key" not in opciones


def test_glm_cierra_el_parser(
    glmocr_falso: dict[str, Any], servidor_local: tuple[str, int]
) -> None:
    motor = MotorGlmOcr(servidor=servidor_local)
    motor.reconocer(PDF, "application/pdf")

    motor.cerrar()

    assert glmocr_falso["parser"].cerrado is True
    motor.cerrar()  # cerrar dos veces no falla


def test_glm_sin_paquete_degrada_sin_excepcion(monkeypatch: pytest.MonkeyPatch) -> None:
    original = motores.importlib.util.find_spec

    def find_spec(nombre: str, *argumentos: Any, **opciones: Any) -> ModuleSpec | None:
        if nombre == "glmocr":
            return None
        return original(nombre, *argumentos, **opciones)

    monkeypatch.setattr(motores.importlib.util, "find_spec", find_spec)

    motor = MotorGlmOcr()
    motivo = motor.disponible()

    assert motivo is not None
    assert "glmocr" in motivo
    with pytest.raises(ErrorMotorOcr):
        motor.reconocer(PDF, "application/pdf")


def test_glm_sin_servidor_local_queda_degradado(glmocr_falso: dict[str, Any]) -> None:
    with socket.socket() as libre:
        libre.bind(("127.0.0.1", 0))
        puerto = libre.getsockname()[1]

    motor = MotorGlmOcr(servidor=("127.0.0.1", puerto))
    motivo = motor.disponible()

    assert motivo is not None
    assert "servidor de inferencia" in motivo
    with pytest.raises(ErrorMotorOcr):
        motor.reconocer(PDF, "application/pdf")


def test_glm_api_externa_avisa_de_privacidad(glmocr_falso: dict[str, Any]) -> None:
    motor = MotorGlmOcr(
        api_key="sk-prueba",
        api_url="https://api.z.ai/api/paas/v4/layout_parsing",
    )

    assert motor.disponible() is None
    documento = motor.reconocer(PDF, "application/pdf")

    opciones = glmocr_falso["opciones"]
    assert opciones["mode"] == "maas"
    assert opciones["api_key"] == "sk-prueba"
    assert opciones["api_url"] == "https://api.z.ai/api/paas/v4/layout_parsing"
    assert documento.avisos[0] == AVISO_API_EXTERNA
    assert AVISO_SIN_CONFIANZA in documento.avisos


DATOS_TESSERACT: dict[str, list[Any]] = {
    "text": ["FICHA", "SINTÉTICA", "", "TSH", "2,5", "mU/L"],
    "conf": ["96.5", "88.0", "-1", "92.0", "70.5", "81.0"],
    "left": [100, 160, 0, 100, 200, 260],
    "top": [50, 50, 0, 120, 120, 120],
    "width": [55, 90, 0, 45, 55, 40],
    "height": [15, 15, 0, 15, 15, 15],
    "block_num": [1, 1, 1, 1, 1, 1],
    "par_num": [1, 1, 1, 1, 1, 1],
    "line_num": [1, 1, 1, 2, 2, 2],
}


def _motor_tesseract_con_dobles(
    monkeypatch: pytest.MonkeyPatch, datos: dict[str, list[Any]], tamano: tuple[int, int]
) -> MotorTesseract:
    motor = MotorTesseract()
    monkeypatch.setattr(motor, "disponible", lambda: None)
    monkeypatch.setattr(
        motores, "_paginas_de", lambda contenido, tipo, dpi=200: [_ImagenFalsa(tamano)]
    )
    monkeypatch.setattr(motores, "_datos_de_tesseract", lambda imagen, idioma, config="": datos)
    return motor


def test_tesseract_mapea_lineas_confianza_y_bbox(monkeypatch: pytest.MonkeyPatch) -> None:
    motor = _motor_tesseract_con_dobles(monkeypatch, DATOS_TESSERACT, (1000, 500))

    documento = motor.reconocer(PDF, "application/pdf")

    assert documento.motor == "tesseract"
    assert documento.modelo == "tesseract-ocr-spa"
    assert documento.paginas == 1
    assert documento.texto_markdown == "FICHA SINTÉTICA\nTSH 2,5 mU/L"
    assert documento.avisos == ()
    assert [bloque.texto for bloque in documento.bloques] == ["FICHA SINTÉTICA", "TSH 2,5 mU/L"]
    assert documento.bloques[0].etiqueta == "text"
    assert documento.bloques[0].bbox == pytest.approx((0.1, 0.1, 0.25, 0.13))
    assert documento.bloques[0].confianza == pytest.approx(0.9225)
    assert documento.bloques[1].bbox == pytest.approx((0.1, 0.24, 0.3, 0.27))
    assert documento.bloques[1].confianza == pytest.approx(0.8117)


def test_tesseract_avisa_de_pagina_sin_texto(monkeypatch: pytest.MonkeyPatch) -> None:
    vacio: dict[str, list[Any]] = {
        "text": [""],
        "conf": ["-1"],
        "left": [0],
        "top": [0],
        "width": [0],
        "height": [0],
        "block_num": [1],
        "par_num": [1],
        "line_num": [1],
    }
    motor = _motor_tesseract_con_dobles(monkeypatch, vacio, (200, 200))

    documento = motor.reconocer(PNG, "image/png")

    assert documento.bloques == ()
    assert documento.texto_markdown == ""
    assert documento.avisos == ("la página 1 no produjo texto reconocible",)


def test_tesseract_documentos_usan_psm_3_sin_reintento(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    motor = MotorTesseract()
    monkeypatch.setattr(motor, "disponible", lambda: None)
    monkeypatch.setattr(
        motores, "_paginas_de", lambda contenido, tipo, dpi=200: [_ImagenFalsa((1000, 500))]
    )
    configuraciones: list[str] = []

    def datos(_imagen: object, _idioma: str, config: str = "") -> dict[str, list[Any]]:
        configuraciones.append(config)
        return DATOS_TESSERACT

    monkeypatch.setattr(motores, "_datos_de_tesseract", datos)

    documento = motor.reconocer(PDF, "application/pdf")

    assert configuraciones == [motores.PSM_DOCUMENTO]
    assert [bloque.texto for bloque in documento.bloques] == ["FICHA SINTÉTICA", "TSH 2,5 mU/L"]


def test_tesseract_texto_incrustado_usa_psm_6_y_palabras_sueltas(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    motor = MotorTesseract()
    monkeypatch.setattr(motor, "disponible", lambda: None)
    monkeypatch.setattr(
        motores, "_paginas_de", lambda contenido, tipo, dpi=200: [_ImagenFalsa((1000, 500))]
    )
    configuraciones: list[str] = []

    def datos(_imagen: object, _idioma: str, config: str = "") -> dict[str, list[Any]]:
        configuraciones.append(config)
        return DATOS_TESSERACT

    monkeypatch.setattr(motores, "_datos_de_tesseract", datos)

    documento = motor.reconocer(PDF, "application/pdf", texto_incrustado=True)

    assert configuraciones == [motores.PSM_TEXTO_EN_BLOQUE]
    # Una palabra por bloque, con su propia confianza, no una línea agrupada.
    assert [bloque.texto for bloque in documento.bloques] == [
        "FICHA",
        "SINTÉTICA",
        "TSH",
        "2,5",
        "mU/L",
    ]
    assert documento.bloques[0].confianza == pytest.approx(0.965)
    assert documento.bloques[1].bbox == pytest.approx((0.16, 0.1, 0.25, 0.13))


def test_tesseract_texto_incrustado_reintenta_con_psm_3_si_psm_6_no_da_texto(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    motor = MotorTesseract()
    monkeypatch.setattr(motor, "disponible", lambda: None)
    monkeypatch.setattr(
        motores, "_paginas_de", lambda contenido, tipo, dpi=200: [_ImagenFalsa((1000, 500))]
    )
    vacio: dict[str, list[Any]] = {
        "text": [""],
        "conf": ["-1"],
        "left": [0],
        "top": [0],
        "width": [0],
        "height": [0],
        "block_num": [1],
        "par_num": [1],
        "line_num": [1],
    }
    configuraciones: list[str] = []

    def datos(_imagen: object, _idioma: str, config: str = "") -> dict[str, list[Any]]:
        configuraciones.append(config)
        return DATOS_TESSERACT if config == motores.PSM_DOCUMENTO else vacio

    monkeypatch.setattr(motores, "_datos_de_tesseract", datos)

    documento = motor.reconocer(PDF, "application/pdf", texto_incrustado=True)

    assert configuraciones == [motores.PSM_TEXTO_EN_BLOQUE, motores.PSM_DOCUMENTO]
    assert [bloque.texto for bloque in documento.bloques] == [
        "FICHA",
        "SINTÉTICA",
        "TSH",
        "2,5",
        "mU/L",
    ]
    assert documento.avisos == ()


def _palabras(datos: dict[str, list[Any]]) -> list[str]:
    return [str(palabra) for palabra in datos["text"] if str(palabra).strip()]


def _ecografia_con_texto() -> Any:
    """Ecografía sintética: grano oscuro con anotaciones claras y sin personas."""
    image_mod = pytest.importorskip("PIL.Image")
    draw_mod = pytest.importorskip("PIL.ImageDraw")
    font_mod = pytest.importorskip("PIL.ImageFont")
    ancho, alto = 942, 1206
    azar = random.Random(11)
    imagen = image_mod.new("L", (ancho, alto))
    pixeles = imagen.load()
    for y in range(alto):
        for x in range(ancho):
            pixeles[x, y] = max(0, min(255, int(azar.gauss(80, 40))))
    dibujo = draw_mod.Draw(imagen)
    try:
        fuente = font_mod.truetype("DejaVuSans-Bold.ttf", 52)
    except OSError:  # sin fuentes TrueType en el sistema
        fuente = font_mod.load_default(52)
    dibujo.text((40, 18), "PACIENTE SINT-0001", font=fuente, fill=255)
    dibujo.text((40, 88), "FECHA 2026-03-14", font=fuente, fill=255)
    return imagen


def test_tesseract_detecta_anotaciones_que_psm_3_descarta() -> None:
    """En la ecografía sintética ``--psm 3`` no ve nada y ``--psm 6`` sí.

    Es el fallo medido: con la detección automática el texto grabado de una
    ecografía produce cero bloques y nunca se taparía; el motor ahora reintenta
    con ``--psm 6`` cuando la primera pasada no reconoce ningún bloque.
    """
    pytest.importorskip("pytesseract")
    if shutil.which("tesseract") is None:
        pytest.skip("el binario tesseract no está instalado")
    import pytesseract

    if "spa" not in pytesseract.get_languages(config=""):
        pytest.skip("el idioma español de Tesseract no está instalado")

    imagen = _ecografia_con_texto()
    assert _palabras(motores._datos_de_tesseract(imagen, "spa", motores.PSM_DOCUMENTO)) == []

    salida = io.BytesIO()
    imagen.save(salida, format="PNG")
    documento = MotorTesseract().reconocer(salida.getvalue(), "image/png", texto_incrustado=True)

    textos = [bloque.texto for bloque in documento.bloques]
    assert textos == [texto for texto in textos if texto]
    assert "PACIENTE" in textos
    paciente = next(bloque for bloque in documento.bloques if bloque.texto == "PACIENTE")
    assert paciente.confianza is not None and paciente.confianza >= 0.6
    assert paciente.bbox is not None


def test_tesseract_sin_binario_degrada(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(motores, "_modulo_instalado", lambda *nombres: True)
    monkeypatch.setattr(motores.shutil, "which", lambda nombre: None)

    motivo = MotorTesseract().disponible()

    assert motivo is not None
    assert "tesseract" in motivo


def test_tesseract_con_documento_ilegible(monkeypatch: pytest.MonkeyPatch) -> None:
    motor = MotorTesseract()
    monkeypatch.setattr(motor, "disponible", lambda: None)

    def revienta(contenido: bytes, tipo: str, dpi: int = 200) -> list[Any]:
        raise RuntimeError("pdf corrupto")

    monkeypatch.setattr(motores, "_paginas_de", revienta)

    with pytest.raises(ErrorMotorOcr):
        motor.reconocer(b"no es un pdf", "application/pdf")


def test_imagen_sin_pdf_se_abre_con_pillow() -> None:
    pytest.importorskip("PIL.Image", reason="Pillow viene con el extra tesseract")
    paginas = motores._paginas_de(PNG, "image/png")

    assert len(paginas) == 1
    assert paginas[0].size == (1, 1)
