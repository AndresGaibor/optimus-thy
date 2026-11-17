"""HT-082: defensas de la aplicación ante ataques comunes (RS-APP-02/05/10).

Cada prueba ejerce la defensa real: el limitador, el filtro de Origin y los
esquemas de Pydantic no se sustituyen. Solo el almacenamiento S3 y el transporte
del servicio de IA usan dobles en memoria, como en el resto de la suite.
"""

from __future__ import annotations

import io
import uuid
from typing import Any

import httpx
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session, sessionmaker

from app.config import get_settings
from app.db import session_dep
from app.ia.cliente import ClienteIA
from app.jobs import manejadores
from app.jobs.worker import MANEJADORES, procesar_una
from app.main import create_app
from app.models.imagenes import Imagen
from app.models.instituciones import Institucion
from app.models.usuarios import Rol, Usuario, UsuarioRol
from app.security.limites import LimiteExcedido, VentanaDeslizante
from app.security.passwords import hash_password
from app.storage.s3 import ObjectStorage

CLAVE = "claveSegura-123"
PACIENTE = {
    "nombres": "Ana María",
    "apellidos": "Pérez Quishpe",
    "documento": "0601234567",
    "fecha_nacimiento": "1980-05-17",
}

CONTRATO: dict[str, Any] = {
    "version_contrato": "1.0",
    "ancho": 96,
    "alto": 96,
    "sin_nodulo": False,
    "nodulos": [
        {
            "indice": 1,
            "caja": {"xmin": 5, "ymin": 5, "xmax": 40, "ymax": 40},
            "confianza_detector": 0.9,
            "origen_mascara": "bgaunet",
            "clase": "benigno",
            "probabilidad_benigno": 0.8,
            "probabilidad_maligno": 0.2,
            "region_analizada": {"xmin": 0, "ymin": 0, "xmax": 96, "ymax": 96},
            "pixeles_mascara": 100,
        }
    ],
    "huella_modelos": "a" * 64,
    "umbrales": {"yolo_confianza": 0.25, "max_nodulos": 3},
}

CONTENIDO_IMAGEN = b"png-sintetico-de-prueba"
URL_METADATOS = "http://169.254.169.254/latest/meta-data/"


class ClienteS3Falso:
    """Almacenamiento en memoria: ningún caso abre una conexión real."""

    def __init__(self) -> None:
        self.objetos: dict[str, bytes] = {}

    def put_object(self, **kwargs: Any) -> dict[str, Any]:
        self.objetos[kwargs["Key"]] = kwargs["Body"]
        return {}

    def get_object(self, **kwargs: Any) -> dict[str, Any]:
        if kwargs["Key"] not in self.objetos:
            raise RuntimeError("objeto inexistente")
        datos = self.objetos[kwargs["Key"]]
        return {"Body": io.BytesIO(datos), "ContentLength": len(datos)}

    def delete_object(self, **kwargs: Any) -> dict[str, Any]:
        self.objetos.pop(kwargs["Key"], None)
        return {}

    def generate_presigned_url(
        self, ClientMethod: str, Params: dict[str, Any], ExpiresIn: int
    ) -> str:
        return f"https://storage.local/{Params['Bucket']}/{Params['Key']}?firma=abc"


def _usuario(db: Session, institucion: Institucion, correo: str, rol: Rol) -> Usuario:
    usuario = Usuario(
        email=correo,
        nombre=correo,
        institucion_id=institucion.id,
        activo=True,
        password_hash=hash_password(correo, CLAVE),
    )
    db.add(usuario)
    db.commit()
    db.refresh(usuario)
    db.add(UsuarioRol(usuario_id=usuario.id, rol_id=rol.id))
    db.commit()
    return usuario


@pytest.fixture()
def mundo(db_session: Session) -> dict[str, Any]:
    institucion = Institucion(nombre="ESPOCH", codigo="ESPOCH")
    db_session.add(institucion)
    db_session.commit()
    rol = Rol(nombre="doctor", descripcion="doctor")
    db_session.add(rol)
    db_session.commit()
    return {
        "institucion": institucion,
        "rol": rol,
        "medico": _usuario(db_session, institucion, "medico@t.com", rol),
    }


@pytest.fixture()
def almacen_manejador(monkeypatch: pytest.MonkeyPatch) -> ClienteS3Falso:
    doble = ClienteS3Falso()
    storage = ObjectStorage(doble, bucket="pruebas", presigned_seconds=600)
    monkeypatch.setattr(manejadores, "get_storage", lambda: storage)
    return doble


