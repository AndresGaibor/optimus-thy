from __future__ import annotations

import hashlib
import re
import zlib

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.auditoria import Auditoria
from tests import test_reportes as base

pytest_plugins = ("tests.test_reportes",)


def _descomprimir_stream(stream: bytes) -> bytes | None:
    try:
        return zlib.decompress(stream)
    except zlib.error:
        return stream


def test_reporte_consolidado_y_verificacion(
    client: TestClient, mundo: dict, db_session: Session
) -> None:
    base._entrar(client, mundo["medico"])
    caso_id = base._caso(client)
    base._inferencia(db_session, caso_id)
    base._inferencia(db_session, caso_id, ruta="casos/prueba/imagenes/otra.png")
    db_session.commit()

    respuesta = client.get(f"/casos/{caso_id}/reporte.pdf")

    assert respuesta.status_code == 200
    assert respuesta.content.startswith(b"%PDF")
    huella = respuesta.headers["X-Reporte-Huella"]
    assert hashlib.sha256(respuesta.content).hexdigest() == huella
    assert re.fullmatch(r"[0-9a-f]{64}", huella)
    identificador = respuesta.headers["X-Reporte-Identificador"]
    assert re.fullmatch(r"REP-[0-9a-f]{12}", identificador)
    streams = re.findall(rb"stream\r?\n(.*?)\r?\nendstream", respuesta.content, re.DOTALL)
    texto_pdf = b"\n".join(
        contenido for stream in streams if (contenido := _descomprimir_stream(stream)) is not None
    )
    assert identificador.encode() in texto_pdf
    assert respuesta.headers["content-disposition"].startswith('attachment; filename="reporte-')
    assert respuesta.headers["content-disposition"].endswith('-consolidado.pdf"')
    evento = (
        db_session.query(Auditoria)
        .filter(Auditoria.detalles.op("->>")("report_sha256") == huella)
        .one()
    )
    assert evento.detalles["report_kind"] == "consolidado"
    assert evento.detalles["report_sha256"] == huella
    assert evento.detalles["content_sha256"][:12] == identificador.removeprefix("REP-")
    assert evento.detalles["resource_count"] == 2

    for valor in (identificador, huella):
        verificacion = client.get(f"/reportes/{valor}")
        assert verificacion.status_code == 200
        assert verificacion.json()["valido"] is True
        assert verificacion.json()["identificador"] == identificador
        assert verificacion.json()["huella_archivo"] == huella
        assert verificacion.json()["inferencias"] == 2


def test_huella_inventada_no_es_valida(client: TestClient, mundo: dict) -> None:
    base._entrar(client, mundo["medico"])
    for valor in ("REP-" + "f" * 12, "a" * 64):
        respuesta = client.get(f"/reportes/{valor}")
        assert respuesta.status_code == 404


def test_caso_sin_inferencias_responde_409(client: TestClient, mundo: dict) -> None:
    base._entrar(client, mundo["medico"])
    caso_id = base._caso(client)
    respuesta = client.get(f"/casos/{caso_id}/reporte.pdf")
    assert respuesta.status_code == 409
    assert respuesta.json()["error"]["code"] == "sin_inferencias"


def test_caso_de_otra_institucion_responde_404(
    client: TestClient, mundo: dict, db_session: Session
) -> None:
    base._entrar(client, mundo["medico"])
    # La fixture de reportes configura otro médico/institución.
    base._entrar(client, mundo["medico_solca"])
    caso_id = base._caso(client)
    client.cookies.clear()
    base._entrar(client, mundo["medico"])
    respuesta = client.get(f"/casos/{caso_id}/reporte.pdf")
    assert respuesta.status_code == 404
