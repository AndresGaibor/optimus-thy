"""Validación de criterios de aceptación de HT/HU ya integradas.

Cada prueba cita la historia y el criterio del backlog que comprueba.
"""

from __future__ import annotations

import os
import time
from datetime import UTC, datetime, timedelta

import pytest
from alembic.autogenerate import compare_metadata
from alembic.migration import MigrationContext
from fastapi.testclient import TestClient

from app.db import Base
from app.models.auditoria import Auditoria
from app.models.instituciones import Institucion
from app.models.trabajos import Trabajo
from app.models.usuarios import Rol, Usuario, UsuarioRol
from app.security.passwords import hash_password

CLAVE = "claveSegura-123"


def _crear_usuario(db, inst, correo, roles, activo=True):
    usuario = Usuario(
        institucion_id=inst.id,
        email=correo,
        password_hash=hash_password(correo, CLAVE),
        nombre=correo.split("@")[0],
        activo=activo,
    )
    db.add(usuario)
    db.commit()
    db.refresh(usuario)
    for r in roles:
        db.add(UsuarioRol(usuario_id=usuario.id, rol_id=r.id))
    db.commit()
    return usuario


@pytest.fixture()
def escenario(db_session):
    """Institución, roles base y usuarios de cada rol."""
    inst = Institucion(nombre="Hospital Prueba", codigo="hosp_prueba")
    db_session.add(inst)
    db_session.commit()
    db_session.refresh(inst)
    roles = {n: Rol(nombre=n, descripcion=n) for n in ("admin", "doctor", "researcher")}
    db_session.add_all(roles.values())
    db_session.commit()
    for r in roles.values():
        db_session.refresh(r)
    return {
        "inst": inst,
        "roles": roles,
        "admin": _crear_usuario(db_session, inst, "admin@t.com", [roles["admin"]]),
        "medico": _crear_usuario(db_session, inst, "medico@t.com", [roles["doctor"]]),
        "multi": _crear_usuario(db_session, inst, "multi@t.com", [roles["admin"], roles["doctor"]]),
    }


def _login(client: TestClient, correo: str, password: str = CLAVE):
    return client.post("/auth/login", json={"correo": correo, "password": password})


def _acciones(db_session) -> list[str]:
    db_session.expire_all()
    return [a for (a,) in db_session.query(Auditoria.accion).order_by(Auditoria.id).all()]


# ---------------------------------------------------------------- HU-001 ----


def test_hu001_login_pone_una_sola_cookie_httponly_samesite(client, escenario):
    resp = _login(client, "admin@t.com")
    assert resp.status_code == 200
    cookies = resp.headers.get_list("set-cookie")
    assert len(cookies) == 1, cookies
    c = cookies[0].lower()
    assert "httponly" in c and "samesite=lax" in c and "max-age=" in c


def test_hu001_credenciales_incorrectas_no_revelan_cual_fallo(client, escenario):
    mala = _login(client, "admin@t.com", "otra-clave-xxxx")
    inexistente = _login(client, "nadie@t.com", "otra-clave-xxxx")
    assert mala.status_code == inexistente.status_code == 401
    assert mala.json()["error"] == inexistente.json()["error"]


def test_hu001_usuario_inexistente_tambien_paga_el_costo_del_hash(client, escenario):
    """Sin esto, el tiempo de respuesta revela si el correo existe."""
    _login(client, "admin@t.com", "otra-clave-xxxx")  # calienta
    t0 = time.perf_counter()
    _login(client, "admin@t.com", "otra-clave-xxxx")
    t_existente = time.perf_counter() - t0
    t0 = time.perf_counter()
    _login(client, "nadie@t.com", "otra-clave-xxxx")
    t_inexistente = time.perf_counter() - t0
    assert t_inexistente > t_existente * 0.5


def test_hu001_login_y_fallo_quedan_en_bitacora_sin_el_correo(client, db_session, escenario):
    _login(client, "admin@t.com", "otra-clave-xxxx")
    _login(client, "admin@t.com")
    acciones = _acciones(db_session)
    assert "AUTH.LOGIN_FAILED" in acciones
    assert "AUTH.SESSION_START" in acciones
    assert "admin@t.com" not in repr(db_session.query(Auditoria.detalles).all())


# ---------------------------------------------------------------- HU-002 ----


