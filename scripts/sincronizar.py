#!/usr/bin/env python3
"""Sincroniza las piezas compartidas del repositorio académico al operativo.

La política vive en ``scripts/sincronizacion.json``: cada ruta relativa se
clasifica como compartida (se copia desde el académico), adaptable (se revisa a
mano) o independiente (nunca se copia). El repositorio académico se lee siempre
por ``git archive`` de un ref concreto —nunca su árbol de trabajo— y nunca se
escribe en él.

Uso::

    python3 scripts/sincronizar.py plan      [--academico DIR] [--ref REF] [--json] [--limite N]
    python3 scripts/sincronizar.py aplicar   [--academico DIR] [--ref REF] [--seco]
    python3 scripts/sincronizar.py verificar [--academico DIR] [--ref REF] [--registrar]
"""

from __future__ import annotations

import argparse
import contextlib
import filecmp
import io
import json
import os
import re
import shutil
import subprocess
import sys
import tarfile
import tempfile
import tomllib
from collections.abc import Iterator, Sequence
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path

ACADEMICO_POR_DEFECTO = "/home/ubuntu/code/optimus-thy-academico"
REGLAS_POR_DEFECTO = Path(__file__).resolve().parent / "sincronizacion.json"
VERSION_REGLAS = 1
REF_OPERATIVO = "HEAD"

# Grupos de la política, en el orden en que se evalúan: gana la primera regla.
GRUPOS_REGLAS = ("compartido", "adaptar", "independiente")

# Grupos del informe, en el orden en que se imprimen.
COPIAR = "COPIAR"
ADAPTAR = "ADAPTAR"
INDEPENDIENTE = "INDEPENDIENTE"
SIN_REGLA = "SIN_REGLA"
GRUPOS_INFORME = (COPIAR, ADAPTAR, INDEPENDIENTE, SIN_REGLA)

GRUPO_DE_REGLA = {
    "compartido": COPIAR,
    "adaptar": ADAPTAR,
    "independiente": INDEPENDIENTE,
}

# Lados del diff de árboles.
SOLO_ACADEMICO = "SOLO_ACADEMICO"
SOLO_OPERATIVO = "SOLO_OPERATIVO"
DIFERENTE = "DIFERENTE"

# Nunca se copian secretos, dependencias instaladas, artefactos ni pesos de
# modelos. El prefijo `**/` hace que el patrón valga también en subdirectorios
# (y en la raíz, porque `**/` puede coincidir con cero directorios).
EXCLUSIONES = (
    "**/.env*",
    "**/node_modules/**",
    "**/var/**",
    "**/__pycache__/**",
    "**/*.pt",
    "**/*.pth",
    "**/*.keras",
    "**/*.h5",
    "**/*.onnx",
    "**/*.ckpt",
    "**/catalogo-static/**",
    "**/test-results/**",
)

LOCK_SNAPSHOT = Path("docs/operacion/academico-snapshot.json")
REGISTRO_SINCRONIZACION = Path("docs/operacion/academico-sync-ultimo.json")
CONTRATO_API = Path("contracts/openapi.json")
CLIENTE_API = Path("frontend/src/api/schema.d.ts")


class ErrorEntorno(RuntimeError):
    """Fallo de entorno o de uso: se informa por stderr y se sale con código 2."""


# --------------------------------------------------------------------------- #
# Patrones
# --------------------------------------------------------------------------- #


def glob_a_expresion(patron: str) -> str:
    """Traduce un patrón glob relativo a una expresión regular anclada.

    ``**`` coincide con cualquier profundidad (incluida ninguna), ``*`` y ``?``
    con un solo segmento.
    """
    salida: list[str] = ["^"]
    posicion = 0
    while posicion < len(patron):
        caracter = patron[posicion]
        if caracter == "*":
            if patron.startswith("**/", posicion):
                salida.append("(?:.*/)?")
                posicion += 3
                continue
            if patron.startswith("**", posicion):
                salida.append(".*")
                posicion += 2
                continue
            salida.append("[^/]*")
            posicion += 1
            continue
        if caracter == "?":
            salida.append("[^/]")
            posicion += 1
            continue
        salida.append(re.escape(caracter))
        posicion += 1
    salida.append("$")
    return "".join(salida)


