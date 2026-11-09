"""Pruebas del cifrado en reposo y de la gestión de la clave (HT-011)."""

from __future__ import annotations

from collections.abc import Iterator

import pytest
from pydantic import ValidationError
from sqlalchemy import LargeBinary, create_engine, select, text
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column

from app.config import DEV_PII_ENCRYPTION_KEY, Settings, get_settings
from app.models import IdentidadPaciente
from app.security.encryption import PiiCipher, PiiDecryptionError, get_cipher
from app.security.types import EncryptedBytes

CLAVE = "clave-de-prueba-suficientemente-larga"


class _Base(DeclarativeBase):
    """Base aparte para no tocar el esquema del modelo v1."""


class _Nota(_Base):
    """Tabla mínima para comprobar el tipo cifrado contra SQLite."""

    __tablename__ = "notas_cifradas"

    id: Mapped[int] = mapped_column(primary_key=True)
    cuerpo: Mapped[str | None] = mapped_column(EncryptedBytes(), nullable=True)


@pytest.fixture()
def clave(monkeypatch: pytest.MonkeyPatch) -> Iterator[PiiCipher]:
    """Cifrador construido con una clave fija de prueba."""
    monkeypatch.setenv("PII_ENCRYPTION_KEY", CLAVE)
    monkeypatch.setenv("ENVIRONMENT", "test")
    get_settings.cache_clear()
    get_cipher.cache_clear()
    yield PiiCipher(CLAVE)
    get_cipher.cache_clear()
    get_settings.cache_clear()


def test_ida_y_vuelta_con_acentos(clave: PiiCipher) -> None:
    """El texto claro se recupera tal cual, sin importar los caracteres."""
    claro = "María Fernanda Núñez — cédula 1712345678"

    cifrado = clave.encrypt(claro)

    assert isinstance(cifrado, bytes)
    assert "María".encode() not in cifrado
    assert clave.decrypt(cifrado) == claro


def test_cada_cifrado_usa_un_nonce_distinto(clave: PiiCipher) -> None:
    """Dos cifrados del mismo dato no coinciden, y ambos se descifran."""
    primero = clave.encrypt("mismo dato")
    segundo = clave.encrypt("mismo dato")

    assert primero != segundo
    assert clave.decrypt(primero) == clave.decrypt(segundo) == "mismo dato"


def test_cifrado_alterado_no_se_descifra(clave: PiiCipher) -> None:
    """GCM detecta la manipulación del contenido."""
    cifrado = clave.encrypt("dato original")
    alterado = cifrado[:-1] + bytes([cifrado[-1] ^ 0x01])

    with pytest.raises(PiiDecryptionError):
        clave.decrypt(alterado)


def test_otra_clave_no_abre_el_dato(clave: PiiCipher) -> None:
    """Sin la clave correcta el dato es ilegible."""
    cifrado = clave.encrypt("dato sensible")

    with pytest.raises(PiiDecryptionError):
        PiiCipher("otra-clave-distinta").decrypt(cifrado)


def test_cifrado_incompleto_o_no_binario_se_rechaza(clave: PiiCipher) -> None:
    """Un valor corto o que no sea ``bytes`` no se interpreta como cifrado."""
    with pytest.raises(PiiDecryptionError):
        clave.decrypt(b"")
    with pytest.raises(PiiDecryptionError):
        clave.decrypt(b"corto")
    with pytest.raises(PiiDecryptionError):
        clave.decrypt("texto plano")  # type: ignore[arg-type]


def test_identificador_de_clave_no_revela_la_clave(clave: PiiCipher) -> None:
    """El identificador es el que va a ``clave_version`` y no expone el secreto."""
    assert clave.key_id() == PiiCipher(CLAVE).key_id()
    assert clave.key_id() != PiiCipher("otra-clave-distinta").key_id()
    assert len(clave.key_id()) == 16
    assert CLAVE not in clave.key_id()


def test_la_base_guarda_solo_el_criptograma(clave: PiiCipher) -> None:
    """Al escribir, la columna contiene el cifrado; al leer, el texto claro."""
    engine = create_engine("sqlite://")
    _Base.metadata.create_all(engine)

    with Session(engine) as sesion:
        sesion.add(_Nota(id=1, cuerpo="Nombre Apellido"))
        sesion.commit()
        leida = sesion.get(_Nota, 1)
        assert leida is not None
        assert leida.cuerpo == "Nombre Apellido"

    with engine.connect() as conexion:
        guardado = conexion.execute(text("SELECT cuerpo FROM notas_cifradas")).scalar_one()

    assert isinstance(guardado, bytes)
    assert b"Nombre" not in guardado
    assert clave.decrypt(guardado) == "Nombre Apellido"
    engine.dispose()


def test_los_identificadores_del_paciente_usan_el_tipo_cifrado() -> None:
    """Las cuatro columnas de identidad cifran en la frontera con la base."""
    cifradas = [
        columna
        for columna in IdentidadPaciente.__table__.columns
        if columna.name.endswith(("_cifrado", "_cifrada", "_cifrados", "_cifradas"))
    ]

    assert len(cifradas) == 4
    assert all(isinstance(columna.type, EncryptedBytes) for columna in cifradas)
    assert all(isinstance(columna.type.impl, LargeBinary) for columna in cifradas)


def test_la_clave_de_ejemplo_no_sirve_fuera_de_desarrollo() -> None:
    """Producción exige una clave propia; desarrollo acepta la de ejemplo."""
    assert Settings(environment="development", pii_encryption_key=DEV_PII_ENCRYPTION_KEY)

    with pytest.raises(ValidationError):
        Settings(environment="production", pii_encryption_key=DEV_PII_ENCRYPTION_KEY)


def test_consulta_del_valor_descifrado(clave: PiiCipher) -> None:
    """El ORM devuelve siempre el texto claro al consultar la columna."""
    engine = create_engine("sqlite://")
    _Base.metadata.create_all(engine)

    with Session(engine) as sesion:
        sesion.add(_Nota(id=2, cuerpo="dato de consulta"))
        sesion.commit()
        fila = sesion.execute(select(_Nota.cuerpo)).scalar_one()

    assert fila == "dato de consulta"
    engine.dispose()
