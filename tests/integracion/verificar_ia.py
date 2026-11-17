"""Integración real API ↔ servicio de IA (HT-101).

Corre dentro del contenedor del backend contra el `ia` del compose:

    docker compose exec -T backend python - < tests/integracion/verificar_ia.py

Sin pesos montados el servicio responde 503 y el cliente debe traducirlo a
`modelo_no_disponible`; con pesos, la respuesta debe cumplir el contrato. En
ambos casos se prueba el cableado HTTP real, no un doble de prueba.
"""

from __future__ import annotations

import sys

from app.ia.cliente import (
    CAMPOS_CONTRATO,
    CODIGO_MODELO_NO_DISPONIBLE,
    ServicioNoDisponible,
    get_cliente_ia,
)

PNG = bytes.fromhex(
    "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c489"
    "0000000d49444154789c626001000000ffff03000006000557bfabd40000000049454e44ae426082"
)


def main() -> int:
    cliente = get_cliente_ia()
    try:
        contrato = cliente.inferir(PNG, "integracion.png")
    except ServicioNoDisponible as error:
        if error.codigo != CODIGO_MODELO_NO_DISPONIBLE:
            raise SystemExit(
                f"código inesperado sin modelos: {error.codigo}"
            ) from error
        print("OK IA: servicio real sin pesos traducido a modelo_no_disponible")
        return 0

    faltantes = [campo for campo in CAMPOS_CONTRATO if campo not in contrato]
    if faltantes:
        raise SystemExit(f"contrato incompleto: faltan {faltantes}")
    print("OK IA: servicio real devolvió el contrato versionado")
    return 0


if __name__ == "__main__":
    sys.exit(main())