@dataclass(frozen=True)
class Regla:
    """Una entrada de la política, ya compilada."""

    grupo: str
    patron: str
    motivo: str
    nota: str | None
    expresion: re.Pattern[str]

    @classmethod
    def crear(cls, grupo: str, patron: str, motivo: str, nota: str | None = None) -> Regla:
        return cls(
            grupo=grupo,
            patron=patron,
            motivo=motivo,
            nota=nota,
            expresion=re.compile(glob_a_expresion(patron)),
        )


_EXCLUSIONES_COMPILADAS = tuple(re.compile(glob_a_expresion(patron)) for patron in EXCLUSIONES)


def excluida(ruta: str) -> bool:
    """Indica si la ruta cae en la lista de exclusiones de copia."""
    return any(patron.match(ruta) for patron in _EXCLUSIONES_COMPILADAS)


# --------------------------------------------------------------------------- #
# Política
# --------------------------------------------------------------------------- #


@dataclass(frozen=True)
class Clasificacion:
    """Grupo del informe al que pertenece una ruta, con su motivo."""

    grupo: str
    motivo: str
    nota: str | None


def clasificar_ruta(ruta: str, reglas: Sequence[Regla]) -> Clasificacion:
    """Devuelve el grupo de ``ruta``: gana la primera regla que coincide."""
    for regla in reglas:
        if regla.expresion.match(ruta):
            return Clasificacion(GRUPO_DE_REGLA[regla.grupo], regla.motivo, regla.nota)
    return Clasificacion(
        SIN_REGLA,
        "ninguna regla de scripts/sincronizacion.json cubre esta ruta",
        None,
    )


def cargar_reglas(ruta: Path) -> list[Regla]:
    """Lee y valida la política; devuelve las reglas en orden de evaluación."""
    try:
        texto = ruta.read_text(encoding="utf-8")
    except OSError as exc:
        raise ErrorEntorno(f"no se pudo leer la política {ruta}: {exc}") from exc
    try:
        datos = json.loads(texto)
    except json.JSONDecodeError as exc:
        raise ErrorEntorno(f"{ruta} no es JSON válido: {exc}") from exc
    if not isinstance(datos, dict):
        raise ErrorEntorno(f"{ruta} debe contener un objeto JSON")
    if datos.get("version") != VERSION_REGLAS:
        raise ErrorEntorno(
            f"{ruta}: versión {datos.get('version')!r} desconocida (se espera {VERSION_REGLAS})"
        )

    reglas: list[Regla] = []
    for grupo in GRUPOS_REGLAS:
        entradas = datos.get(grupo)
        if not isinstance(entradas, list):
            raise ErrorEntorno(f"{ruta}: falta la lista {grupo!r}")
        for posicion, entrada in enumerate(entradas, start=1):
            if not isinstance(entrada, dict):
                raise ErrorEntorno(f"{ruta}: {grupo}[{posicion}] debe ser un objeto")
            patron = entrada.get("patron")
            motivo = entrada.get("motivo")
            nota = entrada.get("nota")
            if not isinstance(patron, str) or not patron:
                raise ErrorEntorno(f"{ruta}: {grupo}[{posicion}] necesita un 'patron' no vacío")
            if not isinstance(motivo, str) or not motivo:
                raise ErrorEntorno(f"{ruta}: {grupo}[{posicion}] necesita un 'motivo' no vacío")
            if nota is not None and not isinstance(nota, str):
                raise ErrorEntorno(f"{ruta}: {grupo}[{posicion}] tiene una 'nota' que no es texto")
            reglas.append(Regla.crear(grupo, patron, motivo, nota))
    return reglas


# --------------------------------------------------------------------------- #
# Git y árboles
# --------------------------------------------------------------------------- #


@dataclass(frozen=True)
class Contexto:
    """Datos inmutables de la comparación en curso."""

    academico: Path
    ref: str
    operativo: Path
    commit_academico: str
    tree_academico: str
    commit_operativo: str
    arbol_limpio: bool


def _git(directorio: Path, *argumentos: str) -> subprocess.CompletedProcess[bytes]:
    orden = ["git", "-C", str(directorio), *argumentos]
    try:
        return subprocess.run(orden, capture_output=True, check=False)  # noqa: S603 - orden fija
    except FileNotFoundError as exc:
        raise ErrorEntorno("no se encontró el ejecutable `git`") from exc


