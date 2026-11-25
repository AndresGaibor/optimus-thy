"""Datasets anonimizados de investigación (HT-070, HU-090)."""

from __future__ import annotations

import json
import uuid
from datetime import UTC, date, datetime, timedelta
from decimal import Decimal

import pytest
from fastapi.testclient import TestClient

from app.investigacion.anonimizacion import _desplazamiento_dias
from app.models.auditoria import Auditoria
from app.models.consentimientos import Consentimiento
from app.models.fichas import Caso, FichaClinica
from app.models.instituciones import Institucion
from app.models.pacientes import IdentidadPaciente, Paciente
from app.models.usuarios import Rol, Usuario, UsuarioRol
from app.security.encryption import get_cipher
from app.security.passwords import hash_password

CLAVE = "claveSegura-123"
CASO_CREADO = datetime(2025, 6, 15, 12, 0, tzinfo=UTC)
NACIMIENTO = date(1980, 5, 17)


def _usuario(db, institucion: Institucion, correo: str, rol: Rol) -> str:
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
    institucion = Institucion(nombre="Hospital Investigación", codigo="INV")
    db_session.add(institucion)
    db_session.commit()
    db_session.refresh(institucion)

    investigador = Rol(nombre="researcher", descripcion="investigador")
    doctor = Rol(nombre="doctor", descripcion="médico")
    db_session.add_all([investigador, doctor])
    db_session.commit()

    return {
        "institucion": institucion,
        "investigador": _usuario(db_session, institucion, "investigador@t.com", investigador),
        "doctor": _usuario(db_session, institucion, "doctor@t.com", doctor),
    }


def _entrar(client: TestClient, correo: str) -> None:
    respuesta = client.post("/auth/login", json={"correo": correo, "password": CLAVE})
    assert respuesta.status_code == 200, respuesta.text


def _caso(
    db,
    institucion: Institucion,
    indice: int,
    *,
    base_legal: str = "investigacion_con_anonimizacion",
    revocado: bool = False,
    tipo_diagnostico: str = "confirmado",
    tsh: str = "2.500",
) -> Caso:
    paciente = Paciente(institucion_id=institucion.id, seudonimo=f"PAC-SECRETO-{indice:02d}")
    db.add(paciente)
    db.flush()
    db.add(
        IdentidadPaciente(
            paciente_id=paciente.id,
            nombres_cifrados=f"Nombre Secreto {indice}",
            apellidos_cifrados="Apellido Secreto",
            documento_cifrado=f"06012345{indice:02d}",
            fecha_nacimiento_cifrada=NACIMIENTO.isoformat(),
            clave_version=get_cipher().key_id(),
        )
    )
    caso = Caso(
        institucion_id=institucion.id,
        paciente_id=paciente.id,
        codigo_caso=f"CASO-SECRETO-{indice:02d}",
        creado_en=CASO_CREADO,
    )
    db.add(caso)
    db.flush()
    desplazamiento = timedelta(days=_desplazamiento_dias(caso.id))
    caso.creado_en = CASO_CREADO - desplazamiento
    db.add(
        FichaClinica(
            caso_id=caso.id,
            tsh=Decimal(tsh),
            tsh_unidad="mIU/L",
            tsh_fecha=date(2025, 3, 14) - desplazamiento,
            t3=Decimal("1.200"),
            t3_unidad="ng/mL",
            t3_fecha=date(2025, 4, 2) - desplazamiento,
            t4=Decimal("1.100"),
            t4_unidad="ng/dL",
            t4_fecha=date(2025, 5, 9) - desplazamiento,
            tamano_nodulo_mm=Decimal("12.50"),
            lateralidad="derecho",
            tirads="4",
            bethesda="V",
            cie10="C73",
            tipo_diagnostico=tipo_diagnostico,
            tipo_consulta="consulta",
        )
    )
    db.add(
        Consentimiento(
            caso_id=caso.id,
            base_legal=base_legal,
            version_texto="v1",
            revocado_en=datetime.now(UTC) if revocado else None,
        )
    )
    db.commit()
    db.refresh(caso)
    return caso


def _sembrar_casos(db, institucion: Institucion, cuantos: int = 5) -> None:
    for indice in range(1, cuantos + 1):
        _caso(db, institucion, indice)


def _crear(client: TestClient, nombre: str = "cohorte-tiroides") -> dict:
    respuesta = client.post(
        "/investigacion/datasets",
        json={
            "nombre": nombre,
            "descripcion": "Cohorte sintética para pruebas",
            "k": 5,
            "filtro": {},
        },
    )
    assert respuesta.status_code == 201, respuesta.text
    return respuesta.json()


