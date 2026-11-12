"""Extracción de campos clínicos por reglas desde el texto reconocido.

Cada campo lleva la confianza del bloque de donde salió. Si el motor no reporta
confianza, el campo queda con ``confianza`` en ``None`` y no se marca para
revisión solo por eso (el aviso lo resume quien consume el resultado). Un valor
fuera del rango clínico sensato se marca para revisión sin corregirlo.

Los campos de texto libre (``histopatologia``, ``cie10``) además se anclan: la
calidad del anclaje decide la revisión, no la confianza del motor (que sigue
siendo la del bloque, como manda el contrato). Una etiqueta cercana
(``Diagnóstico``, ``CIE-10``, ``Dx``) deja el campo sin marcar; una lectura
suelta lo marca para revisión. En el CIE-10 el propio rango tiroideo
(``C73``, ``E04``–``E06``, ``D34``) vale como ancla; un código fuera de esos
rangos se marca siempre.
"""

from __future__ import annotations

import re
from collections.abc import Callable
from dataclasses import dataclass
from datetime import date

from .contrato import BloqueOcr, CampoExtraido, DocumentoOcr

_ROMANOS_1_6 = ("I", "II", "III", "IV", "V", "VI")
_ROMANO_A_NUMERO = {"I": 1, "II": 2, "III": 3, "IV": 4, "V": 5, "VI": 6}
_NUMERO_A_ROMANO = {str(i): r for i, r in enumerate(_ROMANOS_1_6, start=1)}
_RANGOS: dict[str, tuple[float, float]] = {
    "tsh": (0.0, 100.0),
    "t3": (0.0, 20.0),
    "t4": (0.0, 30.0),
    "tamano_nodulo_mm": (0.0, 200.0),
    "tirads": (1.0, 5.0),
}

# Etiquetas conocidas: usadas para no tomar un valor que pertenece a otra sección.
_ETIQUETAS_CONOCIDAS = re.compile(
    r"^\s*(?:"
    r"TSH|T3|T4|"
    r"Tamaño\s+del\s+nódulo|Tamaño|Tamano(?:\s+del\s+nodulo)?|Nódulo|Nodulo|"
    r"Lateralidad|TI\s*-?\s*RADS|TIRADS|ACR\s*TI\s*-?\s*RADS|Bethesda|"
    r"Fecha(?:\s+de\s+laboratorio)?|Fecha\s+de\s+muestra|"
    r"C[ÓO]DIGO|Codigo|Paciente|Nombre(?:\s+del\s+paciente)?|Edad|Sexo|M[ée]dico|Conclusi[oó]n|"
    r"Diagn[oó]stico|Histopatolog[ií]a|Anatom[ií]a\s+patol[oó]gica|Biopsia|"
    r"C\.?I\.?E\.?(?:\s*-?\s*10)?"
    r")\b",
    flags=re.IGNORECASE,
)


@dataclass(frozen=True, slots=True)
class _Origen:
    texto: str
    confianza: float | None


@dataclass(frozen=True, slots=True)
class _Hallazgo:
    nombre: str
    valor: str
    origen: _Origen
    numerico: float | None = None
    rango: tuple[float, float] | None = None
    # Lectura dudosa por el anclaje (valor suelto, sin etiqueta), no por el motor.
    dudoso: bool = False


def extraer_campos(documento: DocumentoOcr, confianza_minima: float) -> tuple[CampoExtraido, ...]:
    """Devuelve los campos encontrados, cada uno con su origen y revisión."""
    hallazgos: list[_Hallazgo] = []
    hallazgos.extend(_extraer_numericos(documento))
    hallazgos.extend(_extraer_fecha(documento))
    hallazgos.extend(_extraer_campo_simple(documento, "lateralidad", _extraer_lateralidad_en))
    hallazgos.extend(_extraer_campo_simple(documento, "tirads", _extraer_tirads_en))
    hallazgos.extend(_extraer_campo_simple(documento, "bethesda", _extraer_bethesda_en))
    hallazgos.extend(_extraer_campo_simple(documento, "codigo", _extraer_codigo_en))
    hallazgos.extend(_extraer_campo_simple(documento, "paciente", _extraer_paciente_en))
    hallazgos.extend(_extraer_histopatologia(documento))
    hallazgos.extend(_extraer_campo_simple(documento, "cie10", _extraer_cie10_en))
    return tuple(_resolver(hallazgos, confianza_minima))


