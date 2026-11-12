"""Pruebas del servicio HTTP con dobles de los tres modelos (sin torch).

Cubren el contrato de ``/inferir`` (0, 1 y 3 nódulos, cuarto descartado), el
503 cuando falta un modelo, la carga única por proceso y ``/health`` con los
tres modelos y una huella estable.
"""

from __future__ import annotations

import base64
from collections.abc import Sequence
from typing import Any

import cv2
import numpy as np
import pytest
from fastapi.testclient import TestClient

from app.carga import CargaModelos, EstadoModelo, umbrales_de
from app.config import ConfiguracionIA
from app.contrato import Caja
from app.main import crear_aplicacion
from app.modelos import Deteccion, ModelosIA, ProbabilidadesNodulo

HUELLA = "f" * 64


class DetectorFijo:
    def __init__(self, cajas: Sequence[Caja], confianzas: Sequence[float] | None = None) -> None:
        self.cajas = list(cajas)
        valores = list(confianzas or [0.9] * len(self.cajas))
        self.detecciones = [
            Deteccion(caja=caja, confianza=confianza)
            for caja, confianza in zip(self.cajas, valores, strict=True)
        ]

    def detectar(self, imagen: np.ndarray, config: ConfiguracionIA) -> Sequence[Deteccion]:
        return tuple(self.detecciones)


class SegmentadorFijo:
    def segmentar(self, imagen: np.ndarray, caja: Caja, config: ConfiguracionIA) -> np.ndarray:
        mascara = np.zeros(imagen.shape[:2], dtype=np.uint8)
        mascara[caja.ymin : caja.ymax, caja.xmin : caja.xmax] = 255
        return mascara


class ClasificadorFijo:
    def __init__(self, benigno: float = 0.7, maligno: float = 0.3) -> None:
        self.probabilidades = ProbabilidadesNodulo(benigno=benigno, maligno=maligno)

    def clasificar(
        self, imagen_roi: np.ndarray, mascara_roi: np.ndarray, config: ConfiguracionIA
    ) -> ProbabilidadesNodulo:
        return self.probabilidades


class CargadorFalso:
    """Sustituye a ``cargar_modelos`` y cuenta cuántas veces se le llama."""

    def __init__(self, modelos: ModelosIA | None) -> None:
        self.modelos = modelos
        self.llamadas = 0

    def __call__(self, config: ConfiguracionIA) -> CargaModelos:
        self.llamadas += 1
        archivos = (
            ("detector", config.yolo_pesos, config.ruta_yolo),
            ("segmentador", config.bgaunet_pesos, config.ruta_bgaunet),
            ("clasificador", config.swin_pesos, config.ruta_swin),
        )
        estados = tuple(
            EstadoModelo(
                nombre=nombre,
                archivo=archivo,
                ruta=ruta,
                sha256=None if self.modelos is None else "a" * 64,
                cargado=self.modelos is not None,
                detalle=None if self.modelos is not None else "Falta el archivo de pesos.",
            )
            for nombre, archivo, ruta in archivos
        )
        return CargaModelos(
            modelos=self.modelos,
            estados=estados,
            huella="" if self.modelos is None else HUELLA,
            umbrales=umbrales_de(config),
        )


