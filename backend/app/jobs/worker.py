"""Worker de la cola de trabajos."""

from __future__ import annotations

import argparse
import logging
import signal
import sys
import time
from collections.abc import Callable
from typing import Any

from sqlalchemy.orm import Session

from app.db import get_session_factory
from app.jobs.manejadores import manejar_inferencia, manejar_ocr
from app.jobs.queue import (
    marcar_completado,
    marcar_error,
    recuperar_vencidos,
    reservar_siguiente,
)
from app.models.trabajos import Trabajo

logger = logging.getLogger("optimus_thy.jobs")

Manejadores = dict[str, Callable[[Trabajo], dict[str, Any]]]

#: Manejadores por tipo de trabajo.
MANEJADORES: Manejadores = {"ocr": manejar_ocr, "inferencia": manejar_inferencia}


def procesar_una(db: Session, manejadores: Manejadores) -> Trabajo | None:
    """Procesa un trabajo. Un fallo del manejador no tumba al worker."""
    recuperar_vencidos(db)
    trabajo = reservar_siguiente(db)
    if trabajo is None:
        return None
    manejador = manejadores.get(trabajo.tipo)
    if manejador is None:
        return marcar_error(db, trabajo, "sin_manejador")
    try:
        resultado = manejador(trabajo)
    except Exception as exc:
        # El detalle técnico va al log; al cliente solo llega el código.
        logger.exception("fallo_manejador", extra={"trabajo_id": str(trabajo.id)})
        codigo = getattr(exc, "codigo", None)
        if isinstance(codigo, str) and codigo:
            # Un fallo tipado ya sabe que repetir no lo arregla (contrato roto,
            # servicio caído o imagen ausente): se cierra en error y el
            # reintento es explícito.
            return marcar_error(db, trabajo, codigo, definitivo=True)
        return marcar_error(db, trabajo, "fallo_manejador")
    return marcar_completado(db, trabajo, resultado)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--una-vez", action="store_true", help="procesa un trabajo y sale")
    parser.add_argument("--espera", type=float, default=2.0, help="segundos entre consultas")
    args = parser.parse_args()

    factory = get_session_factory()
    detener = False

    def _parar(*_: object) -> None:
        nonlocal detener
        detener = True

    signal.signal(signal.SIGTERM, _parar)
    signal.signal(signal.SIGINT, _parar)

    while not detener:
        db = factory()
        try:
            procesado = procesar_una(db, MANEJADORES)
        finally:
            db.close()
        if args.una_vez:
            return 0
        if procesado is None:
            time.sleep(args.espera)
    return 0


if __name__ == "__main__":
    sys.exit(main())