def _resolver(hallazgos: list[_Hallazgo], confianza_minima: float) -> list[CampoExtraido]:
    por_nombre: dict[str, list[_Hallazgo]] = {}
    for hallazgo in hallazgos:
        por_nombre.setdefault(hallazgo.nombre, []).append(hallazgo)
    campos: list[CampoExtraido] = []
    for _nombre, candidatos in por_nombre.items():
        elegido = max(candidatos, key=_clave_confianza)
        conflicto = _hay_conflicto(candidatos)
        campos.append(_campo(elegido, confianza_minima, conflicto=conflicto))
    return campos


def _clave_confianza(hallazgo: _Hallazgo) -> tuple[int, float]:
    confianza = hallazgo.origen.confianza
    if confianza is None:
        # La confianza ausente no debe desplazar a una conocida más alta.
        return (0, -1.0)
    return (1, confianza)


def _hay_conflicto(candidatos: list[_Hallazgo]) -> bool:
    valores = {c.valor for c in candidatos}
    return len(valores) > 1


def _campo(hallazgo: _Hallazgo, confianza_minima: float, *, conflicto: bool) -> CampoExtraido:
    revisar = conflicto or hallazgo.dudoso
    confianza = hallazgo.origen.confianza
    if confianza is not None and confianza < confianza_minima:
        revisar = True
    if hallazgo.numerico is not None and hallazgo.rango is not None:
        minimo, maximo = hallazgo.rango
        if not (minimo <= hallazgo.numerico <= maximo):
            revisar = True
    return CampoExtraido(
        nombre=hallazgo.nombre,
        valor=hallazgo.valor,
        texto_origen=hallazgo.origen.texto,
        confianza=confianza,
        revisar=revisar,
    )


def _bloques_ordenados(documento: DocumentoOcr) -> list[BloqueOcr]:
    return sorted(documento.bloques, key=lambda b: (b.pagina, b.orden))


def _texto_bloque(bloque: BloqueOcr) -> str:
    return bloque.texto or ""


def _origen_bloque(bloque: BloqueOcr, texto: str | None = None) -> _Origen:
    contenido = _texto_bloque(bloque)
    return _Origen(texto=(texto or contenido).strip() or contenido, confianza=bloque.confianza)


def _origen_documento(documento: DocumentoOcr, texto: str) -> _Origen:
    aguja = texto.strip()
    if not aguja:
        return _Origen(texto=documento.texto_markdown, confianza=None)
    for bloque in _bloques_ordenados(documento):
        contenido = _texto_bloque(bloque)
        if aguja in contenido or contenido in aguja:
            return _Origen(texto=contenido, confianza=bloque.confianza)
    compacto = re.sub(r"\s+", "", aguja).lower()
    for bloque in _bloques_ordenados(documento):
        contenido = _texto_bloque(bloque)
        if compacto and compacto in re.sub(r"\s+", "", contenido).lower():
            return _Origen(texto=contenido, confianza=bloque.confianza)
    return _Origen(texto=aguja, confianza=None)


_NUMERO = r"(?P<valor>[-+]?\d+(?:[.,]\d+)?)"


def _a_float(valor: str) -> float:
    return float(valor.replace(",", "."))


def _formatear_decimal(numero: float) -> str:
    """Decimal sin ceros sobrantes (2.50 -> 2.5, 1.0 -> 1, 0.8 -> 0.8)."""
    texto = f"{numero:.10f}".rstrip("0").rstrip(".")
    if texto in ("-0", ""):
        return "0"
    return texto


def _normalizar_numero(valor: str, *, nombre: str) -> str:
    numero = _a_float(valor)
    if nombre == "tamano_nodulo_mm":
        return f"{numero:.1f}"
    return _formatear_decimal(numero)


def _otra_etiqueta_antes(texto: str) -> bool:
    """True si el texto comienza con una etiqueta conocida (valor ajeno)."""
    return _ETIQUETAS_CONOCIDAS.match(texto) is not None


def _siguiente_bloque_valido(bloques: list[BloqueOcr], indice: int) -> BloqueOcr | None:
    """Bloque inmediatamente siguiente, misma página, sin otra etiqueta al inicio."""
    siguiente_indice = indice + 1
    if siguiente_indice >= len(bloques):
        return None
    actual = bloques[indice]
    siguiente = bloques[siguiente_indice]
    if siguiente.pagina != actual.pagina:
        return None
    contenido = _texto_bloque(siguiente).strip()
    if not contenido:
        return None
    if _otra_etiqueta_antes(contenido):
        return None
    return siguiente


# --- Numéricos (TSH, T3, T4, tamaño) ---


@dataclass(frozen=True, slots=True)
class _PatronNumerico:
    nombre: str
    etiqueta: re.Pattern[str]
    valor_en_linea: re.Pattern[str]
    valor_suelto: re.Pattern[str]
    rango: tuple[float, float]
    unidad_cm: bool = False


