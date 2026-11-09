"""Gestión de sesiones: tokens, hashing, creación y validación."""

from __future__ import annotations

import hashlib
import hmac
import secrets
from datetime import UTC, datetime, timedelta
from typing import Any

from sqlalchemy.orm import Session

from app.config import get_settings
from app.models.sesiones import Sesion


def generate_session_token() -> str:
    """Genera un token aleatorio seguro de 32 bytes."""
    return secrets.token_urlsafe(32)


def hash_token(token: str) -> str:
    """Guarda solo el hash del token."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def constant_time_compare(a: str, b: str) -> bool:
    """Comparación en tiempo constante."""
    return hmac.compare_digest(a, b)


def _aware(momento: datetime) -> datetime:
    """Normaliza a UTC una marca que puede venir sin zona desde la base."""
    if momento.tzinfo is None:
        return momento.replace(tzinfo=UTC)
    return momento


def create_session(
    db: Session,
    usuario_id: Any,
    rol_activo_id: Any | None = None,
    ip_origen: str | None = None,
    agente_usuario: str | None = None,
) -> tuple[Sesion, str]:
    settings = get_settings()
    token = generate_session_token()
    token_h = hash_token(token)
    ahora = datetime.now(UTC)
    expira_en = ahora + timedelta(minutes=settings.session_ttl_minutes)
    sesion = Sesion(
        usuario_id=usuario_id,
        token_hash=token_h,
        expira_en=expira_en,
        ultima_actividad=ahora,
        rol_activo_id=rol_activo_id,
        ip_origen=ip_origen,
        agente_usuario=agente_usuario,
    )
    db.add(sesion)
    db.commit()
    db.refresh(sesion)
    return sesion, token


def get_session_by_token(db: Session, token: str) -> Sesion | None:
    token_h = hash_token(token)
    sesion = db.query(Sesion).filter(Sesion.token_hash == token_h).first()
    if sesion is None:
        return None
    now = datetime.now(UTC)
    if sesion.revocada_en is not None:
        return None
    # Normalizar comparacion de zonas horarias si fuera necesario
    expira = sesion.expira_en
    if expira.tzinfo is None:
        expira = expira.replace(tzinfo=UTC)
    if expira < now:
        return None
    return sesion


def sesion_inactiva(sesion: Sesion) -> bool:
    """¿Pasó el tiempo de inactividad configurado? (HU-005)."""
    limite = _aware(sesion.ultima_actividad) + timedelta(
        minutes=get_settings().session_inactividad_minutos
    )
    return limite < datetime.now(UTC)


def segundos_para_expirar(sesion: Sesion) -> int:
    """Segundos hasta que la sesión caduca, por inactividad o por tiempo máximo."""
    now = datetime.now(UTC)
    por_inactividad = _aware(sesion.ultima_actividad) + timedelta(
        minutes=get_settings().session_inactividad_minutos
    )
    limite = min(_aware(sesion.expira_en), por_inactividad)
    return max(0, int((limite - now).total_seconds()))


def tocar_sesion(db: Session, sesion: Sesion, minimo_segundos: int = 30) -> None:
    """Marca actividad, sin escribir en cada request (ahorra una escritura por llamada).

    El aviso de inactividad de la interfaz consulta ``/auth/me`` periódicamente,
    así que ese umbral de 30 s es el margen máximo de error al expirar.
    """
    ahora = datetime.now(UTC)
    if (ahora - _aware(sesion.ultima_actividad)).total_seconds() < minimo_segundos:
        return
    sesion.ultima_actividad = ahora
    db.add(sesion)
    db.commit()


def revoke_session(db: Session, sesion: Sesion) -> None:
    """Cierra la sesión; si ya estaba cerrada, no hace nada."""
    if sesion.revocada_en is None:
        sesion.revocada_en = datetime.now(UTC)
        db.add(sesion)
        db.commit()
        db.refresh(sesion)
