"""Agregados de acuerdo entre la inferencia y la decisión médica."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import Any

import pytest
from fastapi.testclient import TestClient

from app.models.imagenes import DecisionMedica, Imagen, Inferencia, ModeloIA
from app.models.instituciones import Institucion
from app.models.usuarios import Rol, Usuario, UsuarioRol
from app.security.passwords import hash_password

CLAVE = "claveSegura-123"
PACIENTE = {
    "nombres": "Ana María",
    "apellidos": "Pérez Quishpe",
    "documento": "0601234567",
    "fecha_nacimiento": "1980-05-17",
}


def _usuario(db, institucion, correo: str, rol: Rol) -> Usuario:
    usuario = Usuario(
        email=correo,
        nombre=correo,
        institucion_id=institucion.id,
        activo=True,
        password_hash=hash_password(correo, CLAVE),
    )
    db.add(usuario)
    db.commit()
    db.refresh(usuario)
    db.add(UsuarioRol(usuario_id=usuario.id, rol_id=rol.id))
    db.commit()
    return usuario


@pytest.fixture()
def mundo(db_session):
    espoch = Institucion(nombre="ESPOCH", codigo="ESPOCH")
    solca = Institucion(nombre="SOLCA", codigo="SOLCA")
    db_session.add_all([espoch, solca])
    db_session.commit()
    investigador = Rol(nombre="researcher", descripcion="investigador")
    doctor = Rol(nombre="doctor", descripcion="doctor")
    db_session.add_all([investigador, doctor])
    db_session.commit()
    return {
        "investigador": _usuario(db_session, espoch, "investiga@t.com", investigador),
        "medico": _usuario(db_session, espoch, "medico@t.com", doctor),
        "medico_solca": _usuario(db_session, solca, "solca@t.com", doctor),
    }


def _entrar(client: TestClient, correo: str) -> None:
    respuesta = client.post("/auth/login", json={"correo": correo, "password": CLAVE})
    assert respuesta.status_code == 200, respuesta.text


def _crear_caso(client: TestClient, correo: str, documento: str) -> str:
    _entrar(client, correo)
    paciente = client.post("/pacientes", json={**PACIENTE, "documento": documento})
    assert paciente.status_code == 201, paciente.text
    caso = client.post(f"/pacientes/{paciente.json()['id']}/casos")
    assert caso.status_code == 201, caso.text
    client.post("/auth/logout")
    return caso.json()["id"]


def _modelo(db, nombre: str, version: str = "1.0.0") -> ModeloIA:
    modelo = ModeloIA(
        nombre=nombre,
        version=version,
        hash_pesos=uuid.uuid4().hex * 2,
        activo=True,
    )
    db.add(modelo)
    db.commit()
    db.refresh(modelo)
    return modelo


def _inferencia(
    db,
    caso_id: str,
    modelo: ModeloIA,
    *,
    resultado: str = "benigno",
    creado_en: datetime | None = None,
    decision: str | None = None,
    autor_id: uuid.UUID,
) -> Inferencia:
    imagen = Imagen(
        caso_id=uuid.UUID(caso_id),
        ruta_s3=f"casos/x/imagenes/{uuid.uuid4().hex}.png",
        hash_sha256=uuid.uuid4().hex * 2,
    )
    db.add(imagen)
    db.commit()
    inferencia = Inferencia(
        imagen_id=imagen.id,
        modelo_ia_id=modelo.id,
        resultado=resultado,
        confianza=0.87,
        creado_en=creado_en or datetime.now(UTC),
    )
    db.add(inferencia)
    db.commit()
    db.refresh(inferencia)
    if decision is not None:
        db.add(
            DecisionMedica(
                inferencia_id=inferencia.id,
                usuario_id=autor_id,
                decision=decision,
            )
        )
        db.commit()
    return inferencia


def _consultar(client: TestClient, params: dict[str, Any] | None = None):
    return client.get("/investigacion/metricas", params=params or {})


def test_agrega_acuerdo_pendientes_y_desglose_por_resultado(client, mundo, db_session) -> None:
    caso_id = _crear_caso(client, mundo["medico"].email, "0601234567")
    modelo = _modelo(db_session, "Swin")
    modelo_vacio = _modelo(db_session, "ConvNeXt")
    _inferencia(
        db_session,
        caso_id,
        modelo,
        resultado="benigno",
        decision="acepta",
        autor_id=mundo["medico"].id,
    )
    _inferencia(
        db_session,
        caso_id,
        modelo,
        resultado="maligno",
        decision="corrige",
        autor_id=mundo["medico"].id,
    )
    _inferencia(
        db_session,
        caso_id,
        modelo,
        resultado="sin_nodulo",
        decision="descarta",
        autor_id=mundo["medico"].id,
    )
    _inferencia(
        db_session,
        caso_id,
        modelo,
        resultado="benigno",
        autor_id=mundo["medico"].id,
    )
    _entrar(client, mundo["investigador"].email)

    respuesta = _consultar(client)

    assert respuesta.status_code == 200, respuesta.text
    por_id = {fila["modelo"]["id"]: fila for fila in respuesta.json()}
    agregado = por_id[str(modelo.id)]
    assert agregado["modelo"] == {
        "id": str(modelo.id),
        "nombre": "Swin",
        "version": "1.0.0",
        "hash_pesos": modelo.hash_pesos,
    }
    assert agregado["total"] == 4
    assert agregado["acepta"] == 1
    assert agregado["corrige"] == 1
    assert agregado["descarta"] == 1
    assert agregado["pendiente"] == 1
    assert agregado["acuerdo"] == 0.25
    por_resultado = {fila["resultado"]: fila for fila in agregado["por_resultado"]}
    assert por_resultado["benigno"] == {
        "resultado": "benigno",
        "total": 2,
        "acepta": 1,
        "corrige": 0,
        "descarta": 0,
        "pendiente": 1,
    }
    assert por_resultado["maligno"]["corrige"] == 1
    assert por_resultado["sin_nodulo"]["descarta"] == 1
    assert por_id[str(modelo_vacio.id)]["total"] == 0
    assert por_id[str(modelo_vacio.id)]["acuerdo"] is None


def test_filtra_por_fecha_y_modelo(client, mundo, db_session) -> None:
    caso_id = _crear_caso(client, mundo["medico"].email, "0601234567")
    modelo = _modelo(db_session, "Swin")
    otro_modelo = _modelo(db_session, "ConvNeXt")
    _inferencia(
        db_session,
        caso_id,
        modelo,
        creado_en=datetime(2026, 1, 10, 12, tzinfo=UTC),
        decision="acepta",
        autor_id=mundo["medico"].id,
    )
    _inferencia(
        db_session,
        caso_id,
        modelo,
        creado_en=datetime(2026, 2, 10, 12, tzinfo=UTC),
        autor_id=mundo["medico"].id,
    )
    _inferencia(
        db_session,
        caso_id,
        otro_modelo,
        creado_en=datetime(2026, 1, 20, 12, tzinfo=UTC),
        autor_id=mundo["medico"].id,
    )
    _entrar(client, mundo["investigador"].email)

    respuesta = _consultar(
        client,
        {"desde": "2026-01-01", "hasta": "2026-01-31", "modelo": str(modelo.id)},
    )

    assert respuesta.status_code == 200, respuesta.text
    filas = respuesta.json()
    assert len(filas) == 1
    assert filas[0]["modelo"]["id"] == str(modelo.id)
    assert filas[0]["total"] == 1
    assert filas[0]["acepta"] == 1


def test_aisla_las_inferencias_por_institucion(client, mundo, db_session) -> None:
    caso_ajeno = _crear_caso(client, mundo["medico_solca"].email, "0601234568")
    modelo = _modelo(db_session, "Swin")
    _inferencia(
        db_session,
        caso_ajeno,
        modelo,
        decision="acepta",
        autor_id=mundo["medico_solca"].id,
    )
    _entrar(client, mundo["investigador"].email)

    respuesta = _consultar(client)

    assert respuesta.status_code == 200
    fila = next(item for item in respuesta.json() if item["modelo"]["id"] == str(modelo.id))
    assert fila["total"] == 0
    assert fila["acuerdo"] is None


def test_exige_permiso_de_investigacion(client, mundo) -> None:
    _entrar(client, mundo["medico"].email)

    respuesta = _consultar(client)

    assert respuesta.status_code == 403
    assert respuesta.json()["error"]["code"] == "forbidden"
