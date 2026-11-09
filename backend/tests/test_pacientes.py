"""HU-030, HU-031 y HU-033: pacientes y casos."""

from __future__ import annotations

import re
import uuid

import pytest
from fastapi.testclient import TestClient

from app.models.auditoria import Auditoria
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


def _usuario(db, inst, correo, rol):
    usuario = Usuario(
        email=correo,
        nombre=correo,
        institucion_id=inst.id,
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
    espoch = Institucion(nombre="ESPOCH", codigo="ESPOCH")
    solca = Institucion(nombre="SOLCA", codigo="SOLCA")
    db_session.add_all([espoch, solca])
    db_session.commit()
    roles = {n: Rol(nombre=n, descripcion=n) for n in ("admin", "doctor", "researcher")}
    db_session.add_all(roles.values())
    db_session.commit()
    return {
        "medico": _usuario(db_session, espoch, "medico@t.com", roles["doctor"]),
        "otro_medico": _usuario(db_session, espoch, "otro@t.com", roles["doctor"]),
        "medico_solca": _usuario(db_session, solca, "solca@t.com", roles["doctor"]),
        "admin": _usuario(db_session, espoch, "admin@t.com", roles["admin"]),
        "investigador": _usuario(db_session, espoch, "inv@t.com", roles["researcher"]),
    }


def _entrar(client: TestClient, correo: str) -> TestClient:
    assert client.post("/auth/login", json={"correo": correo, "password": CLAVE}).status_code == 200
    return client


def _alta(client: TestClient, **cambios) -> dict:
    respuesta = client.post("/pacientes", json={**PACIENTE, **cambios})
    assert respuesta.status_code == 201, respuesta.text
    return respuesta.json()


def _acciones(db_session) -> list[str]:
    db_session.expire_all()
    return [a for (a,) in db_session.query(Auditoria.accion).order_by(Auditoria.id).all()]


def _veces(db_session, accion: str) -> int:
    return _acciones(db_session).count(accion)


# ------------------------------------------------------------- HU-030 ----


def test_alta_devuelve_codigo_interno_y_nunca_la_identidad(client, mundo):
    _entrar(client, mundo["medico"])
    respuesta = client.post("/pacientes", json=PACIENTE)
    assert respuesta.status_code == 201
    datos = respuesta.json()
    assert re.fullmatch(r"PAC-[0-9A-F]{8}", datos["codigo"])
    assert datos["total_casos"] == 0
    for dato in PACIENTE.values():
        assert dato not in respuesta.text
    assert set(datos) == {"id", "codigo", "creado_en", "total_casos"}


def test_la_identidad_se_guarda_aparte_y_cifrada(client, mundo, test_engine):
    _entrar(client, mundo["medico"])
    paciente = _alta(client)
    with test_engine.connect() as conn:
        (fila,) = conn.exec_driver_sql(
            "select nombres_cifrados, apellidos_cifrados, documento_cifrado, "
            "fecha_nacimiento_cifrada, clave_version from identidades_paciente"
        ).all()
        columnas_paciente = [
            c
            for (c,) in conn.exec_driver_sql(
                "select column_name from information_schema.columns where table_name = 'pacientes'"
            )
        ]
    for valor, original in zip(fila[:4], PACIENTE.values(), strict=True):
        assert bytes(valor) != original.encode()
        assert original.encode() not in bytes(valor)
    assert len(fila[4]) == 16
    # la tabla clínica no lleva ningún dato de identidad
    assert not {"nombres", "apellidos", "documento", "fecha_nacimiento"} & set(columnas_paciente)
    assert paciente["codigo"]


def test_el_alta_queda_en_la_bitacora_sin_datos_personales(client, mundo, db_session):
    _entrar(client, mundo["medico"])
    _alta(client)
    assert _veces(db_session, "PATIENTS.PATIENT_CREATE") == 1
    texto = str(db_session.query(Auditoria.detalles).all())
    for dato in PACIENTE.values():
        assert dato not in texto


@pytest.mark.parametrize(
    "cambios",
    [
        {"nombres": ""},
        {"apellidos": "   "},
        {"documento": "12"},
        {"documento": "06 0123 45; DROP"},
        {"fecha_nacimiento": "2999-01-01"},
        {"fecha_nacimiento": "1850-01-01"},
        {"fecha_nacimiento": "no-es-fecha"},
    ],
)
def test_alta_rechaza_datos_no_validos(client, mundo, cambios):
    _entrar(client, mundo["medico"])
    assert client.post("/pacientes", json={**PACIENTE, **cambios}).status_code == 422


def test_alta_exige_todos_los_campos_minimos(client, mundo):
    _entrar(client, mundo["medico"])
    for campo in PACIENTE:
        cuerpo = {k: v for k, v in PACIENTE.items() if k != campo}
        assert client.post("/pacientes", json=cuerpo).status_code == 422


@pytest.mark.parametrize("quien", ["admin", "investigador"])
def test_solo_el_medico_registra_pacientes(client, mundo, quien):
    _entrar(client, mundo[quien])
    assert client.post("/pacientes", json=PACIENTE).status_code == 403


def test_los_codigos_no_se_repiten(client, mundo):
    _entrar(client, mundo["medico"])
    codigos = {_alta(client)["codigo"] for _ in range(25)}
    assert len(codigos) == 25


# ------------------------------------------------------------- HU-031 ----


def test_lista_busca_por_codigo_y_pagina(client, mundo):
    _entrar(client, mundo["medico"])
    altas = [_alta(client) for _ in range(5)]
    lista = client.get("/pacientes").json()
    assert lista["total"] == 5
    assert {p["codigo"] for p in lista["items"]} == {a["codigo"] for a in altas}

    buscado = altas[2]["codigo"]
    encontrado = client.get("/pacientes", params={"q": buscado[:8].lower()}).json()
    assert [p["codigo"] for p in encontrado["items"]] == [buscado]

    pagina = client.get("/pacientes", params={"limite": 2, "desplazamiento": 4}).json()
    assert pagina["total"] == 5 and len(pagina["items"]) == 1
    assert client.get("/pacientes", params={"limite": 0}).status_code == 422


def test_la_busqueda_trata_los_comodines_como_texto(client, mundo):
    _entrar(client, mundo["medico"])
    _alta(client)
    assert client.get("/pacientes", params={"q": "%"}).json()["total"] == 0
    assert client.get("/pacientes", params={"q": "_"}).json()["total"] == 0


def test_cada_medico_ve_solo_pacientes_de_su_institucion(client, mundo):
    _entrar(client, mundo["medico"])
    propio = _alta(client)
    _entrar(client, mundo["medico_solca"])
    assert client.get("/pacientes").json()["total"] == 0
    assert client.get(f"/pacientes/{propio['id']}").status_code == 404
    assert client.post(f"/pacientes/{propio['id']}/casos").status_code == 404
    _entrar(client, mundo["otro_medico"])
    assert client.get(f"/pacientes/{propio['id']}").status_code == 200


@pytest.mark.parametrize("quien", ["admin", "investigador"])
def test_admin_e_investigador_no_ven_pacientes(client, mundo, quien):
    _entrar(client, mundo["medico"])
    paciente = _alta(client)
    _entrar(client, mundo[quien])
    assert client.get("/pacientes").status_code == 403
    assert client.get(f"/pacientes/{paciente['id']}").status_code == 403


def test_cada_consulta_queda_en_la_bitacora(client, mundo, db_session):
    _entrar(client, mundo["medico"])
    paciente = _alta(client)
    antes = _veces(db_session, "PATIENTS.PATIENT_READ")
    client.get("/pacientes")
    client.get(f"/pacientes/{paciente['id']}")
    assert _veces(db_session, "PATIENTS.PATIENT_READ") == antes + 2


def test_id_mal_formado_o_inexistente_da_404(client, mundo):
    _entrar(client, mundo["medico"])
    assert client.get("/pacientes/no-es-uuid").status_code == 404
    assert client.get(f"/pacientes/{uuid.uuid4()}").status_code == 404
    assert client.get(f"/casos/{uuid.uuid4()}").status_code == 404


# ------------------------------------------------------------- HU-033 ----


def test_un_paciente_puede_tener_varios_casos(client, mundo):
    _entrar(client, mundo["medico"])
    paciente = _alta(client)
    casos = [client.post(f"/pacientes/{paciente['id']}/casos") for _ in range(3)]
    assert all(c.status_code == 201 for c in casos)
    codigos = {c.json()["codigo"] for c in casos}
    assert len(codigos) == 3
    assert all(re.fullmatch(r"CASO-[0-9A-F]{8}", c) for c in codigos)

    detalle = client.get(f"/pacientes/{paciente['id']}").json()
    assert detalle["total_casos"] == 3
    assert {c["codigo"] for c in detalle["casos"]} == codigos
    assert all(c["paciente_codigo"] == paciente["codigo"] for c in detalle["casos"])


def test_el_caso_muestra_su_contenido(client, mundo):
    _entrar(client, mundo["medico"])
    paciente = _alta(client)
    caso = client.post(f"/pacientes/{paciente['id']}/casos").json()
    detalle = client.get(f"/casos/{caso['id']}").json()
    assert detalle["codigo"] == caso["codigo"]
    assert detalle["paciente_codigo"] == paciente["codigo"]
    assert detalle["tiene_ficha"] is False
    assert (detalle["documentos"], detalle["imagenes"], detalle["consentimientos"]) == (0, 0, 0)


def test_un_caso_de_otra_institucion_da_404(client, mundo):
    _entrar(client, mundo["medico"])
    caso = client.post(f"/pacientes/{_alta(client)['id']}/casos").json()
    _entrar(client, mundo["medico_solca"])
    assert client.get(f"/casos/{caso['id']}").status_code == 404


def test_crear_y_leer_casos_queda_en_la_bitacora(client, mundo, db_session):
    _entrar(client, mundo["medico"])
    caso = client.post(f"/pacientes/{_alta(client)['id']}/casos").json()
    client.get(f"/casos/{caso['id']}")
    assert _veces(db_session, "PATIENTS.CASE_CREATE") == 1
    assert _veces(db_session, "PATIENTS.RECORD_READ") == 1
