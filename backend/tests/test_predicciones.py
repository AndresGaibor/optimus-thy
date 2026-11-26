"""Auditoría individual de predicciones (HU-093, RF-INV-06)."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime, timedelta
from typing import Any

import pytest
from fastapi.testclient import TestClient

from app.models.auditoria import Auditoria
from app.models.imagenes import DecisionMedica, Imagen, Inferencia, ModeloIA
from app.models.instituciones import Institucion
from app.models.trabajos import Trabajo
from app.models.usuarios import Rol, Usuario, UsuarioRol
from app.security.passwords import hash_password

CLAVE = "claveSegura-123"
PACIENTE = {
    "nombres": "Ana María",
    "apellidos": "Pérez Quishpe",
    "documento": "0601234567",
    "fecha_nacimiento": "1980-05-17",
}
HUELLA_IMAGEN = "a" * 64
HUELLA_MODELO = "b" * 64


def _usuario(db, institucion, correo: str, rol: Rol) -> Usuario:
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
    return usuario


@pytest.fixture()
def mundo(db_session):
    espoch = Institucion(nombre="ESPOCH", codigo="ESPOCH")
    solca = Institucion(nombre="SOLCA", codigo="SOLCA")
    db_session.add_all([espoch, solca])
    db_session.commit()
    investigador = Rol(nombre="researcher", descripcion="investigador")
    doctor = Rol(nombre="doctor", descripcion="doctor")
    db_session.add_all([investigador, doctor])
    db_session.commit()
    return {
        "investigador": _usuario(db_session, espoch, "investiga@t.com", investigador),
        "medico": _usuario(db_session, espoch, "medico@t.com", doctor),
        "medico_solca": _usuario(db_session, solca, "solca@t.com", doctor),
    }


def _entrar(client: TestClient, correo: str) -> None:
    respuesta = client.post("/auth/login", json={"correo": correo, "password": CLAVE})
    assert respuesta.status_code == 200, respuesta.text


def _caso(client: TestClient, correo: str, documento: str = PACIENTE["documento"]) -> str:
    """Crea un paciente y su caso con el médico indicado; devuelve el caso."""
    _entrar(client, correo)
    paciente = client.post("/pacientes", json={**PACIENTE, "documento": documento})
    assert paciente.status_code == 201, paciente.text
    caso = client.post(f"/pacientes/{paciente.json()['id']}/casos")
    assert caso.status_code == 201, caso.text
    client.post("/auth/logout")
    return caso.json()["id"]


def _inferencia(
    db,
    caso_id: str,
    *,
    resultado: str = "benigno",
    creado_en: datetime | None = None,
    decision: str | None = None,
    resultado_corregido: str | None = None,
    autor_id: uuid.UUID | None = None,
    lanzada_por: uuid.UUID | None = None,
) -> Inferencia:
    imagen = Imagen(
        caso_id=uuid.UUID(caso_id),
        ruta_s3="casos/x/imagenes/eco.png",
        hash_sha256=HUELLA_IMAGEN,
    )
    db.add(imagen)
    db.commit()
    modelo = ModeloIA(nombre="Swin", version="1.2.0", hash_pesos=HUELLA_MODELO, activo=True)
    db.add(modelo)
    db.commit()
    inferencia = Inferencia(
        imagen_id=imagen.id,
        modelo_ia_id=modelo.id,
        resultado=resultado,
        confianza=0.87,
        creado_en=creado_en or datetime.now(UTC),
    )
    db.add(inferencia)
    db.commit()
    db.refresh(inferencia)
    if lanzada_por is not None:
        db.add(
            Trabajo(
                tipo="inferencia",
                estado="completado",
                payload={"imagen_id": str(imagen.id)},
                resultado={"inferencia_id": str(inferencia.id)},
                creado_por=lanzada_por,
            )
        )
        db.commit()
    if decision is not None:
        db.add(
            DecisionMedica(
                inferencia_id=inferencia.id,
                usuario_id=autor_id or uuid.uuid4(),
                decision=decision,
                resultado_corregido=resultado_corregido,
            )
        )
        db.commit()
    return inferencia


def _auditar(client: TestClient, params: dict[str, Any] | None = None):
    return client.get("/investigacion/predicciones", params=params or {})


def test_lista_prediccion_con_modelo_huella_y_lanzador(client, mundo, db_session) -> None:
    caso_id = _caso(client, mundo["medico"].email)
    inferencia = _inferencia(db_session, caso_id, lanzada_por=mundo["investigador"].id)
    _entrar(client, mundo["investigador"].email)

    respuesta = _auditar(client)

    assert respuesta.status_code == 200, respuesta.text
    cuerpo = respuesta.json()
    assert cuerpo["total"] == 1
    item = cuerpo["items"][0]
    assert item["id"] == str(inferencia.id)
    assert item["caso_id"] == caso_id
    assert item["caso_codigo"].startswith("CASO-")
    assert item["paciente_codigo"].startswith("PAC-")
    assert item["imagen"] == {"id": str(inferencia.imagen_id), "hash_sha256": HUELLA_IMAGEN}
    assert item["modelo"]["nombre"] == "Swin"
    assert item["modelo"]["version"] == "1.2.0"
    assert item["modelo"]["hash_pesos"] == HUELLA_MODELO
    assert item["resultado"] == "benigno"
    assert item["confianza"] == 0.87
    assert item["lanzado_por"] == {
        "id": str(mundo["investigador"].id),
        "rol": "researcher",
    }
    assert item["referencia_clinica"] is None
    assert item["diferencia"] == "pendiente"


def test_diferencia_entre_prediccion_y_referencia_clinica(client, mundo, db_session) -> None:
    caso_id = _caso(client, mundo["medico"].email)
    _inferencia(
        db_session,
        caso_id,
        resultado="maligno",
        creado_en=datetime.now(UTC) - timedelta(hours=2),
        decision="acepta",
        autor_id=mundo["medico"].id,
    )
    _inferencia(
        db_session,
        caso_id,
        resultado="benigno",
        creado_en=datetime.now(UTC) - timedelta(hours=1),
        decision="corrige",
        autor_id=mundo["medico"].id,
    )
    _entrar(client, mundo["investigador"].email)

    todo = _auditar(client).json()
    assert [item["diferencia"] for item in todo["items"]] == ["difiere", "coincide"]
    assert todo["items"][1]["referencia_clinica"]["decision"] == "acepta"

    aceptadas = _auditar(client, {"decision": "acepta"}).json()
    assert aceptadas["total"] == 1
    assert aceptadas["items"][0]["diferencia"] == "coincide"

    pendientes = _auditar(client, {"decision": "pendiente"}).json()
    assert pendientes == {"total": 0, "items": []}


def test_filtra_por_fecha_resultado_y_caso(client, mundo, db_session) -> None:
    caso_id = _caso(client, mundo["medico"].email)
    otro_caso = _caso(client, mundo["medico"].email, documento="0601234568")
    _inferencia(
        db_session,
        caso_id,
        resultado="benigno",
        creado_en=datetime(2026, 1, 10, 12, tzinfo=UTC),
    )
    _inferencia(
        db_session,
        otro_caso,
        resultado="maligno",
        creado_en=datetime(2026, 2, 10, 12, tzinfo=UTC),
    )
    _entrar(client, mundo["investigador"].email)

    enero = _auditar(client, {"desde": "2026-01-01", "hasta": "2026-01-31"}).json()
    assert enero["total"] == 1
    assert enero["items"][0]["resultado"] == "benigno"

    malignos = _auditar(client, {"resultado": "maligno"}).json()
    assert malignos["total"] == 1
    assert malignos["items"][0]["caso_id"] == otro_caso

    por_caso = _auditar(client, {"caso": caso_id}).json()
    assert por_caso["total"] == 1
    assert por_caso["items"][0]["caso_id"] == caso_id


def test_no_mezcla_predicciones_de_otra_institucion(client, mundo, db_session) -> None:
    caso_ajeno = _caso(client, mundo["medico_solca"].email, documento="0601234569")
    _inferencia(db_session, caso_ajeno, resultado="maligno")
    _entrar(client, mundo["investigador"].email)

    respuesta = _auditar(client)

    assert respuesta.status_code == 200
    assert respuesta.json() == {"total": 0, "items": []}


def test_parametros_invalidos_dan_422(client, mundo) -> None:
    _entrar(client, mundo["investigador"].email)

    caso = _auditar(client, {"caso": "no-es-uuid"})
    assert caso.status_code == 422
    assert caso.json()["error"]["code"] == "validation_error"

    fechas = _auditar(client, {"desde": "2026-02-01", "hasta": "2026-01-01"})
    assert fechas.status_code == 422
    assert fechas.json()["error"]["code"] == "validation_error"

    assert _auditar(client, {"resultado": "inventado"}).status_code == 422
    assert _auditar(client, {"decision": "inventada"}).status_code == 422


def test_exige_permiso_de_investigacion(client, mundo) -> None:
    _entrar(client, mundo["medico"].email)

    respuesta = _auditar(client)

    assert respuesta.status_code == 403
    assert respuesta.json()["error"]["code"] == "forbidden"


def test_registra_la_consulta_en_la_bitacora(client, mundo, db_session) -> None:
    caso_id = _caso(client, mundo["medico"].email)
    _inferencia(db_session, caso_id)
    _entrar(client, mundo["investigador"].email)

    assert _auditar(client).status_code == 200

    evento = (
        db_session.query(Auditoria)
        .filter(Auditoria.accion == "INFERENCE.INFERENCE_READ")
        .order_by(Auditoria.id.desc())
        .first()
    )
    assert evento is not None
    assert evento.usuario_id == mundo["investigador"].id
    assert evento.detalles == {"resource_count": 1, "role_code": "researcher"}


def _errores(client: TestClient, params: dict[str, Any] | None = None):
    return client.get("/investigacion/errores", params=params or {})


def _sembrar_errores(db, caso_id: str, medico) -> tuple[Inferencia, Inferencia]:
    """Un falso positivo (dijo maligno, era benigno) y un falso negativo (al revés)."""
    falso_positivo = _inferencia(
        db,
        caso_id,
        resultado="maligno",
        decision="corrige",
        resultado_corregido="benigno",
        autor_id=medico,
    )
    falso_negativo = _inferencia(
        db,
        caso_id,
        resultado="benigno",
        decision="corrige",
        resultado_corregido="maligno",
        autor_id=medico,
    )
    _inferencia(db, caso_id, resultado="maligno", decision="acepta", autor_id=medico)
    _inferencia(db, caso_id, resultado="sin_nodulo", decision="descarta", autor_id=medico)
    return falso_positivo, falso_negativo


def test_errores_separa_falsos_positivos_y_negativos(client, mundo, db_session) -> None:
    caso_id = _caso(client, mundo["medico"].email)
    falso_positivo, falso_negativo = _sembrar_errores(db_session, caso_id, mundo["medico"].id)
    _entrar(client, mundo["investigador"].email)

    respuesta = _errores(client)

    assert respuesta.status_code == 200, respuesta.text
    cuerpo = respuesta.json()
    assert cuerpo["total"] == 2
    assert cuerpo["falsos_positivos"] == 1
    assert cuerpo["falsos_negativos"] == 1
    tipos = {item["id"]: item["tipo"] for item in cuerpo["items"]}
    assert tipos[str(falso_positivo.id)] == "falso_positivo"
    assert tipos[str(falso_negativo.id)] == "falso_negativo"
    item = next(item for item in cuerpo["items"] if item["id"] == str(falso_negativo.id))
    assert item["resultado"] == "benigno"
    assert item["resultado_corregido"] == "maligno"
    assert item["modelo"]["nombre"] == "Swin"
    assert item["paciente_codigo"].startswith("PAC-")


@pytest.mark.parametrize(
    ("filtro", "esperado"),
    [("falso_positivo", 1), ("falso_negativo", 1), ("todos", 2)],
)
def test_errores_filtra_por_tipo(client, mundo, db_session, filtro: str, esperado: int) -> None:
    caso_id = _caso(client, mundo["medico"].email)
    _sembrar_errores(db_session, caso_id, mundo["medico"].id)
    _entrar(client, mundo["investigador"].email)

    respuesta = _errores(client, {"tipo": filtro})

    assert respuesta.status_code == 200, respuesta.text
    assert respuesta.json()["total"] == esperado


def test_errores_respeta_la_institucion(client, mundo, db_session) -> None:
    caso_id = _caso(client, mundo["medico"].email)
    _sembrar_errores(db_session, caso_id, mundo["medico"].id)
    _entrar(client, mundo["medico_solca"].email)

    respuesta = _errores(client)

    assert respuesta.status_code == 403


def test_errores_exige_permiso_de_investigacion(client, mundo) -> None:
    _entrar(client, mundo["medico"].email)

    respuesta = _errores(client)

    assert respuesta.status_code == 403
    assert respuesta.json()["error"]["code"] == "forbidden"


def test_errores_acota_por_fecha(client, mundo, db_session) -> None:
    caso_id = _caso(client, mundo["medico"].email)
    _inferencia(
        db_session,
        caso_id,
        resultado="maligno",
        decision="corrige",
        resultado_corregido="benigno",
        autor_id=mundo["medico"].id,
        creado_en=datetime(2025, 1, 10, 12, 0, tzinfo=UTC),
    )
    _inferencia(
        db_session,
        caso_id,
        resultado="maligno",
        decision="corrige",
        resultado_corregido="benigno",
        autor_id=mundo["medico"].id,
        creado_en=datetime(2025, 6, 10, 12, 0, tzinfo=UTC),
    )
    _entrar(client, mundo["investigador"].email)

    respuesta = _errores(
        client,
        {"desde": "2025-05-01", "hasta": "2025-07-01"},
    )

    assert respuesta.status_code == 200, respuesta.text
    assert respuesta.json()["total"] == 1
