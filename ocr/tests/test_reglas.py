"""Pruebas de la extracción de campos clínicos por reglas (HT-041)."""

from __future__ import annotations

import io

from fastapi.testclient import TestClient

from app.contrato import BloqueOcr, CampoExtraido, DocumentoOcr
from app.main import crear_app
from app.reglas import extraer_campos
from tests.conftest import MotorFalso, motor_fijo

TEXTO_FICHA = """# Ficha clínica
CÓDIGO SINT-0001
Paciente Paciente Sintético 01
Fecha de laboratorio 2026-03-14
TSH 2,5 mU/L
T3 1,15 ng/mL
T4 8,2 ng/dL
Tamaño del nódulo 12,0 mm
Lateralidad Lóbulo derecho
TI-RADS 4
Bethesda V
"""

PDF = b"%PDF-1.4\n% ficha sintetica de prueba\n%%EOF\n"


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


def _indice(campos: tuple[CampoExtraido, ...]) -> dict[str, CampoExtraido]:
    return {campo.nombre: campo for campo in campos}


def test_extrae_campos_de_ficha_real() -> None:
    campos = extraer_campos(_documento(TEXTO_FICHA), 0.60)
    por_nombre = _indice(campos)
    assert set(por_nombre) == {
        "tsh",
        "t3",
        "t4",
        "fecha_laboratorio",
        "tamano_nodulo_mm",
        "lateralidad",
        "tirads",
        "bethesda",
        "codigo",
        "paciente",
    }
    assert por_nombre["tsh"].valor == "2.5"
    assert por_nombre["t3"].valor == "1.15"
    assert por_nombre["t4"].valor == "8.2"
    assert por_nombre["tamano_nodulo_mm"].valor == "12.0"
    assert por_nombre["fecha_laboratorio"].valor == "2026-03-14"
    assert por_nombre["lateralidad"].valor == "derecho"
    assert por_nombre["tirads"].valor == "4"
    assert por_nombre["bethesda"].valor == "V"
    assert por_nombre["codigo"].valor == "SINT-0001"
    assert por_nombre["paciente"].valor == "Paciente Sintético 01"
    assert all(campo.confianza == 0.95 for campo in campos)
    assert all(campo.revisar is False for campo in campos)


def test_variantes_de_formato() -> None:
    texto = """
Fecha 14/03/2026
TSH: 4.25 uUI/mL
T3: 1.4 ng/ml
T4: 8.6 ug/dl
Tamano del nodulo 1,2 cm
Lateralidad: lobulo izquierdo
TIRADS TR3
Bethesda II
Código: pac-02
Nombre del paciente: Ana Perez
"""
    campos = _indice(extraer_campos(_documento(texto), 0.60))
    assert campos["fecha_laboratorio"].valor == "2026-03-14"
    assert campos["tsh"].valor == "4.25"
    assert campos["t3"].valor == "1.4"
    assert campos["t4"].valor == "8.6"
    assert campos["tamano_nodulo_mm"].valor == "12.0"
    assert campos["lateralidad"].valor == "izquierdo"
    assert campos["tirads"].valor == "3"
    assert campos["bethesda"].valor == "II"
    assert campos["codigo"].valor == "PAC-02"
    assert campos["paciente"].valor == "Ana Perez"

    romano = extraer_campos(_documento("TI-RADS IV"), 0.60)
    assert romano[0].valor == "4"
    romano_bethesda = extraer_campos(_documento("Bethesda iv"), 0.60)
    assert romano_bethesda[0].valor == "IV"
    bethesda_num = extraer_campos(_documento("Bethesda 5"), 0.60)
    assert bethesda_num[0].valor == "V"
    bethesda_vv = extraer_campos(_documento("Bethesda Vv"), 0.60)
    assert bethesda_vv[0].valor == "V"
    bethesda_vi = extraer_campos(_documento("Bethesda vi"), 0.60)
    assert bethesda_vi[0].valor == "VI"
    tirads_romano = extraer_campos(_documento("TI-RADS V."), 0.60)
    assert tirads_romano[0].valor == "5"
    tirads_num = extraer_campos(_documento("TIRADS 5"), 0.60)
    assert tirads_num[0].valor == "5"