_PATRONES_NUMERICOS: tuple[_PatronNumerico, ...] = (
    _PatronNumerico(
        nombre="tsh",
        etiqueta=re.compile(r"\bTSH\b", flags=re.IGNORECASE),
        valor_en_linea=re.compile(
            rf"\bTSH\b\s*[:=]?\s*{_NUMERO}\s*(?:mU/L|μUI/mL|uUI/mL)?",
            flags=re.IGNORECASE,
        ),
        valor_suelto=re.compile(
            rf"^\s*[:=]?\s*{_NUMERO}\s*(?:mU/L|μUI/mL|uUI/mL)?\s*$",
            flags=re.IGNORECASE,
        ),
        rango=_RANGOS["tsh"],
    ),
    _PatronNumerico(
        nombre="t3",
        etiqueta=re.compile(r"\bT3\b", flags=re.IGNORECASE),
        valor_en_linea=re.compile(
            rf"\bT3\b\s*[:=]?\s*{_NUMERO}\s*(?:ng/mL|pg/mL|nmol/L)?",
            flags=re.IGNORECASE,
        ),
        valor_suelto=re.compile(
            rf"^\s*[:=]?\s*{_NUMERO}\s*(?:ng/mL|pg/mL|nmol/L)?\s*$",
            flags=re.IGNORECASE,
        ),
        rango=_RANGOS["t3"],
    ),
    _PatronNumerico(
        nombre="t4",
        etiqueta=re.compile(r"\bT4\b", flags=re.IGNORECASE),
        valor_en_linea=re.compile(
            rf"\bT4\b\s*[:=]?\s*{_NUMERO}\s*(?:ng/dL|µg/dL|ug/dL|pmol/L)?",
            flags=re.IGNORECASE,
        ),
        valor_suelto=re.compile(
            rf"^\s*[:=]?\s*{_NUMERO}\s*(?:ng/dL|µg/dL|ug/dL|pmol/L)?\s*$",
            flags=re.IGNORECASE,
        ),
        rango=_RANGOS["t4"],
    ),
    _PatronNumerico(
        nombre="tamano_nodulo_mm",
        etiqueta=re.compile(
            r"(?:Tamaño\s+del\s+nódulo|Tamaño|Tamano(?:\s+del\s+nodulo)?|Nódulo|Nodulo)",
            flags=re.IGNORECASE,
        ),
        valor_en_linea=re.compile(
            rf"(?:Tamaño\s+del\s+nódulo|Tamaño|Tamano(?:\s+del\s+nodulo)?|Nódulo|Nodulo)"
            rf"\s*[:=]?\s*{_NUMERO}\s*(?P<unidad>mm|cm)?",
            flags=re.IGNORECASE,
        ),
        valor_suelto=re.compile(
            rf"^\s*[:=]?\s*{_NUMERO}\s*(?P<unidad>mm|cm)?\s*$",
            flags=re.IGNORECASE,
        ),
        rango=_RANGOS["tamano_nodulo_mm"],
        unidad_cm=True,
    ),
)


def _extraer_numericos(documento: DocumentoOcr) -> list[_Hallazgo]:
    bloques = _bloques_ordenados(documento)
    if not bloques:
        return _extraer_numericos_texto(documento.texto_markdown, documento)
    hallazgos: list[_Hallazgo] = []
    for patron in _PATRONES_NUMERICOS:
        hallazgos.extend(_hallazgos_numerico_patron(bloques, patron))
    if not hallazgos and documento.texto_markdown:
        # Respaldo para documentos sin bloques aprovechables.
        return _extraer_numericos_texto(documento.texto_markdown, documento)
    return hallazgos


def _hallazgos_numerico_patron(
    bloques: list[BloqueOcr], patron: _PatronNumerico
) -> list[_Hallazgo]:
    hallazgos: list[_Hallazgo] = []
    for indice, bloque in enumerate(bloques):
        texto = _texto_bloque(bloque)
        coincidencia = patron.valor_en_linea.search(texto)
        if coincidencia:
            hallazgos.append(
                _hallazgo_numerico(
                    patron, coincidencia, _origen_bloque(bloque, coincidencia.group(0))
                )
            )
            continue
        if not patron.etiqueta.search(texto):
            continue
        # Etiqueta presente sin número: buscar en bloque inmediatamente siguiente.
        siguiente = _siguiente_bloque_valido(bloques, indice)
        if siguiente is None:
            continue
        texto_siguiente = _texto_bloque(siguiente).strip()
        if _otra_etiqueta_antes(texto_siguiente):
            continue
        suelta = patron.valor_suelto.search(texto_siguiente)
        if not suelta:
            # Permite valor al inicio del bloque siguiente aunque haya texto residual corto,
            # siempre que no haya otra etiqueta antes del número.
            suelta = re.search(rf"^\s*[:=]?\s*{_NUMERO}", texto_siguiente, flags=re.IGNORECASE)
            if not suelta:
                continue
        origen = _Origen(texto=texto_siguiente, confianza=siguiente.confianza)
        hallazgos.append(_hallazgo_numerico(patron, suelta, origen))
    return hallazgos


