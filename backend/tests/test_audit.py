"""Pruebas del servicio de auditoría de solo escritura (HT-030)."""

from __future__ import annotations

import inspect
import uuid
from collections.abc import Iterator
from pathlib import Path

import pytest
from sqlalchemy import JSON
from sqlalchemy.orm import Session

import app.models  # noqa: F401  (registra las tablas en Base.metadata)
from app.audit import AuditAction, AuditError, AuditModule, AuditObjectType, AuditService
from app.models import Auditoria, Usuario

COLUMNAS_REFERENCIA = {
    "id",
    "ocurrido_en",
    "usuario_id",
    "institucion_id",
    "accion",
    "entidad",
    "entidad_id",
    "direccion_ip",
    "user_agent",
    "detalles",
}


@pytest.fixture()
def sesion() -> Iterator[Session]:
    """Sesión sin conexión: el servicio solo prepara la fila, no la escribe."""
    sesion = Session()
    yield sesion
    sesion.close()


@pytest.fixture()
def usuario() -> Usuario:
    """Usuario de prueba, sin pasar por la base."""
    return Usuario(
        id=uuid.uuid4(),
        institucion_id=uuid.uuid4(),
        email="medico@hospital.test",
    )


def test_registra_las_acciones_del_anteproyecto(sesion: Session, usuario: Usuario) -> None:
    """Cada acción del anteproyecto tiene su evento (RF-AUD-01 a RF-AUD-07)."""
    servicio = AuditService(sesion)
    casos = [
        (AuditAction.SESSION_START, AuditModule.AUTH),
        (AuditAction.LOGIN_FAILED, AuditModule.AUTH),
        (AuditAction.PATIENT_READ, AuditModule.PATIENTS),
        (AuditAction.RECORD_READ, AuditModule.CLINICAL),
        (AuditAction.DOCUMENT_READ, AuditModule.FILES),
        (AuditAction.IMAGE_READ, AuditModule.FILES),
        (AuditAction.DOCUMENT_UPLOAD, AuditModule.FILES),
        (AuditAction.IMAGE_UPLOAD, AuditModule.FILES),
        (AuditAction.OCR_REQUEST, AuditModule.OCR),
        (AuditAction.INFERENCE_REQUEST, AuditModule.INFERENCE),
        (AuditAction.EXPORT, AuditModule.EXPORT),
        (AuditAction.USER_CREATE, AuditModule.ADMIN),
        (AuditAction.SESSION_END, AuditModule.AUTH),
    ]

    eventos = [servicio.record(accion, modulo, usuario=usuario) for accion, modulo in casos]

    assert [evento.accion for evento in eventos] == [
        f"{modulo.value}.{accion.value}" for accion, modulo in casos
    ]
    assert len({evento.accion for evento in eventos}) == len(casos)


def test_el_evento_guarda_referencias_y_no_datos_clinicos(
    sesion: Session, usuario: Usuario
) -> None:
    """Solo hay referencias: tipo y UUID del objeto, nunca su contenido."""
    paciente_id = uuid.uuid4()
    evento = AuditService(sesion).record(
        AuditAction.PATIENT_READ,
        AuditModule.PATIENTS,
        usuario=usuario,
        rol="medico",
        tipo_objeto=AuditObjectType.PATIENT,
        objeto_id=paciente_id,
        ip="10.0.0.5",
        agente_usuario="Mozilla/5.0",
    )

    assert set(Auditoria.__table__.columns.keys()) == COLUMNAS_REFERENCIA
    assert evento.accion == "PATIENTS.PATIENT_READ"
    assert evento.entidad == "PATIENT"
    assert evento.entidad_id == str(paciente_id)
    assert evento.usuario_id == usuario.id
    assert evento.institucion_id == usuario.institucion_id
    assert evento.direccion_ip == "10.0.0.5"
    assert evento.user_agent == "Mozilla/5.0"
    assert evento.detalles == {"role_code": "medico"}


def test_la_hora_la_pone_la_base(sesion: Session, usuario: Usuario) -> None:
    """``ocurrido_en`` no se rellena en Python: lo pone ``now()`` de la base."""
    evento = AuditService(sesion).record(
        AuditAction.SESSION_START, AuditModule.AUTH, usuario=usuario
    )

    assert evento.ocurrido_en is None
    columna = Auditoria.__table__.c.ocurrido_en
    assert columna.server_default is not None
    assert "now()" in str(columna.server_default.arg).lower()