def test_confianza_baja_marca_revision() -> None:
    campos = extraer_campos(_documento("TSH 2,5 mU/L", confianza=0.4), 0.60)
    assert campos[0].confianza == 0.4
    assert campos[0].revisar is True

    altos = extraer_campos(_documento("TSH 2,5 mU/L", confianza=0.9), 0.60)
    assert altos[0].revisar is False


def test_confianza_nula_no_marca_revision() -> None:
    campos = extraer_campos(_documento("TSH 2,5 mU/L", confianza=None), 0.60)
    assert campos[0].confianza is None
    assert campos[0].revisar is False


def test_valor_fuera_de_rango_se_marca_sin_corregir() -> None:
    campos = extraer_campos(_documento("TSH 250 mU/L", confianza=0.95), 0.60)
    assert campos[0].valor == "250"
    assert campos[0].revisar is True


def test_texto_sin_campos_devuelve_lista_vacia() -> None:
    assert extraer_campos(_documento("sin datos reconocibles"), 0.60) == ()


def test_reconocer_expone_campos_y_avisos_de_revision() -> None:
    texto = TEXTO_FICHA.replace("TSH 2,5 mU/L", "TSH 250 mU/L")
    bloques = tuple(
        BloqueOcr(pagina=1, orden=i, etiqueta="text", texto=linea, confianza=0.4)
        for i, linea in enumerate(texto.splitlines())
        if linea.strip()
    )
    documento = DocumentoOcr(
        motor="falso",
        modelo="modelo-de-prueba",
        huella_modelo=None,
        paginas=1,
        texto_markdown=texto,
        bloques=bloques,
        avisos=("aviso de prueba",),
    )
    motor = MotorFalso(documento=documento)
    with TestClient(crear_app(motor_fijo(motor))) as cliente:
        respuesta = cliente.post(
            "/reconocer",
            files={"documento": ("ficha.pdf", io.BytesIO(PDF), "application/pdf")},
        )
    assert respuesta.status_code == 200
    cuerpo = respuesta.json()
    assert cuerpo["version_contrato"] == "1.1"
    assert len(cuerpo["campos"]) == 10
    por_nombre = {campo["nombre"]: campo for campo in cuerpo["campos"]}
    assert por_nombre["tsh"]["valor"] == "250"
    assert por_nombre["tsh"]["revisar"] is True
    assert all(campo["revisar"] is True for campo in cuerpo["campos"])
    assert "aviso de prueba" in cuerpo["avisos"]
    assert "10 campos marcados para revisión" in cuerpo["avisos"]


def test_reconocer_resume_campos_sin_confianza_del_motor() -> None:
    documento = _documento(TEXTO_FICHA, confianza=None)
    documento = DocumentoOcr(
        motor="falso",
        modelo="modelo-de-prueba",
        huella_modelo=None,
        paginas=documento.paginas,
        texto_markdown=documento.texto_markdown,
        bloques=documento.bloques,
        avisos=(),
    )
    motor = MotorFalso(documento=documento)
    with TestClient(crear_app(motor_fijo(motor))) as cliente:
        respuesta = cliente.post(
            "/reconocer",
            files={"documento": ("ficha.pdf", io.BytesIO(PDF), "application/pdf")},
        )
    assert respuesta.status_code == 200
    cuerpo = respuesta.json()
    assert len(cuerpo["campos"]) == 10
    assert all(campo["confianza"] is None for campo in cuerpo["campos"])
    assert all(campo["revisar"] is False for campo in cuerpo["campos"])
    assert cuerpo["avisos"] == ["10 campos sin confianza del motor"]


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
            BloqueOcr(
                pagina=1,
                orden=i,
                etiqueta="text",
                texto=texto,
                bbox=None,
                confianza=c,
            )
            for i, (texto, c) in enumerate(bloques)
        ),
    )


