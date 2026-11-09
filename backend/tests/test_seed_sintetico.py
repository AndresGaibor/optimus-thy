"""Tests del script de datos sintéticos."""

from __future__ import annotations

from decimal import Decimal

import pytest
from sqlalchemy import text

from app import models  # noqa: F401
from app.models.consentimientos import Consentimiento
from app.models.fichas import Caso, FichaClinica, FichaVersion
from app.models.pacientes import Paciente
from scripts.seed_sintetico import cargar_manifiesto, sembrar


def _valores(db_session):
    fichas = (
        db_session.query(FichaClinica)
        .join(Caso, FichaClinica.caso_id == Caso.id)
        .order_by(Caso.codigo_caso)
        .all()
    )
    return [
        (str(f.tsh), str(f.t3), str(f.t4), str(f.tamano_nodulo_mm), f.tirads, f.bethesda)
        for f in fichas
    ]


def test_crea_n_pacientes_y_casos(db_session):
    sembrar(db_session, pacientes=4, semilla=7)
    assert db_session.query(Paciente).count() == 4
    assert db_session.query(Caso).count() == 4
    assert db_session.query(FichaClinica).count() == 4


def test_determinismo(db_session):
    sembrar(db_session, pacientes=3, semilla=7, reemplazar=True)
    primero = _valores(db_session)
    sembrar(db_session, pacientes=3, semilla=7, reemplazar=True)
    segundo = _valores(db_session)
    assert primero == segundo


def test_idempotencia_sin_reemplazar(db_session):
    sembrar(db_session, pacientes=3, semilla=7)
    n0 = db_session.query(Paciente).count()
    sembrar(db_session, pacientes=3, semilla=7)
    assert db_session.query(Paciente).count() == n0


def test_rangos(db_session):
    sembrar(db_session, pacientes=9, semilla=9)
    for f in db_session.query(FichaClinica).all():
        assert Decimal("0.3") <= f.tsh <= Decimal("8")
        assert Decimal("0.8") <= f.t3 <= Decimal("2.2")
        assert Decimal("0.8") <= f.t4 <= Decimal("1.8")
        assert f.tipo_consulta in {"consulta", "control", "urgencia", "teleconsulta"}
        assert f.tipo_diagnostico in {"presuntivo", "confirmado", "descartado"}
        assert f.origen_datos is not None
        assert set(f.origen_datos.values()) == {"digitado"}
    # consentimientos
    assert db_session.query(Consentimiento).count() >= 9


def _por_etiqueta(db_session):
    versiones = db_session.query(FichaVersion).all()
    fichas = {f.id: f for f in db_session.query(FichaClinica).all()}
    return [(v.snapshot["etiqueta_referencia"], fichas[v.ficha_clinica_id]) for v in versiones]


def test_hay_benignos_malignos_y_sin_nodulo(db_session):
    sembrar(db_session, pacientes=3, semilla=11)
    assert {e for e, _ in _por_etiqueta(db_session)} == {"sin_nodulo", "benigno", "maligno"}


def test_ficha_coherente_con_la_etiqueta(db_session):
    sembrar(db_session, pacientes=30, semilla=3)
    vistos = set()
    for etiqueta, f in _por_etiqueta(db_session):
        vistos.add(etiqueta)
        if etiqueta == "sin_nodulo":
            assert f.tamano_nodulo_mm is None
            assert f.lateralidad is None
            assert f.tirads is None
            assert f.bethesda is None
            assert f.cie10 in {"E04.0", "E01.0"}
            assert f.tipo_diagnostico == "descartado"
        elif etiqueta == "benigno":
            assert f.tirads in {"2", "3"}
            assert f.bethesda == "II"
            assert f.cie10 in {"E04.1", "E04.2", "D34"}
            assert Decimal("3") <= f.tamano_nodulo_mm <= Decimal("35")
            assert f.lateralidad in {"izquierdo", "derecho", "istmo"}
        else:
            assert f.tirads in {"4", "5"}
            assert f.bethesda in {"V", "VI"}
            assert f.cie10 == "C73"
            assert f.tipo_diagnostico == "confirmado"
            assert Decimal("8") <= f.tamano_nodulo_mm <= Decimal("60")
    assert vistos == {"sin_nodulo", "benigno", "maligno"}


def test_manifiesto_empareja_cada_caso_con_una_imagen_de_su_etiqueta(db_session, tmp_path):
    ruta = tmp_path / "m.csv"
    filas = ["archivo,etiqueta,sha256"]
    for etiqueta in ("sin_nodulo", "benigno", "maligno"):
        for k in range(2):
            filas.append(f"{etiqueta}-{k}.png,{etiqueta},{str(k) * 64}")
    ruta.write_text("\n".join(filas), encoding="utf-8")

    resultado = sembrar(db_session, pacientes=6, semilla=5, manifiesto=cargar_manifiesto(ruta))

    assert resultado["imagenes"] == 6
    for caso in db_session.query(Caso).all():
        (imagen,) = caso.imagenes
        etiqueta = caso.fichas_versiones[0].snapshot["etiqueta_referencia"]
        assert imagen.ruta_s3.startswith(f"sintetico/{etiqueta}-")


def test_sin_manifiesto_no_crea_imagenes(db_session):
    assert sembrar(db_session, pacientes=3, semilla=5)["imagenes"] == 0


def test_manifiesto_rechaza_filas_no_validas(tmp_path):
    ruta = tmp_path / "m.csv"
    for fila in (
        "a.png,raro," + "a" * 64,
        "../a.png,benigno," + "a" * 64,
        "a.png,benigno,corto",
    ):
        ruta.write_text("archivo,etiqueta,sha256\n" + fila, encoding="utf-8")
        with pytest.raises(ValueError, match="Manifiesto línea 2"):
            cargar_manifiesto(ruta)


def test_sin_identidades(db_session):
    sembrar(db_session, pacientes=3, semilla=1)
    count = db_session.execute(text("SELECT count(*) FROM identidades_paciente")).scalar()
    assert count == 0
