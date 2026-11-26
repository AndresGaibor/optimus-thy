"""Cohortes reutilizables y métricas filtradas por cohortes."""

from __future__ import annotations

import uuid
from datetime import UTC, date, datetime
from decimal import Decimal

import pytest
from fastapi.testclient import TestClient

from app.models.consentimientos import Consentimiento
from app.models.fichas import Caso, FichaClinica
from app.models.imagenes import Imagen, Inferencia, ModeloIA
from app.models.instituciones import Institucion
from app.models.pacientes import IdentidadPaciente, Paciente
from app.models.usuarios import Rol, Usuario, UsuarioRol
from app.security.passwords import hash_password

CLAVE = "claveSegura-123"


def _usuario(db, institucion: Institucion, correo: str, rol: Rol) -> str:
    usuario = Usuario(
        email=correo,
        nombre=correo,
        institucion_id=institucion.id,
        password_hash=hash_password(correo, CLAVE),
        activo=True,
    )
    db.add(usuario)
    db.flush()
    db.add(UsuarioRol(usuario_id=usuario.id, rol_id=rol.id))
    return correo


@pytest.fixture()
def mundo(db_session):
    institucion = Institucion(nombre="Hospital Investigación", codigo="INV")
    otra = Institucion(nombre="Hospital Ajeno", codigo="AJENO")
    db_session.add_all([institucion, otra])
    investigador = Rol(nombre="researcher", descripcion="investigador")
    db_session.add(investigador)
    db_session.flush()
    otro_email = _usuario(db_session, otra, "otro@t.com", investigador)
    investigador_email = _usuario(db_session, institucion, "inv@t.com", investigador)
    db_session.commit()
    return {
        "institucion": institucion,
        "otra": otra,
        "investigador": investigador_email,
        "otro": otro_email,
    }


def _entrar(client: TestClient, correo: str) -> None:
    respuesta = client.post("/auth/login", json={"correo": correo, "password": CLAVE})
    assert respuesta.status_code == 200, respuesta.text


def _caso(db, institucion: Institucion, indice: int, tirads: str) -> Caso:
    paciente = Paciente(institucion_id=institucion.id, seudonimo=f"PAC-COHORTE-{uuid.uuid4().hex}")
    db.add(paciente)
    db.flush()
    identidad = IdentidadPaciente(
        paciente_id=paciente.id,
        nombres_cifrados="Nombres",
        apellidos_cifrados="Apellidos",
        documento_cifrado=f"DOC-{uuid.uuid4().hex}",
        fecha_nacimiento_cifrada=date(1980 + indice, 5, 17).isoformat(),
        clave_version="v1",
    )
    db.add(identidad)
    caso = Caso(
        institucion_id=institucion.id,
        paciente_id=paciente.id,
        codigo_caso=f"CASO-COHORTE-{indice}",
        creado_en=datetime(2025, 6, 15, 12, 0, tzinfo=UTC),
    )
    db.add(caso)
    db.flush()
    db.add_all(
        [
            FichaClinica(
                caso_id=caso.id,
                tsh=Decimal("1.2"),
                tsh_unidad="mIU/L",
                tamano_nodulo_mm=Decimal("12.50"),
                lateralidad="derecho",
                tirads=tirads,
                bethesda="V",
                tipo_diagnostico="confirmado",
                tipo_consulta="consulta",
            ),
            Consentimiento(
                caso_id=caso.id, base_legal="investigacion_con_anonimizacion", version_texto="v1"
            ),
        ]
    )
    db.flush()
    return caso


def _crear(client: TestClient, nombre: str = "Cohorte tiroidea", filtros: dict | None = None):
    return client.post("/cohortes", json={"nombre": nombre, "filtros": filtros or {}})


def test_crear_y_listar_cohorte(client, mundo, db_session) -> None:
    _caso(db_session, mundo["institucion"], 1, "4")
    _caso(db_session, mundo["institucion"], 2, "5")
    db_session.commit()
    _entrar(client, mundo["investigador"])

    creada = _crear(client, filtros={"tirads": "4"})
    assert creada.status_code == 201
    assert creada.json()["total_casos"] == 1
    listado = client.get("/cohortes")
    assert listado.status_code == 200
    assert listado.json()["items"][0]["filtros"] == {"tirads": "4"}


def test_nombre_duplicado_devuelve_409(client, mundo) -> None:
    _entrar(client, mundo["investigador"])
    assert _crear(client, "Tiroides").status_code == 201
    duplicada = _crear(client, " tiroides ")
    assert duplicada.status_code == 409
    assert duplicada.json()["error"]["code"] == "cohorte_duplicada"


def test_filtros_desconocidos_devuelven_422(client, mundo) -> None:
    _entrar(client, mundo["investigador"])
    respuesta = _crear(client, filtros={"sexo": "femenino"})
    assert respuesta.status_code == 422
    assert respuesta.json()["error"]["code"] == "filtro_invalido"


def test_metricas_aplican_filtros_guardados_de_la_cohorte(client, mundo, db_session) -> None:
    caso_4 = _caso(db_session, mundo["institucion"], 1, "4")
    caso_5 = _caso(db_session, mundo["institucion"], 2, "5")
    modelo = ModeloIA(nombre="Modelo cohorte", version="1.0.0", hash_pesos=uuid.uuid4().hex * 2)
    db_session.add(modelo)
    db_session.flush()
    for caso in (caso_4, caso_5):
        imagen = Imagen(
            caso_id=caso.id,
            ruta_s3=f"{uuid.uuid4()}.dcm",
            hash_sha256=uuid.uuid4().hex * 2,
        )
        db_session.add(imagen)
        db_session.flush()
        db_session.add(
            Inferencia(
                imagen_id=imagen.id,
                modelo_ia_id=modelo.id,
                resultado="benigno",
                confianza=0.9,
            )
        )
    db_session.flush()
    db_session.commit()
    _entrar(client, mundo["investigador"])
    creada = _crear(client, filtros={"tirads": "4"})
    assert creada.status_code == 201

    respuesta = client.get("/investigacion/metricas", params={"cohorte_id": creada.json()["id"]})
    assert respuesta.status_code == 200
    filas = {item["modelo"]["id"]: item for item in respuesta.json()}
    assert filas[str(modelo.id)]["total"] == 1
    assert filas[str(modelo.id)]["por_resultado"][0]["total"] == 1


def test_cohorte_de_otra_institucion_es_404(client, mundo, db_session) -> None:
    _entrar(client, mundo["investigador"])
    creada = _crear(client)
    assert creada.status_code == 201
    _entrar(client, mundo["otro"])
    assert client.delete(f"/cohortes/{creada.json()['id']}").status_code == 404
    assert (
        client.get(
            "/investigacion/metricas", params={"cohorte_id": creada.json()["id"]}
        ).status_code
        == 404
    )


def test_borrar_cohorte(client, mundo) -> None:
    _entrar(client, mundo["investigador"])
    creada = _crear(client)
    assert creada.status_code == 201
    borrada = client.delete(f"/cohortes/{creada.json()['id']}")
    assert borrada.status_code == 204
    assert client.get("/cohortes").json()["items"] == []
