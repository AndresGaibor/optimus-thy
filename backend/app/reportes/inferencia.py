"""Reporte PDF de una inferencia (HU-080) y su descarga registrada (HU-082).

- El PDF se arma en memoria: la base y el almacenamiento no guardan copias.
- Solo lleva los datos mínimos del paciente (código), nunca nombres ni documento.
- El aviso de apoyo al diagnóstico va destacado en la primera página.
"""

from __future__ import annotations

from datetime import datetime
from io import BytesIO
from typing import Any

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    Image,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

AVISO = (
    "Este reporte es apoyo al diagnóstico y no lo sustituye. "
    "La decisión clínica es del profesional tratante."
)
LEYENDA_NORMAL = "«Normal» significa «sin nódulo detectado»."


def _estilos() -> dict[str, ParagraphStyle]:
    base = getSampleStyleSheet()
    return {
        "titulo": ParagraphStyle("titulo", parent=base["Title"], fontSize=16, spaceAfter=2 * mm),
        "subtitulo": ParagraphStyle(
            "subtitulo", parent=base["Normal"], fontSize=8, textColor=colors.grey
        ),
        "aviso": ParagraphStyle(
            "aviso", parent=base["Normal"], fontSize=9, leading=12, textColor=colors.black
        ),
        "seccion": ParagraphStyle(
            "seccion", parent=base["Heading2"], fontSize=11, spaceBefore=4 * mm, spaceAfter=2 * mm
        ),
    }


def _tabla(filas: list[list[str]], anchos: list[float] | None = None) -> Table:
    tabla = Table(filas, colWidths=anchos, hAlign="LEFT")
    tabla.setStyle(
        TableStyle(
            [
                ("FONT", (0, 0), (0, -1), "Helvetica-Bold", 8),
                ("FONT", (1, 0), (-1, -1), "Helvetica", 8),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                ("TOPPADDING", (0, 0), (-1, -1), 3),
                ("LINEBELOW", (0, 0), (-1, -1), 0.25, colors.lightgrey),
            ]
        )
    )
    return tabla


def _fecha(valor: datetime) -> str:
    return valor.astimezone().strftime("%Y-%m-%d %H:%M %Z")


def _texto(valor: Any, vacio: str = "—") -> str:
    if valor is None or valor == "":
        return vacio
    return str(valor)


def _porcentaje(valor: float | None) -> str:
    return "—" if valor is None else f"{valor * 100:.1f} %"


def _imagen(contenido: bytes | None, ancho_mm: float = 120) -> list[Any]:
    """La ecografía original, si se pudo leer; el reporte vale sin ella."""
    if not contenido:
        return [Paragraph("Imagen no disponible en este reporte.", _estilos()["subtitulo"])]
    try:
        from PIL import Image as PilImage

        with PilImage.open(BytesIO(contenido)) as original:
            ancho, alto = original.size
        alto_mm = ancho_mm * (alto / ancho)
        return [Image(BytesIO(contenido), width=ancho_mm * mm, height=alto_mm * mm)]
    except Exception:
        return [Paragraph("Imagen no disponible en este reporte.", _estilos()["subtitulo"])]


def construir_reporte(
    *,
    paciente_codigo: str,
    caso_codigo: str,
    inferencia: Any,
    usuario: str,
    imagen: bytes | None,
    generado_en: datetime,
) -> bytes:
    """Arma el PDF de una inferencia; devuelve los bytes listos para descargar."""
    estilos = _estilos()
    salida = BytesIO()
    documento = SimpleDocTemplate(
        salida,
        pagesize=A4,
        leftMargin=18 * mm,
        rightMargin=18 * mm,
        topMargin=18 * mm,
        bottomMargin=18 * mm,
        title=f"Reporte de inferencia {caso_codigo}",
        author="OPTIMUS-THY",
    )

    partes: list[Any] = [
        Paragraph("OPTIMUS-THY", estilos["titulo"]),
        Paragraph(
            "ESPOCH · SOLCA — Sistema de apoyo al diagnóstico de cáncer de tiroides",
            estilos["subtitulo"],
        ),
        Spacer(1, 4 * mm),
        Paragraph("Reporte de inferencia", estilos["seccion"]),
        _tabla(
            [
                ["Paciente", paciente_codigo],
                ["Caso", caso_codigo],
                ["Fecha de la inferencia", _fecha(inferencia.creado_en)],
                ["Generado", _fecha(generado_en)],
                ["Usuario", usuario],
                ["Modelo", f"{inferencia.modelo_ia.nombre} {inferencia.modelo_ia.version}"],
                ["Contrato", _texto(inferencia.version_contrato)],
                [
                    "Tiempo de cómputo",
                    f"{inferencia.tiempo_ms} ms" if inferencia.tiempo_ms else "—",
                ],
            ],
            anchos=[45 * mm, 120 * mm],
        ),
        Spacer(1, 4 * mm),
        Table(
            [[Paragraph(f"<b>Aviso:</b> {AVISO} {LEYENDA_NORMAL}", estilos["aviso"])]],
            colWidths=[165 * mm],
            style=TableStyle(
                [
                    ("BOX", (0, 0), (-1, -1), 0.5, colors.black),
                    ("BACKGROUND", (0, 0), (-1, -1), colors.whitesmoke),
                    ("LEFTPADDING", (0, 0), (-1, -1), 6),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                    ("TOPPADDING", (0, 0), (-1, -1), 5),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ]
            ),
        ),
        Paragraph("Imagen analizada", estilos["seccion"]),
        *_imagen(imagen),
        Paragraph("Resultado", estilos["seccion"]),
        _tabla(
            [
                ["Resultado", _texto(inferencia.resultado)],
                ["Confianza", _porcentaje(inferencia.confianza)],
                ["Nódulos", str(len(inferencia.nodulos))],
                ["Huella de modelos", _texto(inferencia.huella_modelos)],
            ],
            anchos=[45 * mm, 120 * mm],
        ),
    ]

    if inferencia.nodulos:

        def _fila(nodulo: Any) -> list[str]:
            caja = ", ".join(
                str(round(valor, 1))
                for valor in (nodulo.caja_x, nodulo.caja_y, nodulo.caja_w, nodulo.caja_h)
                if valor is not None
            )
            return [
                str(nodulo.indice),
                _texto(nodulo.clase),
                _porcentaje(nodulo.confianza),
                _porcentaje(nodulo.probabilidad_benigno),
                _porcentaje(nodulo.probabilidad_maligno),
                caja or "—",
            ]

        partes.extend(
            [
                Paragraph("Nódulos", estilos["seccion"]),
                _tabla(
                    [["#", "Clase", "Confianza", "P benigno", "P maligno", "Caja (x, y, w, h)"]]
                    + [
                        _fila(nodulo)
                        for nodulo in sorted(inferencia.nodulos, key=lambda fila: fila.indice)
                    ],
                    anchos=[8 * mm, 25 * mm, 22 * mm, 22 * mm, 22 * mm, 66 * mm],
                ),
            ]
        )

    documento.build(partes)
    return salida.getvalue()
