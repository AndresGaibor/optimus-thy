"""Fichas sintéticas de prueba para medir el OCR (HT-091, HT-092 y HT-093).

El script genera, dentro del directorio de destino:

* tres fichas en PDF digital, una por diseño (coma decimal con unidad, punto
  decimal con unidad y punto decimal sin unidad), con los mismos campos clínicos
  sintéticos;
* la versión escaneada de cada ficha en PNG: el mismo contenido con ruido y una
  ligera inclinación, generados con una semilla fija;
* ``referencia.json`` con el valor correcto de cada campo, que es contra lo que
  se medirá la exactitud del OCR cuando el servicio esté implementado.

Ninguna ficha describe a una persona real: el nombre, el código y el aviso van
marcados como sintéticos. La misma semilla produce los mismos bytes.

Uso::

    cd backend && python -m scripts.generar_fixtures_fichas --destino var/fixtures-fichas
"""

from __future__ import annotations

import argparse
import io
import json
import random
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from PIL import Image, ImageDraw, ImageFilter, ImageFont

DESTINO_POR_DEFECTO = Path("var/fixtures-fichas")
SEMILLA_POR_DEFECTO = 2026
NOMBRE_REFERENCIA = "referencia.json"
VERSION_REFERENCIA = 1

# A4 a 150 ppp. Suficiente para que el texto se lea y el archivo siga siendo pequeño.
ANCHO = 1240
ALTO = 1754
RESOLUCION_PDF = 150.0
MARGEN = 80

BLANCO = (255, 255, 255)
TINTA = (32, 38, 46)
GRIS = (108, 118, 128)
GRIS_CLARO = (232, 236, 240)
FONDO_BANDA = (37, 74, 96)

# El PDF de Pillow sella la fecha de creación con el reloj del sistema; se fija a
# un valor constante para que dos ejecuciones den exactamente los mismos bytes.
_HUELLA_FECHA_PDF = re.compile(rb"D:\d{14}Z")
_FECHA_PDF_FIJA = b"D:20260101000000Z"

# La fuente debe traer acentos. Si no está, se usa la fuente por defecto de Pillow.
_RUTAS_FUENTE = (
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
    "/System/Library/Fonts/Supplemental/Arial.ttf",
    "C:/Windows/Fonts/arial.ttf",
)
_RUTAS_FUENTE_NEGRITA = (
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    "C:/Windows/Fonts/arialbd.ttf",
)

AVISO_SINTETICO = (
    "Documento sintético de prueba: no corresponde a una persona real ni a un caso clínico."
)
_TEXTO_MARCA = "FICHA CLÍNICA SINTÉTICA"

CAMPO_IDENTIFICACION = "identificacion"
CAMPOS_MEDIDOS = (
    "tsh",
    "t3",
    "t4",
    "tamano_nodulo_mm",
    "lateralidad",
    "tirads",
    "bethesda",
)

_ETIQUETA_LATERALIDAD = {
    "derecho": "Lóbulo derecho",
    "izquierdo": "Lóbulo izquierdo",
    "istmo": "Istmo",
}


@dataclass(frozen=True)
class Diseno:
    """Cómo se escriben los valores en una plantilla de ficha."""

    id: str
    nombre: str
    separador_decimal: str
    con_unidad: bool
    estilo: str

    @property
    def archivo_pdf(self) -> str:
        return f"ficha-digital-{self.id.replace('_', '-')}.pdf"

    @property
    def archivo_escaneado(self) -> str:
        return f"ficha-digital-{self.id.replace('_', '-')}-escaneado.png"


DISENOS: tuple[Diseno, ...] = (
    Diseno(
        id="coma_con_unidad",
        nombre="Ficha 01 · tabla, coma decimal con unidad",
        separador_decimal=",",
        con_unidad=True,
        estilo="tabla",
    ),
    Diseno(
        id="punto_con_unidad",
        nombre="Ficha 02 · tabla, punto decimal con unidad",
        separador_decimal=".",
        con_unidad=True,
        estilo="tabla",
    ),
    Diseno(
        id="punto_sin_unidad",
        nombre="Ficha 03 · formulario, punto decimal sin unidad",
        separador_decimal=".",
        con_unidad=False,
        estilo="formulario",
    ),
)