def _hallazgo_numerico(
    patron: _PatronNumerico, coincidencia: re.Match[str], origen: _Origen
) -> _Hallazgo:
    crudo = coincidencia.group("valor")
    numero = _a_float(crudo)
    if patron.unidad_cm:
        unidad = (coincidencia.groupdict().get("unidad") or "").lower()
        if unidad == "cm":
            numero = numero * 10.0
    valor = _normalizar_numero(str(numero).replace(".", ","), nombre=patron.nombre)
    return _Hallazgo(
        nombre=patron.nombre,
        valor=valor,
        origen=origen,
        numerico=numero,
        rango=patron.rango,
    )


def _extraer_numericos_texto(texto: str, documento: DocumentoOcr) -> list[_Hallazgo]:
    hallazgos: list[_Hallazgo] = []
    for patron in _PATRONES_NUMERICOS:
        coincidencia = patron.valor_en_linea.search(texto)
        if not coincidencia:
            continue
        origen = _origen_documento(documento, coincidencia.group(0))
        hallazgos.append(_hallazgo_numerico(patron, coincidencia, origen))
    return hallazgos


# --- Fecha ---


_FECHA_SEPARADORES = r"[-/]"
_FECHA_RE = re.compile(
    r"(?:Fecha(?:\s+de\s+laboratorio)?|Fecha\s+de\s+muestra)"
    r"\s*[:=]?\s*(?P<fecha>\d{4}-\d{2}-\d{2}|\d{2}[-/]\d{2}[-/]\d{4})",
    flags=re.IGNORECASE,
)


def _extraer_fecha(documento: DocumentoOcr) -> list[_Hallazgo]:
    texto = documento.texto_markdown
    coincidencia = _FECHA_RE.search(texto)
    if not coincidencia:
        for bloque in _bloques_ordenados(documento):
            coincidencia = _FECHA_RE.search(_texto_bloque(bloque))
            if coincidencia:
                return [
                    _hallazgo_fecha(coincidencia, _origen_bloque(bloque, coincidencia.group(0)))
                ]
        return []
    return [_hallazgo_fecha(coincidencia, _origen_documento(documento, coincidencia.group(0)))]


def _hallazgo_fecha(coincidencia: re.Match[str], origen: _Origen) -> _Hallazgo:
    fecha = _normalizar_fecha(coincidencia.group("fecha"))
    return _Hallazgo("fecha_laboratorio", fecha, origen, dudoso=not _fecha_valida(fecha))


def _normalizar_fecha(fecha: str) -> str:
    partes = [parte for parte in re.split(_FECHA_SEPARADORES, fecha) if parte]
    if len(partes) != 3:
        return fecha
    if len(partes[0]) == 4:
        return f"{partes[0]}-{partes[1]}-{partes[2]}"
    dia, mes, anio = partes
    return f"{anio}-{mes}-{dia}"


def _fecha_valida(fecha: str) -> bool:
    """False si el texto no es una fecha real (no se corrige, solo se marca)."""
    try:
        date.fromisoformat(fecha)
    except ValueError:
        return False
    return True


# --- Campos simples con posible valor en bloque contiguo ---


@dataclass(frozen=True, slots=True)
class _ValorSimple:
    valor: str
    origen: _Origen
    numerico: float | None = None
    rango: tuple[float, float] | None = None
    dudoso: bool = False


def _extraer_campo_simple(
    documento: DocumentoOcr,
    nombre: str,
    extractor: Callable[[str, _Origen, list[BloqueOcr], int | None], _ValorSimple | None],
) -> list[_Hallazgo]:
    bloques = _bloques_ordenados(documento)
    hallazgos: list[_Hallazgo] = []
    if bloques:
        for indice, bloque in enumerate(bloques):
            resultado = extractor(_texto_bloque(bloque), _origen_bloque(bloque), bloques, indice)
            if resultado is not None:
                hallazgos.append(_hallazgo_simple(nombre, resultado))
    if not hallazgos and documento.texto_markdown:
        resultado = extractor(
            documento.texto_markdown, _Origen(documento.texto_markdown, None), [], None
        )
        if resultado is not None:
            hallazgos.append(_hallazgo_simple(nombre, resultado))
    return hallazgos