def git_texto(directorio: Path, *argumentos: str) -> str:
    """Ejecuta git y devuelve la salida estándar; falla con ErrorEntorno."""
    resultado = _git(directorio, *argumentos)
    if resultado.returncode != 0:
        detalle = resultado.stderr.decode("utf-8", "replace").strip()
        raise ErrorEntorno(f"falló `git {' '.join(argumentos)}` en {directorio}: {detalle}")
    return resultado.stdout.decode("utf-8", "replace").rstrip("\n")


def es_repositorio_git(directorio: Path) -> bool:
    """Indica si el directorio está dentro de un repositorio git."""
    return _git(directorio, "rev-parse", "--is-inside-work-tree").returncode == 0


def resolver_revision(directorio: Path, ref: str, sufijo: str) -> str:
    """Resuelve un ref al objeto pedido (`commit` o `tree`)."""
    revision = "{}^{{{}}}".format(ref, sufijo)
    resultado = _git(directorio, "rev-parse", "--verify", "--quiet", revision)
    if resultado.returncode != 0:
        raise ErrorEntorno(f"no existe {ref!r} en {directorio}")
    return resultado.stdout.decode("utf-8", "replace").strip()


def archivo_git(directorio: Path, ref: str) -> bytes:
    """Devuelve el tar de `git archive` para el ref indicado."""
    resultado = _git(directorio, "archive", "--format=tar", ref)
    if resultado.returncode != 0:
        detalle = resultado.stderr.decode("utf-8", "replace").strip()
        raise ErrorEntorno(f"no se pudo archivar {ref!r} de {directorio}: {detalle}")
    return resultado.stdout


def extraer_archivo(datos: bytes, destino: Path) -> None:
    """Extrae un tar de `git archive` validando rutas y enlaces."""
    try:
        with tarfile.open(fileobj=io.BytesIO(datos), mode="r:") as paquete:
            paquete.extractall(destino, filter="data")
    except (tarfile.TarError, OSError) as exc:
        raise ErrorEntorno(f"no se pudo extraer el archivo de git en {destino}: {exc}") from exc


def listar_archivos(raiz: Path) -> list[str]:
    """Rutas relativas posix de todos los archivos del árbol, ordenadas."""
    return sorted(
        archivo.relative_to(raiz).as_posix() for archivo in raiz.rglob("*") if archivo.is_file()
    )


def comparar_arboles(academico: Path, operativo: Path) -> list[tuple[str, str]]:
    """Devuelve (ruta, lado) de cada archivo que difiere entre los dos árboles."""
    rutas_academicas = listar_archivos(academico)
    rutas_operativas = listar_archivos(operativo)
    conjunto_academico = set(rutas_academicas)
    conjunto_operativo = set(rutas_operativas)
    diferencias: list[tuple[str, str]] = []
    for ruta in sorted(conjunto_academico | conjunto_operativo):
        if ruta not in conjunto_operativo:
            diferencias.append((ruta, SOLO_ACADEMICO))
            continue
        if ruta not in conjunto_academico:
            diferencias.append((ruta, SOLO_OPERATIVO))
            continue
        if not filecmp.cmp(academico / ruta, operativo / ruta, shallow=False):
            diferencias.append((ruta, DIFERENTE))
    return diferencias


def preparar_contexto(academico: Path, ref: str, operativo: Path) -> Contexto:
    """Valida el entorno de la comparación y fija sus datos."""
    if not academico.is_dir():
        raise ErrorEntorno(f"el repositorio académico no existe: {academico}")
    if not es_repositorio_git(academico):
        raise ErrorEntorno(f"el repositorio académico no es un árbol git: {academico}")
    if not es_repositorio_git(operativo):
        raise ErrorEntorno(f"este directorio no es un árbol git: {operativo}")
    return Contexto(
        academico=academico,
        ref=ref,
        operativo=operativo,
        commit_academico=resolver_revision(academico, ref, "commit"),
        tree_academico=resolver_revision(academico, ref, "tree"),
        commit_operativo=resolver_revision(operativo, REF_OPERATIVO, "commit"),
        arbol_limpio=not git_texto(operativo, "status", "--porcelain"),
    )


