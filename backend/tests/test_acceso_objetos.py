"""Comprobaciones de acceso cruzado a objetos entre instituciones."""

from __future__ import annotations

import uuid
from datetime import date

import pytest
from fastapi.testclient import TestClient

from app.models import (
    Caso,
    Consentimiento,
    Documento,
    FichaClinica,
    Imagen,
    Inferencia,
    Institucion,
    ModeloIA,
    Paciente,
    Rol,
    SolicitudDerecho,
    Usuario,
    UsuarioRol,
)
from app.security.passwords import hash_password

CLAVE = "claveSegura-123"


def _crear_usuario(db_session, institucion: Institucion, correo: str, rol: Rol) -> Usuario:
    usuario = Usuario(
        institucion_id=institucion.id,
        email=correo,
        nombre=f"Usuario {correo}",
        password_hash=hash_password(correo, CLAVE),
        activo=True,
    )
    db_session.add(usuario)
    db_session.flush()
    db_session.add(UsuarioRol(usuario_id=usuario.id, rol_id=rol.id))
    db_session.flush()
    return usuario


@pytest.fixture()
def mundo(db_session):
    institucion_a = Institucion(nombre="Hospital Sintético A", codigo="SINT-A")
    institucion_b = Institucion(nombre="Hospital Sintético B", codigo="SINT-B")
    admin = Rol(nombre="admin", descripcion="Administración institucional")
    doctor = Rol(nombre="doctor", descripcion="Atención clínica")
    db_session.add_all([institucion_a, institucion_b, admin, doctor])
    db_session.flush()

    admin_a = _crear_usuario(db_session, institucion_a, "admin@sintetico.invalid", admin)
    doctor_b = _crear_usuario(db_session, institucion_b, "doctor@sintetico.invalid", doctor)

    paciente_a = Paciente(
        institucion_id=institucion_a.id,
        seudonimo=f"PAC-{uuid.uuid4().hex[:12]}",
    )
    paciente_b = Paciente(
        institucion_id=institucion_b.id,
        seudonimo=f"PAC-{uuid.uuid4().hex[:12]}",
    )
    db_session.add_all([paciente_a, paciente_b])
    db_session.flush()
    caso_a = Caso(
        institucion_id=institucion_a.id,
        paciente_id=paciente_a.id,
        codigo_caso=f"CASO-{uuid.uuid4().hex[:12]}",
    )
    caso_b = Caso(
        institucion_id=institucion_b.id,
        paciente_id=paciente_b.id,
        codigo_caso=f"CASO-{uuid.uuid4().hex[:12]}",
    )
    db_session.add_all([caso_a, caso_b])
    db_session.flush()
    db_session.add_all(
        [
            FichaClinica(caso_id=caso_a.id),
            Documento(
                caso_id=caso_a.id,
                nombre_original="archivo-sintetico.pdf",
                ruta_s3=f"sintetico/{uuid.uuid4().hex}.pdf",
                hash_sha256="a" * 64,
                version=1,
                tipo_mime="application/pdf",
            ),
            Consentimiento(
                caso_id=caso_a.id,
                base_legal="atencion_de_salud",
                version_texto="v1",
                otorgado_por_id=admin_a.id,
            ),
            Consentimiento(
                caso_id=caso_b.id,
                base_legal="atencion_de_salud",
                version_texto="v1",
                otorgado_por_id=doctor_b.id,
            ),
        ]
    )
    imagen_a = Imagen(
        caso_id=caso_a.id,
        ruta_s3=f"sintetico/{uuid.uuid4().hex}.png",
        hash_sha256="b" * 64,
    )
    imagen_b = Imagen(
        caso_id=caso_b.id,
        ruta_s3=f"sintetico/{uuid.uuid4().hex}.png",
        hash_sha256="c" * 64,
    )
    modelo = ModeloIA(nombre="Modelo sintético", version="1", hash_pesos="d" * 64, activo=True)
    db_session.add_all([imagen_a, imagen_b, modelo])
    db_session.flush()
    inferencia_a = Inferencia(
        imagen_id=imagen_a.id,
        modelo_ia_id=modelo.id,
        resultado="benigno",
        confianza=0.93,
        tiempo_ms=100,
        ancho=128,
        alto=128,
        version_contrato="1.1",
        huella_modelos="e" * 64,
        umbrales={"max_nodulos": 3},
    )
    solicitud_b = SolicitudDerecho(
        institucion_id=institucion_b.id,
        tipo="acceso",
        referencia_titular="TIT-SINTETICO-001",
        solicitada_en=date(2026, 11, 1),
        plazo_dias=15,
        estado="pendiente",
        responsable_id=doctor_b.id,
    )
    db_session.add_all([inferencia_a, solicitud_b])
    db_session.commit()

    return {
        "admin": admin_a,
        "doctor": doctor_b,
        "institucion_b": institucion_b,
        "paciente": paciente_a,
        "caso": caso_a,
        "imagen": imagen_a,
        "imagen_propia": imagen_b,
        "inferencia": inferencia_a,
        "solicitud": solicitud_b,
        "correo_ajeno": doctor_b.email,
        "archivo_ajeno": "archivo-sintetico.pdf",
    }


