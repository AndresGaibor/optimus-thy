"""Consulta de alertas ante patrones raros de uso en la bitácora.

- Solo se analizan los eventos de la institución de quien consulta y de las
  últimas 24 horas.
- Se alertan cinco fallos de acceso en quince minutos, treinta exportaciones o
  descargas en veinticuatro horas y cada exportación fuera de 07:00-19:00 en
  America/Guayaquil.
- La consulta exige `auditoria.leer` y queda registrada como `AUDIT_READ`, sin
  almacenar la IP ni el detalle de ninguna alerta en ese registro.
"""

from __future__ import annotations

import uuid
from datetime import UTC, datetime, timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel, ConfigDict
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.audit.actions import AuditAction, AuditModule, AuditObjectType
from app.audit.http import registrar
from app.auth.deps import SesionActual, requiere_permiso
from app.db import session_dep
from app.models.auditoria import Auditoria
from app.security.alertas import EventoAuditoriaFila, detectar_alertas

router = APIRouter(tags=["alertas"])


class AlertaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    tipo: str
    severidad: str
    cantidad: int
    usuario_id: uuid.UUID | None
    desde: datetime
    hasta: datetime
    detalle: str


@router.get("/seguridad/alertas", response_model=list[AlertaOut])
def consultar_alertas(
    request: Request,
    db: Annotated[Session, Depends(session_dep)],
    actual: Annotated[SesionActual, Depends(requiere_permiso("auditoria.leer"))],
) -> list[AlertaOut]:
    """Devuelve patrones detectados en la bitácora reciente de la institución."""
    desde = datetime.now(UTC) - timedelta(hours=24)
    filas = db.execute(
        select(
            Auditoria.ocurrido_en,
            Auditoria.usuario_id,
            Auditoria.direccion_ip,
            Auditoria.accion,
        ).where(
            Auditoria.institucion_id == actual.usuario.institucion_id,
            Auditoria.ocurrido_en >= desde,
        )
    ).all()
    eventos = [EventoAuditoriaFila(*fila) for fila in filas]
    alertas = detectar_alertas(eventos)
    registrar(
        db,
        request,
        AuditAction.AUDIT_READ,
        AuditModule.AUDIT,
        usuario=actual.usuario,
        rol=actual.rol_activo.nombre if actual.rol_activo else None,
        tipo_objeto=AuditObjectType.AUDIT,
        detalles={"resource_count": len(alertas)},
    )
    return [AlertaOut.model_validate(alerta) for alerta in alertas]
