"""Pruebas de administración de usuarios."""

from __future__ import annotations

import os

import pytest
from fastapi.testclient import TestClient

from app.models import *  # noqa: F403
from app.security.passwords import hash_password


def _skip_if_no_db():
    if not os.environ.get("TEST_DATABASE_URL"):
        pytest.skip("TEST_DATABASE_URL no definida")


def test_admin_crea_usuario_y_listado_lo_devuelve(db_session, client: TestClient):
    _skip_if_no_db()
    from app.models.instituciones import Institucion
    from app.models.usuarios import Rol, Usuario, UsuarioRol

    inst = Institucion(nombre="Hospital Central", codigo="hosp_central")
    db_session.add(inst)
    db_session.commit()
    db_session.refresh(inst)

    rol_admin = Rol(nombre="admin", descripcion="Admin")
    rol_doctor = Rol(nombre="doctor", descripcion="Doctor")
    db_session.add_all([rol_admin, rol_doctor])
    db_session.commit()
    db_session.refresh(rol_admin)
    db_session.refresh(rol_doctor)

    admin = Usuario(
        institucion_id=inst.id,
        email="admin@test.com",
        password_hash=hash_password("admin@test.com", "adminpass123"),
        nombre="Admin",
        activo=True,
    )
    db_session.add(admin)
    db_session.commit()
    db_session.refresh(admin)
    db_session.add(UsuarioRol(usuario_id=admin.id, rol_id=rol_admin.id))
    db_session.commit()

    rlogin = client.post(
        "/auth/login", json={"correo": "admin@test.com", "password": "adminpass123"}
    )
    assert rlogin.status_code == 200

    resp = client.post(
        "/usuarios",
        json={
            "correo": "nuevo@hosp.com",
            "nombre": "Nuevo Usuario",
            "institucion_id": str(inst.id),
            "roles": ["doctor"],
            "password": "pass1234567890",
        },
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["correo"] == "nuevo@hosp.com"
    assert data["roles"] == ["doctor"]

    lista = client.get("/usuarios")
    assert lista.status_code == 200
    ldata = lista.json()
    assert ldata["total"] >= 1
    correos = [item["correo"] for item in ldata["items"]]
    assert "nuevo@hosp.com" in correos


def test_correo_duplicado_409(db_session, client: TestClient):
    _skip_if_no_db()
    from app.models.instituciones import Institucion
    from app.models.usuarios import Rol, Usuario, UsuarioRol

    inst = Institucion(nombre="Inst1", codigo="inst1")
    db_session.add(inst)
    db_session.commit()
    db_session.refresh(inst)

    rol_admin = Rol(nombre="admin", descripcion="Admin")
    rol_doctor = Rol(nombre="doctor", descripcion="Doctor")
    db_session.add_all([rol_admin, rol_doctor])
    db_session.commit()

    admin = Usuario(
        institucion_id=inst.id,
        email="admin2@test.com",
        password_hash=hash_password("admin2@test.com", "pass12345"),
        nombre="Admin",
        activo=True,
    )
    db_session.add(admin)
    db_session.commit()
    db_session.add(UsuarioRol(usuario_id=admin.id, rol_id=rol_admin.id))
    db_session.commit()

    client.post("/auth/login", json={"correo": "admin2@test.com", "password": "pass12345"})

    r1 = client.post(
        "/usuarios",
        json={
            "correo": "dup@hosp.com",
            "nombre": "Dup",
            "institucion_id": str(inst.id),
            "roles": ["doctor"],
            "password": "pass1234567890",
        },
    )
    assert r1.status_code == 201

    r2 = client.post(
        "/usuarios",
        json={
            "correo": "dup@hosp.com",
            "nombre": "Dup2",
            "institucion_id": str(inst.id),
            "roles": ["doctor"],
            "password": "pass1234567890",
        },
    )
    assert r2.status_code == 409
    assert r2.json().get("error", {}).get("code") == "conflict"


def test_doctor_recibe_403_en_todos_los_endpoints_de_gestion(db_session, client: TestClient):
    _skip_if_no_db()
    from app.models.instituciones import Institucion
    from app.models.usuarios import Rol, Usuario, UsuarioRol

    inst = Institucion(nombre="Inst2", codigo="inst2")
    db_session.add(inst)
    db_session.commit()
    db_session.refresh(inst)

    rol_admin = Rol(nombre="admin", descripcion="Admin")
    rol_doctor = Rol(nombre="doctor", descripcion="Doctor")
    db_session.add_all([rol_admin, rol_doctor])
    db_session.commit()

    doctor = Usuario(
        institucion_id=inst.id,
        email="doc@test.com",
        password_hash=hash_password("doc@test.com", "docpass123"),
        nombre="Doc",
        activo=True,
    )
    db_session.add(doctor)
    db_session.commit()
    db_session.add(UsuarioRol(usuario_id=doctor.id, rol_id=rol_doctor.id))
    db_session.commit()

    client.post("/auth/login", json={"correo": "doc@test.com", "password": "docpass123"})

    r1 = client.get("/usuarios")
    assert r1.status_code == 403
    r2 = client.post(
        "/usuarios",
        json={
            "correo": "x@y.com",
            "nombre": "X",
            "institucion_id": str(inst.id),
            "roles": ["doctor"],
            "password": "pass1234567890",
        },
    )
    assert r2.status_code == 403
    r3 = client.patch(f"/usuarios/{doctor.id}", json={"nombre": "X"})
    assert r3.status_code == 403
    r4 = client.put(f"/usuarios/{doctor.id}/roles", json={"roles": ["doctor"]})
    assert r4.status_code == 403


def test_desactivar_deja_activo_false_y_fila_sigue_existiendo(db_session, client: TestClient):
    _skip_if_no_db()
    from app.models.instituciones import Institucion
    from app.models.usuarios import Rol, Usuario, UsuarioRol

    inst = Institucion(nombre="Inst3", codigo="inst3")
    db_session.add(inst)
    db_session.commit()
    db_session.refresh(inst)

    rol_admin = Rol(nombre="admin", descripcion="Admin")
    rol_doctor = Rol(nombre="doctor", descripcion="Doctor")
    db_session.add_all([rol_admin, rol_doctor])
    db_session.commit()

    admin = Usuario(
        institucion_id=inst.id,
        email="admin3@test.com",
        password_hash=hash_password("admin3@test.com", "pass12345"),
        nombre="Admin",
        activo=True,
    )
    db_session.add(admin)
    db_session.commit()
    db_session.add(UsuarioRol(usuario_id=admin.id, rol_id=rol_admin.id))

    user = Usuario(
        institucion_id=inst.id,
        email="todesactivar@test.com",
        password_hash=hash_password("todesactivar@test.com", "pass12345"),
        nombre="A Desactivar",
        activo=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.add(UsuarioRol(usuario_id=user.id, rol_id=rol_doctor.id))
    db_session.commit()

    client.post("/auth/login", json={"correo": "admin3@test.com", "password": "pass12345"})

    r = client.patch(f"/usuarios/{user.id}", json={"activo": False})
    assert r.status_code == 200

    db_session.expire_all()
    user_db = db_session.query(Usuario).filter(Usuario.id == user.id).first()
    assert user_db is not None
    assert user_db.activo is False


def test_un_admin_no_puede_desactivarse(db_session, client: TestClient):
    _skip_if_no_db()
    from app.models.instituciones import Institucion
    from app.models.usuarios import Rol, Usuario, UsuarioRol

    inst = Institucion(nombre="Inst4", codigo="inst4")
    db_session.add(inst)
    db_session.commit()
    db_session.refresh(inst)

    rol_admin = Rol(nombre="admin", descripcion="Admin")
    db_session.add(rol_admin)
    db_session.commit()

    admin = Usuario(
        institucion_id=inst.id,
        email="admin4@test.com",
        password_hash=hash_password("admin4@test.com", "pass12345"),
        nombre="Admin",
        activo=True,
    )
    db_session.add(admin)
    db_session.commit()
    db_session.add(UsuarioRol(usuario_id=admin.id, rol_id=rol_admin.id))
    db_session.commit()

    client.post("/auth/login", json={"correo": "admin4@test.com", "password": "pass12345"})

    r = client.patch(f"/usuarios/{admin.id}", json={"activo": False})
    assert r.status_code == 403
    assert r.json().get("error", {}).get("code") == "forbidden"


def test_roles_desconocidos_422(db_session, client: TestClient):
    _skip_if_no_db()
    from app.models.instituciones import Institucion
    from app.models.usuarios import Rol, Usuario, UsuarioRol

    inst = Institucion(nombre="Inst5", codigo="inst5")
    db_session.add(inst)
    db_session.commit()
    db_session.refresh(inst)

    rol_admin = Rol(nombre="admin", descripcion="Admin")
    db_session.add(rol_admin)
    db_session.commit()

    admin = Usuario(
        institucion_id=inst.id,
        email="admin5@test.com",
        password_hash=hash_password("admin5@test.com", "pass12345"),
        nombre="Admin",
        activo=True,
    )
    db_session.add(admin)
    db_session.commit()
    db_session.add(UsuarioRol(usuario_id=admin.id, rol_id=rol_admin.id))
    db_session.commit()

    client.post("/auth/login", json={"correo": "admin5@test.com", "password": "pass12345"})

    r = client.post(
        "/usuarios",
        json={
            "correo": "bad@role.com",
            "nombre": "Bad",
            "institucion_id": str(inst.id),
            "roles": ["noexiste"],
            "password": "pass1234567890",
        },
    )
    assert r.status_code == 422


def test_paginacion_respeta_limite_y_total(db_session, client: TestClient):
    _skip_if_no_db()
    from app.models.instituciones import Institucion
    from app.models.usuarios import Rol, Usuario, UsuarioRol

    inst = Institucion(nombre="Inst6", codigo="inst6")
    db_session.add(inst)
    db_session.commit()
    db_session.refresh(inst)

    rol_admin = Rol(nombre="admin", descripcion="Admin")
    rol_doctor = Rol(nombre="doctor", descripcion="Doctor")
    db_session.add_all([rol_admin, rol_doctor])
    db_session.commit()

    admin = Usuario(
        institucion_id=inst.id,
        email="admin6@test.com",
        password_hash=hash_password("admin6@test.com", "pass12345"),
        nombre="Admin",
        activo=True,
    )
    db_session.add(admin)
    db_session.commit()
    db_session.add(UsuarioRol(usuario_id=admin.id, rol_id=rol_admin.id))

    for i in range(5):
        u = Usuario(
            institucion_id=inst.id,
            email=f"user{i}@test.com",
            password_hash=hash_password(f"user{i}@test.com", "pass12345"),
            nombre=f"User{i}",
            activo=True,
        )
        db_session.add(u)
        db_session.commit()
        db_session.add(UsuarioRol(usuario_id=u.id, rol_id=rol_doctor.id))
    db_session.commit()

    client.post("/auth/login", json={"correo": "admin6@test.com", "password": "pass12345"})

    r = client.get("/usuarios?limite=2&desplazamiento=0")
    assert r.status_code == 200
    data = r.json()
    assert data["total"] >= 5
    assert len(data["items"]) == 2