def test_los_detalles_admiten_codigos_y_numeros(sesion: Session) -> None:
    """El contexto técnico se guarda como códigos, en una columna JSON."""
    evento = AuditService(sesion).record(
        AuditAction.INFERENCE_REQUEST,
        AuditModule.INFERENCE,
        detalles={
            "model_name": "optimus-thy",
            "model_version": "1.2.0",
            "result_label": "benign",
            "confidence": 0.874,
            "resource_count": 1,
        },
    )

    assert isinstance(Auditoria.__table__.c.detalles.type, JSON)
    assert evento.detalles is not None
    assert evento.detalles["model_version"] == "1.2.0"
    assert evento.detalles["confidence"] == 0.874


@pytest.mark.parametrize(
    "detalles",
    [
        {"paciente": "María Fernanda Núñez"},
        {"model_name": "María Fernanda"},
        {"observacion": "texto libre"},
        {"confidence": None},
        {"resource_count": [1, 2]},
    ],
)
def test_los_detalles_rechazan_texto_libre(sesion: Session, detalles: dict[str, object]) -> None:
    """Ni claves nuevas ni valores con espacios entran en la bitácora."""
    with pytest.raises(AuditError):
        AuditService(sesion).record(
            AuditAction.PATIENT_READ,
            AuditModule.PATIENTS,
            detalles=detalles,  # type: ignore[arg-type]
        )


def test_un_objeto_referenciado_necesita_su_tipo(sesion: Session) -> None:
    """No se guarda un UUID sin decir de qué es."""
    with pytest.raises(AuditError):
        AuditService(sesion).record(
            AuditAction.PATIENT_READ, AuditModule.PATIENTS, objeto_id=uuid.uuid4()
        )


def test_valores_de_entrada_invalidos(sesion: Session) -> None:
    """Acción, módulo, origen y agente se validan antes de escribir."""
    servicio = AuditService(sesion)

    with pytest.raises(AuditError):
        servicio.record("SESSION_START", AuditModule.AUTH)  # type: ignore[arg-type]
    with pytest.raises(AuditError):
        servicio.record(AuditAction.SESSION_START, "AUTH")  # type: ignore[arg-type]
    with pytest.raises(AuditError):
        servicio.record(AuditAction.SESSION_START, AuditModule.AUTH, ip="no es una ip")
    with pytest.raises(AuditError):
        servicio.record(AuditAction.SESSION_START, AuditModule.AUTH, agente_usuario="x" * 256)


def test_acceso_denegado_tiene_su_atajo(sesion: Session, usuario: Usuario) -> None:
    """Las denegaciones se registran con su motivo como código (RS-INC-01)."""
    evento = AuditService(sesion).record_denied(
        AuditModule.PATIENTS,
        motivo="role_not_allowed",
        usuario=usuario,
        rol="investigador",
        tipo_objeto=AuditObjectType.PATIENT,
        objeto_id=uuid.uuid4(),
    )

    assert evento.accion == "PATIENTS.ACCESS_DENIED"
    assert evento.detalles == {"reason_code": "role_not_allowed", "role_code": "investigador"}


def test_el_servicio_no_permite_editar_ni_borrar() -> None:
    """La superficie pública del servicio solo escribe (RF-AUD-08)."""
    publicos = {
        nombre
        for nombre, valor in inspect.getmembers(AuditService, inspect.isfunction)
        if not nombre.startswith("_")
    }

    assert publicos == {"record", "record_denied"}
    for prohibido in ("update", "delete", "remove", "edit", "purge"):
        assert not hasattr(AuditService, prohibido)


def test_la_bitacora_no_se_encadena_a_datos_clinicos() -> None:
    """Ninguna FK de la bitácora apunta a pacientes, casos ni fichas."""
    destinos = {clave.column.table.name for clave in Auditoria.__table__.foreign_keys}

    assert destinos == {"usuarios", "instituciones"}


def test_la_migracion_bloquea_actualizar_y_borrar() -> None:
    """La migración 0005 crea el disparador que rechaza UPDATE y DELETE."""
    ruta = (
        Path(__file__).resolve().parents[1]
        / "alembic"
        / "versions"
        / "0005_auditoria_solo_escritura.py"
    )
    fuente = ruta.read_text(encoding="utf-8")

    assert 'revision: str = "0005"' in fuente
    assert 'down_revision: str | None = "0004"' in fuente
    assert 'TABLA = "auditoria"' in fuente
    assert "BEFORE UPDATE OR DELETE ON {TABLA}" in fuente
