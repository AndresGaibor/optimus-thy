"""CLI para poblar la base con datos sintéticos de desarrollo."""

from __future__ import annotations

import argparse
import contextlib
import csv
import os
import random
import re
from datetime import date, timedelta
from decimal import Decimal
from pathlib import Path
from typing import Any

from sqlalchemy.orm import Session

from app import models  # noqa: F401
from app.models.consentimientos import Consentimiento
from app.models.fichas import Caso, FichaClinica, FichaVersion
from app.models.imagenes import Imagen
from app.models.instituciones import Institucion
from app.models.pacientes import Paciente

INSTITUCION_NOMBRE = "Institución sintética"
INSTITUCION_CODIGO = "dev-sintetica"

# Etiqueta de referencia de cada caso. Cada perfil fija valores que se parecen
# entre sí: TI-RADS, Bethesda, CIE-10 y tamaño salen del mismo perfil, no al azar
# por separado. "sin_nodulo" es "normal" en el lenguaje del proyecto (pendiente
# del visto bueno del director): no hay nódulo, así que no hay tamaño, lado,
# TI-RADS ni Bethesda.
SIN_NODULO = "sin_nodulo"
BENIGNO = "benigno"
MALIGNO = "maligno"
ETIQUETAS = (SIN_NODULO, BENIGNO, MALIGNO)

PERFILES: dict[str, dict[str, Any]] = {
    SIN_NODULO: {
        "tamano": None,
        "lateralidad": [None],
        "tirads": [None],
        "bethesda": [None],
        "cie10": ["E04.0", "E01.0"],
        "tipo_diagnostico": ["descartado"],
        "tsh": (0.4, 4.0),
    },
    BENIGNO: {
        "tamano": (3.0, 35.0),
        "lateralidad": ["izquierdo", "derecho", "istmo"],
        "tirads": ["2", "3"],
        "bethesda": ["II"],
        "cie10": ["E04.1", "E04.2", "D34"],
        "tipo_diagnostico": ["presuntivo", "confirmado"],
        "tsh": (0.3, 6.0),
    },
    MALIGNO: {
        "tamano": (8.0, 60.0),
        "lateralidad": ["izquierdo", "derecho", "istmo"],
        "tirads": ["4", "5"],
        "bethesda": ["V", "VI"],
        "cie10": ["C73"],
        "tipo_diagnostico": ["confirmado"],
        "tsh": (0.5, 8.0),
    },
}
TIPOS_CONSULTA = ["consulta", "control", "urgencia", "teleconsulta"]
_SHA256 = re.compile(r"^[0-9a-f]{64}$")


def cargar_manifiesto(ruta: Path) -> dict[str, list[tuple[str, str]]]:
    """Lee un CSV `archivo,etiqueta,sha256` y agrupa las imágenes por etiqueta.

    Las imágenes no están en el repositorio: el manifiesto solo dice cuáles
    existen y qué etiqueta de referencia tiene cada una.
    """
    por_etiqueta: dict[str, list[tuple[str, str]]] = {e: [] for e in ETIQUETAS}
    with ruta.open(encoding="utf-8", newline="") as f:
        for n, fila in enumerate(csv.DictReader(f), start=2):
            archivo = (fila.get("archivo") or "").strip()
            etiqueta = (fila.get("etiqueta") or "").strip()
            sha = (fila.get("sha256") or "").strip().lower()
            if not archivo or "/" in archivo or ".." in archivo:
                raise ValueError(f"Manifiesto línea {n}: nombre de archivo no válido")
            if etiqueta not in ETIQUETAS:
                raise ValueError(f"Manifiesto línea {n}: etiqueta desconocida")
            if not _SHA256.match(sha):
                raise ValueError(f"Manifiesto línea {n}: sha256 no válido")
            por_etiqueta[etiqueta].append((archivo, sha))
    return por_etiqueta


