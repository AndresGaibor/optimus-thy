#!/usr/bin/env python3
"""Descarga y verifica los pesos de IA del estudio (release privada modelos-idi-086-v1).

Los binarios (410 MB) no se versionan: viven como assets de una release privada del
mismo repositorio y aquí solo se guarda su SHA-256 en `ia/modelos.sha256`.

Uso:
    make modelos
    python3 ia/scripts/descargar_modelos.py --destino var/modelos

    # espejo propio o carpeta servida por HTTP, sin pasar por GitHub
    python3 ia/scripts/descargar_modelos.py --base-url https://ejemplo/modelos

Sin `--base-url` habla con la API de GitHub: usa `gh` si está instalado y con la
sesión abierta (`gh auth login`); si no, `urllib` con `GITHUB_TOKEN`. La release
es privada, así que sin credenciales la descarga falla.

Códigos de salida: 0 todo verificado, 1 error de descarga o entorno, 2 argumentos
inválidos (lo devuelve argparse), 3 algún archivo no coincide con su SHA-256.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import shutil
import subprocess
import sys
import tempfile
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from pathlib import Path

ETIQUETA = "modelos-idi-086-v1"
REPOSITORIO = "AndresGaibor/optimus"
DESTINO_POR_DEFECTO = Path("var") / "modelos"
MANIFIESTO = Path(__file__).resolve().parent.parent / "modelos.sha256"
TROZO = 1024 * 1024

EXITO = 0
ERROR = 1
HASH_INCORRECTO = 3

API = "https://api.github.com"
TIEMPO_ESPERA = 120


class Fallo(Exception):
    """Error esperado: se informa sin traza y corta el archivo en curso."""


class HashNoCoincide(Fallo):
    """El contenido descargado no corresponde al manifiesto."""


@dataclass(frozen=True)
class Pesos:
    nombre: str
    sha256: str


@dataclass(frozen=True)
class Remoto:
    nombre: str
    tamano: int | None
    url: str | None


def tamano_legible(bytes_: int) -> str:
    if bytes_ >= 1024**3:
        return f"{bytes_ / (1024**3):.2f} GB"
    if bytes_ >= 1024**2:
        return f"{bytes_ / (1024**2):.1f} MB"
    if bytes_ >= 1024:
        return f"{bytes_ / 1024:.0f} kB"
    return f"{bytes_} B"


def leer_manifiesto(ruta: Path) -> list[Pesos]:
    if not ruta.is_file():
        raise Fallo(f"no encuentro el manifiesto {ruta}")
    pesos: list[Pesos] = []
    for numero, linea in enumerate(ruta.read_text(encoding="utf-8").splitlines(), 1):
        limpia = linea.strip()
        if not limpia or limpia.startswith("#"):
            continue
        partes = limpia.split(None, 1)
        if len(partes) != 2:
            raise Fallo(f"línea {numero} de {ruta.name}: se esperaba «sha256  nombre»")
        huella, nombre = partes[0].lower(), partes[1].strip().lstrip("*")
        if len(huella) != 64 or any(c not in "0123456789abcdef" for c in huella):
            raise Fallo(f"línea {numero} de {ruta.name}: SHA-256 no válido")
        if not nombre or "/" in nombre or "\\" in nombre or nombre in {".", ".."}:
            raise Fallo(f"línea {numero} de {ruta.name}: nombre de archivo no válido")
        pesos.append(Pesos(nombre=nombre, sha256=huella))
    if not pesos:
        raise Fallo(f"el manifiesto {ruta} no tiene ninguna entrada")
    return pesos


def sha256_de(ruta: Path) -> str:
    resumen = hashlib.sha256()
    with ruta.open("rb") as archivo:
        for bloque in iter(lambda: archivo.read(TROZO), b""):
            resumen.update(bloque)
    return resumen.hexdigest()


class _SinTokenAlRedirigir(urllib.request.HTTPRedirectHandler):
    """GitHub redirige los assets a otro host; allí el token sobra y estorba."""

    def redirect_request(self, req, fp, code, msg, headers, newurl):  # noqa: D102
        nuevo = super().redirect_request(req, fp, code, msg, headers, newurl)
        if (
            nuevo is not None
            and urllib.parse.urlsplit(newurl).netloc != urllib.parse.urlsplit(req.full_url).netloc
        ):
            nuevo.remove_header("Authorization")
            nuevo.unredirected_hdrs.pop("Authorization", None)
            nuevo.unredirected_hdrs.pop("authorization", None)
        return nuevo


def abrir(url: str, token: str | None = None, aceptar: str | None = None):
    peticion = urllib.request.Request(url)
    peticion.add_header("User-Agent", "optimus-descargar-modelos")
    if token:
        peticion.add_header("Authorization", f"Bearer {token}")
    if aceptar:
        peticion.add_header("Accept", aceptar)
    abridor = urllib.request.build_opener(_SinTokenAlRedirigir)
    try:
        return abridor.open(peticion, timeout=TIEMPO_ESPERA)
    except urllib.error.HTTPError as fallo:
        if fallo.code in (401, 403, 404):
            raise Fallo(
                f"GitHub respondió {fallo.code} al pedir la release {ETIQUETA}. "
                "La release es privada: abre sesión con `gh auth login` o exporta GITHUB_TOKEN."
            ) from None
        raise Fallo(f"GitHub respondió {fallo.code} al pedir la release {ETIQUETA}") from None
    except urllib.error.URLError as fallo:
        raise Fallo(f"no se pudo conectar con {url}: {fallo.reason}") from None


def token_de_entorno() -> str | None:
    return os.environ.get("GITHUB_TOKEN") or os.environ.get("GH_TOKEN") or None


def gh_disponible() -> bool:
    if shutil.which("gh") is None:
        return False
    try:
        resultado = subprocess.run(
            ["gh", "auth", "status"], capture_output=True, text=True, timeout=60
        )
    except (OSError, subprocess.SubprocessError):
        return False
    return resultado.returncode == 0


def remotos_gh(repositorio: str) -> dict[str, Remoto]:
    resultado = subprocess.run(
        ["gh", "api", f"repos/{repositorio}/releases/tags/{ETIQUETA}"],
        capture_output=True,
        text=True,
        timeout=TIEMPO_ESPERA,
    )
    if resultado.returncode != 0:
        detalle = (resultado.stderr or resultado.stdout).strip().splitlines()
        raise Fallo(
            f"`gh` no pudo leer la release {ETIQUETA} de {repositorio}"
            + (f": {detalle[-1]}" if detalle else "")
        )
    try:
        datos = json.loads(resultado.stdout)
    except json.JSONDecodeError:
        raise Fallo(f"`gh` devolvió una respuesta ilegible para la release {ETIQUETA}") from None
    return {
        asset["name"]: Remoto(nombre=asset["name"], tamano=int(asset["size"]), url=None)
        for asset in datos.get("assets", [])
    }


def remotos_api(repositorio: str, token: str) -> dict[str, Remoto]:
    url = f"{API}/repos/{repositorio}/releases/tags/{urllib.parse.quote(ETIQUETA)}"
    with abrir(url, token=token, aceptar="application/vnd.github+json") as respuesta:
        try:
            datos = json.load(respuesta)
        except json.JSONDecodeError:
            raise Fallo(
                f"la API devolvió una respuesta ilegible para la release {ETIQUETA}"
            ) from None
    return {
        asset["name"]: Remoto(nombre=asset["name"], tamano=int(asset["size"]), url=asset.get("url"))
        for asset in datos.get("assets", [])
    }


def remotos_directos(base_url: str, pesos: list[Pesos]) -> dict[str, Remoto]:
    raiz = base_url.rstrip("/")
    return {
        peso.nombre: Remoto(
            nombre=peso.nombre,
            tamano=None,
            url=f"{raiz}/{urllib.parse.quote(peso.nombre)}",
        )
        for peso in pesos
    }


def descargar_gh(repositorio: str, nombre: str, carpeta: Path) -> Path:
    resultado = subprocess.run(
        [
            "gh",
            "release",
            "download",
            ETIQUETA,
            "--repo",
            repositorio,
            "--pattern",
            nombre,
            "--dir",
            str(carpeta),
            "--clobber",
        ],
        capture_output=True,
        text=True,
        timeout=TIEMPO_ESPERA * 30,
    )
    if resultado.returncode != 0:
        detalle = (resultado.stderr or resultado.stdout).strip().splitlines()
        raise Fallo(
            f"`gh release download` falló para {nombre}" + (f": {detalle[-1]}" if detalle else "")
        )
    ruta = carpeta / nombre
    if not ruta.is_file():
        raise Fallo(f"`gh` no dejó {nombre} en {carpeta}")
    return ruta


def descargar_http(remoto: Remoto, carpeta: Path, token: str | None) -> tuple[Path, int | None]:
    if not remoto.url:
        raise Fallo(f"la release no publica el asset {remoto.nombre}")
    ruta = carpeta / remoto.nombre
    esperado = remoto.tamano
    with abrir(remoto.url, token=token, aceptar="application/octet-stream") as respuesta:
        declarado = respuesta.headers.get("Content-Length")
        if esperado is None and declarado and declarado.isdigit():
            esperado = int(declarado)
        with ruta.open("wb") as salida:
            shutil.copyfileobj(respuesta, salida, TROZO)
    return ruta, esperado


def verificar(peso: Pesos, ruta: Path, tamano_esperado: int | None) -> None:
    escrito = ruta.stat().st_size
    if tamano_esperado is not None and escrito != tamano_esperado:
        raise Fallo(
            f"{peso.nombre}: se esperaban {tamano_legible(tamano_esperado)} "
            f"y llegaron {tamano_legible(escrito)}"
        )
    obtenido = sha256_de(ruta)
    if obtenido != peso.sha256:
        raise HashNoCoincide(
            f"{peso.nombre}: el SHA-256 descargado ({obtenido}) no coincide con "
            f"el manifiesto ({peso.sha256})"
        )


def traer(
    peso: Pesos, remoto: Remoto, destino: Path, proveedor: str, repositorio: str, token: str | None
) -> None:
    carpeta = Path(tempfile.mkdtemp(prefix=".descarga-", dir=destino))
    try:
        if proveedor == "gh":
            bajado = descargar_gh(repositorio, peso.nombre, carpeta)
            esperado = remoto.tamano
        else:
            bajado, esperado = descargar_http(remoto, carpeta, token)
        verificar(peso, bajado, esperado)
        os.replace(bajado, destino / peso.nombre)
    finally:
        shutil.rmtree(carpeta, ignore_errors=True)


def construir_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="descargar_modelos.py",
        description=(
            f"Descarga los pesos de IA desde la release privada {ETIQUETA} y verifica su SHA-256."
        ),
    )
    parser.add_argument(
        "--destino",
        default=str(DESTINO_POR_DEFECTO),
        help=f"carpeta donde dejar los pesos (por defecto {DESTINO_POR_DEFECTO})",
    )
    parser.add_argument(
        "--base-url",
        default=None,
        help=(
            "URL con los binarios servidos directamente; omite GitHub y verifica "
            "el tamaño solo si el servidor envía Content-Length"
        ),
    )
    parser.add_argument(
        "--repositorio",
        default=REPOSITORIO,
        help=f"repositorio de la release (por defecto {REPOSITORIO})",
    )
    return parser


def ejecutar(args: argparse.Namespace) -> int:
    try:
        pesos = leer_manifiesto(MANIFIESTO)
    except Fallo as fallo:
        print(f"Error: {fallo}.", file=sys.stderr)
        return ERROR

    destino = Path(args.destino).expanduser()
    try:
        destino.mkdir(parents=True, exist_ok=True)
    except OSError as fallo:
        print(f"Error: no puedo crear {destino}: {fallo.strerror or fallo}.", file=sys.stderr)
        return ERROR

    pendientes: list[Pesos] = []
    for peso in pesos:
        ruta = destino / peso.nombre
        if ruta.is_file() and sha256_de(ruta) == peso.sha256:
            print(f"= {peso.nombre}: ya está y coincide con el manifiesto")
            continue
        if ruta.is_file():
            print(f"! {peso.nombre}: presente pero el SHA-256 no coincide; se vuelve a descargar")
        pendientes.append(peso)

    if not pendientes:
        print(f"Listo: los {len(pesos)} pesos de {destino} ya estaban verificados.")
        return EXITO

    token = token_de_entorno()
    if args.base_url:
        proveedor = "directo"
        remotos = remotos_directos(args.base_url, pesos)
        print(f"Descargando {len(pendientes)} archivo(s) desde {args.base_url.rstrip('/')}")
    elif gh_disponible():
        proveedor = "gh"
        try:
            remotos = remotos_gh(args.repositorio)
        except Fallo as fallo:
            print(f"Error: {fallo}.", file=sys.stderr)
            return ERROR
        print(
            f"Descargando {len(pendientes)} archivo(s) con gh desde {args.repositorio} ({ETIQUETA})"
        )
    elif token:
        proveedor = "http"
        try:
            remotos = remotos_api(args.repositorio, token)
        except Fallo as fallo:
            print(f"Error: {fallo}.", file=sys.stderr)
            return ERROR
        print(f"Descargando {len(pendientes)} archivo(s) con GITHUB_TOKEN desde {args.repositorio}")
    else:
        print(
            "Error: la release es privada. Abre sesión con `gh auth login` "
            "o exporta GITHUB_TOKEN con permiso de lectura del repositorio.",
            file=sys.stderr,
        )
        return ERROR

    codigo = EXITO
    for peso in pendientes:
        remoto = remotos.get(peso.nombre)
        if remoto is None:
            print(f"Error: la release {ETIQUETA} no tiene el asset {peso.nombre}.", file=sys.stderr)
            codigo = max(codigo, ERROR)
            continue
        aviso = f" ({tamano_legible(remoto.tamano)})" if remoto.tamano else ""
        print(f"↓ {peso.nombre}{aviso}")
        try:
            traer(peso, remoto, destino, proveedor, args.repositorio, token)
        except HashNoCoincide as fallo:
            print(f"Error: {fallo}. El archivo no se instaló.", file=sys.stderr)
            codigo = max(codigo, HASH_INCORRECTO)
        except Fallo as fallo:
            print(f"Error: {fallo}.", file=sys.stderr)
            codigo = max(codigo, ERROR)
        except OSError as fallo:
            print(
                f"Error: fallo de escritura en {destino}: {fallo.strerror or fallo}.",
                file=sys.stderr,
            )
            codigo = max(codigo, ERROR)
        else:
            print(f"✓ {peso.nombre}: descargado y verificado")

    if codigo == HASH_INCORRECTO:
        print(
            "Error: algún archivo no coincide con su SHA-256; revisa el manifiesto.",
            file=sys.stderr,
        )
    elif codigo == ERROR:
        print("Error: no se pudieron traer todos los pesos.", file=sys.stderr)
    else:
        print(f"Listo: pesos verificados en {destino}.")
    return codigo


def main(argv: list[str] | None = None) -> int:
    args = construir_parser().parse_args(argv)
    try:
        return ejecutar(args)
    except KeyboardInterrupt:
        print("Interrumpido por el usuario.", file=sys.stderr)
        return ERROR


if __name__ == "__main__":
    sys.exit(main())