@dataclass(frozen=True)
class Ficha:
    """Una ficha sintética con sus valores clínicos y su plantilla."""

    codigo: str
    nombre: str
    fecha_laboratorio: str
    tsh: str
    tsh_unidad: str
    t3: str
    t3_unidad: str
    t4: str
    t4_unidad: str
    tamano_nodulo_mm: str
    lateralidad: str
    tirads: str
    bethesda: str
    diseno: Diseno


FICHAS: tuple[Ficha, ...] = (
    Ficha(
        codigo="SINT-0001",
        nombre="Paciente Sintético 01",
        fecha_laboratorio="2026-03-14",
        tsh="2.5",
        tsh_unidad="mU/L",
        t3="1.15",
        t3_unidad="ng/mL",
        t4="8.2",
        t4_unidad="ng/dL",
        tamano_nodulo_mm="12.0",
        lateralidad="derecho",
        tirads="4",
        bethesda="V",
        diseno=DISENOS[0],
    ),
    Ficha(
        codigo="SINT-0002",
        nombre="Paciente Sintético 02",
        fecha_laboratorio="2026-04-02",
        tsh="4.25",
        tsh_unidad="mU/L",
        t3="0.95",
        t3_unidad="ng/mL",
        t4="7.4",
        t4_unidad="ng/dL",
        tamano_nodulo_mm="18.5",
        lateralidad="izquierdo",
        tirads="3",
        bethesda="II",
        diseno=DISENOS[1],
    ),
    Ficha(
        codigo="SINT-0003",
        nombre="Paciente Sintético 03",
        fecha_laboratorio="2026-05-21",
        tsh="0.8",
        tsh_unidad="mU/L",
        t3="1.4",
        t3_unidad="ng/mL",
        t4="9.1",
        t4_unidad="ng/dL",
        tamano_nodulo_mm="7.0",
        lateralidad="istmo",
        tirads="2",
        bethesda="II",
        diseno=DISENOS[2],
    ),
)


def _fuente(tamano: int, negrita: bool = False) -> ImageFont.ImageFont:
    rutas = _RUTAS_FUENTE_NEGRITA if negrita else _RUTAS_FUENTE
    for ruta in rutas:
        if Path(ruta).is_file():
            return ImageFont.truetype(ruta, tamano)
    return ImageFont.load_default(size=tamano)


def _valor_numerico(valor: str, diseno: Diseno) -> str:
    """Escribe un número con el separador decimal del diseño."""
    return valor.replace(".", diseno.separador_decimal)


def _valor_laboratorio(valor: str, unidad: str, diseno: Diseno) -> str:
    """Valor de laboratorio tal como queda impreso según el diseño."""
    texto = _valor_numerico(valor, diseno)
    return f"{texto} {unidad}" if diseno.con_unidad else texto


@dataclass(frozen=True)
class Contenido:
    """Todo lo que se imprime en una ficha, para dibujarlo y para poder leerlo."""

    encabezado: tuple[str, ...]
    titulo: str
    diseno: str
    identificacion: tuple[tuple[str, str], ...]
    filas: tuple[tuple[str, str], ...]
    pie: tuple[str, ...]

    def lineas(self) -> tuple[str, ...]:
        lineas = (*self.encabezado, self.titulo, self.diseno)
        lineas += tuple(f"{etiqueta}: {valor}" for etiqueta, valor in self.identificacion)
        lineas += tuple(f"{etiqueta}: {valor}" for etiqueta, valor in self.filas)
        return (*lineas, *self.pie)