def _institucion(session: Session) -> Institucion:
    institucion = (
        session.query(Institucion).filter(Institucion.codigo == INSTITUCION_CODIGO).first()
    )
    if institucion is None:
        institucion = (
            session.query(Institucion).filter(Institucion.nombre == INSTITUCION_NOMBRE).first()
        )
    if institucion is None:
        institucion = Institucion(nombre=INSTITUCION_NOMBRE, codigo=INSTITUCION_CODIGO)
        session.add(institucion)
        session.flush()
    return institucion


def _limpiar_sintetico(session: Session, institucion_id: Any) -> None:
    session.query(Paciente).filter(Paciente.institucion_id == institucion_id).delete(
        synchronize_session=False
    )
    session.flush()


def sembrar(
    session: Session,
    pacientes: int = 20,
    semilla: int = 2026,
    reemplazar: bool = False,
    manifiesto: dict[str, list[tuple[str, str]]] | None = None,
) -> dict[str, int]:
    """Siembra pacientes, casos y fichas coherentes con una etiqueta de referencia.

    Las etiquetas se reparten en ciclo (tres casos seguidos las contienen todas)
    en un orden que depende de la semilla. Con `manifiesto`, cada caso recibe una
    imagen de su misma etiqueta; sin él no se crean imágenes.
    """
    rng = random.Random(semilla)
    orden = rng.sample(ETIQUETAS, len(ETIQUETAS))
    usadas: dict[str, int] = dict.fromkeys(ETIQUETAS, 0)
    institucion = _institucion(session)
    if reemplazar:
        _limpiar_sintetico(session, institucion.id)
        session.flush()

    existentes = {
        p.seudonimo
        for p in session.query(Paciente).filter(Paciente.institucion_id == institucion.id).all()
    }

    creados_pacientes = 0
    creados_casos = 0
    creadas_imagenes = 0
    for i in range(1, pacientes + 1):
        seudonimo = f"PAC-{i:04d}"
        codigo_caso = f"CASO-{i:04d}"
        if not reemplazar and seudonimo in existentes:
            continue

        if session.query(Paciente).filter(Paciente.seudonimo == seudonimo).first() is not None:
            continue

        paciente = Paciente(institucion_id=institucion.id, seudonimo=seudonimo)
        session.add(paciente)
        session.flush()

        caso = Caso(
            institucion_id=institucion.id,
            paciente_id=paciente.id,
            codigo_caso=codigo_caso,
        )
        session.add(caso)
        session.flush()

        etiqueta = orden[(i - 1) % len(orden)]
        perfil = PERFILES[etiqueta]
        tsh = Decimal(str(round(rng.uniform(*perfil["tsh"]), 3)))
        t3 = Decimal(str(round(rng.uniform(0.8, 2.2), 3)))
        t4 = Decimal(str(round(rng.uniform(0.8, 1.8), 3)))
        tamano = (
            Decimal(str(round(rng.uniform(*perfil["tamano"]), 2))) if perfil["tamano"] else None
        )
        lateralidad = rng.choice(perfil["lateralidad"])
        tirads = rng.choice(perfil["tirads"])
        bethesda = rng.choice(perfil["bethesda"])
        cie10 = rng.choice(perfil["cie10"])
        tipo_diagnostico = rng.choice(perfil["tipo_diagnostico"])
        tipo_consulta = rng.choice(TIPOS_CONSULTA)
        fecha_lab = date(2024, 1, 1) + timedelta(days=rng.randint(0, 700))

        origen_datos = {
            "tsh": "digitado",
            "tsh_unidad": "digitado",
            "tsh_fecha": "digitado",
            "t3": "digitado",
            "t3_unidad": "digitado",
            "t3_fecha": "digitado",
            "t4": "digitado",
            "t4_unidad": "digitado",
            "t4_fecha": "digitado",
            "tamano_nodulo_mm": "digitado",
            "lateralidad": "digitado",
            "tirads": "digitado",
            "bethesda": "digitado",
            "cie10": "digitado",
            "tipo_diagnostico": "digitado",
            "tipo_consulta": "digitado",
        }

        ficha = FichaClinica(
            caso_id=caso.id,
            tsh=tsh,
            tsh_unidad="mUI/L",
            tsh_fecha=fecha_lab,
            t3=t3,
            t3_unidad="ng/mL",
            t3_fecha=fecha_lab,
            t4=t4,
            t4_unidad="ng/dL",
            t4_fecha=fecha_lab,
            tamano_nodulo_mm=tamano,
            lateralidad=lateralidad,
            tirads=tirads,
            bethesda=bethesda,
            cie10=cie10,
            tipo_diagnostico=tipo_diagnostico,
            tipo_consulta=tipo_consulta,
            origen_datos=origen_datos,
        )
        session.add(ficha)
        session.flush()

        snapshot = {
            "tsh": str(tsh),
            "tsh_unidad": "mUI/L",
            "tsh_fecha": fecha_lab.isoformat(),
            "t3": str(t3),
            "t3_unidad": "ng/mL",
            "t3_fecha": fecha_lab.isoformat(),
            "t4": str(t4),
            "t4_unidad": "ng/dL",
            "t4_fecha": fecha_lab.isoformat(),
            "tamano_nodulo_mm": None if tamano is None else str(tamano),
            "lateralidad": lateralidad,
            "tirads": tirads,
            "bethesda": bethesda,
            "cie10": cie10,
            "tipo_diagnostico": tipo_diagnostico,
            "tipo_consulta": tipo_consulta,
            "origen_datos": origen_datos,
            "etiqueta_referencia": etiqueta,
        }
        version = FichaVersion(
            caso_id=caso.id,
            ficha_clinica_id=ficha.id,
            version=1,
            snapshot=snapshot,
            motivo_cambio="siembra sintética",
        )
        session.add(version)

        if manifiesto and manifiesto[etiqueta]:
            candidatas = manifiesto[etiqueta]
            archivo, sha = candidatas[usadas[etiqueta] % len(candidatas)]
            usadas[etiqueta] += 1
            session.add(
                Imagen(
                    caso_id=caso.id,
                    ruta_s3=f"sintetico/{archivo}",
                    hash_sha256=sha,
                    sin_metadatos_exif_dicom=True,
                )
            )
            creadas_imagenes += 1

        session.add(Consentimiento(caso_id=caso.id, base_legal="atencion_de_salud"))

        if i % 3 == 0:
            session.add(
                Consentimiento(caso_id=caso.id, base_legal="investigacion_con_anonimizacion")
            )

        session.flush()
        creados_pacientes += 1
        creados_casos += 1

    session.commit()
    return {
        "pacientes": creados_pacientes,
        "casos": creados_casos,
        "imagenes": creadas_imagenes,
    }