@pytest.fixture()
def app_con_limites(monkeypatch: pytest.MonkeyPatch, test_engine: Any) -> Any:
    """Fábrica de apps con el limitador encendido y la base de pruebas."""

    def _crear(rate_limit: int, inferencia: int) -> FastAPI:
        monkeypatch.setenv("RATE_LIMIT_POR_MINUTO", str(rate_limit))
        monkeypatch.setenv("INFERENCIA_POR_MINUTO", str(inferencia))
        get_settings.cache_clear()
        app = create_app()
        TestingSessionLocal = sessionmaker(bind=test_engine, autoflush=False, autocommit=False)

        def _override_session():
            db = TestingSessionLocal()
            try:
                yield db
            finally:
                db.close()

        app.dependency_overrides[session_dep] = _override_session
        return app

    yield _crear
    get_settings.cache_clear()


def _entrar(client: TestClient, correo: str) -> TestClient:
    respuesta = client.post("/auth/login", json={"correo": correo, "password": CLAVE})
    assert respuesta.status_code == 200, respuesta.text
    return client


def _caso(client: TestClient) -> str:
    paciente = client.post("/pacientes", json=PACIENTE)
    assert paciente.status_code == 201, paciente.text
    caso = client.post(f"/pacientes/{paciente.json()['id']}/casos")
    assert caso.status_code == 201, caso.text
    return caso.json()["id"]


def _consentir(client: TestClient, caso_id: str) -> None:
    respuesta = client.post(
        f"/casos/{caso_id}/consentimientos",
        json={"base_legal": "atencion_de_salud", "version_texto": "1.0"},
    )
    assert respuesta.status_code == 201, respuesta.text


# ------------------------------------------------- inyección y validación ----


def test_sqli_en_login_responde_401_y_no_cambia_usuarios(
    client: TestClient, mundo: dict[str, Any], db_session: Session
) -> None:
    intentos = [
        {"correo": "' OR '1'='1' --", "password": "x"},
        {"correo": "medico@t.com' --", "password": "x"},
        {"correo": "medico@t.com", "password": "' OR 1=1 --"},
    ]
    for credenciales in intentos:
        respuesta = client.post("/auth/login", json=credenciales)
        assert respuesta.status_code == 401, respuesta.text
        assert respuesta.json()["error"]["code"] == "invalid_credentials"
    assert db_session.query(Usuario).count() == 1
    assert client.get("/auth/me").status_code == 401


def test_sqli_en_parametro_tipado_responde_422_y_la_tabla_sigue(
    client: TestClient, mundo: dict[str, Any], db_session: Session
) -> None:
    _entrar(client, mundo["medico"].email)

    inyectado = client.get("/pacientes", params={"limite": "1; DROP TABLE usuarios--"})
    assert inyectado.status_code == 422, inyectado.text
    assert inyectado.json()["error"]["code"] == "validation_error"

    # El texto libre se parametriza: no rompe ni devuelve filas de más.
    literal = client.get("/pacientes", params={"q": "' OR '1'='1"})
    assert literal.status_code == 200, literal.text
    assert literal.json()["total"] == 0

    assert db_session.query(Usuario).count() == 1


# ------------------------------------------------------------------- XSS ----


def test_las_respuestas_de_la_api_no_se_interpretan_como_html(client: TestClient) -> None:
    """La API solo devuelve JSON con cabeceras que impiden interpretar HTML."""
    for respuesta in (client.get("/health"), client.get("/auth/me")):
        assert respuesta.headers["content-type"].startswith("application/json")
        assert respuesta.headers["X-Content-Type-Options"] == "nosniff"
        assert respuesta.headers["X-Frame-Options"] == "DENY"
        assert respuesta.headers["Referrer-Policy"] == "no-referrer"
        assert "default-src 'none'" in respuesta.headers["Content-Security-Policy"]
        assert "frame-ancestors 'none'" in respuesta.headers["Content-Security-Policy"]


# ------------------------------------------------------------------ CSRF ----


def test_csrf_origin_ajeno_da_403_y_sin_sesion_da_401(client: TestClient) -> None:
    ajeno = client.post("/auth/logout", headers={"Origin": "https://evil.example"})
    assert ajeno.status_code == 403
    assert ajeno.json()["error"]["code"] == "origin_forbidden"

    permitido = client.post("/auth/logout", headers={"Origin": "http://testserver"})
    assert permitido.status_code == 204

    sin_sesion = client.post("/trabajos", json={"tipo": "inferencia", "payload": {}})
    assert sin_sesion.status_code == 401
    assert sin_sesion.json()["error"]["code"] == "unauthorized"


# ------------------------------------------------- recorrido de rutas -------


# ------------------------------------------------------------------ SSRF ----


def test_el_cliente_de_ia_usa_la_url_configurada_y_no_otra() -> None:
    settings = get_settings()
    peticiones: list[httpx.Request] = []

    def _responder(peticion: httpx.Request) -> httpx.Response:
        peticiones.append(peticion)
        return httpx.Response(200, json=CONTRATO)

    cliente = ClienteIA(
        settings.ia_url,
        settings.ia_timeout_segundos,
        transporte=httpx.MockTransport(_responder),
    )
    cliente.inferir(CONTENIDO_IMAGEN, "eco.png")

    assert len(peticiones) == 1
    assert str(peticiones[0].url) == f"{settings.ia_url.rstrip('/')}/inferir"


