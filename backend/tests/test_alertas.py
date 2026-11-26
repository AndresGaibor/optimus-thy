from __future__ import annotations

import uuid
from datetime import UTC, datetime, timedelta
from typing import NamedTuple

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.auditoria import Auditoria
from app.models.instituciones import Institucion
from app.models.usuarios import Rol, Usuario, UsuarioRol
from app.security.alertas import detectar_alertas
from app.security.passwords import hash_password


class Evento(NamedTuple):
    ocurrido_en: datetime
    usuario_id: uuid.UUID | None
    direccion_ip: str | None
    accion: str


def _evento(
    instante: datetime,
    accion: str,
    usuario_id: uuid.UUID | None = None,
    direccion_ip: str | None = "192.0.2.1",
) -> Evento:
    return Evento(instante, usuario_id, direccion_ip, accion)


def test_detecta_cinco_fallos_de_acceso_en_quince_minutos() -> None:
    ahora = datetime(2026, 11, 26, 12, tzinfo=UTC)
    usuario = uuid.uuid4()
    eventos = [
        _evento(ahora - timedelta(minutes=2 * n), "AUTH.LOGIN_FAILED", usuario) for n in range(5)
    ]

    alertas = detectar_alertas(eventos)

    assert len(alertas) == 1
    assert alertas[0].tipo == "fallos_de_acceso"
    assert alertas[0].cantidad == 5
    assert alertas[0].usuario_id == usuario


def test_no_detecta_cuatro_fallos_de_acceso() -> None:
    ahora = datetime(2026, 11, 26, 12, tzinfo=UTC)
    eventos = [
        _evento(ahora - timedelta(minutes=n), "AUTH.LOGIN_FAILED", uuid.UUID(int=1))
        for n in range(4)
    ]

    assert detectar_alertas(eventos) == []


def test_detecta_treinta_exportaciones_en_veinticuatro_horas() -> None:
    ahora = datetime(2026, 11, 26, 18, tzinfo=UTC)
    eventos = [
        _evento(ahora - timedelta(minutes=n), "EXPORT.EXPORT", uuid.UUID(int=1)) for n in range(30)
    ]

    alertas = detectar_alertas(eventos)

    assert len(alertas) == 1
    assert alertas[0].tipo == "descargas_masivas"
    assert alertas[0].cantidad == 30


def test_no_detecta_veintinueve_exportaciones() -> None:
    ahora = datetime(2026, 11, 26, 18, tzinfo=UTC)
    eventos = [
        _evento(ahora - timedelta(minutes=n), "EXPORT.EXPORT", uuid.UUID(int=1)) for n in range(29)
    ]

    assert detectar_alertas(eventos) == []


def test_detecta_exportacion_fuera_del_horario_de_guayaquil() -> None:
    usuario = uuid.UUID(int=1)
    evento = _evento(datetime(2026, 11, 26, 4, tzinfo=UTC), "EXPORT.EXPORT", usuario)

    alertas = detectar_alertas([evento])

    assert len(alertas) == 1
    assert alertas[0].tipo == "exportaciones_fuera_de_horario"
    assert alertas[0].cantidad == 1
    assert "correo" not in alertas[0].detalle.lower()


def test_exportacion_al_mediodia_de_guayaquil_no_genera_alerta() -> None:
    evento = _evento(datetime(2026, 11, 26, 17, tzinfo=UTC), "EXPORT.EXPORT", uuid.UUID(int=1))

    assert detectar_alertas([evento]) == []


def test_alertas_en_orden_determinista_por_tipo_y_desde() -> None:
    ahora = datetime(2026, 11, 26, 12, tzinfo=UTC)
    usuario = uuid.UUID(int=1)
    eventos = [
        _evento(ahora - timedelta(hours=1), "EXPORT.EXPORT", usuario),
        *[_evento(ahora - timedelta(minutes=n), "AUTH.ACCESS_DENIED", usuario) for n in range(5)],
    ]

    alertas = detectar_alertas(eventos)

    assert [alerta.tipo for alerta in alertas] == [
        "exportaciones_fuera_de_horario",
        "fallos_de_acceso",
    ]
    assert [(alerta.tipo, alerta.desde) for alerta in alertas] == sorted(
        (alerta.tipo, alerta.desde) for alerta in alertas
    )


def _usuario(db: Session, institucion: Institucion, correo: str, rol: Rol) -> Usuario:
    usuario = Usuario(
        email=correo,
        nombre="Cuenta de prueba",
        institucion_id=institucion.id,
        activo=True,
        password_hash=hash_password(correo, ACCESO_TESTS),
    )
    db.add(usuario)
    db.commit()
    db.refresh(usuario)
    db.add(UsuarioRol(usuario_id=usuario.id, rol_id=rol.id))
    db.commit()
    return usuario