def test_crear_dataset_solo_con_consentimiento_de_investigacion(client, mundo, db_session) -> None:
    _entrar(client, mundo["investigador"])
    _sembrar_casos(db_session, mundo["institucion"], 5)
    _caso(db_session, mundo["institucion"], 6, base_legal="atencion_de_salud")
    _caso(db_session, mundo["institucion"], 7, revocado=True)

    creado = _crear(client)

    assert creado["total_casos"] == 5
    assert creado["k"] == 5
    assert creado["k_efectivo"] == 5
    assert len(creado["huella"]) == 64
    assert len(creado["items"]) == 5
    assert creado["criterios"] == {}


def test_clases_con_k_suficiente_incluyen_k_efectivo(client, mundo, db_session) -> None:
    _entrar(client, mundo["investigador"])
    _sembrar_casos(db_session, mundo["institucion"], 5)
    for indice in range(6, 11):
        _caso(db_session, mundo["institucion"], indice, tipo_diagnostico="en_estudio")

    respuesta = client.post(
        "/investigacion/datasets",
        json={"nombre": "dos-clases", "k": 5, "filtro": {}},
    )

    assert respuesta.status_code == 201, respuesta.text
    assert respuesta.json()["k_efectivo"] == 5


def test_listar_datasets(client, mundo, db_session) -> None:
    _entrar(client, mundo["investigador"])
    _sembrar_casos(db_session, mundo["institucion"], 5)
    _crear(client, "cohorte-a")
    _crear(client, "cohorte-b")

    respuesta = client.get("/investigacion/datasets")

    assert respuesta.status_code == 200, respuesta.text
    cuerpo = respuesta.json()
    assert cuerpo["total"] == 2
    assert {item["nombre"] for item in cuerpo["items"]} == {"cohorte-a", "cohorte-b"}
    assert all("items" not in item for item in cuerpo["items"])
    assert all(item["k_efectivo"] >= 5 for item in cuerpo["items"])


def test_detalle_dataset(client, mundo, db_session) -> None:
    _entrar(client, mundo["investigador"])
    _sembrar_casos(db_session, mundo["institucion"], 5)
    creado = _crear(client)

    respuesta = client.get(f"/investigacion/datasets/{creado['id']}")

    assert respuesta.status_code == 200, respuesta.text
    detalle = respuesta.json()
    assert detalle["id"] == creado["id"]
    assert detalle["huella"] == creado["huella"]
    assert detalle["k_efectivo"] == creado["k_efectivo"]
    assert len(detalle["items"]) == 5

    assert client.get(f"/investigacion/datasets/{uuid.uuid4()}").status_code == 404
    assert client.get("/investigacion/datasets/no-es-uuid").status_code == 404


def test_clase_bajo_k_es_422_sin_exponer_valores(client, mundo, db_session) -> None:
    _entrar(client, mundo["investigador"])
    _sembrar_casos(db_session, mundo["institucion"], 5)
    _caso(db_session, mundo["institucion"], 6, tipo_diagnostico="en_estudio")

    respuesta = client.post(
        "/investigacion/datasets",
        json={"nombre": "k-inefectivo", "k": 5, "filtro": {}},
    )

    assert respuesta.status_code == 422
    error = respuesta.json()["error"]
    assert error["code"] == "k_no_alcanzado"
    assert "1 clase" in error["message"]
    assert "en_estudio" not in respuesta.text


def test_k_menor_que_cinco_es_422(client, mundo, db_session) -> None:
    _entrar(client, mundo["investigador"])
    _sembrar_casos(db_session, mundo["institucion"], 5)

    respuesta = client.post(
        "/investigacion/datasets",
        json={"nombre": "pocos", "k": 4, "filtro": {}},
    )

    assert respuesta.status_code == 422
    assert respuesta.json()["error"]["code"] == "k_insuficiente"


def test_conjunto_menor_que_k_es_422(client, mundo, db_session) -> None:
    _entrar(client, mundo["investigador"])
    _sembrar_casos(db_session, mundo["institucion"], 4)
    _caso(db_session, mundo["institucion"], 5, base_legal="atencion_de_salud")

    respuesta = client.post(
        "/investigacion/datasets",
        json={"nombre": "corto", "k": 5, "filtro": {}},
    )

    assert respuesta.status_code == 422
    assert respuesta.json()["error"]["code"] == "conjunto_insuficiente"


def test_sin_permiso_responde_403(client, mundo) -> None:
    _entrar(client, mundo["doctor"])

    assert client.post("/investigacion/datasets", json={"nombre": "x"}).status_code == 403
    assert client.get("/investigacion/datasets").status_code == 403
    assert client.get(f"/investigacion/datasets/{uuid.uuid4()}").status_code == 403


