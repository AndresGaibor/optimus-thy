"""Pruebas de la matriz de roles y permisos (HU-011) y de su bitácora."""

from __future__ import annotations

import os

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.auditoria import Auditoria
from app.models.instituciones import Institucion
from app.models.usuarios import Permiso, Rol, RolPermiso, Usuario, UsuarioRol
from app.security.passwords import hash_password
from app.security.permisos import (
    PERMISO_IRRENUNCIABLE_ADMIN,
    PERMISOS,
    PERMISOS_POR_ROL,
    ROLES_BASE,
    asegurar_catalogo,
)

CLAVE_ADMIN = "adminpass123"
CORREO_ADMIN = "admin@hospital.test"


def _skip_if_no_db() -> None:
    if not os.environ.get("TEST_DATABASE_URL"):
        pytest.skip("TEST_DATABASE_URL no definida")


def test_la_matriz_por_defecto_solo_usa_permisos_del_catalogo() -> None:
    for codigos in PERMISOS_POR_ROL.values():
        assert set(codigos) <= set(PERMISOS)


def test_existen_los_tres_roles_base_con_matriz() -> None:
    assert set(ROLES_BASE) == {"admin", "doctor", "researcher"}
    assert set(PERMISOS_POR_ROL) == set(ROLES_BASE)


def test_el_administrador_no_tiene_permisos_clinicos() -> None:
    """Con solo el rol administrador no se ven datos clínicos (HU-012)."""
    clinicos = {
        codigo
        for codigo in PERMISOS
        if codigo.split(".", 1)[0]
        in {"paciente", "ficha", "documento", "imagen", "inferencia", "reporte"}
    }

    assert not (set(PERMISOS_POR_ROL["admin"]) & clinicos)


def test_el_medico_no_administra_roles_ni_usuarios() -> None:
    prohibidos = {"usuario.gestionar", "rol.gestionar", "ajustes.gestionar"}

    assert not (set(PERMISOS_POR_ROL["doctor"]) & prohibidos)


def _admin_logueado(db: Session, client: TestClient) -> tuple[Rol, Institucion]:
    """Siembra el catálogo, crea un administrador y abre su sesión."""
    asegurar_catalogo(db)
    db.commit()

    institucion = Institucion(nombre="Hospital Central", codigo="hosp_central")
    db.add(institucion)
    db.commit()

    rol_admin = db.query(Rol).filter(Rol.nombre == "admin").one()
    admin = Usuario(
        institucion_id=institucion.id,
        email=CORREO_ADMIN,
        password_hash=hash_password(CORREO_ADMIN, CLAVE_ADMIN),
        nombre="Admin",
        activo=True,
    )
    db.add(admin)
    db.commit()
    db.add(UsuarioRol(usuario_id=admin.id, rol_id=rol_admin.id))
    db.commit()

    login = client.post("/auth/login", json={"correo": CORREO_ADMIN, "password": CLAVE_ADMIN})
    assert login.status_code == 200
    return rol_admin, institucion


def test_la_matriz_muestra_roles_permisos_y_asignaciones(
    db_session: Session, client: TestClient
) -> None:
    _skip_if_no_db()
    _admin_logueado(db_session, client)

    respuesta = client.get("/roles")

    assert respuesta.status_code == 200
    datos = respuesta.json()
    assert {rol["nombre"] for rol in datos["roles"]} == {"admin", "doctor", "researcher"}
    assert {permiso["codigo"] for permiso in datos["permisos"]} == set(PERMISOS)
    doctor = next(rol for rol in datos["roles"] if rol["nombre"] == "doctor")
    assert doctor["permisos"] == sorted(PERMISOS_POR_ROL["doctor"])


def test_el_admin_edita_la_matriz_y_queda_en_la_bitacora(
    db_session: Session, client: TestClient
) -> None:
    _skip_if_no_db()
    _admin_logueado(db_session, client)
    investigador = db_session.query(Rol).filter(Rol.nombre == "researcher").one()

    respuesta = client.put(
        f"/roles/{investigador.id}/permisos",
        json={"permisos": ["investigacion.leer", "inferencia.leer"]},
    )

    assert respuesta.status_code == 200
    assert respuesta.json()["permisos"] == ["inferencia.leer", "investigacion.leer"]

    db_session.expire_all()
    asignados = (
        db_session.query(Permiso.codigo)
        .join(RolPermiso, RolPermiso.permiso_id == Permiso.id)
        .filter(RolPermiso.rol_id == investigador.id)
        .all()
    )
    assert {codigo for (codigo,) in asignados} == {"inferencia.leer", "investigacion.leer"}

    evento = (
        db_session.query(Auditoria)
        .filter(Auditoria.accion == "ADMIN.PERMISSION_CHANGE")
        .order_by(Auditoria.id.desc())
        .first()
    )
    assert evento is not None
    assert evento.entidad == "ROLE"
    assert evento.entidad_id == str(investigador.id)
    assert evento.detalles == {"role_code": "admin", "resource_count": 2}


