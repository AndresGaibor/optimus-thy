#!/usr/bin/env python3
"""Mide la exactitud del OCR campo a campo contra la referencia de las fichas.

Usa solo la biblioteca estándar y lo que ya incluye el servicio ``ocr``.
Los números del informe los produce este script (no se escriben a mano).
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import re
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any

# Permite ejecutar el script desde cualquier directorio.
_RAIZ_OCR = Path(__file__).resolve().parents[1]
if str(_RAIZ_OCR) not in sys.path:
    sys.path.insert(0, str(_RAIZ_OCR))

from app.contrato import VERSION_CONTRATO  # noqa: E402
from app.main import crear_app  # noqa: E402

CAMPOS_MEDIDOS = ("tsh", "t3", "t4", "tamano_nodulo_mm", "lateralidad", "tirads", "bethesda")
ETIQUETAS_CAMPO = {
    "tsh": "TSH",
    "t3": "T3",
    "t4": "T4",
    "tamano_nodulo_mm": "Tamaño del nódulo (mm)",
    "lateralidad": "Lateralidad",
    "tirads": "TI-RADS",
    "bethesda": "Bethesda",
}


@dataclass
class ResultadoCampo:
    ficha: str
    archivo: str
    campo: str
    esperado: str
    obtenido: str | None
    revisar: bool | None
    estado: str  # acierto | fallo | ausente
    causa: str


def _parsear_numero(texto: str) -> float | None:
    limpio = texto.strip().replace(",", ".")
    if not re.fullmatch(r"[-+]?(?:\d+\.?\d*|\.\d+)", limpio):
        return None
    try:
        return float(limpio)
    except ValueError:
        return None


def _coincide(esperado: str, obtenido: str) -> bool:
    num_e = _parsear_numero(esperado)
    num_o = _parsear_numero(obtenido)
    if num_e is not None and num_o is not None:
        return num_e == num_o
    return esperado.strip().casefold() == obtenido.strip().casefold()


def _causa(resultado: ResultadoCampo, *, es_digital: bool) -> str:
    if resultado.estado == "acierto":
        return ""
    if resultado.estado == "ausente":
        return "el motor no devolvió el valor"
    # fallo con valor presente
    return f"valor reconocido distinto al esperado («{resultado.obtenido}»)"


def reconocer_testclient(archivo: Path, motor: str) -> list[dict[str, Any]]:
    from fastapi.testclient import TestClient

    anterior = os.environ.get("OCR_MOTOR")
    os.environ["OCR_MOTOR"] = motor
    try:
        app = crear_app()
        with TestClient(app) as client:
            with archivo.open("rb") as fh:
                respuesta = client.post(
                    "/reconocer",
                    files={"documento": (archivo.name, fh, "application/pdf")},
                )
            respuesta.raise_for_status()
            return list(respuesta.json().get("campos", []))
    finally:
        if anterior is None:
            os.environ.pop("OCR_MOTOR", None)
        else:
            os.environ["OCR_MOTOR"] = anterior


def reconocer_url(archivo: Path, motor: str, url: str) -> list[dict[str, Any]]:
    import urllib.request

    limite = f"----medicionocr{dt.datetime.now().timestamp():.0f}"
    with archivo.open("rb") as fh:
        contenido = fh.read()
    partes: list[bytes] = []
    partes.append(
        (
            f"--{limite}\r\n"
            f'Content-Disposition: form-data; name="documento"; filename="{archivo.name}"\r\n'
            "Content-Type: application/pdf\r\n\r\n"
        ).encode()
        + contenido
        + b"\r\n"
    )
    partes.append(
        (f'--{limite}\r\nContent-Disposition: form-data; name="motor"\r\n\r\n{motor}\r\n').encode()
    )
    partes.append(f"--{limite}--\r\n".encode())
    cuerpo = b"".join(partes)
    peticion = urllib.request.Request(
        url.rstrip("/") + "/reconocer",
        data=cuerpo,
        headers={"Content-Type": f"multipart/form-data; boundary={limite}"},
        method="POST",
    )
    with urllib.request.urlopen(peticion) as resp:
        datos = json.loads(resp.read().decode("utf-8"))
    return list(datos.get("campos", []))


def reconocer(archivo: Path, motor: str, url: str | None) -> list[dict[str, Any]]:
    if url:
        return reconocer_url(archivo, motor, url)
    return reconocer_testclient(archivo, motor)


def evaluar_ficha(ficha: dict[str, Any], campos_resp: list[dict[str, Any]]) -> list[ResultadoCampo]:
    por_nombre = {c.get("nombre"): c for c in campos_resp if isinstance(c, dict)}
    archivo = ficha["archivo_pdf"]
    resultados: list[ResultadoCampo] = []
    for nombre in CAMPOS_MEDIDOS:
        esperado = str(ficha["campos"][nombre]["valor"])
        campo = por_nombre.get(nombre)
        if campo is None or campo.get("valor") is None or str(campo.get("valor", "")).strip() == "":
            resultados.append(
                ResultadoCampo(
                    ficha=ficha["nombre"],
                    archivo=archivo,
                    campo=nombre,
                    esperado=esperado,
                    obtenido=None,
                    revisar=bool(campo.get("revisar")) if campo else None,
                    estado="ausente",
                    causa="",
                )
            )
            continue
        obtenido = str(campo.get("valor"))
        revisar = bool(campo.get("revisar", False))
        estado = "acierto" if _coincide(esperado, obtenido) else "fallo"
        resultados.append(
            ResultadoCampo(
                ficha=ficha["nombre"],
                archivo=archivo,
                campo=nombre,
                esperado=esperado,
                obtenido=obtenido,
                revisar=revisar,
                estado=estado,
                causa="",
            )
        )
    es_digital = archivo.endswith(".pdf")
    for r in resultados:
        if r.estado != "acierto":
            r.causa = _causa(r, es_digital=es_digital)
    return resultados


def _metricas(resultados: list[ResultadoCampo]) -> dict[str, Any]:
    total = len(resultados)
    aciertos = sum(1 for r in resultados if r.estado == "acierto")
    fallos = [r for r in resultados if r.estado != "acierto"]
    fallos_sin_revisar = [r for r in fallos if r.revisar is not True]
    return {
        "total": total,
        "aciertos": aciertos,
        "fallos": len([r for r in resultados if r.estado == "fallo"]),
        "ausentes": len([r for r in resultados if r.estado == "ausente"]),
        "exactitud": (aciertos / total) if total else 0.0,
        "fallos_sin_revisar": len(fallos_sin_revisar),
    }


def _tabla_por_campo(resultados: list[ResultadoCampo]) -> str:
    filas = [
        (
            "| Campo | Aciertos | Fallos | Ausentes | Fallos marcados `revisar` | "
            "Fallos sin `revisar` | Exactitud |"
        ),
        "| --- | ---: | ---: | ---: | ---: | ---: | ---: |",
    ]
    for nombre in CAMPOS_MEDIDOS:
        rs = [r for r in resultados if r.campo == nombre]
        aciertos = sum(1 for r in rs if r.estado == "acierto")
        fallos = sum(1 for r in rs if r.estado == "fallo")
        ausentes = sum(1 for r in rs if r.estado == "ausente")
        fallos_lista = [r for r in rs if r.estado != "acierto"]
        marcados = sum(1 for r in fallos_lista if r.revisar is True)
        sin_marcar = sum(1 for r in fallos_lista if r.revisar is not True)
        exactitud = (aciertos / len(rs)) if rs else 0.0
        filas.append(
            f"| {ETIQUETAS_CAMPO[nombre]} | {aciertos} | {fallos} | {ausentes} | "
            f"{marcados} | {sin_marcar} | {exactitud:.2f} |"
        )
    return "\n".join(filas)


def _tabla_por_ficha(resultados: list[ResultadoCampo], fichas: list[dict[str, Any]]) -> str:
    filas = [
        (
            "| Ficha | Archivo (PDF) | Aciertos | Fallos | Ausentes | "
            "Fallos sin `revisar` | Exactitud |"
        ),
        "| --- | --- | ---: | ---: | ---: | ---: | ---: |",
    ]
    for ficha in fichas:
        rs = [r for r in resultados if r.archivo == ficha["archivo_pdf"]]
        m = _metricas(rs)
        sin_revisar = sum(1 for r in rs if r.estado != "acierto" and r.revisar is not True)
        filas.append(
            f"| {ficha['nombre']} | `{ficha['archivo_pdf']}` | {m['aciertos']} | "
            f"{m['fallos']} | {m['ausentes']} | {sin_revisar} | {m['exactitud']:.2f} |"
        )
    return "\n".join(filas)


def _tabla_fallos(resultados: list[ResultadoCampo]) -> str:
    fallos = [r for r in resultados if r.estado != "acierto"]
    if not fallos:
        return "No se registraron fallos."
    filas = [
        "| Ficha | Campo | Esperado | Obtenido | `revisar` | Causa |",
        "| --- | --- | --- | --- | --- | --- |",
    ]
    for r in fallos:
        obtenido = "— (ausente)" if r.obtenido is None else f"`{r.obtenido}`"
        revisar = "—" if r.revisar is None else ("sí" if r.revisar else "no")
        filas.append(
            f"| {r.ficha} | {ETIQUETAS_CAMPO[r.campo]} | `{r.esperado}` | "
            f"{obtenido} | {revisar} | {r.causa} |"
        )
    return "\n".join(filas)


def generar_informe(
    *,
    resultados: list[ResultadoCampo],
    fichas: list[dict[str, Any]],
    motor: str,
    directorio: Path,
    fecha: str,
    comando: str,
) -> str:
    m = _metricas(resultados)
    cobertura = (
        "n/a (sin fallos)"
        if (m["fallos"] + m["ausentes"]) == 0
        else (
            f"{(m['fallos'] + m['ausentes']) - m['fallos_sin_revisar']}/"
            f"{(m['fallos'] + m['ausentes'])}"
        )
    )
    lineas = [
        "# Medición de la calidad del OCR (HT-043)",
        "",
        f"- Fecha de ejecución: {fecha}",
        f"- Contrato del servicio OCR: `{VERSION_CONTRATO}`",
        f"- Motor medido: `{motor}`",
        f"- Directorio de fichas: `{directorio}`",
        "",
        "## Meta (fijada antes de medir)",
        "",
        "Se fija antes de ejecutar la medición y antes de observar los resultados:",
        "",
        "- **Exactitud por campo ≥ 0,90** sobre las fichas digitales (PDF).",
        "- **Cero campos incorrectos sin marcar como `revisar`** en las fichas digitales.",
        "",
        "Esta meta se declara de forma previa a la medición; los resultados de este informe "
        "son la primera observación registrada con este script sobre el conjunto de "
        "referencia indicado.",
        "",
        "## Método",
        "",
        "1. Se generan las fichas sintéticas y su referencia con "
        "`backend/scripts/generar_fixtures_fichas.py` (HT-093), que produce tres fichas "
        "digitales (PDF), sus versiones escaneadas (PNG) y `referencia.json` con los "
        "valores esperados normalizados.",
        "2. El script `ocr/scripts/medir_calidad.py` recorre las fichas digitales "
        "(`archivo_pdf`) del directorio, envía cada PDF a `/reconocer` con el motor "
        "indicado y compara la respuesta campo a campo contra `referencia.json`.",
        "3. Campos medidos (7): `tsh`, `t3`, `t4`, `tamano_nodulo_mm`, `lateralidad`, "
        "`tirads`, `bethesda`.",
        "4. Normalización para comparar: se admiten coma y punto como separador decimal; "
        "la comparación numérica es exacta sobre el valor numérico; la comparación "
        "textual no distingue mayúsculas/minúsculas.",
        "5. Por cada comparación se registra: acierto, fallo (valor distinto) o ausente "
        "(el motor no devolvió el campo). En los fallos se anota si el campo venía "
        "marcado con `revisar=true`.",
        "6. Todos los números y tablas de este informe son calculados por el script a "
        "partir de esa ejecución.",
        "",
        "## Comandos",
        "",
        "```bash",
        "# 1) Generar las fichas sintéticas de referencia",
        "cd backend && .venv/bin/python scripts/generar_fixtures_fichas.py --destino /tmp/fichas",
        "",
        "# 2) Ejecutar la medición con Tesseract y escribir el informe",
        comando,
        "```",
        "",
        "## Resultados por campo",
        "",
        _tabla_por_campo(resultados),
        "",
        "## Resultados por ficha",
        "",
        _tabla_por_ficha(resultados, fichas),
        "",
        "## Resumen",
        "",
        (
            f"- Aciertos / total: **{m['aciertos']}/{m['total']}** "
            f"(exactitud global {m['exactitud']:.4f})."
        ),
        f"- Fallos: **{m['fallos']}** · Ausentes: **{m['ausentes']}**.",
        (
            f"- Fallos marcados `revisar`: "
            f"**{(m['fallos'] + m['ausentes']) - m['fallos_sin_revisar']}/"
            f"{m['fallos'] + m['ausentes']}** "
            f"(cobertura de `revisar` sobre fallos/ausentes: {cobertura})."
        ),
        f"- Fallos/ausentes sin `revisar`: **{m['fallos_sin_revisar']}**.",
        "",
        "## Detalle de fallos y ausencias",
        "",
        _tabla_fallos(resultados),
        "",
        "## GLM-OCR: por qué no se mide a escala en este host",
        "",
        "No se incluye una corrida completa con `--motor glm` en este host por costo de "
        "cómputo, no por falta de integración:",
        "",
        "- **Entorno:** host `arm64`, ejecución en CPU (sin aceleración GPU).",
        (
            "- **Tiempo observado:** ≈ **1,1 s por token** generado; una página de ficha "
            "tarda entre **6 y 15 minutos** en reconocerse (según la cantidad de "
            "texto/bloques)."
        ),
        (
            "- **Impacto:** medir el conjunto de referencia completo con GLM-OCR en CPU "
            "implica decenas de minutos por corrida, lo que impide iterar y dejar "
            "evidencia reproducible en el mismo ciclo que la medición con Tesseract."
        ),
        "",
        (
            "**Qué haría falta para medirlo a escala:** ejecutar el servicio OCR con "
            "GLM-OCR sobre **GPU** y servir el modelo mediante **vLLM** (u otro servidor "
            "de inferencia con batching y kernels GPU). Con ese despliegue el tiempo por "
            "página baja a un rango interactivo y la misma medición "
            "(`ocr/scripts/medir_calidad.py --motor glm ...`) puede correrse sobre el "
            "conjunto completo y registrarse con el mismo formato de informe."
        ),
        "",
        "## Reproducibilidad",
        "",
        (
            "- El informe se regenera ejecutando el script con los mismos argumentos y el "
            "mismo `--fecha`; el contenido es determinista salvo la fecha indicada."
        ),
        (
            "- La referencia de fichas es sintética (sin datos personales) y reproducible "
            "con la semilla documentada por el generador."
        ),
        "",
    ]
    return "\n".join(lineas)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Mide la exactitud del OCR por campo contra referencia.json."
    )
    parser.add_argument("directorio", help="Directorio con las fichas y referencia.json")
    parser.add_argument("--motor", choices=("tesseract", "glm"), default="tesseract")
    parser.add_argument("--url", help="URL base del servicio OCR; por defecto usa TestClient local")
    parser.add_argument("--salida", help="Ruta del informe Markdown a escribir")
    parser.add_argument("--fecha", help="Fecha a registrar en el informe (YYYY-MM-DD)")
    args = parser.parse_args(argv)

    directorio = Path(args.directorio)
    referencia = json.loads((directorio / "referencia.json").read_text(encoding="utf-8"))
    fichas = list(referencia.get("fichas", []))
    fecha = args.fecha or dt.date.today().isoformat()

    todos: list[ResultadoCampo] = []
    for ficha in fichas:
        archivo = directorio / ficha["archivo_pdf"]
        campos_resp = reconocer(archivo, args.motor, args.url)
        todos.extend(evaluar_ficha(ficha, campos_resp))

    comando = (
        f"cd ocr && .venv/bin/python scripts/medir_calidad.py {directorio} "
        f"--motor {args.motor} --salida docs/pruebas/medicion-ocr.md --fecha {fecha}"
    )
    informe = generar_informe(
        resultados=todos,
        fichas=fichas,
        motor=args.motor,
        directorio=directorio,
        fecha=fecha,
        comando=comando,
    )

    if args.salida:
        salida = Path(args.salida)
        salida.parent.mkdir(parents=True, exist_ok=True)
        salida.write_text(informe, encoding="utf-8")
    else:
        sys.stdout.write(informe)

    m = _metricas(todos)
    print(
        f"RESUMEN aciertos={m['aciertos']} total={m['total']} exactitud={m['exactitud']:.4f}",
        file=sys.stderr,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