def _hallazgo_simple(nombre: str, resultado: _ValorSimple) -> _Hallazgo:
    return _Hallazgo(
        nombre=nombre,
        valor=resultado.valor,
        origen=resultado.origen,
        numerico=resultado.numerico,
        rango=resultado.rango,
        dudoso=resultado.dudoso,
    )


# --- Lateralidad ---


_LATERALIDAD_RE = re.compile(
    r"\bLateralidad\b\s*[:=]?\s*"
    r"(?P<valor>L[oó]bulo\s+(?:derecho|izquierdo)|derecho|izquierdo|istmo)\b",
    flags=re.IGNORECASE,
)


def _extraer_lateralidad_en(
    texto: str, origen: _Origen, bloques: list[BloqueOcr], indice: int | None
) -> _ValorSimple | None:
    coincidencia = _LATERALIDAD_RE.search(texto)
    if not coincidencia:
        return None
    valor_crudo = coincidencia.group("valor").strip().lower()
    if "derecho" in valor_crudo:
        valor = "derecho"
    elif "izquierdo" in valor_crudo:
        valor = "izquierdo"
    else:
        valor = "istmo"
    return _ValorSimple(
        valor=valor,
        origen=_Origen(
            texto=coincidencia.group(0).strip() or origen.texto,
            confianza=origen.confianza,
        ),
    )


# --- TI-RADS y Bethesda (tolerantes) ---


def _normalizar_token_romano(texto: str) -> str:
    """Normaliza confusiones OCR comunes antes de leer un romano."""
    limpio = texto.strip()
    limpio = re.sub(r"^[^A-Za-z0-9|!]+", "", limpio)
    m = re.match(r"[A-Za-z0-9|!]+", limpio)
    if not m:
        return ""
    token = m.group(0)
    # Confusiones frecuentes: l/|/! como I en contexto romano (Bethesda/TI-RADS).
    return token.replace("l", "I").replace("|", "I").replace("!", "I")


def _token_ambiguo_ele(texto: str) -> bool:
    """True si el token es un solo carácter ``l``/``i``/``|``/``!``.

    Ese token es indistinguible de la letra ele que Tesseract mete por ruido:
    convertirlo en el romano ``I`` inventaría un valor. Se rechaza.
    """
    limpio = re.sub(r"^[^A-Za-z0-9|!]+", "", texto.strip())
    return len(limpio) == 1 and limpio in {"l", "i", "|", "!"}


def _prefijo_romano_valido(texto: str) -> str | None:
    """Prefijo romano I..VI más largo que aparece al inicio (case-insensitive)."""
    if _token_ambiguo_ele(texto):
        return None
    candidato = _normalizar_token_romano(texto).upper()
    m = re.match(r"[IV]+", candidato)
    if not m:
        return None
    candidato = m.group(0)
    # Más largo primero.
    for romano in ("VI", "IV", "V", "III", "II", "I"):
        if candidato.startswith(romano):
            return romano
    return None


def _prefijo_digito_valido(texto: str, minimo: int, maximo: int) -> str | None:
    limpio = _normalizar_token_romano(texto)
    m = re.match(r"\d+", limpio)
    if not m:
        return None
    valor = m.group(0)
    if minimo <= int(valor) <= maximo:
        return valor
    return None


def _parsear_tirads_token(token: str) -> tuple[str, float] | None:
    if _token_ambiguo_ele(token):
        return None
    limpio = _normalizar_token_romano(token)
    # TR1..TR5
    m = re.match(r"TR\s*([1-5])", limpio, flags=re.IGNORECASE)
    if m:
        digito = m.group(1)
        return digito, float(digito)
    # Dígito 1..5
    digito = _prefijo_digito_valido(limpio, 1, 5)
    if digito is not None:
        return digito, float(digito)
    # Romano I..V (VI no aplica a TI-RADS 1-5)
    romano = _prefijo_romano_valido(limpio)
    if romano is not None and romano in {"I", "II", "III", "IV", "V"}:
        mapa = {"I": "1", "II": "2", "III": "3", "IV": "4", "V": "5"}
        valor = mapa[romano]
        return valor, float(valor)
    return None


