"""Carga, validación y activación de paquetes de modelos IA."""

from __future__ import annotations

import hashlib
import io
import json
import zipfile
from pathlib import Path
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.audit.actions import AuditAction
from app.models.auditoria import Auditoria
from app.models.imagenes import ModeloIA
from app.models.instituciones import Institucion
from app.models.usuarios import Rol, Usuario, UsuarioRol
from app.security.passwords import hash_password

CLAVE = "claveSegura-123"
PESOS = {
    "best_yolo.pt": b"yolo weights",
    "best_bgaunet.keras": b"bgaunet weights",
    "best_swin.pth": b"swin weights",
}


def _zip(contenido: dict[str, bytes] | None = None) -> bytes:
    contenido = PESOS if contenido is None else contenido
    archivo = io.BytesIO()
    with zipfile.ZipFile(archivo, "w") as paquete:
        for nombre, datos in contenido.items():
            paquete.writestr(nombre, datos)
    return archivo.getvalue()


def _usuario(db: Session, rol_nombre: str) -> str:
    institucion = db.query(Institucion).first()
    if institucion is None:
        institucion = Institucion(nombre="Hospital Prueba", codigo="hosp_prueba")
        db.add(institucion)
        db.commit()
        db.refresh(institucion)
    rol = db.query(Rol).filter_by(nombre=rol_nombre).first()
    if rol is None:
        rol = Rol(nombre=rol_nombre, descripcion=rol_nombre)
        db.add(rol)
        db.commit()
        db.refresh(rol)
    correo = f"{rol_nombre}@modelos.test"
    usuario = Usuario(
        email=correo,
        nombre=rol_nombre,
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


def _login(client: TestClient, db: Session, rol: str = "admin") -> None:
    correo = _usuario(db, rol)
    assert client.post("/auth/login", json={"correo": correo, "password": CLAVE}).status_code == 200


def _subir(
    client: TestClient, contenido: bytes | None = None, nombre: str = "modelo", version: str = "v1"
):
    return client.post(
        "/modelos-ia",
        data={"nombre": nombre, "version": version},
        files={
            "archivo": ("pesos.zip", _zip() if contenido is None else contenido, "application/zip")
        },
    )


def test_zip_valido_registra_modelo_y_extrae_pesos(
    client: TestClient, db_session: Session, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    from app.api import modelos_ia

    monkeypatch.setattr(
        modelos_ia, "get_settings", lambda: SimpleNamespace(modelos_dir=str(tmp_path))
    )
    _login(client, db_session)

    respuesta = _subir(client)

    assert respuesta.status_code == 201, respuesta.text
    fila = db_session.query(ModeloIA).one()
    carpeta = tmp_path / "modelo" / "v1"
    assert fila.nombre == "modelo" and fila.version == "v1" and not fila.activo
    assert Path(fila.ruta_pesos) == carpeta
    assert {archivo.name for archivo in carpeta.iterdir()} == set(PESOS)
    assert respuesta.json()["hash_pesos"] == fila.hash_pesos
    assert json.loads(fila.parametros) == {
        nombre: hashlib.sha256(datos).hexdigest() for nombre, datos in PESOS.items()
    }
    huella = hashlib.sha256()
    for nombre, datos in sorted(PESOS.items()):
        huella.update(nombre.encode())
        huella.update(len(datos).to_bytes(8, "big"))
        huella.update(datos)
    assert fila.hash_pesos == huella.hexdigest()


@pytest.mark.parametrize(
    "contenido",
    [
        _zip({"best_yolo.pt": b"yolo", "best_swin.pth": b"swin"}),
        _zip({**PESOS, "unexpected.bin": b"extra"}),
        _zip(
            {"../best_yolo.pt": b"bad", "best_bgaunet.keras": b"bgaunet", "best_swin.pth": b"swin"}
        ),
    ],
)
def test_zip_invalido_se_rechaza_sin_fila(
    client: TestClient,
    db_session: Session,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
    contenido: bytes,
) -> None:
    from app.api import modelos_ia

    monkeypatch.setattr(
        modelos_ia, "get_settings", lambda: SimpleNamespace(modelos_dir=str(tmp_path))
    )
    _login(client, db_session)

    respuesta = _subir(client, contenido)

    assert respuesta.status_code == 422
    assert respuesta.json()["error"]["code"] in {
        "paquete_invalido",
        "ruta_invalida",
        "pesos_incompletos",
    }
    assert db_session.query(ModeloIA).count() == 0
    assert list(tmp_path.iterdir()) == []


def test_archivo_no_zip_se_rechaza(client: TestClient, db_session: Session) -> None:
    _login(client, db_session)

    respuesta = client.post(
        "/modelos-ia",
        data={"nombre": "modelo", "version": "v1"},
        files={"archivo": ("pesos.tar", b"not a zip", "application/octet-stream")},
    )

    assert respuesta.status_code == 422
    assert respuesta.json()["error"]["code"] == "paquete_invalido"


def test_usuario_sin_permiso_no_puede_listar_modelos(
    client: TestClient, db_session: Session
) -> None:
    _login(client, db_session, "doctor")
    assert client.get("/modelos-ia").status_code == 403


def test_acepta_pesos_dentro_de_models(
    client: TestClient, db_session: Session, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    from app.api import modelos_ia

    monkeypatch.setattr(
        modelos_ia, "get_settings", lambda: SimpleNamespace(modelos_dir=str(tmp_path))
    )
    _login(client, db_session)
    contenido = _zip({f"models/{nombre}": datos for nombre, datos in PESOS.items()})

    respuesta = _subir(client, contenido)

    assert respuesta.status_code == 201, respuesta.text
    assert {archivo.name for archivo in (tmp_path / "modelo" / "v1").iterdir()} == set(PESOS)


def test_paquete_mayor_a_limite_responde_413(
    client: TestClient,
    db_session: Session,
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
) -> None:
    from app.api import modelos_ia

    monkeypatch.setattr(modelos_ia, "_MAX_ARCHIVO", 1)
    monkeypatch.setattr(
        modelos_ia, "get_settings", lambda: SimpleNamespace(modelos_dir=str(tmp_path))
    )
    _login(client, db_session)

    respuesta = _subir(client)

    assert respuesta.status_code == 413
    assert respuesta.json()["error"]["code"] == "archivo_demasiado_grande"


def test_activar_versiones_mantiene_una_activa(
    client: TestClient,
    db_session: Session,
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
) -> None:
    from app.api import modelos_ia

    class Recarga:
        status_code = 200

        def json(self):
            return {"status": "ok"}

        def raise_for_status(self):
            return None

    monkeypatch.setattr(modelos_ia.httpx, "post", lambda *args, **kwargs: Recarga())
    monkeypatch.setattr(
        modelos_ia,
        "get_settings",
        lambda: SimpleNamespace(modelos_dir=str(tmp_path), ia_url="http://ia"),
    )
    _login(client, db_session)
    versiones = [
        ModeloIA(
            nombre="modelo",
            version=f"v{i}",
            hash_pesos=str(i) * 64,
            activo=False,
            ruta_pesos=str(tmp_path / "modelo" / f"v{i}"),
        )
        for i in (1, 2)
    ]
    db_session.add_all(versiones)
    db_session.commit()

    assert client.post(f"/modelos-ia/{versiones[0].id}/activar").status_code == 200
    assert client.post(f"/modelos-ia/{versiones[1].id}/activar").status_code == 200

    activas = db_session.query(ModeloIA).filter_by(activo=True).all()
    assert [modelo.id for modelo in activas] == [versiones[1].id]
    evento = (
        db_session.query(Auditoria)
        .filter_by(accion="ADMIN.SETTINGS_CHANGE")
        .order_by(Auditoria.id.desc())
        .first()
    )
    assert evento is not None and evento.entidad_id == str(versiones[1].id)
    assert AuditAction.SETTINGS_CHANGE.value in evento.accion


def test_recarga_fallida_revierte_la_activacion(
    client: TestClient,
    db_session: Session,
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
) -> None:
    from app.api import modelos_ia

    class Recarga:
        status_code = 200

        def json(self):
            return {"status": "degradado"}

        def raise_for_status(self):
            return None

    monkeypatch.setattr(modelos_ia.httpx, "post", lambda *args, **kwargs: Recarga())
    monkeypatch.setattr(
        modelos_ia,
        "get_settings",
        lambda: SimpleNamespace(modelos_dir=str(tmp_path), ia_url="http://ia"),
    )
    _login(client, db_session)
    anterior = ModeloIA(
        nombre="modelo",
        version="v1",
        hash_pesos="1" * 64,
        activo=True,
        ruta_pesos=str(tmp_path / "modelo" / "v1"),
    )
    nueva = ModeloIA(
        nombre="modelo",
        version="v2",
        hash_pesos="2" * 64,
        activo=False,
        ruta_pesos=str(tmp_path / "modelo" / "v2"),
    )
    db_session.add_all([anterior, nueva])
    db_session.commit()

    respuesta = client.post(f"/modelos-ia/{nueva.id}/activar")

    assert respuesta.status_code == 502
    assert respuesta.json()["error"]["code"] == "recarga_fallida"
    db_session.expire_all()
    assert db_session.query(ModeloIA).filter_by(activo=True).one().id == anterior.id
    assert db_session.query(Auditoria).filter_by(accion="ADMIN.SETTINGS_CHANGE").count() == 0