def contenido(ficha: Ficha) -> Contenido:
    """Arma el texto de la ficha. Es la única fuente del PDF y del escaneado."""
    diseno = ficha.diseno
    return Contenido(
        encabezado=(
            "Institución sintética · Servicio de Endocrinología",
            "Ficha de prueba para medición de OCR (HT-091 a HT-093)",
        ),
        titulo=_TEXTO_MARCA,
        diseno=f"Diseño: {diseno.nombre}",
        identificacion=(
            ("Código", ficha.codigo),
            ("Paciente", ficha.nombre),
            ("Aviso", AVISO_SINTETICO),
        ),
        filas=(
            ("TSH", _valor_laboratorio(ficha.tsh, ficha.tsh_unidad, diseno)),
            ("T3", _valor_laboratorio(ficha.t3, ficha.t3_unidad, diseno)),
            ("T4", _valor_laboratorio(ficha.t4, ficha.t4_unidad, diseno)),
            ("Fecha de laboratorio", ficha.fecha_laboratorio),
            ("Tamaño del nódulo", f"{_valor_numerico(ficha.tamano_nodulo_mm, diseno)} mm"),
            ("Lateralidad", _ETIQUETA_LATERALIDAD[ficha.lateralidad]),
            ("TI-RADS", ficha.tirads),
            ("Bethesda", ficha.bethesda),
        ),
        pie=(
            "Generado por scripts/generar_fixtures_fichas.py · página 1 de 1",
            "Los datos son inventados y se repiten en cada ejecución del generador.",
        ),
    )


def texto_ficha(ficha: Ficha) -> str:
    """Todo el texto impreso en la ficha, una línea por renglón."""
    return "\n".join(contenido(ficha).lineas())


def _dibujar_encabezado(dibujo: ImageDraw.ImageDraw, objeto: Contenido) -> int:
    """Encabezado común: membrete, título y datos de identificación."""
    y = MARGEN
    fuente_membrete = _fuente(18)
    for linea in objeto.encabezado:
        dibujo.text((MARGEN, y), linea, font=fuente_membrete, fill=GRIS)
        y += 26

    y += 18
    alto_banda = 78
    dibujo.rectangle((MARGEN, y, ANCHO - MARGEN, y + alto_banda), fill=FONDO_BANDA)
    dibujo.text((MARGEN + 24, y + 20), objeto.titulo, font=_fuente(34, negrita=True), fill=BLANCO)
    y += alto_banda + 18
    dibujo.text((MARGEN, y), objeto.diseno, font=_fuente(20), fill=TINTA)
    y += 40

    fuente_etiqueta = _fuente(18)
    fuente_valor = _fuente(22)
    for etiqueta, valor in objeto.identificacion:
        dibujo.text((MARGEN, y), etiqueta.upper(), font=fuente_etiqueta, fill=GRIS)
        dibujo.text((MARGEN + 130, y - 2), valor, font=fuente_valor, fill=TINTA)
        y += 34
    return y + 10


def _dibujar_pie(dibujo: ImageDraw.ImageDraw, objeto: Contenido) -> None:
    fuente = _fuente(15)
    y = ALTO - MARGEN - 44
    dibujo.line((MARGEN, y - 10, ANCHO - MARGEN, y - 10), fill=GRIS_CLARO, width=2)
    for linea in objeto.pie:
        dibujo.text((MARGEN, y), linea, font=fuente, fill=GRIS)
        y += 22


def _pagina_tabla(objeto: Contenido) -> Image.Image:
    imagen = Image.new("RGB", (ANCHO, ALTO), BLANCO)
    dibujo = ImageDraw.Draw(imagen)
    y = _dibujar_encabezado(dibujo, objeto)

    ancho_columna = 330
    alto_fila = 52
    fuente_campo = _fuente(21, negrita=True)
    fuente_valor = _fuente(23)
    for indice, (etiqueta, valor) in enumerate(objeto.filas):
        relleno = GRIS_CLARO if indice % 2 == 0 else BLANCO
        dibujo.rectangle(
            (MARGEN, y, ANCHO - MARGEN, y + alto_fila), fill=relleno, outline=GRIS_CLARO
        )
        dibujo.line(
            (MARGEN + ancho_columna, y, MARGEN + ancho_columna, y + alto_fila),
            fill=GRIS_CLARO,
            width=2,
        )
        dibujo.text((MARGEN + 18, y + 14), etiqueta, font=fuente_campo, fill=TINTA)
        dibujo.text((MARGEN + ancho_columna + 18, y + 12), valor, font=fuente_valor, fill=TINTA)
        y += alto_fila

    _dibujar_pie(dibujo, objeto)
    return imagen