def _parsear_bethesda_token(token: str) -> tuple[str, float] | None:
    if _token_ambiguo_ele(token):
        return None
    limpio = _normalizar_token_romano(token)
    # Dígito 1..6
    digito = _prefijo_digito_valido(limpio, 1, 6)
    if digito is not None:
        return _NUMERO_A_ROMANO[digito], float(digito)
    # Romano I..VI (prefijo válido más largo)
    romano = _prefijo_romano_valido(limpio)
    if romano is not None:
        return romano, float(_ROMANO_A_NUMERO[romano])
    return None


_TIRADS_ETIQUETA = re.compile(
    r"\b(?:TI\s*-?\s*RADS|TIRADS|ACR\s*TI\s*-?\s*RADS)\b\s*[:=]?\s*(?P<resto>.*)$",
    flags=re.IGNORECASE,
)


def _extraer_tirads_en(
    texto: str, origen: _Origen, bloques: list[BloqueOcr], indice: int | None
) -> _ValorSimple | None:
    m = _TIRADS_ETIQUETA.search(texto)
    if not m:
        return None
    resto = m.group("resto")
    parseado = _parsear_tirads_token(resto)
    origen_valor = _Origen(texto=m.group(0).strip() or origen.texto, confianza=origen.confianza)
    if parseado is None:
        if indice is None:
            return None
        siguiente = _siguiente_bloque_valido(bloques, indice)
        if siguiente is None:
            return None
        texto_siguiente = _texto_bloque(siguiente).strip()
        parseado = _parsear_tirads_token(texto_siguiente)
        if parseado is None:
            return None
        origen_valor = _Origen(texto=texto_siguiente, confianza=siguiente.confianza)
    valor, numero = parseado
    return _ValorSimple(valor=valor, origen=origen_valor, numerico=numero, rango=_RANGOS["tirads"])


_BETHESDA_ETIQUETA = re.compile(
    r"\bBethesda\b\s*[:=]?\s*(?P<resto>.*)$",
    flags=re.IGNORECASE,
)


def _extraer_bethesda_en(
    texto: str, origen: _Origen, bloques: list[BloqueOcr], indice: int | None
) -> _ValorSimple | None:
    m = _BETHESDA_ETIQUETA.search(texto)
    if not m:
        return None
    resto = m.group("resto")
    parseado = _parsear_bethesda_token(resto)
    origen_valor = _Origen(texto=m.group(0).strip() or origen.texto, confianza=origen.confianza)
    if parseado is None:
        if indice is None:
            return None
        siguiente = _siguiente_bloque_valido(bloques, indice)
        if siguiente is None:
            return None
        texto_siguiente = _texto_bloque(siguiente).strip()
        parseado = _parsear_bethesda_token(texto_siguiente)
        if parseado is None:
            return None
        origen_valor = _Origen(texto=texto_siguiente, confianza=siguiente.confianza)
    valor, numero = parseado
    return _ValorSimple(valor=valor, origen=origen_valor, numerico=numero, rango=(1.0, 6.0))


# --- Código y paciente ---


_CODIGO_RE = re.compile(
    r"\bC[ÓO]DIGO\b\s*[:=]?\s*(?P<valor>[A-Z0-9][A-Z0-9._/-]*)",
    flags=re.IGNORECASE,
)


def _extraer_codigo_en(
    texto: str, origen: _Origen, bloques: list[BloqueOcr], indice: int | None
) -> _ValorSimple | None:
    m = _CODIGO_RE.search(texto)
    if not m:
        return None
    valor = m.group("valor").strip().upper()
    return _ValorSimple(
        valor=valor,
        origen=_Origen(texto=m.group(0).strip() or origen.texto, confianza=origen.confianza),
    )


_PACIENTE_RE = re.compile(
    r"\b(?:Paciente|Nombre(?:\s+del\s+paciente)?)\b\s*[:=]?\s*(?P<valor>[^\n|]+)",
    flags=re.IGNORECASE,
)


def _extraer_paciente_en(
    texto: str, origen: _Origen, bloques: list[BloqueOcr], indice: int | None
) -> _ValorSimple | None:
    m = _PACIENTE_RE.search(texto)
    if not m:
        return None
    valor = m.group("valor").strip().strip("|").strip()
    valor = re.split(r"\s{2,}|\s*\|\s*", valor)[0].strip()
    if not valor:
        return None
    return _ValorSimple(
        valor=valor,
        origen=_Origen(texto=m.group(0).strip() or origen.texto, confianza=origen.confianza),
    )


# --- Histopatología ---

