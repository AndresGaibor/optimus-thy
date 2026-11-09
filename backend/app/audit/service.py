"""Servicio de auditoría de solo escritura (HT-030).

Reglas que el servicio garantiza:

- No expone forma alguna de modificar o borrar eventos.
- Los detalles son códigos y números, nunca texto libre: no pueden llevar
  nombres, cédulas ni contenido clínico.
- La hora la pone la base de datos (``now()``), no el proceso.
"""

from __future__ import annotations

import re
import uuid
from collections.abc import Mapping
from typing import Final

from sqlalchemy.orm import Session

from app.audit.actions import AuditAction, AuditModule, AuditObjectType
from app.models.auditoria import Auditoria
from app.models.usuarios import Usuario

__all__ = ["AuditError", "AuditService"]

Detalle = str | int | float | bool | uuid.UUID

#: Claves admitidas en ``detalles``. Añadir una clave aquí es la única forma de
#: guardar más contexto, y todas son códigos o números.
CLAVES_DE_DETALLE: Final[frozenset[str]] = frozenset(
    {
        "model_name",
        "model_version",
        "result_label",
        "confidence",
        "reason_code",
        "resource_count",
        "attempt_count",
        "file_kind",
        "from_status",
        "to_status",
        "role_code",
        "permission_code",
        "setting_key",
        "error_code",
        "format",
    }
)

#: Un valor de texto es un código: sin espacios, sin acentos y corto.
_CODIGO_RE = re.compile(r"^[A-Za-z0-9_.:@/+-]{1,64}$")
_IP_RE = re.compile(r"^[0-9a-fA-F:.]{3,45}$")

_MAX_AGENTE = 255
"""``auditoria.user_agent`` guarda como mucho 255 caracteres."""


class AuditError(Exception):
    """El evento no cumple las reglas de la bitácora."""


def _validar_detalles(detalles: Mapping[str, Detalle] | None) -> dict[str, Detalle] | None:
    if detalles is None:
        return None
    desconocidas = set(detalles) - CLAVES_DE_DETALLE
    if desconocidas:
        raise AuditError(f"Claves de detalle no permitidas: {sorted(desconocidas)}")
    limpios: dict[str, Detalle] = {}
    for clave, valor in detalles.items():
        if isinstance(valor, str):
            if not _CODIGO_RE.match(valor):
                raise AuditError(f"El detalle «{clave}» solo admite códigos, no texto libre")
        elif not isinstance(valor, (int, float, bool, uuid.UUID)):
            raise AuditError(f"El detalle «{clave}» tiene un tipo no permitido")
        limpios[clave] = valor
    return limpios


class AuditService:
    """Registra eventos; no los lee, no los edita y no los borra."""

    def __init__(self, session: Session) -> None:
        self._session = session

    def record(
        self,
        accion: AuditAction,
        modulo: AuditModule,
        *,
        usuario: Usuario | None = None,
        institucion_id: uuid.UUID | None = None,
        rol: str | None = None,
        tipo_objeto: AuditObjectType | None = None,
        objeto_id: uuid.UUID | None = None,
        ip: str | None = None,
        agente_usuario: str | None = None,
        detalles: Mapping[str, Detalle] | None = None,
    ) -> Auditoria:
        """Añade un evento a la sesión; el commit lo decide quien llama."""
        if not isinstance(accion, AuditAction):
            raise AuditError("Acción de auditoría desconocida")
        if not isinstance(modulo, AuditModule):
            raise AuditError("Módulo de auditoría desconocido")
        if tipo_objeto is not None and not isinstance(tipo_objeto, AuditObjectType):
            raise AuditError("Tipo de objeto de auditoría desconocido")
        if objeto_id is not None and tipo_objeto is None:
            raise AuditError("Un objeto referenciado necesita su tipo")
        if ip is not None and not _IP_RE.match(ip):
            raise AuditError("Dirección de origen no válida")
        if agente_usuario is not None and len(agente_usuario) > _MAX_AGENTE:
            raise AuditError("El agente de usuario es demasiado largo")

        contexto = dict(detalles) if detalles is not None else {}
        if rol is not None:
            contexto["role_code"] = rol

        evento = Auditoria(
            usuario_id=usuario.id if usuario is not None else None,
            institucion_id=(
                institucion_id
                if institucion_id is not None
                else usuario.institucion_id
                if usuario is not None
                else None
            ),
            # Una sola cadena legible en la tabla: módulo y acción.
            accion=f"{modulo.value}.{accion.value}",
            entidad=tipo_objeto.value if tipo_objeto is not None else modulo.value,
            entidad_id=str(objeto_id) if objeto_id is not None else None,
            direccion_ip=ip,
            user_agent=agente_usuario,
            detalles=_validar_detalles(contexto or None),
        )
        self._session.add(evento)
        return evento

    def record_denied(
        self,
        modulo: AuditModule,
        *,
        motivo: str,
        usuario: Usuario | None = None,
        institucion_id: uuid.UUID | None = None,
        rol: str | None = None,
        tipo_objeto: AuditObjectType | None = None,
        objeto_id: uuid.UUID | None = None,
        ip: str | None = None,
    ) -> Auditoria:
        """Atajo para un acceso denegado (RF-AUD-07, RS-INC-01)."""
        return self.record(
            AuditAction.ACCESS_DENIED,
            modulo,
            usuario=usuario,
            institucion_id=institucion_id,
            rol=rol,
            tipo_objeto=tipo_objeto,
            objeto_id=objeto_id,
            ip=ip,
            detalles={"reason_code": motivo},
        )