def test_un_permiso_desconocido_no_cambia_nada(db_session: Session, client: TestClient) -> None:
    _skip_if_no_db()
    _admin_logueado(db_session, client)
    investigador = db_session.query(Rol).filter(Rol.nombre == "researcher").one()

    respuesta = client.put(
        f"/roles/{investigador.id}/permisos",
        json={"permisos": ["investigacion.leer", "permiso.inventado"]},
    )

    assert respuesta.status_code == 422
    assert respuesta.json()["error"]["code"] == "unprocessable_entity"
    db_session.expire_all()
    assert db_session.query(RolPermiso).filter(RolPermiso.rol_id == investigador.id).count() == len(
        PERMISOS_POR_ROL["researcher"]
    )


def test_el_admin_conserva_la_gestion_de_roles(db_session: Session, client: TestClient) -> None:
    _skip_if_no_db()
    rol_admin, _ = _admin_logueado(db_session, client)

    respuesta = client.put(
        f"/roles/{rol_admin.id}/permisos",
        json={"permisos": ["usuario.gestionar"]},
    )

    assert respuesta.status_code == 422
    db_session.expire_all()
    codigos = {
        codigo
        for (codigo,) in db_session.query(Permiso.codigo)
        .join(RolPermiso, RolPermiso.permiso_id == Permiso.id)
        .filter(RolPermiso.rol_id == rol_admin.id)
        .all()
    }
    assert PERMISO_IRRENUNCIABLE_ADMIN in codigos


def test_un_rol_inexistente_devuelve_404(db_session: Session, client: TestClient) -> None:
    _skip_if_no_db()
    _admin_logueado(db_session, client)

    respuesta = client.put(
        "/roles/00000000-0000-0000-0000-000000000000/permisos",
        json={"permisos": ["investigacion.leer"]},
    )

    assert respuesta.status_code == 404


def test_el_medico_no_puede_ver_la_matriz(db_session: Session, client: TestClient) -> None:
    _skip_if_no_db()
    asegurar_catalogo(db_session)
    institucion = Institucion(nombre="Hospital Norte", codigo="hosp_norte")
    db_session.add(institucion)
    db_session.commit()
    rol_doctor = db_session.query(Rol).filter(Rol.nombre == "doctor").one()
    doctor = Usuario(
        institucion_id=institucion.id,
        email="doctor@hospital.test",
        password_hash=hash_password("doctor@hospital.test", "docpass123"),
        nombre="Doctor",
        activo=True,
    )
    db_session.add(doctor)
    db_session.commit()
    db_session.add(UsuarioRol(usuario_id=doctor.id, rol_id=rol_doctor.id))
    db_session.commit()
    client.post("/auth/login", json={"correo": "doctor@hospital.test", "password": "docpass123"})

    assert client.get("/roles").status_code == 403
    assert client.put(f"/roles/{rol_doctor.id}/permisos", json={"permisos": []}).status_code == 403


def test_asegurar_catalogo_no_revierte_la_matriz_editada(db_session: Session) -> None:
    _skip_if_no_db()
    asegurar_catalogo(db_session)
    db_session.commit()
    investigador = db_session.query(Rol).filter(Rol.nombre == "researcher").one()
    db_session.query(RolPermiso).filter(RolPermiso.rol_id == investigador.id).delete()
    db_session.commit()

    asegurar_catalogo(db_session)
    db_session.commit()

    assert db_session.query(RolPermiso).filter(RolPermiso.rol_id == investigador.id).count() == 0


def test_el_alta_de_usuario_y_el_cambio_de_roles_quedan_en_la_bitacora(
    db_session: Session, client: TestClient
) -> None:
    _skip_if_no_db()
    _, institucion = _admin_logueado(db_session, client)

    alta = client.post(
        "/usuarios",
        json={
            "correo": "nuevo@hospital.test",
            "nombre": "Nuevo",
            "institucion_id": str(institucion.id),
            "roles": ["doctor"],
            "password": "temporal12345",
        },
    )
    assert alta.status_code == 201
    usuario_id = alta.json()["id"]

    cambio = client.put(f"/usuarios/{usuario_id}/roles", json={"roles": ["doctor", "researcher"]})
    assert cambio.status_code == 200
    assert cambio.json()["roles"] == ["doctor", "researcher"]

    db_session.expire_all()
    eventos = (
        db_session.query(Auditoria)
        .filter(Auditoria.entidad == "USER", Auditoria.entidad_id == usuario_id)
        .order_by(Auditoria.id.asc())
        .all()
    )
    assert [evento.accion for evento in eventos] == [
        "ADMIN.USER_CREATE",
        "ADMIN.USER_ROLE_CHANGE",
    ]
    assert eventos[0].detalles == {"role_code": "admin"}
    assert eventos[1].detalles == {"resource_count": 2, "role_code": "admin"}


def test_asegurar_catalogo_es_idempotente(db_session: Session) -> None:
    _skip_if_no_db()
    asegurar_catalogo(db_session)
    db_session.commit()
    conteo_permisos = db_session.query(Permiso).count()
    conteo_roles = db_session.query(Rol).count()
    conteo_matriz = db_session.query(RolPermiso).count()

    asegurar_catalogo(db_session)
    db_session.commit()

    assert db_session.query(Permiso).count() == conteo_permisos
    assert db_session.query(Rol).count() == conteo_roles
    assert db_session.query(RolPermiso).count() == conteo_matriz
