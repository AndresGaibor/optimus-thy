"""Pruebas del algoritmo TOTP con los vectores RFC 6238."""

from __future__ import annotations

import base64
from datetime import UTC, datetime

import pytest

from app.security.totp import codigo_para, generar_secreto, verificar_codigo

SECRETO_RFC = base64.b32encode(b"12345678901234567890").decode()


@pytest.mark.parametrize(
    ("instante", "esperado"),
    [
        (59, "287082"),
        (1_111_111_109, "081804"),
        (1_111_111_111, "050471"),
        (1_234_567_890, "005924"),
        (2_000_000_000, "279037"),
        (20_000_000_000, "353130"),
    ],
)
def test_codigo_para_coincide_con_vectores_rfc_6238(instante: int, esperado: str) -> None:
    momento = datetime.fromtimestamp(instante, tz=UTC)

    assert codigo_para(SECRETO_RFC, momento) == esperado


def test_generar_secreto_produce_base32_seguro() -> None:
    secreto = generar_secreto()
    relleno = "=" * ((8 - len(secreto) % 8) % 8)

    assert base64.b32decode(secreto + relleno)


def test_verificar_codigo_acepta_un_paso_y_rechaza_dos() -> None:
    secreto = generar_secreto()
    codigo_anterior = codigo_para(secreto, datetime.fromtimestamp(120, tz=UTC))
    codigo_dos_pasos = codigo_para(secreto, datetime.fromtimestamp(120, tz=UTC))

    assert verificar_codigo(secreto, codigo_anterior, datetime.fromtimestamp(150, tz=UTC))
    assert not verificar_codigo(secreto, codigo_dos_pasos, datetime.fromtimestamp(180, tz=UTC))


def test_verificar_codigo_rechaza_formato_invalido() -> None:
    assert not verificar_codigo(SECRETO_RFC, "12345x", datetime.fromtimestamp(59, tz=UTC))
