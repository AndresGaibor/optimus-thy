"""CLI de administración de usuarios: alta, contraseña, estado y roles.

Trabaja contra la base real del backend, sin pasar por la API:

    .venv/bin/python scripts/usuarios.py              # menú interactivo
    .venv/bin/python scripts/usuarios.py --listar     # tabla y salir

La contraseña se lee con ``getpass`` (sin eco) y solo vive en memoria: nunca
se imprime, se registra ni queda en el historial del shell.
"""

from __future__ import annotations

import argparse
import contextlib
import getpass
import os
import re
import sys
from collections.abc import Callable
from datetime import UTC, datetime
from pathlib import Path
from typing import TYPE_CHECKING

from sqlalchemy import create_engine
from sqlalchemy.exc import IntegrityError, OperationalError, SQLAlchemyError
from sqlalchemy.orm import Session, joinedload, sessionmaker

_RAIZ = Path(__file__).resolve().parents[1]
if str(_RAIZ) not in sys.path:
    sys.path.insert(0, str(_RAIZ))

from app import models  # noqa: E402,F401
from app.audit.actions import AuditAction, AuditModule, AuditObjectType  # noqa: E402
from app.audit.service import AuditService  # noqa: E402
from app.db import get_session_factory  # noqa: E402
from app.models.instituciones import Institucion  # noqa: E402
from app.models.usuarios import Rol, Usuario, UsuarioRol  # noqa: E402
from app.security.passwords import hash_password  # noqa: E402

if TYPE_CHECKING:
    from sqlalchemy.engine import Engine

#: Mismos límites que el API de administración de usuarios.
_CORREO_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
_CORREO_MAX = 255
_CLAVE_MIN = 12
_CLAVE_MAX = 128

_MENU = """1) Crear usuario
2) Restablecer contraseña
3) Listar usuarios
4) Activar o desactivar usuario
5) Asignar o quitar rol
0) Salir"""

#: Roles con los que se puede administrar el sistema; nunca dejar el último activo sin admin.
_ROL_ADMIN = "admin"

_engine_prueba: Engine | None = None


def _sesion() -> Session:
    """Abre una sesión; con ``TEST_DATABASE_URL`` usa esa base (pruebas)."""
    global _engine_prueba
    url = os.environ.get("TEST_DATABASE_URL")
    if url:
        if _engine_prueba is None:
            _engine_prueba = create_engine(url, pool_pre_ping=True)
        return sessionmaker(bind=_engine_prueba, autoflush=False, autocommit=False)()
    return get_session_factory()()


def _motivo(exc: SQLAlchemyError) -> str:
    """Traduce el fallo a una frase corta, sin SQL ni rutas."""
    if isinstance(exc, IntegrityError):
        return "el dato choca con uno existente o incumple una restricción"
    if isinstance(exc, OperationalError):
        return "no hay conexión con la base de datos"
    return "error de la base de datos"


def _ejecutar(operacion: Callable[[Session], int]) -> int:
    """Abre sesión, ejecuta y cierra; ante error de base, revierte y sale con 1."""
    db = _sesion()
    try:
        return operacion(db)
    except SQLAlchemyError as exc:
        with contextlib.suppress(Exception):
            db.rollback()
        print(f"No se pudo guardar: {_motivo(exc)}", file=sys.stderr)
        return 1
    finally:
        db.close()


def _normalizar_correo(texto: str) -> str:
    return texto.strip().lower()


def _validar_correo(correo: str) -> str | None:
    """Devuelve el error de formato, o ``None`` si el correo es válido."""
    if not correo:
        return "El correo no puede estar vacío."
    if len(correo) > _CORREO_MAX:
        return f"El correo es demasiado largo (máximo {_CORREO_MAX} caracteres)."
    if _CORREO_RE.match(correo) is None:
        return "El correo no tiene un formato válido."
    return None


def _preguntar(texto: str, por_defecto: str | None = None) -> str:
    sufijo = f" [{por_defecto}]" if por_defecto else ""
    respuesta = input(f"{texto}{sufijo}: ").strip()
    if not respuesta and por_defecto is not None:
        return por_defecto
    return respuesta


