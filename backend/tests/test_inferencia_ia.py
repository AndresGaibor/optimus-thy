"""Traducción de errores de contenido del servicio de IA."""

from __future__ import annotations

import httpx
import pytest

from app.ia.cliente import ClienteIA, ServicioRespondioError


def test_cliente_preserva_codigo_de_imagen_no_ecografica() -> None:
    respuesta = httpx.Response(
        422,
        json={
            "code": "imagen_no_parece_ecografia",
            "mensaje": "La imagen no parece una ecografía tiroidea.",
        },
    )
    cliente = ClienteIA(
        "http://ia:8002",
        transporte=httpx.MockTransport(lambda _: respuesta),
    )

    with pytest.raises(ServicioRespondioError) as error:
        cliente.inferir(b"contenido", "imagen.png")

    assert error.value.codigo == "imagen_no_parece_ecografia"