_LABEL_HISTOPATOLOGIA = (
    r"(?:Diagn[oó]stico(?:\s+histopatol[oó]gico)?|Dx|Histopatolog[ií]a|"
    r"Anatom[ií]a\s+patol[oó]gica|Biopsia|Patolog[ií]a|"
    r"Resultado(?:\s+histopatol[oó]gico)?|Conclusi[oó]n)"
)
# Delante del valor: la etiqueta puede abreviarse, pero entonces lleva separador.
_LABEL_HISTOPATOLOGIA_ANTES = re.compile(
    r"(?:" + _LABEL_HISTOPATOLOGIA + r"\s*[:=]?\s*|A\.?P\.?\s*[:=]\s*)$",
    flags=re.IGNORECASE,
)
# Bloque entero que solo contiene la etiqueta; el valor viene en el siguiente.
_LABEL_HISTOPATOLOGIA_SOLA = re.compile(
    r"^\s*(?:" + _LABEL_HISTOPATOLOGIA + r"|A\.?P\.?)\s*[:=]?\s*$",
    flags=re.IGNORECASE,
)

# Del más específico al más general: la variante gana al diagnóstico genérico.
_PATRONES_HISTOPATOLOGIA: tuple[tuple[str, re.Pattern[str]], ...] = (
    (
        "Carcinoma papilar variante folicular",
        re.compile(
            r"(?:carcinoma|c[áa]ncer)\s+papilar\s*,?\s*"
            r"(?:(?:de\s+tiroides)\s*,?\s*)?(?:(?:variante|tipo|subtipo)\s+)?folicular"
            r"|variante\s+folicular\s+(?:del?\s+)?(?:carcinoma|c[áa]ncer)\s+papilar",
            flags=re.IGNORECASE,
        ),
    ),
    (
        "Carcinoma papilar variante de células altas",
        re.compile(
            r"(?:carcinoma|c[áa]ncer)\s+papilar\s*,?\s*"
            r"(?:(?:de\s+tiroides)\s*,?\s*)?(?:(?:variante|tipo|subtipo)\s+(?:de\s+)?)?"
            r"c[ée]lulas\s+altas"
            r"|c[ée]lulas\s+altas\s+(?:del?\s+)?(?:carcinoma|c[áa]ncer)\s+papilar",
            flags=re.IGNORECASE,
        ),
    ),
    (
        "Carcinoma papilar",
        re.compile(r"(?:carcinoma|c[áa]ncer)\s+papilar\b", flags=re.IGNORECASE),
    ),
    (
        "Carcinoma folicular",
        re.compile(r"(?:carcinoma|c[áa]ncer)\s+folicular\b", flags=re.IGNORECASE),
    ),
    (
        "Carcinoma medular",
        re.compile(r"(?:carcinoma|c[áa]ncer)\s+medular\b", flags=re.IGNORECASE),
    ),
    (
        "Carcinoma anaplásico",
        re.compile(
            r"(?:carcinoma|c[áa]ncer)\s+(?:anapl[áa]sico|indiferenciado)\b",
            flags=re.IGNORECASE,
        ),
    ),
    (
        "Bocio multinodular",
        re.compile(r"bocio\s+multi-?\s?nodular", flags=re.IGNORECASE),
    ),
    (
        "Bocio coloide",
        re.compile(r"bocio\s+coloide|bocio\s+coloidal", flags=re.IGNORECASE),
    ),
    (
        "Adenoma folicular",
        re.compile(r"adenoma\s+folicular", flags=re.IGNORECASE),
    ),
    ("Bocio", re.compile(r"\bbocio\b", flags=re.IGNORECASE)),
    (
        "Tiroiditis de Hashimoto",
        re.compile(
            r"tiroiditis\s+(?:de\s+)?hashimoto|hashimoto'?s\s+tiroiditis|"
            r"tiroiditis\s+(?:cr[óo]nica\s+)?linfoc[ií]tica(?:\s+cr[óo]nica)?",
            flags=re.IGNORECASE,
        ),
    ),
    ("Hiperplasia", re.compile(r"\bhiperplasia\b", flags=re.IGNORECASE)),
)


def _diagnosticos_en(texto: str) -> list[tuple[str, int, int]]:
    """Diagnósticos del texto, sin solapes: el más específico gana el tramo."""
    encontrados: list[tuple[str, int, int]] = []
    for canonico, patron in _PATRONES_HISTOPATOLOGIA:
        for coincidencia in patron.finditer(texto):
            inicio, fin = coincidencia.span()
            solapa = any(
                inicio < otro_fin and otro_inicio < fin for _, otro_inicio, otro_fin in encontrados
            )
            if not solapa:
                encontrados.append((canonico, inicio, fin))
    encontrados.sort(key=lambda encontrado: encontrado[1])
    return encontrados