def _pedir_clave() -> str | None:
    """Pide la contraseña dos veces sin eco; ``None`` si no cumple las reglas."""
    clave = getpass.getpass(f"Contraseña (mínimo {_CLAVE_MIN} caracteres): ")
    if len(clave) < _CLAVE_MIN:
        print(f"La contraseña debe tener al menos {_CLAVE_MIN} caracteres.", file=sys.stderr)
        return None
    if len(clave) > _CLAVE_MAX:
        print(f"La contraseña no puede pasar de {_CLAVE_MAX} caracteres.", file=sys.stderr)
        return None
    if getpass.getpass("Repite la contraseña: ") != clave:
        print("Las contraseñas no coinciden.", file=sys.stderr)
        return None
    return clave


def _instituciones(db: Session) -> list[Institucion]:
    return db.query(Institucion).order_by(Institucion.nombre.asc()).all()


def _roles(db: Session) -> list[Rol]:
    return db.query(Rol).order_by(Rol.nombre.asc()).all()


def _usuarios(db: Session) -> list[Usuario]:
    return (
        db.query(Usuario)
        .options(
            joinedload(Usuario.institucion),
            joinedload(Usuario.usuarios_roles).joinedload(UsuarioRol.rol),
        )
        .order_by(Usuario.email.asc())
        .all()
    )


def _buscar_usuario(db: Session, correo: str) -> Usuario | None:
    return (
        db.query(Usuario)
        .options(
            joinedload(Usuario.institucion),
            joinedload(Usuario.usuarios_roles).joinedload(UsuarioRol.rol),
        )
        .filter(Usuario.email == correo)
        .first()
    )


def _roles_nombres(usuario: Usuario) -> list[str]:
    return sorted(ur.rol.nombre for ur in usuario.usuarios_roles if ur.rol is not None)


def _elegir_institucion(db: Session) -> Institucion | None:
    instituciones = _instituciones(db)
    if not instituciones:
        print(
            "No hay instituciones registradas; crea una antes de dar de alta usuarios.",
            file=sys.stderr,
        )
        return None
    for numero, institucion in enumerate(instituciones, start=1):
        print(f"  {numero}) {institucion.nombre} ({institucion.codigo})")
    while True:
        entrada = _preguntar("Institución (número)")
        if entrada.isdigit() and 1 <= int(entrada) <= len(instituciones):
            return instituciones[int(entrada) - 1]
        print("Elige un número de la lista.")


def _elegir_roles(db: Session) -> list[Rol] | None:
    roles = _roles(db)
    if not roles:
        print("No hay roles registrados; siembra la base antes de crear usuarios.", file=sys.stderr)
        return None
    for numero, rol in enumerate(roles, start=1):
        print(f"  {numero}) {rol.nombre}")
    predeterminado = next(
        (i for i, rol in enumerate(roles, start=1) if rol.nombre == "doctor"), None
    )
    while True:
        entrada = _preguntar(
            "Roles (números separados por coma)",
            str(predeterminado) if predeterminado is not None else None,
        )
        try:
            indices = {int(parte) for parte in entrada.replace(" ", "").split(",") if parte}
        except ValueError:
            print("Escribe números separados por coma, por ejemplo 1,2.")
            continue
        if not indices:
            print("Asigna al menos un rol.")
            continue
        if any(indice < 1 or indice > len(roles) for indice in indices):
            print("Algún número no está en la lista.")
            continue
        return [roles[indice - 1] for indice in sorted(indices)]


def _pedir_usuario(db: Session, *, con_lista: bool = False) -> Usuario | None:
    """Pide un correo (o el número de una lista mostrada) y devuelve el usuario."""
    usuarios: list[Usuario] = []
    if con_lista:
        usuarios = _usuarios(db)
        if not usuarios:
            print("No hay usuarios registrados.")
            return None
        for numero, usuario in enumerate(usuarios, start=1):
            print(f"  {numero}) {usuario.email}")
    entrada = _preguntar("Correo")
    if not entrada:
        print("El correo no puede estar vacío.")
        return None
    if con_lista and entrada.isdigit():
        indice = int(entrada)
        if 1 <= indice <= len(usuarios):
            return usuarios[indice - 1]
        print("Ese número no está en la lista.")
        return None
    correo = _normalizar_correo(entrada)
    usuario = _buscar_usuario(db, correo)
    if usuario is None:
        print(f"No existe un usuario con el correo {correo}.")
    return usuario


def _auditar_usuario(
    db: Session,
    accion: AuditAction,
    usuario: Usuario,
    *,
    detalles: dict[str, str],
) -> None:
    AuditService(db).record(
        accion,
        AuditModule.ADMIN,
        institucion_id=usuario.institucion_id,
        tipo_objeto=AuditObjectType.USER,
        objeto_id=usuario.id,
        detalles=detalles,
    )


