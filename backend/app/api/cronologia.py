"""Lectura de la cronología de un caso."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, Request, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.audit.actions import AuditAction, AuditModule, AuditObjectType
from app.audit.http import registrar
from app.auth.deps import SesionActual, requiere_permiso
from app.db import session_dep
from app.models.consentimientos import Consentimiento
from app.models.fichas import Caso, FichaClinica, FichaVersion
from app.models.imagenes import DecisionMedica, Imagen, Inferencia

router = APIRouter(tags=["pacientes"])


def _error(request: Request, codigo: int, clave: str, mensaje: str) -> JSONResponse:
    return JSONResponse(
        status_code=codigo,
        content={
            "error": {"code": clave, "message": mensaje},
            "request_id": getattr(request.state, "request_id", "-"),
        },
    )


class HitoCronologia(BaseModel):
    tipo: Literal["imagen", "inferencia", "consentimiento", "decision", "ficha", "cambio_ficha"]
    ocurrido_en: datetime
    titulo: str
    detalle: str | None = None
    actor: str | None = None


class CronologiaOut(BaseModel):
    items: list[HitoCronologia]


@router.get("/casos/{caso_id}/cronologia", response_model=CronologiaOut)
def obtener_cronologia(
    caso_id: uuid.UUID,
    request: Request,
    actual: Annotated[SesionActual, Depends(requiere_permiso("paciente.leer"))],
    db: Annotated[Session, Depends(session_dep)],
) -> CronologiaOut | JSONResponse:
    caso = (
        db.query(Caso)
        .filter(
            Caso.id == caso_id,
            Caso.institucion_id == actual.usuario.institucion_id,
        )
        .first()
    )
    if caso is None:
        return _error(request, status.HTTP_404_NOT_FOUND, "not_found", "No encontrado")

    items: list[HitoCronologia] = []
    for imagen in db.query(Imagen).filter(Imagen.caso_id == caso_id).all():
        items.append(HitoCronologia(tipo="imagen", ocurrido_en=imagen.creado_en, titulo="Imagen agregada"))
    for inferencia in (
        db.query(Inferencia).join(Imagen, Inferencia.imagen_id == Imagen.id)
        .filter(Imagen.caso_id == caso_id).all()
    ):
        items.append(HitoCronologia(tipo="inferencia", ocurrido_en=inferencia.creado_en, titulo="Inferencia completada"))
    for consentimiento in db.query(Consentimiento).filter(Consentimiento.caso_id == caso_id).all():
        items.append(HitoCronologia(
            tipo="consentimiento", ocurrido_en=consentimiento.otorgado_en,
            titulo="Consentimiento registrado",
            detalle="Revocado" if consentimiento.revocado_en is not None else "Vigente",
        ))
    for decision in (
        db.query(DecisionMedica).join(Inferencia, DecisionMedica.inferencia_id == Inferencia.id)
        .join(Imagen, Inferencia.imagen_id == Imagen.id).filter(Imagen.caso_id == caso_id).all()
    ):
        items.append(HitoCronologia(tipo="decision", ocurrido_en=decision.creado_en, titulo="Decisión médica registrada"))
    ficha = db.query(FichaClinica).filter(FichaClinica.caso_id == caso_id).first()
    if ficha is not None:
        items.append(HitoCronologia(tipo="ficha", ocurrido_en=ficha.creado_en, titulo="Ficha clínica registrada"))
    for version in db.query(FichaVersion).filter(FichaVersion.caso_id == caso_id).all():
        items.append(HitoCronologia(tipo="cambio_ficha", ocurrido_en=version.creado_en, titulo="Ficha clínica actualizada"))

    items.sort(key=lambda item: item.ocurrido_en, reverse=True)
    items = items[:100]
    registrar(
        db,
        request,
        AuditAction.RECORD_READ,
        AuditModule.PATIENTS,
        usuario=actual.usuario,
        tipo_objeto=AuditObjectType.CASE,
        objeto_id=caso_id,
        detalles={"resource_count": len(items)},
    )
    return CronologiaOut(items=items)