def test_hu002_logout_invalida_sesion_y_queda_en_bitacora(client, db_session, escenario):
    _login(client, "admin@t.com")
    assert client.get("/auth/me").status_code == 200
    assert client.post("/auth/logout").status_code == 204
    assert client.get("/auth/me").status_code == 401
    assert "AUTH.SESSION_END" in _acciones(db_session)


def test_hu002_respuestas_autenticadas_no_se_guardan_en_cache(client, escenario):
    """Al volver atrás con el botón del navegador no deben verse datos."""
    _login(client, "admin@t.com")
    for ruta in ("/auth/me", "/usuarios"):
        resp = client.get(ruta)
        assert resp.status_code == 200
        assert "no-store" in resp.headers.get("cache-control", "")


# ---------------------------------------------------------------- HU-003 ----


def test_hu003_el_servidor_aplica_el_rol_activo(client, escenario):
    _login(client, "multi@t.com")  # entra con el primer rol por nombre: admin
    assert client.get("/usuarios").status_code == 200
    assert client.put("/auth/rol-activo", json={"rol": "doctor"}).status_code == 200
    assert client.get("/usuarios").status_code == 403
    assert client.put("/auth/rol-activo", json={"rol": "admin"}).status_code == 200
    assert client.get("/usuarios").status_code == 200


def test_hu003_solo_ofrece_roles_asignados(client, escenario):
    _login(client, "multi@t.com")
    assert client.put("/auth/rol-activo", json={"rol": "researcher"}).status_code == 403


def test_hu003_cada_cambio_de_rol_queda_en_bitacora(client, db_session, escenario):
    _login(client, "multi@t.com")
    client.put("/auth/rol-activo", json={"rol": "doctor"})
    assert _acciones(db_session).count("AUTH.ROLE_SWITCH") == 1


def test_hu003_el_rol_inicial_es_determinista(client, escenario):
    for _ in range(3):
        assert _login(client, "multi@t.com").json()["rol_activo"] == "admin"


# ---------------------------------------------------------------- HU-010 ----


def test_hu010_cambios_de_usuarios_y_denegaciones_quedan_en_bitacora(client, db_session, escenario):
    inst = escenario["inst"]
    _login(client, "admin@t.com")
    creado = client.post(
        "/usuarios",
        json={
            "correo": "nuevo@t.com",
            "nombre": "Nuevo",
            "institucion_id": str(inst.id),
            "roles": ["doctor"],
            "password": CLAVE,
        },
    )
    assert creado.status_code == 201
    uid = creado.json()["id"]
    assert client.patch(f"/usuarios/{uid}", json={"activo": False}).status_code == 200
    assert client.put(f"/usuarios/{uid}/roles", json={"roles": ["researcher"]}).status_code == 200
    client.post("/auth/logout")
    _login(client, "medico@t.com")
    assert client.get("/usuarios").status_code == 403
    acciones = _acciones(db_session)
    for esperada in (
        "ADMIN.USER_CREATE",
        "ADMIN.USER_UPDATE",
        "ADMIN.USER_ROLE_CHANGE",
        "AUTH.ACCESS_DENIED",
    ):
        assert esperada in acciones, acciones


def test_hu010_crear_usuario_valida_correo_y_longitud_de_clave(client, escenario):
    inst = escenario["inst"]
    _login(client, "admin@t.com")
    base = {"nombre": "X", "institucion_id": str(inst.id), "roles": ["doctor"]}
    corto = client.post("/usuarios", json={**base, "correo": "a@t.com", "password": "corta"})
    assert corto.status_code == 422
    sin_arroba = client.post(
        "/usuarios", json={**base, "correo": "no-es-correo", "password": CLAVE}
    )
    assert sin_arroba.status_code == 422


# ---------------------------------------------------------------- HT-010 ----


def _trabajo_via_api(client, tipo="ocr"):
    resp = client.post("/trabajos", json={"tipo": tipo, "payload": {"caso": 1}})
    assert resp.status_code == 202, resp.text
    return resp.json()["id"]


def test_ht010_un_usuario_no_ve_trabajos_ajenos(client, escenario):
    _login(client, "medico@t.com")
    tid = _trabajo_via_api(client)
    assert client.get(f"/trabajos/{tid}").status_code == 200
    client.post("/auth/logout")
    _login(client, "multi@t.com")
    client.put("/auth/rol-activo", json={"rol": "doctor"})
    assert client.get(f"/trabajos/{tid}").status_code == 404