def _guardar_usuario(
    db: Session,
    *,
    correo: str,
    nombre: str | None,
    institucion: Institucion,
    roles: list[Rol],
    clave: str,
) -> int:
    """Crea el usuario con su hash, sus roles y la auditoría; un solo commit."""
    if _buscar_usuario(db, correo) is not None:
        print(f"Ya existe un usuario con el correo {correo}.", file=sys.stderr)
        print(
            "Para cambiar su contraseña usa «Restablecer contraseña» o --restablecer.",
            file=sys.stderr,
        )
        return 1
    usuario = Usuario(
        institucion_id=institucion.id,
        email=correo,
        nombre=nombre or correo.split("@")[0],
        password_hash=hash_password(correo, clave),
        activo=True,
    )
    db.add(usuario)
    db.flush()
    for rol in roles:
        db.add(UsuarioRol(usuario_id=usuario.id, rol_id=rol.id))
    _auditar_usuario(db, AuditAction.USER_CREATE, usuario, detalles={"reason_code": "admin_cli"})
    for rol in roles:
        _auditar_usuario(
            db,
            AuditAction.USER_ROLE_CHANGE,
            usuario,
            detalles={"reason_code": "admin_cli", "role_code": rol.nombre},
        )
    db.commit()
    nombres = ", ".join(rol.nombre for rol in roles)
    print(f"Usuario {usuario.email} creado en {institucion.nombre} con roles: {nombres}.")
    return 0


def _cambiar_clave(db: Session, usuario: Usuario, clave: str) -> int:
    """Guarda una contraseña nueva y desbloquea la cuenta (HU-004)."""
    usuario.password_hash = hash_password(usuario.email, clave)
    usuario.intentos_fallidos = 0
    usuario.bloqueado_hasta = None
    _auditar_usuario(
        db, AuditAction.USER_UPDATE, usuario, detalles={"reason_code": "password_reset"}
    )
    db.commit()
    print(f"Contraseña de {usuario.email} actualizada; intentos fallidos y bloqueo a cero.")
    return 0


def _restablecer_por_correo(db: Session, correo: str) -> int:
    usuario = _buscar_usuario(db, correo)
    if usuario is None:
        print(f"No existe un usuario con el correo {correo}.", file=sys.stderr)
        return 1
    clave = _pedir_clave()
    if clave is None:
        return 1
    return _cambiar_clave(db, usuario, clave)


def _estado(usuario: Usuario) -> str:
    partes: list[str] = []
    if not usuario.activo:
        partes.append("inactivo")
    if usuario.bloqueado_hasta is not None:
        bloqueado = usuario.bloqueado_hasta
        if bloqueado.tzinfo is None:
            bloqueado = bloqueado.replace(tzinfo=UTC)
        if bloqueado > datetime.now(UTC):
            partes.append(f"bloqueado hasta {bloqueado:%Y-%m-%d %H:%M} UTC")
    return ", ".join(partes) if partes else "activo"


def _imprimir_tabla(db: Session) -> int:
    usuarios = _usuarios(db)
    if not usuarios:
        print("No hay usuarios registrados.")
        return 0
    filas: list[tuple[str, str, str, str, str, str]] = [
        ("correo", "nombre", "institución", "activo", "roles", "estado")
    ]
    for usuario in usuarios:
        institucion = usuario.institucion.nombre if usuario.institucion is not None else ""
        filas.append(
            (
                usuario.email,
                usuario.nombre or "",
                institucion,
                "sí" if usuario.activo else "no",
                ",".join(_roles_nombres(usuario)),
                _estado(usuario),
            )
        )
    anchos = [max(len(fila[columna]) for fila in filas) for columna in range(6)]
    for fila in filas:
        columnas = [valor.ljust(ancho) for valor, ancho in zip(fila, anchos, strict=True)]
        print("  ".join(columnas).rstrip())
    return 0


def _es_ultimo_admin_activo(db: Session, usuario: Usuario) -> bool:
    """Cierto si desactivar a ``usuario`` dejaría el sistema sin administradores."""
    if _ROL_ADMIN not in _roles_nombres(usuario):
        return False
    otros = (
        db.query(Usuario)
        .join(UsuarioRol, UsuarioRol.usuario_id == Usuario.id)
        .join(Rol, Rol.id == UsuarioRol.rol_id)
        .filter(
            Rol.nombre == _ROL_ADMIN,
            Usuario.activo.is_(True),
            Usuario.id != usuario.id,
        )
        .count()
    )
    return otros == 0


