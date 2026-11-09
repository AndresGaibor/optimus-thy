"""CLI para crear usuario de demo."""

from __future__ import annotations

import argparse
import contextlib
import getpass
import os
import sys

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app import models  # noqa: F401
from app.models.instituciones import Institucion
from app.models.usuarios import Rol, Usuario, UsuarioRol
from app.security.passwords import hash_password


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--correo", required=True)
    parser.add_argument("--rol", required=True)
    parser.add_argument("--institucion", required=True, help="Nombre/código de institución")
    args = parser.parse_args(argv)

    password = getpass.getpass("Contraseña: ")
    if not password:
        print("Contraseña vacía", file=sys.stderr)
        return 1

    test_db_url = os.environ.get("TEST_DATABASE_URL")
    if test_db_url:
        engine = create_engine(test_db_url, pool_pre_ping=True)
        SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
        db: Session = SessionLocal()
    else:
        from app.db import get_session_factory

        factory = get_session_factory()
        db = factory()
    try:
        # Buscar o crear institución
        institucion = db.query(Institucion).filter(Institucion.nombre == args.institucion).first()
        if institucion is None:
            institucion = (
                db.query(Institucion).filter(Institucion.codigo == args.institucion).first()
            )
        if institucion is None:
            codigo = args.institucion.strip().lower().replace(" ", "_")[:64]
            institucion = Institucion(nombre=args.institucion, codigo=codigo)
            db.add(institucion)
            db.commit()
            db.refresh(institucion)

        # Buscar rol
        rol = db.query(Rol).filter(Rol.nombre == args.rol).first()
        if rol is None:
            print(f"Rol '{args.rol}' no encontrado", file=sys.stderr)
            return 1

        # Crear usuario
        usuario = db.query(Usuario).filter(Usuario.email == args.correo).first()
        if usuario is None:
            usuario = Usuario(
                institucion_id=institucion.id,
                email=args.correo,
                password_hash=hash_password(args.correo, password),
                nombre=args.correo.split("@")[0],
                activo=True,
            )
            db.add(usuario)
            db.commit()
            db.refresh(usuario)
        else:
            usuario.password_hash = hash_password(args.correo, password)
            db.add(usuario)
            db.commit()
            db.refresh(usuario)

        # Asignar rol si no lo tiene
        ur = (
            db.query(UsuarioRol)
            .filter(UsuarioRol.usuario_id == usuario.id, UsuarioRol.rol_id == rol.id)
            .first()
        )
        if ur is None:
            ur = UsuarioRol(usuario_id=usuario.id, rol_id=rol.id)
            db.add(ur)
            db.commit()

        print(
            f"Usuario {usuario.email} creado/asignado con rol {rol.nombre} en {institucion.nombre}"
        )
        return 0
    finally:
        with contextlib.suppress(Exception):
            db.close()
        try:
            engine = locals().get("engine")
            if engine is not None:
                engine.dispose()
        except Exception:
            pass


if __name__ == "__main__":
    raise SystemExit(main())
