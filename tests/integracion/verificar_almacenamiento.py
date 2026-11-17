"""Integración real API ↔ almacenamiento S3 (HT-101).

Corre dentro del contenedor del backend contra el MinIO del compose:

    docker compose exec -T backend python - < tests/integracion/verificar_almacenamiento.py

Comprueba el camino que usa la API de imágenes: alta con clave opaca, enlace
firmado, descarga y borrado. Falla con código distinto de cero si algo no cuadra.
"""

from __future__ import annotations

import sys

import httpx
from app.storage import get_storage

# PNG 1×1 válido: basta para ejercitar el almacenamiento sin datos de paciente.
PNG = bytes.fromhex(
    "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c489"
    "0000000d49444154789c626001000000ffff03000006000557bfabd40000000049454e44ae426082"
)


def main() -> int:
    almacenamiento = get_storage()
    almacenamiento.ensure_bucket()

    objeto = almacenamiento.put_object(
        PNG, "image/png", "patients/e2e00001/images", ".png"
    )
    if objeto.size_bytes != len(PNG):
        raise SystemExit(f"tamaño inesperado: {objeto.size_bytes}")

    enlace = almacenamiento.generate_presigned_link(objeto.key)
    descarga = httpx.get(enlace.url, timeout=10)
    if descarga.status_code != 200 or descarga.content != PNG:
        raise SystemExit(
            f"descarga por enlace firmado falló: HTTP {descarga.status_code}"
        )

    almacenamiento.delete_object(objeto.key)
    borrado = httpx.get(enlace.url, timeout=10)
    if borrado.status_code != 404:
        raise SystemExit(
            f"el objeto borrado sigue accesible: HTTP {borrado.status_code}"
        )

    print("OK almacenamiento: alta, enlace firmado, descarga y borrado")
    return 0


if __name__ == "__main__":
    sys.exit(main())