def _menu_crear(db: Session) -> int:
    while True:
        correo = _normalizar_correo(_preguntar("Correo"))
        error = _validar_correo(correo)
        if error is None:
            break
        print(error)
    if _buscar_usuario(db, correo) is not None:
        print(f"Ya existe un usuario con el correo {correo}.")
        print("Vuelve a entrar y usa la opción 2 para restablecer su contraseña.")
        return 0
    nombre = _preguntar("Nombre", correo.split("@")[0])
    institucion = _elegir_institucion(db)
    if institucion is None:
        return 1
    roles = _elegir_roles(db)
    if roles is None:
        return 1
    clave = _pedir_clave()
    if clave is None:
        return 1
    return _guardar_usuario(
        db,
        correo=correo,
        nombre=nombre,
        institucion=institucion,
        roles=roles,
        clave=clave,
    )


def _menu_restablecer(db: Session) -> int:
    usuario = _pedir_usuario(db, con_lista=True)
    if usuario is None:
        return 0
    clave = _pedir_clave()
    if clave is None:
        return 1
    return _cambiar_clave(db, usuario, clave)


def _menu_activar(db: Session) -> int:
    usuario = _pedir_usuario(db)
    if usuario is None:
        return 0
    print(f"{usuario.email}: {_estado(usuario)}.")
    nuevo_estado = not usuario.activo
    verbo = "activar" if nuevo_estado else "desactivar"
    if _preguntar(f"¿{verbo.capitalize()} esta cuenta? (s/n)").lower() != "s":
        print("Sin cambios.")
        return 0
    if not nuevo_estado and _es_ultimo_admin_activo(db, usuario):
        print("No se puede desactivar: es la última cuenta activa con rol admin.")
        print("Asigna el rol admin a otra cuenta activa primero.")
        return 1
    usuario.activo = nuevo_estado
    _auditar_usuario(
        db,
        AuditAction.USER_UPDATE,
        usuario,
        detalles={"reason_code": "activation_change" if nuevo_estado else "deactivation_change"},
    )
    db.commit()
    print(f"Cuenta {usuario.email} {'activada' if nuevo_estado else 'desactivada'}.")
    return 0


def _menu_roles(db: Session) -> int:
    usuario = _pedir_usuario(db)
    if usuario is None:
        return 0
    actuales = _roles_nombres(usuario)
    print(f"Roles actuales de {usuario.email}: {', '.join(actuales) if actuales else 'ninguno'}.")
    roles = _roles(db)
    if not roles:
        print("No hay roles registrados.", file=sys.stderr)
        return 1
    for numero, rol in enumerate(roles, start=1):
        marca = " *" if rol.nombre in actuales else ""
        print(f"  {numero}) {rol.nombre}{marca}")
    print("Escribe +nombre para añadir y -nombre para quitar (también +1 / -1).")
    entrada = _preguntar("Cambios")
    cambios: list[tuple[Rol, bool]] = []
    for token in (parte for parte in re.split(r"[\s,]+", entrada) if parte):
        quitar = token.startswith("-")
        cuerpo = token[1:] if token[0] in "+-" else token
        rol = None
        if cuerpo.isdigit():
            indice = int(cuerpo)
            if 1 <= indice <= len(roles):
                rol = roles[indice - 1]
        else:
            rol = next((candidato for candidato in roles if candidato.nombre == cuerpo), None)
        if rol is None:
            print(f"No reconozco «{token}»; no se aplica ningún cambio.")
            return 0
        cambios.append((rol, quitar))
    finales = set(actuales)
    for rol, quitar in cambios:
        if quitar:
            finales.discard(rol.nombre)
        else:
            finales.add(rol.nombre)
    if not finales:
        print("Un usuario debe conservar al menos un rol; no se aplica ningún cambio.")
        return 1
    if finales == set(actuales):
        print("Sin cambios.")
        return 0
    for rol in roles:
        estaba = rol.nombre in actuales
        queda = rol.nombre in finales
        if estaba and not queda:
            db.query(UsuarioRol).filter(
                UsuarioRol.usuario_id == usuario.id, UsuarioRol.rol_id == rol.id
            ).delete()
            _auditar_usuario(
                db, AuditAction.USER_ROLE_CHANGE, usuario, detalles={"role_code": rol.nombre}
            )
        elif queda and not estaba:
            db.add(UsuarioRol(usuario_id=usuario.id, rol_id=rol.id))
            _auditar_usuario(
                db, AuditAction.USER_ROLE_CHANGE, usuario, detalles={"role_code": rol.nombre}
            )
    db.commit()
    print(f"Roles de {usuario.email}: {', '.join(sorted(finales))}.")
    return 0


