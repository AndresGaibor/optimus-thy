"""Pruebas de la carga única, la huella y el reporte de modelos ausentes (HT-062)."""

from __future__ import annotations

from pathlib import Path
from typing import Any

import pytest

import app.carga as carga
from app.carga import (
    CargaModelos,
    archivos_de_pesos,
    cargar_modelos,
    huella_pesos,
    sha256_archivo,
    umbrales_de,
)
from app.config import ConfiguracionIA
from app.modelos import MOTIVO_LIBRERIA, ModeloNoDisponible, ModelosIA


class ModeloFalso:
    """Adaptador mínimo: la carga no lo usa, solo se guarda."""


class Contador:
    def __init__(self, modelo: Any | None = None, error: Exception | None = None) -> None:
        self.modelo = modelo
        self.error = error
        self.llamadas = 0

    def __call__(self, config: ConfiguracionIA, ruta: Path) -> Any:
        self.llamadas += 1
        if self.error is not None:
            raise self.error
        return self.modelo


def configuracion(directorio: Path, **cambios: Any) -> ConfiguracionIA:
    valores: dict[str, Any] = {"modelos_dir": directorio}
    valores.update(cambios)
    return ConfiguracionIA(**valores)


def crear_pesos(directorio: Path, contenidos: dict[str, bytes] | None = None) -> None:
    archivos = contenidos or {
        "best_yolo.pt": b"yolo",
        "best_bgaunet.keras": b"bgaunet",
        "best_swin.pth": b"swin",
    }
    for nombre, contenido in archivos.items():
        (directorio / nombre).write_bytes(contenido)


@pytest.fixture(autouse=True)
def limpiar_cache() -> Any:
    cargar_modelos.cache_clear()
    yield
    cargar_modelos.cache_clear()


@pytest.fixture
def fabricas(monkeypatch: pytest.MonkeyPatch) -> dict[str, Contador]:
    contadores = {nombre: Contador(ModeloFalso()) for nombre in carga.NOMBRES_MODELOS}
    for nombre, contador in contadores.items():
        monkeypatch.setitem(carga._FABRICAS, nombre, contador)
    return contadores


def test_huella_es_estable_y_cambia_con_un_byte(tmp_path: Path) -> None:
    crear_pesos(tmp_path)
    config = configuracion(tmp_path)

    primera = huella_pesos(config.modelos_dir)
    segunda = huella_pesos(config.modelos_dir)

    assert len(primera) == 64
    assert primera == segunda

    (tmp_path / "best_swin.pth").write_bytes(b"swin!")
    assert huella_pesos(config.modelos_dir) != primera


def test_huella_solo_considera_archivos_de_pesos(tmp_path: Path) -> None:
    crear_pesos(tmp_path)
    antes = huella_pesos(tmp_path)

    (tmp_path / "notas.txt").write_bytes(b"no son pesos")

    assert huella_pesos(tmp_path) == antes
    assert [ruta.name for ruta in archivos_de_pesos(tmp_path)] == sorted(
        ["best_yolo.pt", "best_bgaunet.keras", "best_swin.pth"]
    )


def test_sha256_archivo_inexistente_es_none(tmp_path: Path) -> None:
    assert sha256_archivo(tmp_path / "no.pt") is None


def test_carga_sin_pesos_reporta_los_tres_sin_lanzar(tmp_path: Path) -> None:
    resultado = cargar_modelos(configuracion(tmp_path))

    assert resultado.disponible is False
    assert resultado.modelos is None
    assert {estado.nombre for estado in resultado.ausentes} == set(carga.NOMBRES_MODELOS)
    assert all(
        "Falta el archivo de pesos" in (estado.detalle or "") for estado in resultado.ausentes
    )


def test_carga_usa_los_tres_adaptadores_y_no_repite_en_el_proceso(
    tmp_path: Path, fabricas: dict[str, Contador]
) -> None:
    crear_pesos(tmp_path)
    config = configuracion(tmp_path)

    primero = cargar_modelos(config)
    segundo = cargar_modelos(config)

    assert primero is segundo
    assert primero.disponible is True
    assert isinstance(primero.modelos, ModelosIA)
    assert all(contador.llamadas == 1 for contador in fabricas.values())


def test_carga_reporta_libreria_ausente_y_sigue_con_los_demas(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    crear_pesos(tmp_path)
    error = ModeloNoDisponible(
        "detector", MOTIVO_LIBRERIA, "Falta la librería ultralytics para cargar YOLO11."
    )
    monkeypatch.setitem(carga._FABRICAS, "detector", Contador(error=error))
    segmentador = Contador(ModeloFalso())
    clasificador = Contador(ModeloFalso())
    monkeypatch.setitem(carga._FABRICAS, "segmentador", segmentador)
    monkeypatch.setitem(carga._FABRICAS, "clasificador", clasificador)

    resultado = cargar_modelos(configuracion(tmp_path))

    assert resultado.disponible is False
    assert resultado.estado("detector").cargado is False
    assert "ultralytics" in (resultado.estado("detector").detalle or "")
    assert resultado.estado("segmentador").cargado is True
    assert segmentador.llamadas == clasificador.llamadas == 1


def test_carga_reporta_archivo_del_modelo_que_si_existe(
    tmp_path: Path, fabricas: dict[str, Contador]
) -> None:
    crear_pesos(tmp_path, {"best_yolo.pt": b"yolo"})

    resultado = cargar_modelos(configuracion(tmp_path))

    assert resultado.estado("detector").sha256 is not None
    assert resultado.estado("detector").cargado is True
    assert fabricas["detector"].llamadas == 1
    faltantes = {estado.nombre for estado in resultado.ausentes}
    assert faltantes == {"segmentador", "clasificador"}
    assert resultado.estado("detector").archivo == "best_yolo.pt"


def test_sin_configuracion_el_estado_es_honesto() -> None:
    resultado = CargaModelos.sin_configuracion("Falta la variable de entorno IA_MODELOS_DIR.")

    assert resultado.disponible is False
    assert resultado.huella == ""
    assert [estado.cargado for estado in resultado.estados] == [False, False, False]
    assert resultado.modelos_a_diccionario()["detector"]["archivo"] == "best_yolo.pt"


def test_umbrales_documentan_lo_que_uso_la_inferencia(tmp_path: Path) -> None:
    umbrales = umbrales_de(configuracion(tmp_path, yolo_confianza=0.4, max_nodulos=2))

    assert umbrales["yolo_confianza"] == 0.4
    assert umbrales["yolo_iou"] == 0.60
    assert umbrales["max_nodulos"] == 2
    assert umbrales["min_pixeles_mascara"] == 20
