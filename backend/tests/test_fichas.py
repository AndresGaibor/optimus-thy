"""HU-040 y HU-041: ficha clínica por secciones, versionada y validada.

La ficha se guarda por secciones (consulta, laboratorio, ecografía, PAAF y
Bethesda, diagnóstico); cada guardado incrementa la versión y conserva un
snapshot del estado, con autor y motivo. Los valores de laboratorio y el
tamaño del nódulo se validan contra rangos configurables, y TI-RADS y Bethesda
solo admiten sus categorías.
"""

from __future__ import annotations

import uuid
from decimal import Decimal

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

FICHA_COMPLETA = {
    "tipo_consulta": "consulta",
    "tsh": 2.5,
    "tsh_unidad": "mU/L",
    "tsh_fecha": "2026-01-15",
    "t3": 1.2,
    "t3_unidad": "ng/mL",
    "t4": 8.1,
    "t4_unidad": "mcg/dL",
    "tamano_nodulo_mm": 18.5,
    "lateralidad": "derecha",
    "tirads": "TR4",
    "bethesda": "IV",
    "cie10": "C73",
    "tipo_diagnostico": "sospecha",
    "origen_datos": {"laboratorio": "digitado", "ecografia": "digitado"},
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
        "medico_solca": _usuario(db_session, solca, "solca@t.com", roles["doctor"]),
        "investigador": _usuario(db_session, espoch, "investigador@t.com", roles["researcher"]),
    }


def _entrar(client: TestClient, correo: str) -> TestClient:
    assert client.post("/auth/login", json={"correo": correo, "password": CLAVE}).status_code == 200
    return client


def _caso(client: TestClient) -> str:
    paciente = client.post("/pacientes", json=PACIENTE)
    assert paciente.status_code == 201, paciente.text
    caso = client.post(f"/pacientes/{paciente.json()['id']}/casos")
    assert caso.status_code == 201, caso.text
    return caso.json()["id"]


def _guardar(client: TestClient, caso_id: str, cuerpo: dict, esperado: int = 200):
    respuesta = client.put(f"/casos/{caso_id}/ficha", json=cuerpo)
    assert respuesta.status_code == esperado, respuesta.text
    return respuesta


def _leer(client: TestClient, caso_id: str) -> dict:
    respuesta = client.get(f"/casos/{caso_id}/ficha")
    assert respuesta.status_code == 200, respuesta.text
    return respuesta.json()


def _mensaje(respuesta) -> str:
    return respuesta.json()["error"]["message"]


# ------------------------------------------------------------- HU-040 ----


def test_guarda_y_lee_la_ficha_con_todas_sus_secciones(client, mundo):
    _entrar(client, mundo["medico"])
    caso_id = _caso(client)
    guardada = _guardar(client, caso_id, FICHA_COMPLETA).json()
    assert guardada["ficha"]["caso_id"] == caso_id
    assert guardada["ficha"]["tsh"] == pytest.approx(2.5)
    assert guardada["ficha"]["tirads"] == "TR4"
    assert guardada["ficha"]["bethesda"] == "IV"
    assert guardada["ficha"]["origen_datos"] == {
        "laboratorio": "digitado",
        "ecografia": "digitado",
    }

    leida = _leer(client, caso_id)
    ficha = leida["ficha"]
    for campo, valor in FICHA_COMPLETA.items():
        if campo in {"tsh", "t3", "t4", "tamano_nodulo_mm"}:
            assert ficha[campo] == pytest.approx(valor)
        else:
            assert ficha[campo] == valor, campo
    assert ficha["tsh_fecha"] == "2026-01-15"


def test_cada_seccion_se_guarda_por_separado_sin_borrar_lo_anterior(client, mundo):
    _entrar(client, mundo["medico"])
    caso_id = _caso(client)
    _guardar(client, caso_id, {"tsh": 2.5, "tsh_unidad": "mU/L"})
    _guardar(client, caso_id, {"tamano_nodulo_mm": 12.0, "tirads": "TR3"})
    _guardar(client, caso_id, {"bethesda": "II", "cie10": "D34"})
    ficha = _leer(client, caso_id)["ficha"]
    assert ficha["tsh"] == pytest.approx(2.5)
    assert ficha["tamano_nodulo_mm"] == pytest.approx(12.0)
    assert ficha["tirads"] == "TR3"
    assert ficha["bethesda"] == "II"
    assert ficha["cie10"] == "D34"


def test_cada_guardado_incrementa_la_version_y_conserva_el_snapshot(client, mundo, db_session):
    _entrar(client, mundo["medico"])
    caso_id = _caso(client)
    _guardar(client, caso_id, {"tsh": 2.5, "motivo_cambio": "registro inicial"})
    segunda = _guardar(
        client,
        caso_id,
        {"tsh": 4.8, "tirads": "TR5", "motivo_cambio": "corrección de TSH"},
    ).json()

    versiones = segunda["versiones"]
    assert [v["version"] for v in versiones] == [2, 1]
    assert versiones[0]["motivo_cambio"] == "corrección de TSH"
    assert versiones[1]["motivo_cambio"] == "registro inicial"
    assert versiones[0]["autor"] == mundo["medico"]
    assert versiones[0]["autor_id"] == versiones[1]["autor_id"]
    assert Decimal(str(versiones[0]["snapshot"]["tsh"])) == Decimal("4.8")
    assert versiones[0]["snapshot"]["tirads"] == "TR5"
    assert Decimal(str(versiones[1]["snapshot"]["tsh"])) == Decimal("2.500")

    leida = _leer(client, caso_id)
    assert [v["version"] for v in leida["versiones"]] == [2, 1]
    assert leida["ficha"]["tsh"] == pytest.approx(4.8)