def _menu() -> int:
    opciones: dict[str, Callable[[Session], int]] = {
        "1": _menu_crear,
        "2": _menu_restablecer,
        "3": _imprimir_tabla,
        "4": _menu_activar,
        "5": _menu_roles,
    }
    while True:
        print()
        print(_MENU)
        opcion = input("Opción: ").strip()
        if opcion == "0":
            print("Hasta luego.")
            return 0
        operacion = opciones.get(opcion)
        if operacion is None:
            print("Opción no válida.")
            continue
        _ejecutar(operacion)


def _crear_no_interactivo(argumentos: argparse.Namespace) -> int:
    correo = _normalizar_correo(argumentos.correo)
    error = _validar_correo(correo)
    if error is not None:
        print(error, file=sys.stderr)
        return 1
    nombres_roles = list(
        dict.fromkeys(parte.strip() for parte in argumentos.rol.split(",") if parte.strip())
    )
    if not nombres_roles:
        print("Indica al menos un rol con --rol.", file=sys.stderr)
        return 1
    clave = _pedir_clave()
    if clave is None:
        return 1

    def operacion(db: Session) -> int:
        institucion = (
            db.query(Institucion).filter(Institucion.nombre == argumentos.institucion).first()
        )
        if institucion is None:
            institucion = (
                db.query(Institucion).filter(Institucion.codigo == argumentos.institucion).first()
            )
        if institucion is None:
            print(
                f"No existe la institución «{argumentos.institucion}» (nombre o código).",
                file=sys.stderr,
            )
            return 1
        roles: list[Rol] = []
        for nombre_rol in nombres_roles:
            rol = db.query(Rol).filter(Rol.nombre == nombre_rol).first()
            if rol is None:
                print(f"No existe el rol «{nombre_rol}».", file=sys.stderr)
                return 1
            roles.append(rol)
        return _guardar_usuario(
            db,
            correo=correo,
            nombre=argumentos.nombre,
            institucion=institucion,
            roles=roles,
            clave=clave,
        )

    return _ejecutar(operacion)


def _parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Administra usuarios de la base del sistema (alta, contraseña, estado y roles)."
    )
    parser.add_argument(
        "--listar", action="store_true", help="Imprime la tabla de usuarios y sale."
    )
    parser.add_argument("--correo", help="Correo del usuario a crear.")
    parser.add_argument("--rol", help="Rol o roles separados por coma para el usuario nuevo.")
    parser.add_argument(
        "--institucion", help="Nombre o código de una institución existente para el usuario nuevo."
    )
    parser.add_argument("--nombre", help="Nombre visible; por defecto, la parte local del correo.")
    parser.add_argument(
        "--restablecer", metavar="CORREO", help="Cambia la contraseña de ese correo."
    )
    return parser


def main(argv: list[str] | None = None) -> int:
    argumentos = _parser().parse_args(argv)
    try:
        if argumentos.listar:
            return _ejecutar(_imprimir_tabla)
        if argumentos.restablecer is not None:
            correo = _normalizar_correo(argumentos.restablecer)
            error = _validar_correo(correo)
            if error is not None:
                print(error, file=sys.stderr)
                return 1
            return _ejecutar(lambda db: _restablecer_por_correo(db, correo))
        if (
            argumentos.correo is not None
            or argumentos.rol is not None
            or argumentos.institucion is not None
        ):
            faltan = [
                nombre
                for nombre in ("correo", "rol", "institucion")
                if getattr(argumentos, nombre) is None
            ]
            if faltan:
                print(
                    "Faltan datos: " + ", ".join(f"--{nombre}" for nombre in faltan),
                    file=sys.stderr,
                )
                return 2
            return _crear_no_interactivo(argumentos)
        if argumentos.nombre is not None:
            print(
                "--nombre solo se usa junto con --correo, --rol y --institucion.", file=sys.stderr
            )
            return 2
        return _menu()
    except KeyboardInterrupt:
        print("\nCancelado.", file=sys.stderr)
        return 130
    except EOFError:
        print()
        return 0


if __name__ == "__main__":
    raise SystemExit(main())