@pytest.fixture()
def mundo(db_session: Session) -> dict[str, object]:
    institucion = Institucion(nombre="Institución de prueba", codigo="PRUEBA")
    otra = Institucion(nombre="Otra institución", codigo="OTRA")
    db_session.add_all([institucion, otra])
    db_session.commit()
    admin_rol = Rol(nombre="admin", descripcion="Administrador")
    medico_rol = Rol(nombre="doctor", descripcion="Médico")
    db_session.add_all([admin_rol, medico_rol])
    db_session.commit()
    return {
        "institucion": institucion,
        "otra": otra,
        "admin": _usuario(db_session, institucion, "admin@ejemplo.invalid", admin_rol),
        "medico": _usuario(db_session, institucion, "medico@ejemplo.invalid", medico_rol),
    }


def _evento_db(
    db: Session,
    mundo: dict[str, object],
    *,
    usuario: Usuario,
    institucion: Institucion,
    accion: str,
    ocurrido_en: datetime,
    direccion_ip: str | None = "192.0.2.1",
) -> None:
    db.add(
        Auditoria(
            usuario_id=usuario.id,
            institucion_id=institucion.id,
            accion=accion,
            entidad="USER",
            direccion_ip=direccion_ip,
            ocurrido_en=ocurrido_en,
        )
    )


# Acceso sintético de las cuentas del test; no es una credencial real.
ACCESO_TESTS = "acceso-de-prueba"


def _entrar(client: TestClient, correo: str) -> None:
    respuesta = client.post("/auth/login", json={"correo": correo, "password": ACCESO_TESTS})
    assert respuesta.status_code == 200, respuesta.text


def test_alertas_del_endpoint_aislan_instituciones(client, mundo, db_session) -> None:
    ahora = datetime.now(UTC)
    admin = mundo["admin"]
    institucion = mundo["institucion"]
    otra = mundo["otra"]
    assert isinstance(admin, Usuario)
    assert isinstance(institucion, Institucion)
    assert isinstance(otra, Institucion)
    for minuto in range(4):
        _evento_db(
            db_session,
            mundo,
            usuario=admin,
            institucion=institucion,
            accion="AUTH.LOGIN_FAILED",
            ocurrido_en=ahora - timedelta(minutes=minuto),
        )
    _evento_db(
        db_session,
        mundo,
        usuario=admin,
        institucion=otra,
        accion="AUTH.LOGIN_FAILED",
        ocurrido_en=ahora - timedelta(minutes=4),
    )
    db_session.commit()
    _entrar(client, admin.email)

    respuesta = client.get("/seguridad/alertas")

    assert respuesta.status_code == 200
    assert respuesta.json() == []


def test_alertas_ignoran_eventos_anteriores_a_veinticuatro_horas(client, mundo, db_session) -> None:
    ahora = datetime.now(UTC)
    admin = mundo["admin"]
    institucion = mundo["institucion"]
    assert isinstance(admin, Usuario)
    assert isinstance(institucion, Institucion)
    for minuto in range(4):
        _evento_db(
            db_session,
            mundo,
            usuario=admin,
            institucion=institucion,
            accion="AUTH.LOGIN_FAILED",
            ocurrido_en=ahora - timedelta(minutes=minuto),
        )
    _evento_db(
        db_session,
        mundo,
        usuario=admin,
        institucion=institucion,
        accion="AUTH.LOGIN_FAILED",
        ocurrido_en=ahora - timedelta(hours=25),
    )
    db_session.commit()
    _entrar(client, admin.email)

    respuesta = client.get("/seguridad/alertas")

    assert respuesta.status_code == 200
    assert respuesta.json() == []


def test_alertas_no_incluyen_datos_personales_en_detalle(client, mundo, db_session) -> None:
    ahora = datetime.now(UTC)
    admin = mundo["admin"]
    institucion = mundo["institucion"]
    assert isinstance(admin, Usuario)
    assert isinstance(institucion, Institucion)
    for minuto in range(5):
        _evento_db(
            db_session,
            mundo,
            usuario=admin,
            institucion=institucion,
            accion="AUTH.LOGIN_FAILED",
            ocurrido_en=ahora - timedelta(minutes=minuto),
        )
    db_session.commit()
    _entrar(client, admin.email)

    respuesta = client.get("/seguridad/alertas")

    assert respuesta.status_code == 200
    detalle = respuesta.json()[0]["detalle"]
    assert admin.email not in detalle
    assert admin.nombre not in detalle


def test_usuario_sin_permiso_no_puede_consultar_alertas(client, mundo) -> None:
    medico = mundo["medico"]
    assert isinstance(medico, Usuario)
    _entrar(client, medico.email)

    respuesta = client.get("/seguridad/alertas")

    assert respuesta.status_code == 403