def _pagina_formulario(objeto: Contenido) -> Image.Image:
    imagen = Image.new("RGB", (ANCHO, ALTO), BLANCO)
    dibujo = ImageDraw.Draw(imagen)
    y = _dibujar_encabezado(dibujo, objeto)

    fuente_etiqueta = _fuente(17)
    fuente_valor = _fuente(24)
    for etiqueta, valor in objeto.filas:
        dibujo.text((MARGEN, y), etiqueta.upper(), font=fuente_etiqueta, fill=GRIS)
        caja = (MARGEN, y + 24, MARGEN + 520, y + 78)
        dibujo.rounded_rectangle(caja, radius=8, outline=GRIS, width=2)
        dibujo.text((MARGEN + 16, y + 36), valor, font=fuente_valor, fill=TINTA)
        y += 104

    _dibujar_pie(dibujo, objeto)
    return imagen


def pagina(ficha: Ficha) -> Image.Image:
    """Página de la ficha en PDF digital, en memoria."""
    objeto = contenido(ficha)
    if ficha.diseno.estilo == "formulario":
        return _pagina_formulario(objeto)
    return _pagina_tabla(objeto)


def _bytes_pdf(imagen: Image.Image) -> bytes:
    buffer = io.BytesIO()
    imagen.save(buffer, format="PDF", resolution=RESOLUCION_PDF)
    datos, cambios = _HUELLA_FECHA_PDF.subn(_FECHA_PDF_FIJA, buffer.getvalue())
    if not cambios:
        raise RuntimeError(
            "El PDF no trae la fecha de creación esperada: sin fijarla, dos "
            "ejecuciones dejarían de producir los mismos bytes."
        )
    return datos


def _escaneado(pagina_digital: Image.Image, semilla: int) -> Image.Image:
    """Simula el escaneo: leve inclinación, ruido y desenfoque, todo reproducible."""
    azar = random.Random(semilla)
    angulo = round(azar.uniform(-1.8, 1.8), 3)
    imagen = pagina_digital.rotate(
        angulo,
        resample=Image.Resampling.BICUBIC,
        expand=False,
        fillcolor=(252, 251, 247),
    )

    ancho, alto = imagen.size
    dibujo = ImageDraw.Draw(imagen)
    for _ in range(2600):
        x = azar.randrange(ancho)
        y = azar.randrange(alto)
        tono = azar.randrange(150, 232)
        radio = azar.choice((1, 1, 2))
        dibujo.ellipse((x, y, x + radio, y + radio), fill=(tono, tono, tono - 4))
    for _ in range(70):
        x = azar.randrange(ancho)
        y = azar.randrange(alto)
        largo = azar.randrange(20, 90)
        dibujo.line((x, y, x + largo, y), fill=(214, 214, 210), width=1)
    for _ in range(24):
        x = azar.randrange(ancho)
        y = azar.randrange(alto)
        lado = azar.randrange(30, 80)
        dibujo.rectangle((x, y, x + lado, y + lado), outline=(240, 240, 236))

    return imagen.filter(ImageFilter.GaussianBlur(radius=0.45))


def _campo(
    tipo: str, valor: str, texto: str, unidad: str | None = None, fecha: str | None = None
) -> dict[str, Any]:
    campo: dict[str, Any] = {"tipo": tipo, "valor": valor, "texto": texto}
    if unidad is not None:
        campo["unidad"] = unidad
    if fecha is not None:
        campo["fecha"] = fecha
    return campo