def imagen_png(lado: int = 160) -> bytes:
    imagen = np.full((lado, lado, 3), 40, dtype=np.uint8)
    imagen[lado // 4 : 3 * lado // 4, lado // 4 : 3 * lado // 4] = 180
    correcto, codificada = cv2.imencode(".png", imagen)
    assert correcto
    return codificada.tobytes()


def modelos(cajas: Sequence[Caja], confianzas: Sequence[float] | None = None) -> ModelosIA:
    return ModelosIA(
        detector=DetectorFijo(cajas, confianzas),
        segmentador=SegmentadorFijo(),
        clasificador=ClasificadorFijo(),
    )


@pytest.fixture(autouse=True)
def entorno(monkeypatch: pytest.MonkeyPatch, tmp_path: Any) -> None:
    """Modelos en un directorio temporal y MGAC corto para pruebas rápidas."""
    monkeypatch.setenv("IA_MODELOS_DIR", str(tmp_path))
    monkeypatch.setenv("IA_MGAC_ITERACIONES", "6")
    monkeypatch.setenv("IA_MGAC_RADIO_CIERRE", "0")


def abrir(modelos_ia: ModelosIA | None) -> tuple[TestClient, CargadorFalso]:
    cargador = CargadorFalso(modelos_ia)
    return TestClient(crear_aplicacion(cargador)), cargador


def publicar(cliente: TestClient) -> Any:
    return cliente.post("/inferir", files={"imagen": ("eco.png", imagen_png(), "image/png")})


def test_health_confirma_los_tres_modelos_y_una_huella_estable() -> None:
    cliente, cargador = abrir(modelos([]))

    with cliente:
        primera = cliente.get("/health").json()
        segunda = cliente.get("/health").json()

    assert primera["status"] == "ok"
    assert primera["servicio"] == "ia"
    assert primera["version_contrato"] == "1.1"
    assert primera["huella_modelos"] == HUELLA == segunda["huella_modelos"]
    assert set(primera["modelos"]) == {"detector", "segmentador", "clasificador"}
    for estado in primera["modelos"].values():
        assert estado["cargado"] is True
        assert estado["sha256"] == "a" * 64
    assert primera["modelos"]["detector"]["archivo"] == "best_yolo.pt"
    assert cargador.llamadas == 1


def test_la_carga_se_ejecuta_una_sola_vez_por_proceso() -> None:
    cliente, cargador = abrir(modelos([]))

    with cliente:
        cliente.get("/health")
        cliente.get("/health")
        publicar(cliente)

    assert cargador.llamadas == 1


def test_inferir_sin_nodulos_devuelve_contrato_vacio() -> None:
    cliente, _ = abrir(modelos([]))

    with cliente:
        respuesta = publicar(cliente)

    assert respuesta.status_code == 200
    cuerpo = respuesta.json()
    assert cuerpo["version_contrato"] == "1.1"
    assert cuerpo["sin_nodulo"] is True
    assert cuerpo["nodulos"] == []
    assert cuerpo["huella_modelos"] == HUELLA
    assert cuerpo["umbrales"]["yolo_confianza"] == 0.25


def test_inferir_un_nodulo_incluye_huella_y_umbrales() -> None:
    cliente, _ = abrir(modelos([Caja(40, 40, 100, 100)]))

    with cliente:
        respuesta = publicar(cliente)

    cuerpo = respuesta.json()
    assert respuesta.status_code == 200
    assert cuerpo["sin_nodulo"] is False
    assert len(cuerpo["nodulos"]) == 1
    nodulo = cuerpo["nodulos"][0]
    assert nodulo["indice"] == 1
    assert nodulo["clase"] == "benigno"
    assert nodulo["origen_mascara"] == "bgaunet"
    assert cuerpo["huella_modelos"] == HUELLA
    assert cuerpo["umbrales"]["max_nodulos"] == 3


def test_inferir_un_nodulo_lleva_sus_artefactos_en_base64() -> None:
    cliente, _ = abrir(modelos([Caja(40, 40, 100, 100)]))

    with cliente:
        respuesta = publicar(cliente)

    cuerpo = respuesta.json()
    assert cuerpo["version_contrato"] == "1.1"
    nodulo = cuerpo["nodulos"][0]
    for clave in ("mascara_png", "mgac_png", "superposicion_png"):
        assert base64.b64decode(nodulo[clave]).startswith(b"\x89PNG\r\n\x1a\n")
    xml = base64.b64decode(nodulo["xml"]).decode("utf-8")
    assert "<filename>imagen</filename>" in xml
    assert "<xmin>40</xmin>" in xml
    assert "<fallback_full_image>0</fallback_full_image>" in xml


def test_inferir_tres_nodulos_y_descarta_el_cuarto() -> None:
    cajas = [
        Caja(10, 10, 40, 40),
        Caja(50, 10, 80, 40),
        Caja(90, 10, 120, 40),
        Caja(10, 60, 40, 90),
    ]
    cliente, _ = abrir(modelos(cajas, [0.6, 0.9, 0.8, 0.7]))

    with cliente:
        respuesta = publicar(cliente)

    cuerpo = respuesta.json()
    assert respuesta.status_code == 200
    assert len(cuerpo["nodulos"]) == 3
    assert [nodulo["indice"] for nodulo in cuerpo["nodulos"]] == [1, 2, 3]
    assert all(
        nodulo["caja"] != {"xmin": 10, "ymin": 10, "xmax": 40, "ymax": 40}
        for nodulo in cuerpo["nodulos"]
    )


def test_inferir_sin_modelos_responde_503_con_lo_que_falta() -> None:
    cliente, _ = abrir(None)

    with cliente:
        respuesta = publicar(cliente)

    assert respuesta.status_code == 503
    cuerpo = respuesta.json()
    assert cuerpo["code"] == "modelo_no_disponible"
    assert {faltante["modelo"] for faltante in cuerpo["faltantes"]} == {
        "detector",
        "segmentador",
        "clasificador",
    }


def test_inferir_rechaza_un_archivo_que_no_es_imagen() -> None:
    cliente, _ = abrir(modelos([]))

    with cliente:
        respuesta = cliente.post(
            "/inferir", files={"imagen": ("notas.png", b"no es una imagen", "image/png")}
        )

    assert respuesta.status_code == 422
    assert respuesta.json()["code"] == "imagen_invalida"
    assert "imagen" in respuesta.json()["mensaje"].lower()


def test_inferir_rechaza_un_tipo_no_soportado() -> None:
    cliente, _ = abrir(modelos([]))

    with cliente:
        respuesta = cliente.post("/inferir", files={"imagen": ("eco.txt", b"texto", "text/plain")})

    assert respuesta.status_code == 422
    assert respuesta.json()["code"] == "imagen_invalida"


def test_inferir_rechaza_una_imagen_vacia() -> None:
    cliente, _ = abrir(modelos([]))

    with cliente:
        respuesta = cliente.post("/inferir", files={"imagen": ("eco.png", b"", "image/png")})

    assert respuesta.status_code == 422
    assert respuesta.json()["code"] == "imagen_invalida"
