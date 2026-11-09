"""Pruebas de la función de inferencia con dobles de los tres modelos.

Los pesos reales no viven en el repositorio, así que aquí se comprueba la
lógica de la cadena (selección, contrato, respaldo de máscara, regiones) con
detectores, segmentadores y clasificadores controlados.
"""

from __future__ import annotations

import json
from collections.abc import Sequence
from typing import Any

import numpy as np
import pytest

from app.config import ConfiguracionIA
from app.contrato import Caja
from app.modelos import Deteccion, ModelosIA, ProbabilidadesNodulo
from app.pipeline import analizar_imagen, postprocesar_mascara, seleccionar_detecciones


def configuracion(**cambios: Any) -> ConfiguracionIA:
    valores: dict[str, Any] = {
        "modelos_dir": "modelos",
        "mgac_iteraciones": 6,
        "mgac_radio_cierre": 0,
    }
    valores.update(cambios)
    return ConfiguracionIA(**valores)


class DetectorFijo:
    def __init__(self, detecciones: Sequence[Deteccion]) -> None:
        self.detecciones = list(detecciones)
        self.llamadas = 0

    def detectar(self, imagen: np.ndarray, config: ConfiguracionIA) -> Sequence[Deteccion]:
        self.llamadas += 1
        return self.detecciones


class SegmentadorFijo:
    """Marca toda la caja como nódulo; sirve para comprobar el postproceso."""

    def __init__(self, ancho_pixeles: bool = True) -> None:
        self.ancho_pixeles = ancho_pixeles
        self.llamadas = 0

    def segmentar(self, imagen: np.ndarray, caja: Caja, config: ConfiguracionIA) -> np.ndarray:
        self.llamadas += 1
        mascara = np.zeros(imagen.shape[:2], dtype=np.uint8)
        if self.ancho_pixeles:
            mascara[caja.ymin : caja.ymax, caja.xmin : caja.xmax] = 255
        return mascara


class ClasificadorFijo:
    def __init__(self, benigno: float = 0.8, maligno: float = 0.2) -> None:
        self.probabilidades = ProbabilidadesNodulo(benigno=benigno, maligno=maligno)
        self.regiones: list[tuple[tuple[int, ...], tuple[int, ...]]] = []

    def clasificar(
        self,
        imagen_roi: np.ndarray,
        mascara_roi: np.ndarray,
        config: ConfiguracionIA,
    ) -> ProbabilidadesNodulo:
        self.regiones.append((imagen_roi.shape, mascara_roi.shape))
        return self.probabilidades


def modelos(
    detecciones: Sequence[Deteccion],
    *,
    segmentador: SegmentadorFijo | None = None,
    clasificador: ClasificadorFijo | None = None,
) -> tuple[ModelosIA, ClasificadorFijo]:
    clasificador = clasificador or ClasificadorFijo()
    return (
        ModelosIA(
            detector=DetectorFijo(detecciones),
            segmentador=segmentador or SegmentadorFijo(),
            clasificador=clasificador,
        ),
        clasificador,
    )