seed = sembrar
seed_sintetico = sembrar
run = sembrar
ejecutar = sembrar


def main(argv=None):
    parser = argparse.ArgumentParser(description="Siembra datos sintéticos de desarrollo.")
    parser.add_argument("--pacientes", type=int, default=20)
    parser.add_argument("--semilla", type=int, default=2026)
    parser.add_argument("--reemplazar", action="store_true")
    parser.add_argument(
        "--manifiesto",
        type=Path,
        help="CSV archivo,etiqueta,sha256 para emparejar cada caso con una imagen",
    )
    args = parser.parse_args(argv)

    test_db_url = os.environ.get("TEST_DATABASE_URL")
    if test_db_url:
        from sqlalchemy import create_engine
        from sqlalchemy.orm import sessionmaker

        engine = create_engine(test_db_url, pool_pre_ping=True)
        SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
        db = SessionLocal()
    else:
        from app.db import get_session_factory

        db = get_session_factory()()

    try:
        resultado = sembrar(
            db,
            pacientes=args.pacientes,
            semilla=args.semilla,
            reemplazar=args.reemplazar,
            manifiesto=cargar_manifiesto(args.manifiesto) if args.manifiesto else None,
        )
        print(
            f"Siembra completada: {resultado['pacientes']} pacientes, {resultado['casos']} casos, "
            f"{resultado['imagenes']} imágenes."
        )
        return 0
    finally:
        with contextlib.suppress(Exception):
            db.close()
        if test_db_url:
            with contextlib.suppress(Exception):
                engine.dispose()


if __name__ == "__main__":
    raise SystemExit(main())