def test_la_bitacora_registra_la_version_sin_datos_clinicos(client, mundo, db_session):
    _entrar(client, mundo["medico"])
    caso_id = _caso(client)
    _guardar(client, caso_id, FICHA_COMPLETA)
    db_session.expire_all()
    eventos = (
        db_session.query(Auditoria)
        .filter(Auditoria.accion.in_(["CLINICAL.RECORD_CREATE", "CLINICAL.RECORD_UPDATE"]))
        .all()
    )
    assert [e.accion for e in eventos] == ["CLINICAL.RECORD_CREATE"]
    assert eventos[0].detalles["version"] == 1
    texto = str([e.detalles for e in eventos])
    assert "TR4" not in texto
    assert "2.5" not in texto


# ------------------------------------------------------------- HU-041 ----


@pytest.mark.parametrize(
    ("campo", "valor"),
    [
        ("tsh", -0.1),
        ("tsh", 150.5),
        ("t3", -1),
        ("t3", 30.1),
        ("t4", -0.5),
        ("t4", 50.01),
        ("tamano_nodulo_mm", -1),
        ("tamano_nodulo_mm", 200.5),
        ("tsh", "doce"),
    ],
)
def test_valores_fuera_de_rango_dan_422_con_campo_valor_y_rango(client, mundo, campo, valor):
    _entrar(client, mundo["medico"])
    caso_id = _caso(client)
    respuesta = _guardar(client, caso_id, {campo: valor}, esperado=422)
    mensaje = _mensaje(respuesta)
    nombre = "tamaño del nódulo" if campo == "tamano_nodulo_mm" else campo.upper()
    assert nombre in mensaje
    assert str(valor) in mensaje
    if isinstance(valor, str):
        assert "no es un número válido" in mensaje
    else:
        assert "fuera del rango admitido" in mensaje
    assert _leer(client, caso_id)["ficha"] is None


@pytest.mark.parametrize(
    "cuerpo",
    [
        {"tsh": 0},
        {"tsh": 150},
        {"t3": 0},
        {"t3": 30},
        {"t4": 0},
        {"t4": 50},
        {"tamano_nodulo_mm": 0},
        {"tamano_nodulo_mm": 200},
    ],
)
def test_los_limites_exactos_del_rango_son_validos(client, mundo, cuerpo):
    _entrar(client, mundo["medico"])
    caso_id = _caso(client)
    _guardar(client, caso_id, cuerpo)
    ficha = _leer(client, caso_id)["ficha"]
    campo, valor = next(iter(cuerpo.items()))
    assert ficha[campo] == pytest.approx(valor)


def test_acepta_coma_decimal(client, mundo):
    _entrar(client, mundo["medico"])
    caso_id = _caso(client)
    _guardar(client, caso_id, {"tsh": "4,2", "tamano_nodulo_mm": "18,5"})
    ficha = _leer(client, caso_id)["ficha"]
    assert ficha["tsh"] == pytest.approx(4.2)
    assert ficha["tamano_nodulo_mm"] == pytest.approx(18.5)


@pytest.mark.parametrize(
    ("campo", "valor", "nombre"),
    [
        ("tirads", "TR6", "TI-RADS"),
        ("tirads", "4", "TI-RADS"),
        ("tirads", "TR0", "TI-RADS"),
        ("bethesda", "VII", "Bethesda"),
        ("bethesda", "0", "Bethesda"),
        ("bethesda", "IVa", "Bethesda"),
    ],
)
def test_tirads_y_bethesda_invalidos_dan_422(client, mundo, campo, valor, nombre):
    _entrar(client, mundo["medico"])
    caso_id = _caso(client)
    respuesta = _guardar(client, caso_id, {campo: valor}, esperado=422)
    mensaje = _mensaje(respuesta)
    assert nombre in mensaje
    assert valor in mensaje
    assert "no es válido" in mensaje


def test_tirads_y_bethesda_se_normalizan(client, mundo):
    _entrar(client, mundo["medico"])
    caso_id = _caso(client)
    _guardar(client, caso_id, {"tirads": "tr5", "bethesda": "vi"})
    ficha = _leer(client, caso_id)["ficha"]
    assert ficha["tirads"] == "TR5"
    assert ficha["bethesda"] == "VI"


# ------------------------------------------------------- control de acceso ----


def test_caso_de_otra_institucion_da_404(client, mundo):
    _entrar(client, mundo["medico"])
    caso_id = _caso(client)
    _guardar(client, caso_id, {"tsh": 2.5})

    _entrar(client, mundo["medico_solca"])
    assert client.get(f"/casos/{caso_id}/ficha").status_code == 404
    assert client.put(f"/casos/{caso_id}/ficha", json={"tsh": 3.0}).status_code == 404


def test_permiso_denegado_para_investigador(client, mundo):
    _entrar(client, mundo["medico"])
    caso_id = _caso(client)
    _guardar(client, caso_id, {"tsh": 2.5})

    _entrar(client, mundo["investigador"])
    lectura = client.get(f"/casos/{caso_id}/ficha")
    escritura = client.put(f"/casos/{caso_id}/ficha", json={"tsh": 3.0})
    assert lectura.status_code == 403
    assert escritura.status_code == 403
    assert lectura.json()["error"]["code"] == "forbidden"


def test_caso_inexistente_o_id_no_uuid_da_404(client, mundo):
    _entrar(client, mundo["medico"])
    assert client.get(f"/casos/{uuid.uuid4()}/ficha").status_code == 404
    assert client.get("/casos/no-es-uuid/ficha").status_code == 404
    assert client.put("/casos/no-es-uuid/ficha", json={"tsh": 2.5}).status_code == 404