@contextlib.contextmanager
def arboles(contexto: Contexto) -> Iterator[tuple[Path, Path]]:
    """Extrae los dos árboles en un directorio temporal y los entrega."""
    with tempfile.TemporaryDirectory(prefix="sincronizar-") as temporal:
        base = Path(temporal)
        arbol_academico = base / "academico"
        arbol_operativo = base / "operativo"
        arbol_academico.mkdir()
        arbol_operativo.mkdir()
        extraer_archivo(archivo_git(contexto.academico, contexto.ref), arbol_academico)
        extraer_archivo(archivo_git(contexto.operativo, REF_OPERATIVO), arbol_operativo)
        yield arbol_academico, arbol_operativo


# --------------------------------------------------------------------------- #
# Informe
# --------------------------------------------------------------------------- #


@dataclass(frozen=True)
class Ruta:
    """Una ruta del informe con su clasificación."""

    ruta: str
    lado: str
    grupo: str
    motivo: str
    nota: str | None


def clasificar_diferencias(
    diferencias: Sequence[tuple[str, str]], reglas: Sequence[Regla]
) -> list[Ruta]:
    """Clasifica las diferencias y las ordena por grupo y ruta."""
    rutas = [
        Ruta(
            ruta=ruta,
            lado=lado,
            grupo=(clasificacion := clasificar_ruta(ruta, reglas)).grupo,
            motivo=clasificacion.motivo,
            nota=clasificacion.nota,
        )
        for ruta, lado in diferencias
    ]
    return sorted(rutas, key=lambda ruta: (GRUPOS_INFORME.index(ruta.grupo), ruta.ruta))


def contar(rutas: Sequence[Ruta]) -> dict[str, int]:
    """Cuenta las rutas de cada grupo del informe."""
    conteos = dict.fromkeys(GRUPOS_INFORME, 0)
    for ruta in rutas:
        conteos[ruta.grupo] += 1
    return conteos


def imprimir_cabecera(contexto: Contexto) -> None:
    print(f"academico.commit={contexto.commit_academico}")
    print(f"academico.tree={contexto.tree_academico}")
    print(f"operativo.commit={contexto.commit_operativo}")
    print(f"operativo.ref={REF_OPERATIVO}")
    print(f"operativo.working-tree={'limpio' if contexto.arbol_limpio else 'sucio'}")
    print(f"reglas.version={VERSION_REGLAS}")


def imprimir_conteos(conteos: dict[str, int]) -> None:
    for grupo in GRUPOS_INFORME:
        print(f"{grupo} {conteos[grupo]}")


def imprimir_rutas(rutas: Sequence[Ruta], limite: int) -> None:
    for grupo in GRUPOS_INFORME:
        del_grupo = [ruta.ruta for ruta in rutas if ruta.grupo == grupo]
        for ruta in del_grupo[:limite]:
            print(f"{grupo} {ruta}")
        if len(del_grupo) > limite:
            print(f"... {grupo}: {len(del_grupo) - limite} rutas omitidas (usa --limite)")


def informe_json(contexto: Contexto, rutas: Sequence[Ruta], conteos: dict[str, int]) -> str:
    datos = {
        "academico": {
            "commit": contexto.commit_academico,
            "tree": contexto.tree_academico,
        },
        "operativo": {
            "commit": contexto.commit_operativo,
            "ref": REF_OPERATIVO,
            "working_tree": "limpio" if contexto.arbol_limpio else "sucio",
        },
        "reglas": {"version": VERSION_REGLAS},
        "conteos": {
            "copiar": conteos[COPIAR],
            "adaptar": conteos[ADAPTAR],
            "independiente": conteos[INDEPENDIENTE],
            "sin_regla": conteos[SIN_REGLA],
        },
        "rutas": [
            {
                "ruta": ruta.ruta,
                "lado": ruta.lado,
                "grupo": ruta.grupo,
                "motivo": ruta.motivo,
                **({"nota": ruta.nota} if ruta.nota else {}),
            }
            for ruta in rutas
        ],
    }
    return json.dumps(datos, ensure_ascii=False, indent=2)


def recolectar(contexto: Contexto, reglas: Sequence[Regla]) -> list[Ruta]:
    """Compara los dos árboles y clasifica cada diferencia."""
    with arboles(contexto) as (arbol_academico, arbol_operativo):
        diferencias = comparar_arboles(arbol_academico, arbol_operativo)
    return clasificar_diferencias(diferencias, reglas)


# --------------------------------------------------------------------------- #
# Comandos
# --------------------------------------------------------------------------- #


