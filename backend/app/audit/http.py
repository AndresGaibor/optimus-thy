"""Registro de eventos de auditoría desde las rutas HTTP (HT-030)."""

from __future__ import annotations

import ipaddress
import uuid
from collections.abc import Mapping

from fastapi import Request
from sqlalchemy.orm import Session

from app.audit.actions import AuditAction, AuditModule, AuditObjectType
from app.audit.service import _MAX_AGENTE, AuditService, Detalle
from app.models.usuarios import Usuario


def _ip(request: Request) -> str | None:
    host = request.client.host if request.client else None
    if host is None:
        return None
    try:
        return str(ipaddress.ip_address(host))
    except ValueError:
        return None


def registrar(
    db: Session,
    request: Request,
    accion: AuditAction,
    modulo: AuditModule,
    *,
    usuario: Usuario | None = None,
    rol: str | None = None,
    tipo_objeto: AuditObjectType | None = None,
    objeto_id: uuid.UUID | None = None,
    detalles: Mapping[str, Detalle] | None = None,
) -> None:
    """Añade el evento y confirma; solo guarda códigos, nunca texto libre."""
    agente = request.headers.get("user-agent")
    AuditService(db).record(
        accion,
        modulo,
        usuario=usuario,
        rol=rol,
        tipo_objeto=tipo_objeto,
        objeto_id=objeto_id,
        ip=_ip(request),
        agente_usuario=agente[:_MAX_AGENTE] if agente else None,
        detalles=detalles,
    )
    db.commit()


def registrar_denegado(
    db: Session,
    request: Request,
    modulo: AuditModule,
    *,
    motivo: str,
    usuario: Usuario | None = None,
    rol: str | None = None,
) -> None:
    AuditService(db).record_denied(modulo, motivo=motivo, usuario=usuario, rol=rol, ip=_ip(request))
    db.commit()
