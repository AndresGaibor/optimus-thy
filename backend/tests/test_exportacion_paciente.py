"""Exportación de los datos personales y resultados de un paciente (TES-364)."""

from __future__ import annotations

import csv
import io
import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text

from app.models.auditoria import Auditoria
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


def _usuario(db, institucion, correo: str, rol: Rol) -> str:
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
    return correo


@pytest.fixture()
def mundo(db_session):
    propia = Institucion(nombre="ESPOCH", codigo="ESPOCH")
    ajena = Institucion(nombre="SOLCA", codigo="SOLCA")
    db_session.add_all([propia, ajena])
    db_session.commit()
    doctor = Rol(nombre="doctor", descripcion="doctor")
    lector = Rol(nombre="lector", descripcion="sin acceso a pacientes")
    db_session.add_all([doctor, lector])
    db_session.commit()
    return {
        "propia": propia,
        "ajena": ajena,
        "medico": _usuario(db_session, propia, "medico@t.com", doctor),
        "lector": _usuario(db_session, propia, "lector@t.com", lector),
        "medico_ajeno": _usuario(db_session, ajena, "solca@t.com", doctor),
    }


def _entrar(client: TestClient, correo: str) -> None:
    respuesta = client.post("/auth/login", json={"correo": correo, "password": CLAVE})
    assert respuesta.status_code == 200, respuesta.text


def _paciente_y_caso(client: TestClient, documento: str = PACIENTE["documento"]) -> tuple[str, str]:
    paciente = client.post("/pacientes", json={**PACIENTE, "documento": documento})
    assert paciente.status_code == 201, paciente.text
    paciente_id = paciente.json()["id"]
    caso = client.post(f"/pacientes/{paciente_id}/casos")
    assert caso.status_code == 201, caso.text
    return paciente_id, caso.json()["id"]


def _inferencia(db, caso_id: str, modelo_nombre: str, resultado: str) -> Inferencia:
    imagen = Imagen(
        caso_id=uuid.UUID(caso_id),
        ruta_s3="privado/eco.png",
        hash_sha256="a" * 64,
    )
    db.add(imagen)
    db.commit()
    modelo = ModeloIA(
        nombre=modelo_nombre,
        version=uuid.uuid4().hex[:8],
        hash_pesos="b" * 64,
        activo=True,
    )
    db.add(modelo)
    db.commit()
    inferencia = Inferencia(
        imagen_id=imagen.id,
        modelo_ia_id=modelo.id,
        resultado=resultado,
        confianza=0.91,
        tiempo_ms=100,
        ancho=128,
        alto=128,
        version_contrato="1.1",
        huella_modelos="c" * 64,
        umbrales={},
    )
    db.add(inferencia)
    db.commit()
    db.refresh(inferencia)
    return inferencia


def test_exporta_json_con_dos_inferencias_sin_datos_de_almacenamiento(
    client, mundo, db_session
) -> None:
    _entrar(client, mundo["medico"])
    paciente_id, caso_id = _paciente_y_caso(client)
    primera = _inferencia(db_session, caso_id, "Ecografía clínica", "benigno")
    segunda = _inferencia(db_session, caso_id, "Ecografía clínica", "maligno")
    db_session.add(
        DecisionMedica(
            inferencia_id=primera.id,
            usuario_id=(
                db_session.query(Usuario).filter(Usuario.email == mundo["medico"]).one().id
            ),
            decision="acepta",
        )
    )
    db_session.commit()

    respuesta = client.get(f"/pacientes/{paciente_id}/exportacion", params={"formato": "json"})

    assert respuesta.status_code == 200
    nombre = respuesta.json()["paciente"]["seudonimo"]
    assert respuesta.headers["content-disposition"] == (
        f'attachment; filename="datos-{nombre}.json"'
    )
    datos = respuesta.json()
    identidad = datos["paciente"]
    assert set(identidad) == {
        "seudonimo",
        "nombres",
        "apellidos",
        "documento",
        "fecha_nacimiento",
    }
    assert identidad["nombres"] == PACIENTE["nombres"]
    assert identidad["apellidos"] == PACIENTE["apellidos"]
    assert identidad["documento"] == PACIENTE["documento"]
    assert identidad["fecha_nacimiento"] == PACIENTE["fecha_nacimiento"]
    documento_cifrado = db_session.execute(
        text("SELECT documento_cifrado FROM identidades_paciente WHERE paciente_id = :paciente_id"),
        {"paciente_id": uuid.UUID(paciente_id)},
    ).scalar_one()
    assert documento_cifrado != identidad["documento"]
    assert len(datos["casos"][0]["inferencias"]) == 2
    filas = datos["casos"][0]["inferencias"]
    assert {fila["resultado"] for fila in filas} == {"benigno", "maligno"}
    assert {fila["version_contrato"] for fila in filas} == {"1.1"}
    decision = next(fila for fila in filas if fila["resultado"] == "benigno")["decision"]
    assert decision == "acepta"
    contenido = respuesta.text
    for reservado in ("ruta_s3", "privado/eco.png", "hash_sha256", "huella_modelos"):
        assert reservado not in contenido
    assert str(segunda.id) not in contenido