def ejecutar_plan(contexto: Contexto, reglas: Sequence[Regla], limite: int, como_json: bool) -> int:
    """Clasifica las diferencias entre los dos árboles."""
    rutas = recolectar(contexto, reglas)
    conteos = contar(rutas)
    if como_json:
        print(informe_json(contexto, rutas, conteos))
    else:
        imprimir_cabecera(contexto)
        imprimir_conteos(conteos)
        imprimir_rutas(rutas, limite)
    return 3 if conteos[SIN_REGLA] else 0


def copiar_archivo(origen: Path, destino: Path) -> None:
    """Copia contenido y permiso de ejecución de un archivo."""
    destino.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(origen, destino)
    if os.access(origen, os.X_OK):
        destino.chmod(destino.stat().st_mode | 0o111)


def resumen_cambios(operativo: Path) -> list[str]:
    """Resume lo que quedó modificado en el árbol de trabajo."""
    resultado = _git(operativo, "diff", "--stat")
    lineas = [
        linea.strip()
        for linea in resultado.stdout.decode("utf-8", "replace").splitlines()
        if linea.strip()
    ]
    resumen = [f"git diff --stat: {lineas[-1]}" if lineas else "git diff --stat: sin cambios"]
    estado = _git(operativo, "status", "--porcelain")
    nuevos = sum(
        1
        for linea in estado.stdout.decode("utf-8", "replace").splitlines()
        if linea.startswith("??")
    )
    if nuevos:
        resumen.append(f"nuevos sin seguimiento: {nuevos}")
    return resumen


def ejecutar_aplicar(contexto: Contexto, reglas: Sequence[Regla], seco: bool) -> int:
    """Copia al árbol de trabajo solo las rutas compartidas."""
    with arboles(contexto) as (arbol_academico, arbol_operativo):
        rutas = clasificar_diferencias(
            comparar_arboles(arbol_academico, arbol_operativo), reglas
        )
        pendientes_de_regla = [ruta.ruta for ruta in rutas if ruta.grupo == SIN_REGLA]
        if pendientes_de_regla:
            print(
                f"error: {len(pendientes_de_regla)} rutas sin regla; "
                "clasifícalas en scripts/sincronizacion.json antes de aplicar:",
                file=sys.stderr,
            )
            for ruta in pendientes_de_regla:
                print(f"{SIN_REGLA} {ruta}", file=sys.stderr)
            return 3

        aplicadas = 0
        iguales = 0
        omitidas = 0
        for ruta in listar_archivos(arbol_academico):
            if clasificar_ruta(ruta, reglas).grupo != COPIAR:
                continue
            if excluida(ruta):
                omitidas += 1
                print(f"OMITIDA {ruta}")
                continue
            origen = arbol_academico / ruta
            destino = contexto.operativo / ruta
            if destino.is_file() and filecmp.cmp(origen, destino, shallow=False):
                iguales += 1
                continue
            print(f"{'APLICAR' if seco else 'APLICADA'} {ruta}")
            if not seco:
                copiar_archivo(origen, destino)
            aplicadas += 1

    print(f"APLICADAS {aplicadas}")
    print(f"YA_IGUALES {iguales}")
    print(f"OMITIDAS {omitidas}")
    if seco:
        print("seco: no se escribió nada")
        return 0
    for linea in resumen_cambios(contexto.operativo):
        print(linea)
    return 0


def dependencias_declaradas(archivo: Path) -> list[str]:
    """Requisitos declarados en `pyproject.toml` (incluye extras y grupos)."""
    datos = tomllib.loads(archivo.read_text(encoding="utf-8"))
    proyecto = datos.get("project", {})
    declaradas = [str(requisito) for requisito in proyecto.get("dependencies", [])]
    for grupo in proyecto.get("optional-dependencies", {}).values():
        declaradas.extend(str(requisito) for requisito in grupo)
    for grupo in datos.get("dependency-groups", {}).values():
        declaradas.extend(requisito for requisito in grupo if isinstance(requisito, str))
    return declaradas


def nombre_paquete(requisito: str) -> str | None:
    """Extrae el nombre normalizado de un requisito PEP 508."""
    coincidencia = re.match(r"\s*([A-Za-z0-9][A-Za-z0-9._-]*)", requisito)
    if not coincidencia:
        return None
    return re.sub(r"[-_.]+", "-", coincidencia.group(1)).lower()