def imagen_sintetica(lado: int = 120) -> np.ndarray:
    imagen = np.full((lado, lado, 3), 40, dtype=np.uint8)
    imagen[lado // 4 : 3 * lado // 4, lado // 4 : 3 * lado // 4] = 180
    return imagen


def test_sin_detecciones_devuelve_sin_nodulo() -> None:
    modelos_ia, clasificador = modelos([])

    resultado = analizar_imagen(imagen_sintetica(), modelos=modelos_ia, config=configuracion())

    assert resultado.sin_nodulo is True
    assert resultado.nodulos == ()
    assert clasificador.regiones == []


def test_no_procesa_mas_de_tres_nodulos() -> None:
    detecciones = [
        Deteccion(caja=Caja(x, 10, x + 20, 30), confianza=confianza)
        for x, confianza in ((10, 0.5), (40, 0.9), (70, 0.7), (100, 0.8), (130, 0.6))
    ]
    modelos_ia, _ = modelos(detecciones)

    resultado = analizar_imagen(imagen_sintetica(200), modelos=modelos_ia, config=configuracion())

    assert [nodo.indice for nodo in resultado.nodulos] == [1, 2, 3]
    # Se quedan las tres con más confianza y se ordenan por posición.
    assert [round(nodo.confianza_detector, 2) for nodo in resultado.nodulos] == [0.9, 0.7, 0.8]


def test_los_nodulos_se_numeran_por_posicion() -> None:
    detecciones = [
        Deteccion(caja=Caja(60, 10, 90, 40), confianza=0.9),
        Deteccion(caja=Caja(10, 10, 40, 40), confianza=0.8),
    ]
    modelos_ia, _ = modelos(detecciones)

    resultado = analizar_imagen(imagen_sintetica(), modelos=modelos_ia, config=configuracion())

    assert resultado.nodulos[0].indice == 1
    assert resultado.nodulos[0].caja.xmin == 10
    assert resultado.nodulos[1].indice == 2
    assert resultado.nodulos[1].caja.xmin == 60


def test_descarta_cajas_diminutas() -> None:
    detecciones = [
        Deteccion(caja=Caja(10, 10, 13, 13), confianza=0.99),
        Deteccion(caja=Caja(40, 40, 80, 80), confianza=0.40),
    ]

    elegidas = seleccionar_detecciones(detecciones, ancho=120, alto=120, max_nodulos=3)

    assert len(elegidas) == 1
    assert elegidas[0].caja == Caja(40, 40, 80, 80)


def test_usa_mgac_cuando_la_mascara_de_bgaunet_queda_vacia() -> None:
    modelos_ia, _ = modelos(
        [Deteccion(caja=Caja(30, 30, 90, 90), confianza=0.9)],
        segmentador=SegmentadorFijo(ancho_pixeles=False),
    )

    resultado = analizar_imagen(imagen_sintetica(), modelos=modelos_ia, config=configuracion())

    assert resultado.nodulos[0].origen_mascara == "mgac"


def test_marca_bgaunet_cuando_la_mascara_tiene_pixeles() -> None:
    modelos_ia, _ = modelos([Deteccion(caja=Caja(30, 30, 90, 90), confianza=0.9)])

    resultado = analizar_imagen(imagen_sintetica(), modelos=modelos_ia, config=configuracion())

    nodulo = resultado.nodulos[0]
    assert nodulo.origen_mascara == "bgaunet"
    assert nodulo.pixeles_mascara > 0


def test_clasificacion_maligna() -> None:
    modelos_ia, _ = modelos(
        [Deteccion(caja=Caja(30, 30, 90, 90), confianza=0.9)],
        clasificador=ClasificadorFijo(benigno=0.2, maligno=0.8),
    )

    resultado = analizar_imagen(imagen_sintetica(), modelos=modelos_ia, config=configuracion())

    assert resultado.nodulos[0].clase == "maligno"
    assert resultado.nodulos[0].probabilidad_maligno == 0.8


def test_empate_de_probabilidades_es_benigno() -> None:
    modelos_ia, _ = modelos(
        [Deteccion(caja=Caja(30, 30, 90, 90), confianza=0.9)],
        clasificador=ClasificadorFijo(benigno=0.5, maligno=0.5),
    )

    resultado = analizar_imagen(imagen_sintetica(), modelos=modelos_ia, config=configuracion())

    assert resultado.nodulos[0].clase == "benigno"


def test_region_analizada_expande_la_caja_del_nodulo() -> None:
    modelos_ia, clasificador = modelos([Deteccion(caja=Caja(50, 50, 100, 100), confianza=0.9)])

    resultado = analizar_imagen(
        imagen_sintetica(200),
        modelos=modelos_ia,
        config=configuracion(margen_roi=0.10),
    )

    nodulo = resultado.nodulos[0]
    assert nodulo.region_analizada == Caja(45, 45, 105, 105)
    assert clasificador.regiones == [((60, 60, 3), (60, 60))]


def test_la_imagen_de_entrada_no_se_modifica() -> None:
    imagen = imagen_sintetica()
    original = imagen.copy()
    modelos_ia, _ = modelos([Deteccion(caja=Caja(30, 30, 90, 90), confianza=0.9)])

    analizar_imagen(imagen, modelos=modelos_ia, config=configuracion())

    assert np.array_equal(imagen, original)


def test_dos_solicitudes_dan_el_mismo_resultado() -> None:
    detecciones = [Deteccion(caja=Caja(30, 30, 90, 90), confianza=0.75)]
    primera_ia, _ = modelos(detecciones)
    segunda_ia, _ = modelos(detecciones)
    config = configuracion()
    imagen = imagen_sintetica()

    primera = analizar_imagen(imagen, modelos=primera_ia, config=config)
    segunda = analizar_imagen(imagen, modelos=segunda_ia, config=config)

    assert primera.a_diccionario() == segunda.a_diccionario()
    assert json.dumps(primera.a_diccionario())


@pytest.mark.parametrize(
    "imagen",
    [
        np.zeros((10, 10), dtype=np.float32),
        np.zeros((10,), dtype=np.uint8),
        np.zeros((0, 10, 3), dtype=np.uint8),
        "no es una imagen",
    ],
)
def test_rechaza_imagenes_invalidas(imagen: object) -> None:
    modelos_ia, _ = modelos([])

    with pytest.raises((TypeError, ValueError)):
        analizar_imagen(imagen, modelos=modelos_ia, config=configuracion())  # type: ignore[arg-type]


def test_rechaza_mascara_con_tamano_incorrecto() -> None:
    class SegmentadorDescuadrado(SegmentadorFijo):
        def segmentar(self, imagen: np.ndarray, caja: Caja, config: ConfiguracionIA) -> np.ndarray:
            return np.zeros((10, 10), dtype=np.uint8)

    modelos_ia, _ = modelos(
        [Deteccion(caja=Caja(30, 30, 90, 90), confianza=0.9)],
        segmentador=SegmentadorDescuadrado(),
    )

    with pytest.raises(ValueError, match="tamaño de la imagen"):
        analizar_imagen(imagen_sintetica(), modelos=modelos_ia, config=configuracion())


def test_postprocesar_mascara_recorta_a_la_caja() -> None:
    mascara = np.full((100, 100), 255, dtype=np.uint8)

    procesada = postprocesar_mascara(mascara, Caja(20, 20, 60, 60))

    assert procesada.shape == (100, 100)
    assert np.count_nonzero(procesada[:20, :]) == 0
    assert np.count_nonzero(procesada[:, :20]) == 0
    assert np.count_nonzero(procesada[20:60, 20:60]) == 40 * 40