def test_exporta_csv_con_bom_tildes_y_una_fila_por_inferencia(client, mundo, db_session) -> None:
    _entrar(client, mundo["medico"])
    paciente_id, caso_id = _paciente_y_caso(client)
    _inferencia(db_session, caso_id, "Ecografía clínica", "benigno")
    _inferencia(db_session, caso_id, "Ecografía clínica", "maligno")

    respuesta = client.get(f"/pacientes/{paciente_id}/exportacion", params={"formato": "csv"})

    assert respuesta.status_code == 200
    assert respuesta.content.startswith(b"\xef\xbb\xbf")
    assert respuesta.headers["content-disposition"].endswith('.csv"')
    filas = csv.DictReader(io.StringIO(respuesta.content.decode("utf-8-sig")))
    assert filas.fieldnames == [
        "seudonimo",
        "documento",
        "codigo_caso",
        "fecha_inferencia",
        "resultado",
        "confianza",
        "modelo",
        "decision",
    ]
    filas = list(filas)
    assert len(filas) == 2
    assert {fila["resultado"] for fila in filas} == {"benigno", "maligno"}
    assert all(fila["documento"] == PACIENTE["documento"] for fila in filas)
    assert all("Ecografía" in fila["modelo"] for fila in filas)


def test_exportacion_registra_evento_de_auditoria_con_numero_de_filas(
    client, mundo, db_session
) -> None:
    _entrar(client, mundo["medico"])
    paciente_id, caso_id = _paciente_y_caso(client)
    _inferencia(db_session, caso_id, "Nodo", "benigno")

    respuesta = client.get(f"/pacientes/{paciente_id}/exportacion", params={"formato": "json"})

    assert respuesta.status_code == 200
    evento = db_session.query(Auditoria).filter(Auditoria.accion == "EXPORT.EXPORT").one()
    assert evento.entidad == "PATIENT"
    assert evento.detalles == {"format": "json", "resource_count": 1, "role_code": "doctor"}


def test_exportacion_exige_paciente_leer(client, mundo) -> None:
    _entrar(client, mundo["lector"])

    respuesta = client.get(f"/pacientes/{uuid.uuid4()}/exportacion")

    assert respuesta.status_code == 403


def test_no_exporta_un_paciente_de_otra_institucion(client, mundo) -> None:
    _entrar(client, mundo["medico_ajeno"])
    paciente_id, _ = _paciente_y_caso(client, documento="0609876543")
    _entrar(client, mundo["medico"])

    respuesta = client.get(f"/pacientes/{paciente_id}/exportacion")

    assert respuesta.status_code == 404
    assert respuesta.json()["error"] == {"code": "not_found", "message": "No encontrado"}


def test_csv_incluye_fila_para_caso_sin_inferencias(client, mundo, db_session) -> None:
    _entrar(client, mundo["medico"])
    paciente_id, _ = _paciente_y_caso(client)

    respuesta = client.get(f"/pacientes/{paciente_id}/exportacion", params={"formato": "csv"})

    assert respuesta.status_code == 200
    filas = list(csv.DictReader(io.StringIO(respuesta.content.decode("utf-8-sig"))))
    assert len(filas) == 1
    evento = db_session.query(Auditoria).filter(Auditoria.accion == "EXPORT.EXPORT").one()
    assert evento.detalles["resource_count"] == 0
    assert filas[0]["seudonimo"]
    assert filas[0]["codigo_caso"]
    assert filas[0]["fecha_inferencia"] == ""
    assert filas[0]["resultado"] == ""
