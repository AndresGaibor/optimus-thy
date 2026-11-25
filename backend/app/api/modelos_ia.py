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
from fastapi import APIRouter, Depends, File, Form, Request, Response, UploadFile, status
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
# Los paquetes superan el límite de Cloudflare (100 MB) y el del borde nginx:
# el cliente los envía en trozos de 25 MB para poder ensamblarlos aquí.
_MAX_TROZO = 32 * 1024 * 1024
_MAX_TROZOS = 64
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
        # Finder añade __MACOSX/ y .DS_Store al comprimir: son metadatos, no pesos.
        if nombre.startswith("__MACOSX/") or nombre.rsplit("/", 1)[-1] == ".DS_Store":
            continue
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


def _instalar(
    paquete: zipfile.ZipFile,
    nombre_slug: str,
    version_slug: str,
    db: Session,
) -> ModeloIA:
    """Extrae los tres pesos del paquete y registra la versión; limpia si falla."""
    root = Path(get_settings().modelos_dir)
    root.mkdir(parents=True, exist_ok=True)
    destino = root / nombre_slug / version_slug
    staging: Path | None = None
    instalado = False
    registrado = False
    try:
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
    finally:
        if staging is not None and staging.exists():
            shutil.rmtree(staging, ignore_errors=True)
        if not registrado:
            db.rollback()
            if instalado and destino.exists():
                shutil.rmtree(destino, ignore_errors=True)


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
    try:
        archivo.file.seek(0, 2)
        size = archivo.file.tell()
        archivo.file.seek(0)
    except OSError:
        return _error("paquete_invalido", "No se pudo leer el paquete.", 422)
    if size > _MAX_ARCHIVO:
        return _error("archivo_demasiado_grande", "El paquete supera el límite de 600 MB.", 413)
    try:
        with zipfile.ZipFile(archivo.file) as paquete:
            return _instalar(paquete, nombre_slug, version_slug, db)
    except FileExistsError:
        return _error("modelo_duplicado", "Ya existe esa versión del modelo.", 409)
    except (zipfile.BadZipFile, ValueError, OSError):
        return _error("paquete_invalido", "No se pudo procesar el paquete.", 422)
    finally:
        archivo.file.close()


class SubidaOut(BaseModel):
    id: uuid.UUID


def _carpeta_subida(subida_id: uuid.UUID) -> Path:
    return Path(get_settings().modelos_dir) / ".subidas" / str(subida_id)


@router.post(
    "/modelos-ia/paquetes",
    status_code=status.HTTP_202_ACCEPTED,
    response_model=SubidaOut,
)
def iniciar_paquete(
    nombre: Annotated[str, Form()],
    version: Annotated[str, Form()],
    _actual: Annotated[SesionActual, Depends(requiere_permiso("ajustes.gestionar"))],
) -> SubidaOut | JSONResponse:
    """Abre una subida por trozos para un paquete que supera el límite del proxy."""
    try:
        nombre_slug, version_slug = _slug(nombre), _slug(version)
    except ValueError:
        return _error("identificador_invalido", "El nombre y la versión no son válidos.", 422)
    subida_id = uuid.uuid4()
    carpeta = _carpeta_subida(subida_id)
    try:
        carpeta.mkdir(parents=True)
        (carpeta / "meta.json").write_text(
            json.dumps({"nombre": nombre_slug, "version": version_slug}),
            encoding="utf-8",
        )
    except OSError:
        return _error("paquete_invalido", "No se pudo iniciar la subida.", 422)
    return SubidaOut(id=subida_id)


@router.put(
    "/modelos-ia/paquetes/{subida_id}/trozos/{indice}", status_code=status.HTTP_204_NO_CONTENT
)
async def subir_trozo(
    subida_id: uuid.UUID,
    indice: int,
    request: Request,
    _actual: Annotated[SesionActual, Depends(requiere_permiso("ajustes.gestionar"))],
) -> Response:
    if not 0 <= indice < _MAX_TROZOS:
        return _error("trozo_invalido", "El índice del trozo no es válido.", 422)
    carpeta = _carpeta_subida(subida_id)
    if not carpeta.is_dir():
        return _error("paquete_no_encontrado", "La subida no existe o expiró.", 404)
    destino = carpeta / f"trozo-{indice:03d}.bin"
    total = 0
    try:
        with destino.open("wb") as salida:
            async for bloque in request.stream():
                total += len(bloque)
                if total > _MAX_TROZO:
                    raise ValueError
                salida.write(bloque)
    except ValueError:
        destino.unlink(missing_ok=True)
        return _error("trozo_demasiado_grande", "El trozo supera el límite de 32 MB.", 413)
    except OSError:
        destino.unlink(missing_ok=True)
        return _error("paquete_invalido", "No se pudo guardar el trozo.", 422)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post(
    "/modelos-ia/paquetes/{subida_id}/cerrar",
    status_code=status.HTTP_201_CREATED,
    response_model=ModeloOut,
)
def cerrar_paquete(
    subida_id: uuid.UUID,
    _actual: Annotated[SesionActual, Depends(requiere_permiso("ajustes.gestionar"))],
    db: Annotated[Session, Depends(session_dep)],
) -> ModeloIA | JSONResponse:
    carpeta = _carpeta_subida(subida_id)
    if not carpeta.is_dir():
        return _error("paquete_no_encontrado", "La subida no existe o expiró.", 404)
    try:
        meta = json.loads((carpeta / "meta.json").read_text(encoding="utf-8"))
        trozos = sorted(carpeta.glob("trozo-*.bin"))
        if not trozos or {t.name for t in trozos} != {
            f"trozo-{i:03d}.bin" for i in range(len(trozos))
        }:
            return _error("paquete_incompleto", "Faltan trozos por subir.", 422)
        total = sum(t.stat().st_size for t in trozos)
        if total > _MAX_ARCHIVO:
            return _error("archivo_demasiado_grande", "El paquete supera el límite de 600 MB.", 413)
        paquete_zip = carpeta / "paquete.zip"
        with paquete_zip.open("wb") as salida:
            for trozo in trozos:
                with trozo.open("rb") as origen:
                    shutil.copyfileobj(origen, salida, 1024 * 1024)
        with zipfile.ZipFile(paquete_zip) as paquete:
            return _instalar(paquete, meta["nombre"], meta["version"], db)
    except FileExistsError:
        return _error("modelo_duplicado", "Ya existe esa versión del modelo.", 409)
    except (OSError, ValueError, KeyError, zipfile.BadZipFile):
        return _error("paquete_invalido", "No se pudo procesar el paquete.", 422)
    finally:
        shutil.rmtree(carpeta, ignore_errors=True)


@router.delete("/modelos-ia/paquetes/{subida_id}", status_code=status.HTTP_204_NO_CONTENT)
def cancelar_paquete(
    subida_id: uuid.UUID,
    _actual: Annotated[SesionActual, Depends(requiere_permiso("ajustes.gestionar"))],
) -> Response:
    shutil.rmtree(_carpeta_subida(subida_id), ignore_errors=True)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


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