def test_valor_en_bloque_siguiente_tabla_separada() -> None:
    # Etiqueta y valor en bloques separados (como ficha punto sin unidad en tabla).
    documento = _documento_bloques(
        [
            ("T3", 0.95),
            ("1.4", 0.95),
            ("T4", 0.95),
            ("9.1 ng/dL", 0.95),
            ("TAMAÑO DEL NÓDULO", 0.95),
            ("7 mm", 0.95),
            ("TI-RADS", 0.95),
            ("2", 0.95),
            ("BETHESDA", 0.95),
            ("II", 0.95),
        ]
    )
    campos = _indice(extraer_campos(documento, 0.60))
    assert campos["t3"].valor == "1.4"
    assert campos["t4"].valor == "9.1"
    assert campos["tamano_nodulo_mm"].valor == "7.0"
    assert campos["tirads"].valor == "2"
    assert campos["bethesda"].valor == "II"


def test_bethesda_vv_y_valor_suelto_en_bloque_siguiente() -> None:
    documento = _documento_bloques(
        [
            ("Bethesda Vv", 0.9),
        ]
    )
    campos = extraer_campos(documento, 0.6)
    assert campos[0].nombre == "bethesda"
    assert campos[0].valor == "V"

    documento2 = _documento_bloques(
        [
            ("Bethesda", 0.9),
            ("V", 0.9),
        ]
    )
    campos2 = _indice(extraer_campos(documento2, 0.6))
    assert campos2["bethesda"].valor == "V"


def test_tamano_12_mm_normaliza_a_un_decimal() -> None:
    campos = extraer_campos(_documento("Tamaño del nódulo 12 mm"), 0.60)
    assert campos[0].nombre == "tamano_nodulo_mm"
    assert campos[0].valor == "12.0"


def test_valor_bloque_siguiente_no_se_toma_si_hay_otra_etiqueta_en_medio() -> None:
    documento = _documento_bloques(
        [
            ("T3", 0.95),
            ("Lateralidad", 0.95),  # otra etiqueta en medio
            ("1.4", 0.95),
        ]
    )
    campos = _indice(extraer_campos(documento, 0.60))
    assert "t3" not in campos
    assert "lateralidad" not in campos
    assert "t4" not in campos


def test_bethesda_token_suelto_ambiguo_no_produce_campo() -> None:
    # ``l`` (ele minúscula) es lo que Tesseract deja donde había un romano: no
    # se puede saber si era ``I`` o simple ruido, así que no se inventa el campo.
    documento = DocumentoOcr(
        motor="falso",
        modelo="modelo-de-prueba",
        huella_modelo=None,
        paginas=1,
        texto_markdown="BETHESDA\nl",
        bloques=(
            BloqueOcr(pagina=1, orden=0, etiqueta="text", texto="BETHESDA", confianza=0.9),
            BloqueOcr(pagina=1, orden=1, etiqueta="text", texto="l", confianza=0.4),
        ),
    )
    assert "bethesda" not in _indice(extraer_campos(documento, 0.60))

    for token in ("II", "iii", "V", "Vv", "5", "vi"):
        campos = _indice(extraer_campos(_documento(f"Bethesda {token}"), 0.60))
        assert (
            campos["bethesda"].valor
            == {
                "II": "II",
                "iii": "III",
                "V": "V",
                "Vv": "V",
                "5": "V",
                "vi": "VI",
            }[token]
        )


def test_conflicto_mismo_campo_prevalece_mayor_confianza_y_revisar() -> None:
    # Mismo campo con valores distintos en bloques de distinta confianza.
    documento = DocumentoOcr(
        motor="falso",
        modelo="modelo-de-prueba",
        huella_modelo=None,
        paginas=1,
        texto_markdown="TSH 2.5 mU/L\nTSH 9.0 mU/L",
        bloques=(
            BloqueOcr(
                pagina=1,
                orden=0,
                etiqueta="text",
                texto="TSH 2.5 mU/L",
                bbox=None,
                confianza=0.95,
            ),
            BloqueOcr(
                pagina=1,
                orden=1,
                etiqueta="text",
                texto="TSH 9.0 mU/L",
                bbox=None,
                confianza=0.40,
            ),
        ),
    )
    campos = _indice(extraer_campos(documento, 0.60))
    assert campos["tsh"].valor == "2.5"
    assert campos["tsh"].revisar is True
