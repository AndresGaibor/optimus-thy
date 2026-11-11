"""Pruebas de histopatología, CIE-10 y formatos de fecha (HT-042)."""

from __future__ import annotations

import pytest

from app.contrato import BloqueOcr, CampoExtraido, DocumentoOcr
from app.reglas import extraer_campos
from tests.test_reglas import TEXTO_FICHA


def _documento(texto: str, confianza: float | None = 0.95) -> DocumentoOcr:
    bloques = tuple(
        BloqueOcr(pagina=1, orden=i, etiqueta="text", texto=linea, confianza=confianza)
        for i, linea in enumerate(texto.splitlines())
        if linea.strip()
    )
    return DocumentoOcr(
        motor="tesseract",
        modelo="tesseract-ocr-spa",
        huella_modelo=None,
        paginas=1,
        texto_markdown=texto,
        bloques=bloques,
        avisos=(),
    )


def _documento_bloques(
    bloques: list[tuple[str, float | None]], confianza: float | None = None
) -> DocumentoOcr:
    return DocumentoOcr(
        motor="falso",
        modelo="modelo-de-prueba",
        huella_modelo=None,
        paginas=1,
        texto_markdown="\n".join(texto for texto, _ in bloques),
        bloques=tuple(
            BloqueOcr(pagina=1, orden=i, etiqueta="text", texto=texto, bbox=None, confianza=c)
            for i, (texto, c) in enumerate(bloques)
        ),
    )


def _indice(campos: tuple[CampoExtraido, ...]) -> dict[str, CampoExtraido]:
    return {campo.nombre: campo for campo in campos}


# --- Histopatología ---


@pytest.mark.parametrize(
    ("texto", "esperado"),
    [
        ("Diagnóstico: carcinoma papilar de tiroides", "Carcinoma papilar"),
        (
            "Diagnóstico: carcinoma papilar variante folicular",
            "Carcinoma papilar variante folicular",
        ),
        (
            "Diagnóstico: variante folicular del carcinoma papilar",
            "Carcinoma papilar variante folicular",
        ),
        (
            "Diagnóstico: carcinoma papilar variante de células altas",
            "Carcinoma papilar variante de células altas",
        ),
        ("Diagnóstico: carcinoma folicular", "Carcinoma folicular"),
        ("Diagnóstico: carcinoma medular", "Carcinoma medular"),
        ("Diagnóstico: carcinoma anaplásico", "Carcinoma anaplásico"),
        ("Diagnóstico: carcinoma indiferenciado", "Carcinoma anaplásico"),
        ("Diagnóstico: bocio multinodular", "Bocio multinodular"),
        ("Diagnóstico: bocio coloide", "Bocio coloide"),
        ("Diagnóstico: adenoma folicular", "Adenoma folicular"),
        ("Diagnóstico: tiroiditis de Hashimoto", "Tiroiditis de Hashimoto"),
        ("Diagnóstico: tiroiditis linfocítica crónica", "Tiroiditis de Hashimoto"),
        ("Diagnóstico: hiperplasia", "Hiperplasia"),
    ],
)
def test_histopatologia_reconoce_cada_familia(texto: str, esperado: str) -> None:
    campos = _indice(extraer_campos(_documento(texto), 0.60))
    assert campos["histopatologia"].valor == esperado
    # La etiqueta está al lado del valor: el anclaje es bueno.
    assert campos["histopatologia"].revisar is False
    assert campos["histopatologia"].confianza == 0.95


def test_histopatologia_etiqueta_en_bloque_anterior() -> None:
    documento = _documento_bloques([("DIAGNÓSTICO", 0.9), ("Carcinoma medular", 0.9)])
    campos = _indice(extraer_campos(documento, 0.60))
    assert campos["histopatologia"].valor == "Carcinoma medular"
    assert campos["histopatologia"].revisar is False


def test_histopatologia_suelta_marca_revision() -> None:
    # Sin etiqueta la lectura es suelta: se entrega, pero para revisión.
    campos = _indice(extraer_campos(_documento("carcinoma papilar"), 0.60))
    assert campos["histopatologia"].valor == "Carcinoma papilar"
    assert campos["histopatologia"].revisar is True


def test_dos_diagnosticos_no_se_promedian() -> None:
    # Dos diagnósticos distintos: un solo campo, el primero, marcado para revisión.
    texto = "Diagnóstico: carcinoma papilar\nConclusión: carcinoma medular"
    campos = extraer_campos(_documento(texto), 0.60)
    histopatologias = [campo for campo in campos if campo.nombre == "histopatologia"]
    assert len(histopatologias) == 1
    assert histopatologias[0].valor == "Carcinoma papilar"
    assert histopatologias[0].revisar is True


def test_variante_no_emite_ademas_el_diagnostico_generico() -> None:
    campos = _indice(
        extraer_campos(_documento("Diagnóstico: carcinoma papilar variante folicular"), 0.60)
    )
    assert campos["histopatologia"].valor == "Carcinoma papilar variante folicular"
    assert campos["histopatologia"].revisar is False


