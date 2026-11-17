"""Administración de versiones de modelos de IA."""

from __future__ import annotations

import hashlib
import json
import re
import shutil
import tempfile
import uuid
import zipfile
from datetime import datetime
from pathlib import Path, PurePosixPath
from typing import Annotated

import httpx
from fastapi import APIRouter, Depends, File, Form, Request, UploadFile, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

from app.audit.actions import AuditAction, AuditModule, AuditObjectType
from app.audit.http import registrar
from app.auth.deps import SesionActual, requiere_permiso
from app.config import get_settings
from app.db import session_dep
from app.models.imagenes import ModeloIA

router = APIRouter(tags=["modelos-ia"])
_MAX_ARCHIVO = 600 * 1024 * 1024
_MAX_ENTRADAS = 10
_PESOS = {"best_yolo.pt", "best_bgaunet.keras", "best_swin.pth"}


class ModeloOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    nombre: str
    version: str
    hash_pesos: str
    ruta_pesos: str | None
    activo: bool
    creado_en: datetime


def _error(code: str, message: str, status_code: int) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={"error": {"code": code, "message": message}},
    )


def _slug(value: str) -> str:
    result = re.sub(r"[^a-z0-9._-]+", "-", value.strip().lower()).strip(".-_")
    if not result or result in {".", ".."}:
        raise ValueError
    return result


def _archivo_seguro(nombre: str) -> str:
    normalizado = nombre.replace("\\", "/")
    ruta = PurePosixPath(normalizado)
    if ruta.is_absolute() or re.match(r"^[a-zA-Z]:", normalizado) or ".." in ruta.parts:
        raise ValueError
    if ruta.as_posix() in _PESOS:
        return ruta.name
    if ruta.as_posix() in {f"models/{peso}" for peso in _PESOS}:
        return ruta.name
    raise ValueError


def _extraer(paquete: zipfile.ZipFile, staging: Path) -> tuple[dict[str, str], str]:
    entradas = paquete.infolist()
    if len(entradas) > _MAX_ENTRADAS:
        raise ValueError
    seleccionadas: dict[str, zipfile.ZipInfo] = {}
    for entrada in entradas:
        nombre = entrada.filename.replace("\\", "/")
        if entrada.is_dir():
            if nombre != "models/":
                raise ValueError
            continue
        peso = _archivo_seguro(nombre)
        if peso in seleccionadas:
            raise ValueError
        if entrada.external_attr >> 16 & 0o170000 == 0o120000:
            raise ValueError
        seleccionadas[peso] = entrada
    if set(seleccionadas) != _PESOS:
        raise ValueError

    hashes: dict[str, str] = {}
    huella = hashlib.sha256()
    total = 0
    for nombre in sorted(_PESOS):
        info = seleccionadas[nombre]
        digest = hashlib.sha256()
        huella.update(nombre.encode("utf-8"))
        huella.update(info.file_size.to_bytes(8, "big"))
        with paquete.open(info) as origen, (staging / nombre).open("wb") as destino:
            while bloque := origen.read(1024 * 1024):
                total += len(bloque)
                if total > _MAX_ARCHIVO:
                    raise ValueError
                digest.update(bloque)
                huella.update(bloque)
                destino.write(bloque)
        hashes[nombre] = digest.hexdigest()
    return hashes, huella.hexdigest()


@router.get("/modelos-ia", response_model=list[ModeloOut])
def listar_modelos(
    _actual: Annotated[SesionActual, Depends(requiere_permiso("ajustes.gestionar"))],
    db: Annotated[Session, Depends(session_dep)],
) -> list[ModeloIA]:
    return db.query(ModeloIA).order_by(ModeloIA.creado_en.desc()).all()


