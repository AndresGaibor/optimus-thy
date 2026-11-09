"""HU-013: cada operación exige el permiso del rol activo y las denegaciones se auditan."""

from __future__ import annotations

import os
import uuid

import pytest
from fastapi.routing import APIRoute
from fastapi.testclient import TestClient

from app.auth.deps import sesion_actual
from app.main import create_app
from app.models.auditoria import Auditoria
from app.models.instituciones import Institucion
from app.models.usuarios import Rol, Usuario, UsuarioRol
from app.security.passwords import hash_password
from app.security.permisos import PERMISOS, PERMISOS_POR_ROL

MATRIZ = {rol: frozenset(codigos) for rol, codigos in PERMISOS_POR_ROL.items()}
CLAVE = "claveSegura-123"
# Rutas sin sesión a propósito: salud, y las que crean o cierran la sesión.
PUBLICAS = {"/health", "/auth/login", "/auth/logout"}
# Basta una sesión válida: actúan sobre la propia sesión, no sobre datos.
SOLO_SESION = {"/auth/me", "/auth/rol-activo"}


def _dependencias(dependant):
    for sub in dependant.dependencies:
        yield sub.call
        yield from _dependencias(sub)


def _rutas() -> list[APIRoute]:
    """Rutas de la app; los routers incluidos (`_IncludedRouter`) se abren uno a uno."""
    encontradas: list[APIRoute] = []
    for r in create_app().routes:
        origen = getattr(r, "original_router", None)
        candidatas = origen.routes if origen is not None else [r]
        encontradas.extend(c for c in candidatas if isinstance(c, APIRoute))
    return encontradas


def _permiso_de(ruta: APIRoute) -> str | None:
    for llamada in _dependencias(ruta.dependant):
        permiso = getattr(llamada, "permiso", None)
        if permiso:
            return str(permiso)
    return None


def _con_sesion(ruta: APIRoute) -> bool:
    return any(c is sesion_actual for c in _dependencias(ruta.dependant))


RUTAS_PROTEGIDAS = [
    (m, r.path, _permiso_de(r))
    for r in _rutas()
    if r.path not in PUBLICAS | SOLO_SESION
    for m in sorted(r.methods - {"HEAD", "OPTIONS"})
]


def test_se_encuentran_las_rutas_de_la_api():
    """Si FastAPI cambia cómo guarda los routers, las pruebas de abajo quedarían vacías."""
    rutas = {r.path for r in _rutas()}
    assert {"/health", "/auth/login", "/usuarios", "/trabajos"} <= rutas
    assert len(RUTAS_PROTEGIDAS) >= 8


def test_ninguna_ruta_queda_sin_proteger():
    sin_proteger = [
        f"{r.path}"
        for r in _rutas()
        if r.path not in PUBLICAS and not _con_sesion(r) and _permiso_de(r) is None
    ]
    assert sin_proteger == [], f"Rutas sin sesión ni permiso: {sin_proteger}"
    for r in _rutas():
        if r.path in SOLO_SESION:
            assert _con_sesion(r)


def test_las_rutas_usan_permisos_del_catalogo():
    usados = {p for _m, _r, p in RUTAS_PROTEGIDAS}
    assert None not in usados
    # El catálogo trae también permisos clínicos de rutas que aún no existen.
    assert usados <= set(PERMISOS)


def test_la_matriz_solo_usa_permisos_del_catalogo():
    for rol, permisos in MATRIZ.items():
        assert permisos <= set(PERMISOS), rol


@pytest.fixture()
def usuarios_por_rol(db_session):
    inst = Institucion(nombre="Hospital Prueba", codigo="hosp_prueba")
    db_session.add(inst)
    db_session.commit()
    db_session.refresh(inst)
    creados = {}
    for nombre in MATRIZ:
        rol = Rol(nombre=nombre, descripcion=nombre)
        db_session.add(rol)
        db_session.commit()
        db_session.refresh(rol)
        correo = f"{nombre}@t.com"
        usuario = Usuario(
            email=correo,
            nombre=nombre,
            institucion_id=inst.id,
            activo=True,
            password_hash=hash_password(correo, CLAVE),
        )
        db_session.add(usuario)
        db_session.commit()
        db_session.refresh(usuario)
        db_session.add(UsuarioRol(usuario_id=usuario.id, rol_id=rol.id))
        db_session.commit()
        creados[nombre] = correo
    return creados


def _llamar(client: TestClient, metodo: str, ruta: str):
    url = ruta.replace("{id}", str(uuid.uuid4()))
    return client.request(metodo, url, json={} if metodo in {"POST", "PUT", "PATCH"} else None)


def _denegaciones(db_session) -> int:
    db_session.expire_all()
    return db_session.query(Auditoria).filter(Auditoria.accion == "AUTH.ACCESS_DENIED").count()


@pytest.mark.parametrize(("metodo", "ruta", "permiso"), RUTAS_PROTEGIDAS)
def test_sin_sesion_cada_ruta_responde_401(client, metodo, ruta, permiso):
    assert _llamar(client, metodo, ruta).status_code == 401


@pytest.mark.parametrize("rol", sorted(MATRIZ))
@pytest.mark.parametrize(("metodo", "ruta", "permiso"), RUTAS_PROTEGIDAS)
def test_cada_ruta_con_cada_rol(client, db_session, usuarios_por_rol, rol, metodo, ruta, permiso):
    login = client.post("/auth/login", json={"correo": usuarios_por_rol[rol], "password": CLAVE})
    assert login.status_code == 200
    antes = _denegaciones(db_session)

    respuesta = _llamar(client, metodo, ruta)

    if permiso in MATRIZ[rol]:
        assert respuesta.status_code not in (401, 403), respuesta.text
        assert _denegaciones(db_session) == antes
    else:
        assert respuesta.status_code == 403
        assert respuesta.json()["error"]["code"] == "forbidden"
        assert _denegaciones(db_session) == antes + 1


def test_la_base_migrada_tiene_la_matriz_por_defecto(test_engine):
    from alembic.config import Config

    from alembic import command

    cfg = Config(os.path.join(os.path.dirname(__file__), "..", "alembic.ini"))
    cfg.set_main_option("script_location", os.path.join(os.path.dirname(__file__), "..", "alembic"))
    cfg.set_main_option("sqlalchemy.url", test_engine.url.render_as_string(hide_password=False))
    command.downgrade(cfg, "0005")
    command.upgrade(cfg, "head")
    with test_engine.connect() as conn:
        filas = conn.exec_driver_sql(
            "select r.nombre, p.codigo from roles_permisos rp "
            "join roles r on r.id = rp.rol_id join permisos p on p.id = rp.permiso_id"
        ).all()
        catalogo = {c for (c,) in conn.exec_driver_sql("select codigo from permisos")}
    real: dict[str, set[str]] = {}
    for rol, codigo in filas:
        real.setdefault(rol, set()).add(codigo)
    assert catalogo == set(PERMISOS)
    assert real == {rol: set(p) for rol, p in MATRIZ.items()}
