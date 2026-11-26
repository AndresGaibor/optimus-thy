"""Generación de reportes consolidados de inferencias clínicas."""

from __future__ import annotations

from datetime import datetime
from io import BytesIO
from typing import Any

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen.canvas import Canvas
from reportlab.platypus import PageBreak, Paragraph, SimpleDocTemplate, Spacer

from app.reportes.inferencia import (
    AVISO,
    LEYENDA_NORMAL,
    _estilos,
    _etiqueta,
    _fecha,
    _porcentaje,
    _tabla,
    _texto,
)


def construir_consolidado(
    *,
    paciente_codigo: str,
    caso_codigo: str,
    inferencias: list[Any],
    usuario: str,
    generado_en: datetime,
    identificador: str,
) -> bytes:
    """Construye un PDF consolidado sin acceder a imágenes o almacenamiento."""
    salida = BytesIO()
    documento = SimpleDocTemplate(
        salida,
        pagesize=A4,
        rightMargin=18 * mm,
        leftMargin=18 * mm,
        topMargin=20 * mm,
        bottomMargin=22 * mm,
        title=f"Reporte consolidado {caso_codigo}",
    )
    estilos = _estilos()
    story: list[Any] = [
        Paragraph("Reporte consolidado del caso", estilos["titulo"]),
        Paragraph(AVISO, estilos["subtitulo"]),
        Spacer(1, 8 * mm),
        _tabla(
            [
                ["Paciente", _texto(paciente_codigo)],
                ["Caso", _texto(caso_codigo)],
                ["Generado", _fecha(generado_en)],
                ["Usuario", _texto(usuario)],
                ["Identificador", identificador],
            ]
        ),
        Spacer(1, 8 * mm),
        Paragraph("Resumen de inferencias", estilos["subtitulo"]),
        _tabla(
            [
                ["Fecha", "Modelo y versión", "Resultado", "Confianza", "Nódulos"],
                *[
                    [
                        _fecha(f.creado_en),
                        f"{_texto(f.modelo_ia.nombre)} {_texto(f.modelo_ia.version)}",
                        _etiqueta(f.resultado),
                        _porcentaje(f.confianza),
                        str(len(f.nodulos)),
                    ]
                    for f in inferencias
                ],
            ]
        ),
        Spacer(1, 4 * mm),
        Paragraph(LEYENDA_NORMAL, estilos["subtitulo"]),
    ]
    for indice, inferencia in enumerate(inferencias, start=1):
        story.extend(
            [
                PageBreak(),
                Paragraph(f"Inferencia {indice}", estilos["titulo"]),
                _tabla(
                    [
                        ["Fecha", _fecha(inferencia.creado_en)],
                        [
                            "Modelo",
                            (
                                f"{_texto(inferencia.modelo_ia.nombre)} "
                                f"{_texto(inferencia.modelo_ia.version)}"
                            ),
                        ],
                        ["Resultado", _etiqueta(inferencia.resultado)],
                        ["Confianza", _porcentaje(inferencia.confianza)],
                    ]
                ),
                Spacer(1, 4 * mm),
                Paragraph("Nódulos", estilos["subtitulo"]),
            ]
        )
        if inferencia.nodulos:
            story.append(
                _tabla(
                    [
                        ["N.º", "Clase", "Confianza", "Prob. benigno", "Prob. maligno"],
                        *[
                            [
                                str(n.indice),
                                _etiqueta(n.clase),
                                _porcentaje(n.confianza),
                                _porcentaje(n.probabilidad_benigno),
                                _porcentaje(n.probabilidad_maligno),
                            ]
                            for n in inferencia.nodulos
                        ],
                    ]
                )
            )
        else:
            story.append(Paragraph("Sin nódulos detectados.", estilos["subtitulo"]))

    def crear_canvas(*args: Any, **kwargs: Any) -> Canvas:
        kwargs["pageCompression"] = 0
        return Canvas(*args, **kwargs)

    def pie(canvas: Any, _documento: Any) -> None:
        canvas.saveState()
        canvas.setFont("Helvetica", 8)
        canvas.setFillColor(colors.grey)
        canvas.drawString(18 * mm, 12 * mm, identificador)
        canvas.drawRightString(A4[0] - 18 * mm, 12 * mm, f"Página {canvas.getPageNumber()}")
        canvas.restoreState()

    documento.build(
        story,
        onFirstPage=pie,
        onLaterPages=pie,
        canvasmaker=crear_canvas,
    )
    return salida.getvalue()