def test_texto_sin_histopatologia_no_produce_campo() -> None:
    campos = _indice(extraer_campos(_documento("TSH 2,5 mU/L\nBethesda V"), 0.60))
    assert "histopatologia" not in campos


# --- CIE-10 ---


@pytest.mark.parametrize(
    ("texto", "esperado"),
    [
        ("CIE-10: C73", "C73"),
        ("Diagnóstico CIE-10 C73.9", "C73.9"),
        ("CIE 10: E04.1", "E04.1"),
        ("CIE-10 E06.3", "E06.3"),
        ("Dx: D34", "D34"),
        # Código tiroideo suelto: el rango es el ancla.
        ("E05.9", "E05.9"),
    ],
)
def test_cie10_reconoce_codigos_tiroideos(texto: str, esperado: str) -> None:
    campos = _indice(extraer_campos(_documento(texto), 0.60))
    assert campos["cie10"].valor == esperado
    assert campos["cie10"].revisar is False


def test_cie10_en_bloque_siguiente_a_la_etiqueta() -> None:
    documento = _documento_bloques([("CIE-10", 0.9), ("C73", 0.9)])
    campos = _indice(extraer_campos(documento, 0.60))
    assert campos["cie10"].valor == "C73"
    assert campos["cie10"].revisar is False


def test_cie10_fuera_de_rango_conocido_marca_revision() -> None:
    campos = _indice(extraer_campos(_documento("CIE-10: Z00"), 0.60))
    assert campos["cie10"].valor == "Z00"
    assert campos["cie10"].revisar is True


def test_cie10_fuera_de_rango_sin_etiqueta_no_se_toma() -> None:
    # Sin etiqueta podría ser un identificador de paciente: no se inventa.
    assert "cie10" not in _indice(extraer_campos(_documento("Z00"), 0.60))


def test_codigo_de_morfologia_no_es_cie10() -> None:
    # ``M8140/3`` no tiene forma CIE-10 y el sufijo numérico no se recorta.
    campos = extraer_campos(_documento("Diagnóstico: M8140/3"), 0.60)
    assert "cie10" not in _indice(campos)


def test_cie10_no_confunde_medidas_ni_codigo_de_paciente() -> None:
    texto = "CÓDIGO SINT-0001\nTSH 2,5 mU/L\nT3 1,15 ng/mL\nT4 8,2 ng/dL\nTI-RADS 4\nBethesda V"
    campos = _indice(extraer_campos(_documento(texto), 0.60))
    assert "cie10" not in campos
    assert campos["codigo"].valor == "SINT-0001"


# --- Fecha de laboratorio ---


@pytest.mark.parametrize(
    ("texto", "esperado"),
    [
        ("Fecha de laboratorio 14/03/2026", "2026-03-14"),
        ("Fecha de laboratorio 2026-03-14", "2026-03-14"),
        ("Fecha de laboratorio 14-03-2026", "2026-03-14"),
        ("Fecha: 2026-03-14", "2026-03-14"),
    ],
)
def test_fecha_admite_los_tres_formatos(texto: str, esperado: str) -> None:
    campos = _indice(extraer_campos(_documento(texto), 0.60))
    assert campos["fecha_laboratorio"].valor == esperado
    assert campos["fecha_laboratorio"].revisar is False


@pytest.mark.parametrize(
    "texto",
    [
        "Fecha de laboratorio 14/03",
        "Fecha de laboratorio 03/2026",
        "Fecha de laboratorio 2026-03",
    ],
)
def test_fecha_incompleta_no_inventa_el_dia(texto: str) -> None:
    assert "fecha_laboratorio" not in _indice(extraer_campos(_documento(texto), 0.60))


def test_fecha_imposible_se_marca_sin_corregir() -> None:
    campos = _indice(extraer_campos(_documento("Fecha de laboratorio 45/13/2026"), 0.60))
    assert campos["fecha_laboratorio"].valor == "2026-13-45"
    assert campos["fecha_laboratorio"].revisar is True


# --- Los campos nuevos no alteran los existentes ---


def test_campos_nuevos_con_viven_con_los_anteriores() -> None:
    texto = TEXTO_FICHA + "Diagnóstico: carcinoma papilar\nCIE-10: C73\n"
    campos = _indice(extraer_campos(_documento(texto), 0.60))
    assert campos["tsh"].valor == "2.5"
    assert campos["t3"].valor == "1.15"
    assert campos["t4"].valor == "8.2"
    assert campos["fecha_laboratorio"].valor == "2026-03-14"
    assert campos["tamano_nodulo_mm"].valor == "12.0"
    assert campos["lateralidad"].valor == "derecho"
    assert campos["tirads"].valor == "4"
    assert campos["bethesda"].valor == "V"
    assert campos["codigo"].valor == "SINT-0001"
    assert campos["paciente"].valor == "Paciente Sintético 01"
    assert campos["histopatologia"].valor == "Carcinoma papilar"
    assert campos["histopatologia"].revisar is False
    assert campos["cie10"].valor == "C73"
    assert campos["cie10"].revisar is False