def _entrar(client: TestClient, usuario: Usuario) -> None:
    respuesta = client.post("/auth/login", json={"correo": usuario.email, "password": CLAVE})
    assert respuesta.status_code == 200, respuesta.text


RECURSOS = (
    "paciente",
    "caso",
    "ficha",
    "imagen",
    "inferencia",
    "solicitud",
    "usuario",
)


@pytest.mark.parametrize("recurso", RECURSOS)
def test_objeto_de_otra_institucion_no_se_expone(client, mundo, recurso: str) -> None:
    actor = mundo["admin"] if recurso in {"solicitud", "usuario"} else mundo["doctor"]
    _entrar(client, actor)

    if recurso == "paciente":
        respuesta = client.get(f"/pacientes/{mundo['paciente'].id}")
    elif recurso == "caso":
        respuesta = client.get(f"/casos/{mundo['caso'].id}")
    elif recurso == "ficha":
        respuesta = client.get(f"/casos/{mundo['caso'].id}/ficha")
    elif recurso == "imagen":
        respuesta = client.get(f"/casos/{mundo['caso'].id}/imagenes")
    elif recurso == "inferencia":
        respuesta = client.get(
            f"/casos/{mundo['caso'].id}/inferencias/{mundo['inferencia'].id}/reporte.pdf"
        )
    elif recurso == "solicitud":
        respuesta = client.patch(
            f"/administrador/solicitudes-derechos/{mundo['solicitud'].id}",
            json={"estado": "atendida", "respuesta": "Respuesta sintética de prueba."},
        )
    else:
        respuesta = client.patch(
            f"/usuarios/{mundo['doctor'].id}", json={"nombre": "Cambio no autorizado"}
        )

    assert respuesta.status_code in {403, 404}, respuesta.text
    assert str(mundo["caso"].id) not in respuesta.text
    assert str(mundo["inferencia"].id) not in respuesta.text
    assert str(mundo["solicitud"].id) not in respuesta.text
    assert mundo["correo_ajeno"] not in respuesta.text
    assert mundo["archivo_ajeno"] not in respuesta.text


def test_id_de_imagen_en_el_cuerpo_no_permite_encolar_inferencia(client, mundo) -> None:
    _entrar(client, mundo["doctor"])
    propia = client.post(
        "/trabajos",
        json={"tipo": "inferencia", "payload": {"imagen_id": str(mundo["imagen_propia"].id)}},
    )
    assert propia.status_code == 202, propia.text

    ajena = client.post(
        "/trabajos",
        json={"tipo": "inferencia", "payload": {"imagen_id": str(mundo["imagen"].id)}},
    )

    assert ajena.status_code in {403, 404}, ajena.text
    assert str(mundo["imagen"].id) not in ajena.text


def test_listado_usuarios_no_revela_otra_institucion(client, mundo) -> None:
    _entrar(client, mundo["admin"])

    respuesta = client.get("/usuarios")

    assert respuesta.status_code == 200, respuesta.text
    assert mundo["correo_ajeno"] not in respuesta.text


def test_rol_de_usuario_ajeno_no_se_puede_cambiar(client, mundo) -> None:
    _entrar(client, mundo["admin"])

    respuesta = client.put(f"/usuarios/{mundo['doctor'].id}/roles", json={"roles": ["admin"]})

    assert respuesta.status_code in {403, 404}, respuesta.text
    assert mundo["correo_ajeno"] not in respuesta.text


def test_id_de_institucion_en_cuerpo_no_permite_crear_usuario_ajeno(client, mundo) -> None:
    _entrar(client, mundo["admin"])

    respuesta = client.post(
        "/usuarios",
        json={
            "correo": "nuevo@sintetico.invalid",
            "nombre": "Usuario Sintético",
            "institucion_id": str(mundo["institucion_b"].id),
            "roles": ["doctor"],
            "password": "clave-sintetica-de-prueba",
        },
    )

    assert respuesta.status_code in {403, 404}, respuesta.text
    assert "nuevo@sintetico.invalid" not in respuesta.text