def _etiqueta_histopatologia_cerca(
    bloques: list[BloqueOcr], indice: int, texto_previo: str
) -> bool:
    """True si el valor va precedido por una etiqueta (misma línea o bloque anterior)."""
    if _LABEL_HISTOPATOLOGIA_ANTES.search(texto_previo):
        return True
    if indice <= 0 or indice >= len(bloques):
        return False
    previo = bloques[indice - 1]
    if previo.pagina != bloques[indice].pagina:
        return False
    return _LABEL_HISTOPATOLOGIA_SOLA.match(_texto_bloque(previo)) is not None


def _extraer_histopatologia(documento: DocumentoOcr) -> list[_Hallazgo]:
    """Diagnóstico canónico; si hay varios, la resolución marca el campo para revisión."""
    bloques = _bloques_ordenados(documento)
    hallazgos: list[_Hallazgo] = []
    for indice, bloque in enumerate(bloques):
        texto = _texto_bloque(bloque)
        for canonico, inicio, fin in _diagnosticos_en(texto):
            anclado = _etiqueta_histopatologia_cerca(bloques, indice, texto[:inicio])
            hallazgos.append(
                _Hallazgo(
                    nombre="histopatologia",
                    valor=canonico,
                    origen=_origen_bloque(bloque, texto[inicio:fin]),
                    dudoso=not anclado,
                )
            )
    if hallazgos or not documento.texto_markdown:
        return hallazgos
    texto = documento.texto_markdown
    for canonico, inicio, fin in _diagnosticos_en(texto):
        hallazgos.append(
            _Hallazgo(
                nombre="histopatologia",
                valor=canonico,
                origen=_origen_documento(documento, texto[inicio:fin]),
                dudoso=_LABEL_HISTOPATOLOGIA_ANTES.search(texto[:inicio]) is None,
            )
        )
    return hallazgos


# --- CIE-10 ---

_CIE10_RE = re.compile(
    r"\b(?P<valor>[A-Z][0-9]{2}(?:\.[0-9A-Z]{1,2})?)\b",
    flags=re.IGNORECASE,
)
_LABEL_CIE10 = r"(?:C\.?I\.?E\.?(?:\s*-?\s*10)?|Diagn[oó]stico(?:\s+CIE(?:\s*-?\s*10)?)?|Dx)"
_LABEL_CIE10_ANTES = re.compile(_LABEL_CIE10 + r"\s*[:=]?\s*$", flags=re.IGNORECASE)
_LABEL_CIE10_SOLA = re.compile(r"^\s*" + _LABEL_CIE10 + r"\s*[:=]?\s*$", flags=re.IGNORECASE)

# Rangos tiroideos admitidos sin etiqueta: el propio código es el ancla.
_CIE10_TIROIDEOS = frozenset({"C73", "D34"})
_CIE10_TIROIDEO_EXTRA = re.compile(r"E0[456]")


def _es_cie10_tiroideo(codigo: str) -> bool:
    base = codigo.split(".", 1)[0]
    return base in _CIE10_TIROIDEOS or _CIE10_TIROIDEO_EXTRA.fullmatch(base) is not None


def _etiqueta_cie10_cerca(bloques: list[BloqueOcr], indice: int | None, texto_previo: str) -> bool:
    """True si el código va precedido por ``CIE``, ``CIE-10``, ``diagnóstico`` o ``dx``."""
    if _LABEL_CIE10_ANTES.search(texto_previo):
        return True
    if indice is None or indice <= 0 or indice >= len(bloques):
        return False
    previo = bloques[indice - 1]
    if previo.pagina != bloques[indice].pagina:
        return False
    return _LABEL_CIE10_SOLA.match(_texto_bloque(previo)) is not None


def _extraer_cie10_en(
    texto: str, origen: _Origen, bloques: list[BloqueOcr], indice: int | None
) -> _ValorSimple | None:
    """Primer código con forma CIE-10 cuando hay etiqueta o el código es tiroideo.

    Un código de otro rango sin etiqueta no se toma: podría ser un identificador
    de paciente o de otra clasificación. Con etiqueta se toma, marcado para
    revisión, porque el rango no es de los reconocidos.
    """
    for coincidencia in _CIE10_RE.finditer(texto):
        codigo = coincidencia.group("valor").upper()
        tiroideo = _es_cie10_tiroideo(codigo)
        anclado = _etiqueta_cie10_cerca(bloques, indice, texto[: coincidencia.start()])
        if not tiroideo and not anclado:
            continue
        return _ValorSimple(
            valor=codigo,
            origen=_Origen(
                texto=coincidencia.group(0).strip() or origen.texto,
                confianza=origen.confianza,
            ),
            dudoso=not tiroideo,
        )
    return None
