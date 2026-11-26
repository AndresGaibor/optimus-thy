"""Pruebas del tablero administrativo (TES-358)."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from types import SimpleNamespace

import pytest
from sqlalchemy.orm import Session

from app.models.auditoria import Auditoria
from app.models.fichas import Caso
from app.models.imagenes import Imagen, Inferencia, ModeloIA
from app.models.instituciones import Institucion
from app.models.pacientes import Paciente
from app.models.usuarios import Rol, Usuario, UsuarioRol
from app.security.passwords import hash_password

CLAVE = "claveSegura-123"


@pytest.fixture()
def mundo(db_session: Session) -> dict[str, object]:
    institucion = Institucion(nombre="Institución sintética", codigo="TABLERO")
    db_session.add(institucion)
    db_session.flush()
    roles = {}
    for nombre_rol in ("admin", "doctor"):
        rol = db_session.query(Rol).filter_by(nombre=nombre_rol).first()
        if rol is None:
            rol = Rol(nombre=nombre_rol, descripcion=nombre_rol)
            db_session.add(rol)
            db_session.flush()
        roles[nombre_rol] = rol
    usuarios = []
    for nombre, role in (("admin-tablero", roles["admin"]), ("doctor-tablero", roles["doctor"])):
        correo = f"{nombre}@test.local"
        usuario = Usuario(
            institucion_id=institucion.id,
            email=correo,
            nombre=nombre,
            password_hash=hash_password(correo, CLAVE),
        )
        db_session.add(usuario)
        db_session.flush()
        db_session.add(UsuarioRol(usuario_id=usuario.id, rol_id=role.id))
        usuarios.append(usuario)
    db_session.commit()
    return {"institucion": institucion, "admin": usuarios[0], "doctor": usuarios[1]}


def entrar(client, correo: str) -> None:
    respuesta = client.post("/auth/login", json={"correo": correo, "password": CLAVE})
    assert respuesta.status_code == 200, respuesta.text


def servicios_ok(monkeypatch) -> None:
    monkeypatch.setattr(
        "app.api.usuarios.get_cliente_ia",
        lambda: SimpleNamespace(health=lambda: {"status": "ok", "modelos_cargados": True}),
    )
    monkeypatch.setattr(
        "app.api.usuarios.get_storage",
        lambda: SimpleNamespace(health=lambda: True),
    )


def test_volumen_refleja_recuentos_reales(client, db_session: Session, mundo, monkeypatch) -> None:
    institucion = mundo["institucion"]
    paciente = Paciente(institucion_id=institucion.id, seudonimo="paciente-sintetico")
    db_session.add(paciente)
    db_session.flush()
    caso = Caso(
        institucion_id=institucion.id, paciente_id=paciente.id, codigo_caso="caso-sintetico"
    )
    db_session.add(caso)
    db_session.flush()
    imagen = Imagen(caso_id=caso.id, ruta_s3="sintetico/imagen", hash_sha256="a" * 64)
    modelo = ModeloIA(nombre="Modelo sintético", version="1", hash_pesos="b" * 64)
    db_session.add_all([imagen, modelo])
    db_session.flush()
    db_session.add(Inferencia(imagen_id=imagen.id, modelo_ia_id=modelo.id, resultado="benigno"))
    db_session.commit()
    servicios_ok(monkeypatch)
    entrar(client, mundo["admin"].email)

    respuesta = client.get("/administrador/tablero")

    assert respuesta.status_code == 200, respuesta.text
    assert respuesta.json()["volumen"] == {
        "pacientes": 1,
        "casos": 1,
        "imagenes": 1,
        "inferencias": 1,
        "usuarios": 2,
    }


def test_actividad_agrega_eventos_recientes_por_accion(
    client, db_session: Session, mundo, monkeypatch
) -> None:
    ahora = datetime.now(UTC)
    institucion = mundo["institucion"]
    for accion, ocurrio in (
        ("TEST.ACTION", ahora - timedelta(hours=2)),
        ("TEST.ACTION", ahora - timedelta(hours=1)),
        ("USER.CREATE", ahora - timedelta(days=8)),
    ):
        db_session.add(
            Auditoria(
                institucion_id=institucion.id,
                accion=accion,
                entidad="SYSTEM",
                ocurrido_en=ocurrio,
            )
        )
    db_session.commit()
    servicios_ok(monkeypatch)
    entrar(client, mundo["admin"].email)

    respuesta = client.get("/administrador/tablero")

    assert respuesta.status_code == 200
    actividad = respuesta.json()["actividad"]
    evento = next(fila for fila in actividad if fila["accion"] == "TEST.ACTION")
    assert evento["total"] == 2
    assert all(fila["accion"] != "USER.CREATE" for fila in actividad)
    assert datetime.fromisoformat(evento["ultima"]).tzinfo is not None


def test_servicio_ia_sin_modelos_se_muestra_degradado(client, mundo, monkeypatch) -> None:
    servicios_ok(monkeypatch)
    monkeypatch.setattr(
        "app.api.usuarios.get_cliente_ia",
        lambda: SimpleNamespace(health=lambda: {"status": "ok", "modelos_cargados": False}),
    )
    entrar(client, mundo["admin"].email)

    respuesta = client.get("/administrador/tablero")

    assert respuesta.status_code == 200
    estados = {servicio["nombre"]: servicio["estado"] for servicio in respuesta.json()["servicios"]}
    assert estados["servicio_ia"] == "degradado"


def test_sin_permiso_de_auditoria_responde_403(client, mundo) -> None:
    entrar(client, mundo["doctor"].email)
    assert client.get("/administrador/tablero").status_code == 403