def test_sin_sesion_responde_401(client, mundo) -> None:
    assert client.get("/investigacion/datasets").status_code == 401
    assert client.post("/investigacion/datasets", json={"nombre": "x"}).status_code == 401


def test_anonimizacion_campo_a_campo(client, mundo, db_session) -> None:
    _entrar(client, mundo["investigador"])
    _sembrar_casos(db_session, mundo["institucion"], 5)
    creado = _crear(client)

    crudo = json.dumps(creado, ensure_ascii=False)
    for prohibido in (
        "Nombre Secreto",
        "Apellido Secreto",
        "06012345",
        "1980-05-17",
        "2025-03-14",
        "PAC-SECRETO",
        "CASO-SECRETO",
        "Hospital Investigación",
        "caso_id",
        "paciente_id",
        "codigo_caso",
        "institucion",
    ):
        assert prohibido not in crudo

    created_keys = set(creado["items"][0])
    assert created_keys == {
        "sujeto",
        "edad_rango",
        "mes_caso",
        "mes_tsh",
        "tsh",
        "tsh_unidad",
        "mes_t3",
        "t3",
        "t3_unidad",
        "mes_t4",
        "t4",
        "t4_unidad",
        "tamano_nodulo_mm",
        "lateralidad",
        "tirads",
        "bethesda",
        "cie10",
        "tipo_diagnostico",
        "tipo_consulta",
    }
    fila = creado["items"][0]
    assert fila["edad_rango"] == "40-49"
    assert fila["mes_caso"] is not None and len(fila["mes_caso"]) == 7
    assert fila["mes_tsh"] is not None and len(fila["mes_tsh"]) == 7
    assert fila["tsh"] == 2.5
    assert fila["tamano_nodulo_mm"] == 12.5
    assert fila["tsh_unidad"] == "mIU/L"
    assert fila["lateralidad"] == "derecho"
    assert fila["tirads"] == "4"
    assert fila["bethesda"] == "V"
    assert fila["cie10"] == "C73"
    assert fila["tipo_diagnostico"] == "confirmado"
    assert fila["tipo_consulta"] == "consulta"
    assert fila["sujeto"].startswith("suj-")
    sujetos = [item["sujeto"] for item in creado["items"]]
    assert len(set(sujetos)) == 5


def test_huella_estable_y_sensible_al_contenido(client, mundo, db_session) -> None:
    _entrar(client, mundo["investigador"])
    _sembrar_casos(db_session, mundo["institucion"], 5)
    primero = _crear(client, "cohorte-estable")
    segundo = _crear(client, "cohorte-estable")

    assert primero["huella"] == segundo["huella"]
    detalle = client.get(f"/investigacion/datasets/{primero['id']}").json()
    assert detalle["huella"] == primero["huella"]

    ficha = db_session.query(FichaClinica).order_by(FichaClinica.caso_id).first()
    assert ficha is not None
    ficha.tsh = Decimal("9.999")
    db_session.commit()
    tercero = _crear(client, "cohorte-estable")

    assert tercero["huella"] != primero["huella"]


def test_el_filtro_clinico_acota_el_conjunto(client, mundo, db_session) -> None:
    _entrar(client, mundo["investigador"])
    _sembrar_casos(db_session, mundo["institucion"], 5)
    for indice in range(6, 8):
        _caso(db_session, mundo["institucion"], indice, tipo_diagnostico="descartado")

    respuesta = client.post(
        "/investigacion/datasets",
        json={
            "nombre": "solo-confirmados",
            "k": 5,
            "filtro": {"tipo_diagnostico": "confirmado"},
        },
    )

    assert respuesta.status_code == 201, respuesta.text
    assert respuesta.json()["total_casos"] == 5
    assert respuesta.json()["criterios"] == {"tipo_diagnostico": "confirmado"}


def test_cada_consulta_queda_en_la_bitacora(client, mundo, db_session) -> None:
    _entrar(client, mundo["investigador"])
    _sembrar_casos(db_session, mundo["institucion"], 5)
    creado = _crear(client)
    client.get("/investigacion/datasets")
    client.get(f"/investigacion/datasets/{creado['id']}")

    db_session.expire_all()
    eventos = [
        evento for evento in db_session.query(Auditoria).all() if evento.entidad == "DATASET"
    ]
    acciones = [evento.accion for evento in eventos]
    assert "RESEARCH.DATASET_CREATE" in acciones
    assert acciones.count("RESEARCH.DATASET_READ") >= 2
    detalles = json.dumps([evento.detalles for evento in eventos], ensure_ascii=False)
    assert "Nombre Secreto" not in detalles
    assert "06012345" not in detalles
    assert "CASO-SECRETO" not in detalles