def paquetes_del_lock(archivo: Path) -> set[str]:
    """Nombres normalizados de los paquetes bloqueados en `uv.lock`."""
    datos = tomllib.loads(archivo.read_text(encoding="utf-8"))
    paquetes: set[str] = set()
    for paquete in datos.get("package", []):
        if isinstance(paquete, dict) and isinstance(paquete.get("name"), str):
            paquetes.add(re.sub(r"[-_.]+", "-", paquete["name"]).lower())
    return paquetes


def avisos_lock_backend(operativo: Path) -> list[str]:
    """Avisa si `backend/uv.lock` no cubre lo declarado en `backend/pyproject.toml`."""
    pyproject = operativo / "backend/pyproject.toml"
    lock = operativo / "backend/uv.lock"
    if not pyproject.is_file() or not lock.is_file():
        return []
    try:
        declaradas = dependencias_declaradas(pyproject)
        bloqueadas = paquetes_del_lock(lock)
    except (OSError, tomllib.TOMLDecodeError) as exc:
        return [f"no se pudo comprobar backend/uv.lock: {exc}"]
    faltantes = sorted(
        nombre
        for requisito in declaradas
        if (nombre := nombre_paquete(requisito)) and nombre not in bloqueadas
    )
    if not faltantes:
        return []
    return [
        "backend/uv.lock no incluye dependencias declaradas en backend/pyproject.toml: "
        f"{', '.join(faltantes)} (regenera con `uv lock`)"
    ]


