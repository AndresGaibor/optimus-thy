"""Pruebas de la configuración por variables de entorno (HT-061, RIA-02)."""

from __future__ import annotations

from pathlib import Path

import pytest

from app.config import MAX_NODULOS_POR_IMAGEN, ConfiguracionIA, ErrorConfiguracion


def test_valores_por_defecto() -> None:
    config = ConfiguracionIA.desde_entorno({"IA_MODELOS_DIR": "/modelos"})

    assert config.modelos_dir == Path("/modelos")
    assert config.max_nodulos == MAX_NODULOS_POR_IMAGEN == 3
    assert config.yolo_confianza == 0.25
    assert config.yolo_iou == 0.60
    assert config.mgac_margen == 1.15
    assert config.margen_roi == 0.10


def test_lee_valores_del_entorno() -> None:
    config = ConfiguracionIA.desde_entorno(
        {
            "IA_MODELOS_DIR": "/pesos",
            "IA_YOLO_PESOS": "yolo_v2.pt",
            "IA_MAX_NODULOS": "2",
            "IA_YOLO_CONFIANZA": "0.4",
            "IA_MIN_PIXELES_MASCARA": "35",
            "IA_DISPOSITIVO": "cpu",
        }
    )

    assert config.ruta_yolo == Path("/pesos/yolo_v2.pt")
    assert config.max_nodulos == 2
    assert config.yolo_confianza == 0.4
    assert config.min_pixeles_mascara == 35
    assert config.dispositivo == "cpu"


def test_exige_directorio_de_modelos() -> None:
    with pytest.raises(ErrorConfiguracion, match="IA_MODELOS_DIR"):
        ConfiguracionIA.desde_entorno({})


@pytest.mark.parametrize("valor", ["-0.1", "1.5", "alta"])
def test_rechaza_umbral_de_confianza_invalido(valor: str) -> None:
    with pytest.raises(ErrorConfiguracion, match="IA_YOLO_CONFIANZA"):
        ConfiguracionIA.desde_entorno({"IA_MODELOS_DIR": "/m", "IA_YOLO_CONFIANZA": valor})


@pytest.mark.parametrize("valor", ["0", "4", "ocho"])
def test_rechaza_maximo_de_nodulos_invalido(valor: str) -> None:
    with pytest.raises(ErrorConfiguracion, match="IA_MAX_NODULOS"):
        ConfiguracionIA.desde_entorno({"IA_MODELOS_DIR": "/m", "IA_MAX_NODULOS": valor})


def test_las_rutas_dependen_solo_de_la_configuracion() -> None:
    uno = ConfiguracionIA(modelos_dir=Path("/a"))
    otro = ConfiguracionIA(modelos_dir=Path("/b"))

    assert uno.ruta_yolo == Path("/a/best_yolo.pt")
    assert otro.ruta_yolo == Path("/b/best_yolo.pt")
    assert uno.ruta_bgaunet.name == "best_bgaunet.keras"
    assert uno.ruta_swin.name == "best_swin.pth"


def test_verificar_pesos_informa_los_faltantes(tmp_path: Path) -> None:
    config = ConfiguracionIA(modelos_dir=tmp_path)

    with pytest.raises(FileNotFoundError) as error:
        config.verificar_pesos()

    mensaje = str(error.value)
    assert "best_yolo.pt" in mensaje
    assert "best_bgaunet.keras" in mensaje
    assert "best_swin.pth" in mensaje


def test_verificar_pesos_acepta_los_tres_archivos(tmp_path: Path) -> None:
    for nombre in ("best_yolo.pt", "best_bgaunet.keras", "best_swin.pth"):
        (tmp_path / nombre).write_bytes(b"")

    ConfiguracionIA(modelos_dir=tmp_path).verificar_pesos()