def test_ht010_el_error_al_cliente_no_expone_detalles_internos(client, db_session, escenario):
    from app.jobs.worker import procesar_una

    _login(client, "medico@t.com")
    tid = _trabajo_via_api(client)

    def roto(_t):
        raise RuntimeError("psycopg.OperationalError: host=10.0.0.5 /srv/secreto/ruta.py")

    for _ in range(3):
        db_session.execute(
            Trabajo.__table__.update().values(disponible_en=datetime.now(UTC) - timedelta(hours=1))
        )
        db_session.commit()
        procesar_una(db_session, {"ocr": roto})
    cuerpo = client.get(f"/trabajos/{tid}").json()
    assert cuerpo["estado"] == "error"
    assert "10.0.0.5" not in repr(cuerpo) and "/srv/" not in repr(cuerpo)


def test_ht010_trabajo_que_excede_su_tiempo_maximo_pasa_a_error(db_session, escenario):
    from app.jobs.queue import encolar, recuperar_vencidos, reservar_siguiente

    t = encolar(db_session, "ocr", {"x": 1}, max_intentos=1)
    t = reservar_siguiente(db_session)
    assert t is not None and t.estado == "en_proceso" and t.iniciado_en is not None
    t.iniciado_en = datetime.now(UTC) - timedelta(seconds=t.timeout_segundos + 5)
    db_session.commit()
    assert recuperar_vencidos(db_session) == 1
    db_session.refresh(t)
    assert t.estado == "error" and t.error_detalle == "tiempo_excedido"


def test_ht010_reintento_manual_solo_desde_error_y_solo_el_dueno(client, db_session, escenario):
    _login(client, "medico@t.com")
    tid = _trabajo_via_api(client)
    # En cola: no se puede reintentar.
    assert client.post(f"/trabajos/{tid}/reintentar").status_code == 409
    db_session.execute(Trabajo.__table__.update().values(estado="error", intentos=3))
    db_session.commit()
    resp = client.post(f"/trabajos/{tid}/reintentar")
    assert resp.status_code == 200 and resp.json()["estado"] == "en_cola"
    db_session.expire_all()
    assert db_session.query(Trabajo).one().intentos == 0


def test_ht010_un_fallo_no_tumba_el_worker_y_agota_reintentos(db_session, escenario):
    from app.jobs.queue import encolar
    from app.jobs.worker import procesar_una

    encolar(db_session, "ocr", {}, max_intentos=2)

    def roto(_t):
        raise RuntimeError("boom")

    for _ in range(2):
        db_session.execute(
            Trabajo.__table__.update().values(disponible_en=datetime.now(UTC) - timedelta(hours=1))
        )
        db_session.commit()
        procesar_una(db_session, {"ocr": roto})
    db_session.expire_all()
    assert db_session.query(Trabajo).one().estado == "error"


def test_ht010_tipo_de_trabajo_desconocido_se_rechaza(client, escenario):
    _login(client, "medico@t.com")
    resp = client.post("/trabajos", json={"tipo": "borrar_todo", "payload": {}})
    assert resp.status_code == 422


# ---------------------------------------------------------------- HT-006 ----


def test_ht006_el_esquema_de_la_base_coincide_con_los_modelos(test_engine):
    """Equivale a `alembic check`: ninguna diferencia modelo-migración."""
    with test_engine.connect() as conn:
        ctx = MigrationContext.configure(conn)
        diferencias = compare_metadata(ctx, Base.metadata)
    assert diferencias == [], diferencias


def test_ht006_la_migracion_de_base_siembra_roles_e_instituciones(test_engine):
    from alembic.config import Config

    from alembic import command

    cfg = Config(os.path.join(os.path.dirname(__file__), "..", "alembic.ini"))
    cfg.set_main_option("script_location", os.path.join(os.path.dirname(__file__), "..", "alembic"))
    cfg.set_main_option("sqlalchemy.url", test_engine.url.render_as_string(hide_password=False))
    command.downgrade(cfg, "0005")
    command.upgrade(cfg, "head")
    command.downgrade(cfg, "0005")
    command.upgrade(cfg, "head")  # idempotente
    with test_engine.connect() as conn:
        roles = {r[0] for r in conn.exec_driver_sql("select nombre from roles")}
        insts = {r[0] for r in conn.exec_driver_sql("select codigo from instituciones")}
    assert roles == {"admin", "doctor", "researcher"}
    assert {"ESPOCH", "SOLCA"} <= insts