def avisos_snapshot(operativo: Path, commit_academico: str) -> list[str]:
    """Avisa si el lock del snapshot no corresponde al commit académico comparado."""
    archivo = operativo / LOCK_SNAPSHOT
    if not archivo.is_file():
        return []
    try:
        datos = json.loads(archivo.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        return [f"no se pudo leer {LOCK_SNAPSHOT}: {exc}"]
    registrado = datos.get("commit_academico")
    if registrado == commit_academico:
        return []
    return [
        f"{LOCK_SNAPSHOT} registra el commit académico {registrado} "
        f"y la comparación usa {commit_academico}"
    ]


def escribir_registro(contexto: Contexto, conteos: dict[str, int], destino: Path) -> None:
    """Escribe el registro de la sincronización verificada."""
    datos = {
        "commit_academico": contexto.commit_academico,
        "tree_academico": contexto.tree_academico,
        "commit_operativo": contexto.commit_operativo,
        "fecha": datetime.now(UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "grupos": {
            "copiar": conteos[COPIAR],
            "adaptar": conteos[ADAPTAR],
            "independiente": conteos[INDEPENDIENTE],
            "sin_regla": conteos[SIN_REGLA],
        },
        "version_reglas": VERSION_REGLAS,
    }
    destino.parent.mkdir(parents=True, exist_ok=True)
    destino.write_text(json.dumps(datos, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def ejecutar_verificar(contexto: Contexto, reglas: Sequence[Regla], registrar: bool) -> int:
    """Comprueba que no queda ninguna pieza compartida pendiente."""
    with arboles(contexto) as (arbol_academico, arbol_operativo):
        rutas = clasificar_diferencias(
            comparar_arboles(arbol_academico, arbol_operativo), reglas
        )
        contrato_academico = (arbol_academico / CONTRATO_API).is_file()
    conteos = contar(rutas)

    imprimir_cabecera(contexto)
    imprimir_conteos(conteos)

    fallo = 0
    pendientes = [ruta.ruta for ruta in rutas if ruta.grupo == COPIAR]
    for ruta in pendientes:
        print(f"PENDIENTE {ruta}")
    if conteos[SIN_REGLA]:
        print(
            f"error: {conteos[SIN_REGLA]} rutas sin regla en scripts/sincronizacion.json",
            file=sys.stderr,
        )
        fallo = 3
    elif pendientes:
        print(
            f"error: {len(pendientes)} rutas compartidas pendientes de copiar "
            "(ejecuta `python3 scripts/sincronizar.py aplicar`)",
            file=sys.stderr,
        )
        fallo = 4

    faltantes = []
    if not contrato_academico:
        faltantes.append(f"el académico no tiene {CONTRATO_API}")
    if not (contexto.operativo / CONTRATO_API).is_file():
        faltantes.append(f"este repositorio no tiene {CONTRATO_API}")
    if not (contexto.operativo / CLIENTE_API).is_file():
        faltantes.append(f"este repositorio no tiene {CLIENTE_API}")
    if faltantes:
        for aviso in faltantes:
            print(f"error: {aviso}", file=sys.stderr)
        return fallo or 2

    for aviso in avisos_lock_backend(contexto.operativo):
        print(f"aviso: {aviso}")
    for aviso in avisos_snapshot(contexto.operativo, contexto.commit_academico):
        print(f"aviso: {aviso}")

    if fallo:
        return fallo

    if registrar:
        destino = contexto.operativo / REGISTRO_SINCRONIZACION
        escribir_registro(contexto, conteos, destino)
        print(f"registrado {REGISTRO_SINCRONIZACION.as_posix()}")
    print("ok: no hay piezas compartidas pendientes")
    return 0


# --------------------------------------------------------------------------- #
# CLI
# --------------------------------------------------------------------------- #


def _argumentos_comunes(analizador: argparse.ArgumentParser) -> None:
    analizador.add_argument(
        "--academico",
        default=os.environ.get("ACADEMICO_DIR") or ACADEMICO_POR_DEFECTO,
        metavar="DIR",
        help=f"repositorio académico de solo lectura (defecto: $ACADEMICO_DIR o "
        f"{ACADEMICO_POR_DEFECTO})",
    )
    analizador.add_argument(
        "--ref",
        default="HEAD",
        metavar="REF",
        help="commit o ref del académico que se compara (defecto: HEAD)",
    )


def construir_analizador() -> argparse.ArgumentParser:
    analizador = argparse.ArgumentParser(
        prog="sincronizar.py",
        description=(
            "Sincroniza las piezas compartidas del repositorio académico al operativo. "
            "La política está en scripts/sincronizacion.json: compartido se copia, "
            "adaptar se revisa a mano e independiente nunca se copia."
        ),
    )
    subcomandos = analizador.add_subparsers(
        dest="comando", required=True, metavar="{plan,aplicar,verificar}"
    )

    plan = subcomandos.add_parser(
        "plan",
        help="clasifica las rutas que difieren entre los dos repositorios",
        description="Compara el árbol académico con HEAD del operativo y clasifica cada ruta.",
    )
    _argumentos_comunes(plan)
    plan.add_argument("--json", action="store_true", help="emite el informe en JSON")
    plan.add_argument(
        "--limite",
        type=int,
        default=20,
        metavar="N",
        help="máximo de rutas listadas por grupo (defecto: 20)",
    )

    aplicar = subcomandos.add_parser(
        "aplicar",
        help="copia al árbol de trabajo solo las rutas compartidas",
        description=(
            "Copia desde `git archive` del académico las rutas compartidas que difieren. "
            "Nunca escribe rutas adaptables ni independientes, ni secretos o artefactos."
        ),
    )
    _argumentos_comunes(aplicar)
    aplicar.add_argument(
        "--seco", action="store_true", help="solo lista lo que copiaría, sin escribir"
    )

    verificar = subcomandos.add_parser(
        "verificar",
        help="comprueba que no queda ninguna pieza compartida pendiente",
        description=(
            "Falla si hay rutas sin regla o compartidas pendientes de copiar; avisa "
            "del desfase de backend/uv.lock y del lock del snapshot."
        ),
    )
    _argumentos_comunes(verificar)
    verificar.add_argument(
        "--registrar",
        action="store_true",
        help=f"escribe {REGISTRO_SINCRONIZACION.as_posix()} al terminar",
    )
    return analizador


def main(argv: Sequence[str] | None = None, ruta_reglas: Path | None = None) -> int:
    """Punto de entrada: devuelve el código de salida del contrato."""
    argumentos = construir_analizador().parse_args(argv)
    if getattr(argumentos, "limite", 0) < 0:
        print("error: --limite no puede ser negativo", file=sys.stderr)
        return 2
    try:
        reglas = cargar_reglas(ruta_reglas or REGLAS_POR_DEFECTO)
        contexto = preparar_contexto(
            Path(argumentos.academico).expanduser().resolve(),
            argumentos.ref,
            Path.cwd().resolve(),
        )
    except ErrorEntorno as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 2

    if argumentos.comando == "plan":
        return ejecutar_plan(contexto, reglas, argumentos.limite, argumentos.json)
    if argumentos.comando == "aplicar":
        return ejecutar_aplicar(contexto, reglas, argumentos.seco)
    return ejecutar_verificar(contexto, reglas, argumentos.registrar)


if __name__ == "__main__":
    raise SystemExit(main())