@router.post("/modelos-ia", status_code=status.HTTP_201_CREATED, response_model=ModeloOut)
def cargar_modelo(
    request: Request,
    archivo: Annotated[UploadFile, File()],
    nombre: Annotated[str, Form()],
    version: Annotated[str, Form()],
    actual: Annotated[SesionActual, Depends(requiere_permiso("ajustes.gestionar"))],
    db: Annotated[Session, Depends(session_dep)],
) -> ModeloIA | JSONResponse:
    if Path(archivo.filename or "").suffix.lower() != ".zip":
        return _error("paquete_invalido", "El archivo debe ser un paquete ZIP válido.", 422)
    try:
        nombre_slug, version_slug = _slug(nombre), _slug(version)
    except ValueError:
        return _error("identificador_invalido", "El nombre y la versión no son válidos.", 422)

    settings = get_settings()
    root = Path(settings.modelos_dir)
    try:
        root.mkdir(parents=True, exist_ok=True)
        archivo.file.seek(0, 2)
        size = archivo.file.tell()
        archivo.file.seek(0)
    except OSError:
        return _error("paquete_invalido", "No se pudo leer el paquete.", 422)
    if size > _MAX_ARCHIVO:
        return _error("archivo_demasiado_grande", "El paquete supera el límite de 600 MB.", 413)

    staging: Path | None = None
    destino = root / nombre_slug / version_slug
    instalado = False
    registrado = False
    try:
        with zipfile.ZipFile(archivo.file) as paquete:
            staging = Path(tempfile.mkdtemp(dir=root))
            hashes, huella = _extraer(paquete, staging)
        if destino.exists():
            raise FileExistsError
        destino.parent.mkdir(parents=True, exist_ok=True)
        staging.rename(destino)
        instalado = True
        modelo = ModeloIA(
            nombre=nombre_slug,
            version=version_slug,
            hash_pesos=huella,
            parametros=json.dumps(hashes, sort_keys=True),
            ruta_pesos=str(destino),
            activo=False,
        )
        db.add(modelo)
        db.commit()
        registrado = True
        db.refresh(modelo)
        return modelo
    except Exception:
        db.rollback()
        if staging is not None and staging.exists():
            shutil.rmtree(staging, ignore_errors=True)
        if instalado and not registrado and destino.exists():
            shutil.rmtree(destino, ignore_errors=True)
        return _error("paquete_invalido", "No se pudo procesar el paquete.", 422)
    finally:
        archivo.file.close()


@router.post("/modelos-ia/{id}/activar", response_model=ModeloOut)
def activar_modelo(
    id: uuid.UUID,
    request: Request,
    actual: Annotated[SesionActual, Depends(requiere_permiso("ajustes.gestionar"))],
    db: Annotated[Session, Depends(session_dep)],
) -> ModeloIA | JSONResponse:
    modelo = db.get(ModeloIA, id)
    if modelo is None:
        return _error("modelo_no_encontrado", "No se encontró el modelo solicitado.", 404)
    if not modelo.ruta_pesos:
        return _error("modelo_sin_pesos", "El modelo no tiene una carpeta de pesos.", 422)
    try:
        version = Path(modelo.ruta_pesos).relative_to(Path(get_settings().modelos_dir)).as_posix()
    except ValueError:
        return _error("modelo_sin_pesos", "La carpeta del modelo no está en MODELOS_DIR.", 422)
    estados_previos = {fila.id: fila.activo for fila in db.query(ModeloIA).all()}
    try:
        db.query(ModeloIA).update({ModeloIA.activo: False}, synchronize_session=False)
        modelo.activo = True
        db.commit()
        respuesta = httpx.post(
            f"{get_settings().ia_url.rstrip('/')}/recargar",
            params={"version": version},
            timeout=120,
        )
        respuesta.raise_for_status()
        if respuesta.json().get("status") == "degradado":
            raise RuntimeError("recarga degradada")
    except Exception:
        db.rollback()
        for modelo_id, estaba_activo in estados_previos.items():
            db.query(ModeloIA).filter_by(id=modelo_id).update(
                {ModeloIA.activo: estaba_activo}, synchronize_session=False
            )
        db.commit()
        return _error("recarga_fallida", "El servicio de IA no pudo recargar el modelo.", 502)

    registrar(
        db,
        request,
        AuditAction.SETTINGS_CHANGE,
        AuditModule.ADMIN,
        usuario=actual.usuario,
        rol=actual.rol_activo.nombre if actual.rol_activo else None,
        tipo_objeto=AuditObjectType.SYSTEM,
        objeto_id=modelo.id,
    )
    db.refresh(modelo)
    return modelo
