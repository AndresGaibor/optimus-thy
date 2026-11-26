"""Pruebas de purga operativa segura y simulación."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from importlib import import_module

import pytest
from sqlalchemy import select, text
from sqlalchemy.orm import Session, sessionmaker

from app.models.trabajos import Trabajo

AHORA = datetime(2026, 11, 26, 12, tzinfo=UTC)


def _retencion():
    return import_module("app.jobs.retencion")


def _politica(habilitada: bool):
    return _retencion().PoliticaRetencion(
        trabajos_dias=90,
        alertas_dias=365,
        purga_habilitada=habilitada,
    )


def _trabajo(estado: str, creado_en: datetime, actualizado_en: datetime | None = None) -> Trabajo:
    return Trabajo(
        tipo="inferencia",
        estado=estado,
        disponible_en=creado_en,
        creado_en=creado_en,
        actualizado_en=actualizado_en or creado_en,
        payload={},
    )


def test_politica_se_carga_de_la_configuracion(monkeypatch: pytest.MonkeyPatch) -> None:
    retencion = _retencion()
    from app.config import Settings

    settings = Settings(
        _env_file=None,
        retencion_trabajos_dias=45,
        retencion_alertas_dias=120,
        purga_habilitada=True,
    )
    monkeypatch.setattr(retencion, "get_settings", lambda: settings)

    politica = retencion.politica_desde_settings()

    assert politica.trabajos_dias == 45
    assert politica.alertas_dias == 120
    assert politica.purga_habilitada is True


def test_purga_borra_trabajos_terminales_en_lotes_y_conserva_los_demas(
    db_session: Session,
) -> None:
    antiguos = AHORA - timedelta(days=100)
    actuales = AHORA - timedelta(days=10)
    db_session.add_all(
        [
            *(
                _trabajo(
                    "completado" if indice % 2 else "error",
                    antiguos,
                )
                for indice in range(1001)
            ),
            _trabajo("en_cola", antiguos),
            _trabajo("en_proceso", antiguos),
            _trabajo("completado", actuales),
        ]
    )
    db_session.commit()

    resultado = _retencion().purgar(db_session, AHORA, _politica(habilitada=True))

    assert resultado["trabajos"] == 1001
    assert db_session.scalar(select(Trabajo.estado).where(Trabajo.estado == "en_cola")) == "en_cola"
    assert (
        db_session.scalar(select(Trabajo.estado).where(Trabajo.estado == "en_proceso"))
        == "en_proceso"
    )
    assert (
        db_session.scalar(select(Trabajo.estado).where(Trabajo.estado == "completado"))
        == "completado"
    )


def test_purga_deshabilitada_informa_candidatos_sin_borrar(db_session: Session) -> None:
    db_session.add(_trabajo("error", AHORA - timedelta(days=100)))
    db_session.commit()

    resultado = _retencion().purgar(db_session, AHORA, _politica(habilitada=False))

    assert resultado["trabajos"] == 1
    assert db_session.scalar(select(Trabajo.id)) is not None


def test_tabla_de_alertas_ausente_se_omite_sin_sql_de_purga(db_session: Session) -> None:
    resultado = _retencion().purgar(db_session, AHORA, _politica(habilitada=True))

    assert resultado["alertas"] == 0
    assert resultado["omitido"] == {"alertas": "tabla ausente"}


def test_tabla_de_alertas_existente_purga_solo_las_antiguas(db_session: Session) -> None:
    bind = db_session.get_bind()
    with bind.begin() as conexion:
        conexion.execute(text("DROP TABLE IF EXISTS alertas"))
        conexion.execute(
            text(
                "CREATE TABLE alertas ("
                "id BIGSERIAL PRIMARY KEY, "
                "creado_en TIMESTAMPTZ NOT NULL, "
                "revisada_en TIMESTAMPTZ)"
            )
        )
        conexion.execute(
            text(
                "INSERT INTO alertas (creado_en, revisada_en) VALUES "
                "(:antigua, :revisada), "
                "(:antigua, NULL), "
                "(:reciente, :revisada)"
            ),
            {
                "antigua": AHORA - timedelta(days=366),
                "reciente": AHORA - timedelta(days=2),
                "revisada": AHORA - timedelta(days=1),
            },
        )

    try:
        resultado = _retencion().purgar(db_session, AHORA, _politica(habilitada=True))
        db_session.commit()
        restantes = db_session.execute(text("SELECT count(*) FROM alertas")).scalar_one()

        assert resultado["alertas"] == 1
        assert resultado.get("omitido") is None
        assert restantes == 2
    finally:
        db_session.rollback()
        with bind.begin() as conexion:
            conexion.execute(text("DROP TABLE IF EXISTS alertas"))


def test_cli_sin_si_simula_y_no_muestra_datos_personales(
    db_session: Session, monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
) -> None:
    retencion = _retencion()
    db_session.add(_trabajo("completado", AHORA - timedelta(days=100)))
    db_session.commit()
    factory = sessionmaker(bind=db_session.get_bind(), autoflush=False, autocommit=False)
    monkeypatch.setattr(retencion, "get_session_factory", lambda: factory)
    monkeypatch.setattr(retencion, "politica_desde_settings", lambda: _politica(habilitada=True))

    assert retencion.main([]) == 0
    salida = capsys.readouterr().out

    assert "simulación" in salida.lower()
    assert "trabajos=1" in salida
    assert "auditoria: no se purga" in salida
    assert db_session.scalar(select(Trabajo.id)) is not None
    assert "Paciente" not in salida


def test_cli_si_informa_purga_deshabilitada_sin_borrar(
    db_session: Session, monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
) -> None:
    retencion = _retencion()
    db_session.add(_trabajo("error", AHORA - timedelta(days=100)))
    db_session.commit()
    factory = sessionmaker(bind=db_session.get_bind(), autoflush=False, autocommit=False)
    monkeypatch.setattr(retencion, "get_session_factory", lambda: factory)
    monkeypatch.setattr(retencion, "politica_desde_settings", lambda: _politica(habilitada=False))

    assert retencion.main(["--si"]) == 0

    assert "purga deshabilitada" in capsys.readouterr().out.lower()
    assert db_session.scalar(select(Trabajo.id)) is not None