def test_payload_con_url_arbitraria_no_provoca_peticion_a_esa_url(
    client: TestClient,
    mundo: dict[str, Any],
    db_session: Session,
    almacen_manejador: ClienteS3Falso,
    sesiones: None,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """El manejador ignora ``url``: solo habla con la URL de ``Settings``."""
    _entrar(client, mundo["medico"].email)
    caso_id = _caso(client)
    _consentir(client, caso_id)

    imagen = Imagen(
        caso_id=uuid.UUID(caso_id),
        ruta_s3="casos/abc/imagenes/eco.png",
        hash_sha256="b" * 64,
    )
    db_session.add(imagen)
    db_session.commit()
    almacen_manejador.put_object(
        Bucket="pruebas",
        Key=imagen.ruta_s3,
        Body=CONTENIDO_IMAGEN,
        ContentType="image/png",
    )

    creado = client.post(
        "/trabajos",
        json={
            "tipo": "inferencia",
            "payload": {"imagen_id": str(imagen.id), "url": URL_METADATOS},
        },
    )
    assert creado.status_code == 202, creado.text

    peticiones: list[httpx.Request] = []

    def _responder(peticion: httpx.Request) -> httpx.Response:
        peticiones.append(peticion)
        return httpx.Response(200, json=CONTRATO)

    settings = get_settings()
    cliente = ClienteIA(
        settings.ia_url,
        settings.ia_timeout_segundos,
        transporte=httpx.MockTransport(_responder),
    )
    monkeypatch.setattr(manejadores, "get_cliente_ia", lambda: cliente)
    trabajo = procesar_una(db_session, MANEJADORES)

    assert trabajo is not None
    assert trabajo.estado == "completado", trabajo.error_detalle
    assert len(peticiones) == 1
    assert str(peticiones[0].url) == f"{settings.ia_url.rstrip('/')}/inferir"
    assert "169.254.169.254" not in str(peticiones[0].url)


@pytest.fixture()
def sesiones(monkeypatch: pytest.MonkeyPatch, test_engine: Any) -> None:
    """El manejador abre su sesión contra la base de pruebas."""
    monkeypatch.setattr(manejadores, "get_session_factory", lambda: sessionmaker(bind=test_engine))


# --------------------------------------------------------------- límites ----


def test_la_cuarta_peticion_con_limite_tres_da_429_y_retry_after(
    app_con_limites: Any,
) -> None:
    app = app_con_limites(rate_limit=3, inferencia=0)
    with TestClient(app) as cliente:
        for _ in range(3):
            assert cliente.get("/auth/me").status_code == 401

        cuarta = cliente.get("/auth/me")
        assert cuarta.status_code == 429, cuarta.text
        assert cuarta.json()["error"]["code"] == "rate_limited"
        assert int(cuarta.headers["Retry-After"]) >= 1
        assert cuarta.headers["X-Content-Type-Options"] == "nosniff"
        assert cuarta.headers["X-Request-ID"]

        # Operación y documentación no consumen cupo ni se bloquean.
        assert cliente.get("/health").status_code == 200
        assert cliente.get("/docs").status_code == 200
        assert cliente.get("/openapi.json").status_code == 200


def test_la_segunda_inferencia_con_cupo_uno_da_429(
    app_con_limites: Any, mundo: dict[str, Any]
) -> None:
    app = app_con_limites(rate_limit=0, inferencia=1)
    with TestClient(app) as cliente:
        _entrar(cliente, mundo["medico"].email)
        caso_id = _caso(cliente)
        _consentir(cliente, caso_id)

        primera = cliente.post("/trabajos", json={"tipo": "inferencia", "payload": {}})
        assert primera.status_code == 202, primera.text

        segunda = cliente.post("/trabajos", json={"tipo": "inferencia", "payload": {}})
        assert segunda.status_code == 429, segunda.text
        assert segunda.json()["error"]["code"] == "rate_limited"
        assert int(segunda.headers["Retry-After"]) >= 1


def test_la_ventana_deslizante_usa_el_reloj_inyectado() -> None:
    ahora = [0.0]
    limite = VentanaDeslizante(2, reloj=lambda: ahora[0])

    assert limite.permitir("k") == (True, 0)
    ahora[0] = 10.0
    assert limite.permitir("k") == (True, 0)

    permitido, espera = limite.permitir("k")
    assert permitido is False
    assert espera == 50

    ahora[0] = 60.0
    assert limite.permitir("k") == (True, 0)


def test_el_limite_en_cero_desactiva_la_ventana() -> None:
    limite = VentanaDeslizante(0)
    for _ in range(1000):
        assert limite.permitir("k") == (True, 0)


def test_limite_excedido_lleva_el_tiempo_de_reintento() -> None:
    error = LimiteExcedido(0)
    assert error.segundos_reintento == 1


# ----------------------------------------------------------------- tamaño ---