def _referencia_ficha(ficha: Ficha) -> dict[str, Any]:
    diseno = ficha.diseno
    return {
        "nombre": diseno.nombre,
        "archivo_pdf": diseno.archivo_pdf,
        "archivo_escaneado": diseno.archivo_escaneado,
        "fecha_laboratorio": ficha.fecha_laboratorio,
        "diseno": {
            "id": diseno.id,
            "separador_decimal": diseno.separador_decimal,
            "con_unidad": diseno.con_unidad,
            "estilo": diseno.estilo,
        },
        CAMPO_IDENTIFICACION: {
            "codigo": ficha.codigo,
            "nombre": ficha.nombre,
            "sintetica": True,
        },
        "campos": {
            "tsh": _campo(
                "numero",
                ficha.tsh,
                _valor_laboratorio(ficha.tsh, ficha.tsh_unidad, diseno),
                unidad=ficha.tsh_unidad if diseno.con_unidad else None,
                fecha=ficha.fecha_laboratorio,
            ),
            "t3": _campo(
                "numero",
                ficha.t3,
                _valor_laboratorio(ficha.t3, ficha.t3_unidad, diseno),
                unidad=ficha.t3_unidad if diseno.con_unidad else None,
                fecha=ficha.fecha_laboratorio,
            ),
            "t4": _campo(
                "numero",
                ficha.t4,
                _valor_laboratorio(ficha.t4, ficha.t4_unidad, diseno),
                unidad=ficha.t4_unidad if diseno.con_unidad else None,
                fecha=ficha.fecha_laboratorio,
            ),
            "tamano_nodulo_mm": _campo(
                "numero",
                ficha.tamano_nodulo_mm,
                f"{_valor_numerico(ficha.tamano_nodulo_mm, diseno)} mm",
                unidad="mm",
            ),
            "lateralidad": _campo(
                "texto",
                ficha.lateralidad,
                _ETIQUETA_LATERALIDAD[ficha.lateralidad],
            ),
            "tirads": _campo("texto", ficha.tirads, ficha.tirads),
            "bethesda": _campo("texto", ficha.bethesda, ficha.bethesda),
        },
    }


def generar(
    destino: Path | str = DESTINO_POR_DEFECTO, semilla: int = SEMILLA_POR_DEFECTO
) -> dict[str, Any]:
    """Escribe las fichas y la referencia en ``destino`` y devuelve la referencia."""
    carpeta = Path(destino)
    if carpeta.exists() and not carpeta.is_dir():
        raise NotADirectoryError(f"El destino no es un directorio: {carpeta}")
    carpeta.mkdir(parents=True, exist_ok=True)

    referencia: dict[str, Any] = {
        "version": VERSION_REFERENCIA,
        "generado_por": "scripts.generar_fixtures_fichas",
        "semilla": semilla,
        "aviso": AVISO_SINTETICO,
        "campos_medidos": list(CAMPOS_MEDIDOS),
        "fichas": [],
    }

    for indice, ficha in enumerate(FICHAS, start=1):
        digital = pagina(ficha)
        (carpeta / ficha.diseno.archivo_pdf).write_bytes(_bytes_pdf(digital))
        escaneado = _escaneado(digital, semilla + indice)
        escaneado.save(carpeta / ficha.diseno.archivo_escaneado, format="PNG", optimize=False)
        referencia["fichas"].append(_referencia_ficha(ficha))

    texto = json.dumps(referencia, ensure_ascii=False, indent=2) + "\n"
    (carpeta / NOMBRE_REFERENCIA).write_text(texto, encoding="utf-8")
    return referencia


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Genera las fichas sintéticas de prueba del OCR (HT-091 a HT-093)."
    )
    parser.add_argument(
        "--destino",
        type=Path,
        default=DESTINO_POR_DEFECTO,
        help=f"Directorio donde escribir las fichas (por defecto {DESTINO_POR_DEFECTO})",
    )
    parser.add_argument("--semilla", type=int, default=SEMILLA_POR_DEFECTO)
    args = parser.parse_args(argv)

    referencia = generar(args.destino, semilla=args.semilla)
    carpeta = Path(args.destino)
    print(f"Fichas: {len(referencia['fichas'])} · semilla {args.semilla} · destino {carpeta}")
    for ficha in referencia["fichas"]:
        print(f"  {ficha['archivo_pdf']} + {ficha['archivo_escaneado']}")
    print(f"  {NOMBRE_REFERENCIA}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
