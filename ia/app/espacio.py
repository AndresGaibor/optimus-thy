"""Espacio de trabajo temporal propio de cada solicitud (RIA-03).

Dos inferencias simultáneas nunca comparten carpeta y nada se borra fuera del
directorio de la solicitud.
"""

from __future__ import annotations

import tempfile
from collections.abc import Iterator
from contextlib import contextmanager
from pathlib import Path


@contextmanager
def espacio_de_trabajo(base: Path | None = None) -> Iterator[Path]:
    """Cede un directorio temporal exclusivo y lo elimina al salir."""
    if base is not None:
        base.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="optimus-ia-", dir=base) as ruta:
        yield Path(ruta)
