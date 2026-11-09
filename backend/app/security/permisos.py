"""Catálogo de permisos y matriz por defecto de los roles base (HU-011).

Es la referencia que usa la aplicación para validar códigos de permiso. La
migración ``0006`` siembra esta misma matriz en una base nueva y
``asegurar_catalogo`` la completa en desarrollo y en las pruebas.
"""

from __future__ import annotations

from typing import Final

from sqlalchemy.orm import Session

from app.models.usuarios import Permiso, Rol, RolPermiso

PERMISOS: Final[dict[str, str]] = {
    "paciente.leer": "Consultar el listado y el detalle de pacientes",
    "paciente.escribir": "Registrar y actualizar pacientes y casos",
    "ficha.leer": "Consultar la ficha clínica del caso",
    "ficha.escribir": "Registrar y versionar la ficha clínica",
    "documento.leer": "Ver y descargar los documentos del caso",
    "documento.cargar": "Cargar documentos del caso",
    "imagen.leer": "Ver las imágenes del caso",
    "imagen.cargar": "Cargar imágenes del caso",
    "inferencia.ejecutar": "Ejecutar la inferencia de IA sobre una imagen",
    "inferencia.leer": "Consultar los resultados de inferencia",
    "reporte.generar": "Generar el reporte PDF de una inferencia",
    "investigacion.leer": "Consultar cohortes y métricas agregadas",
    "investigacion.exportar": "Exportar conjuntos de datos anonimizados",
    "auditoria.leer": "Consultar la bitácora de auditoría",
    "usuario.gestionar": "Crear, editar y desactivar usuarios",
    "rol.gestionar": "Editar la matriz de roles y permisos",
    "ajustes.gestionar": "Cambiar los ajustes del sistema",
}

ROLES_BASE: Final[dict[str, str]] = {
    "admin": "Administrador: usuarios, roles y ajustes, sin acceso a datos clínicos",
    "doctor": "Médico: pacientes, fichas, imágenes e inferencias",
    "researcher": "Investigador: cohortes y exportación anonimizada",
}

PERMISOS_POR_ROL: Final[dict[str, tuple[str, ...]]] = {
    "admin": (
        "ajustes.gestionar",
        "auditoria.leer",
        "rol.gestionar",
        "usuario.gestionar",
    ),
    "doctor": (
        "documento.cargar",
        "documento.leer",
        "ficha.escribir",
        "ficha.leer",
        "imagen.cargar",
        "imagen.leer",
        "inferencia.ejecutar",
        "inferencia.leer",
        "paciente.escribir",
        "paciente.leer",
        "reporte.generar",
    ),
    "researcher": (
        "inferencia.leer",
        "investigacion.exportar",
        "investigacion.leer",
    ),
}

PERMISO_IRRENUNCIABLE_ADMIN: Final[str] = "rol.gestionar"
"""El rol administrador conserva este permiso para no bloquear la propia matriz."""


def asegurar_catalogo(db: Session) -> None:
    """Crea lo que falte del catálogo y aplica la matriz por defecto.

    Solo aplica la matriz por defecto a los roles que crea en esta llamada: una
    edición hecha desde la pantalla no se revierte, ni siquiera si el rol se
    quedó sin permisos. El commit lo decide quien llama.
    """
    permisos_por_codigo = {permiso.codigo: permiso for permiso in db.query(Permiso).all()}
    for codigo, descripcion in PERMISOS.items():
        if codigo not in permisos_por_codigo:
            permiso = Permiso(codigo=codigo, descripcion=descripcion)
            db.add(permiso)
            permisos_por_codigo[codigo] = permiso

    roles_por_nombre = {rol.nombre: rol for rol in db.query(Rol).all()}
    creados: list[str] = []
    for nombre, descripcion in ROLES_BASE.items():
        if nombre not in roles_por_nombre:
            rol = Rol(nombre=nombre, descripcion=descripcion)
            db.add(rol)
            roles_por_nombre[nombre] = rol
            creados.append(nombre)

    db.flush()

    for nombre in creados:
        rol = roles_por_nombre[nombre]
        ya_asignados = {
            permiso_id
            for (permiso_id,) in db.query(RolPermiso.permiso_id).filter(RolPermiso.rol_id == rol.id)
        }
        for codigo in PERMISOS_POR_ROL[nombre]:
            permiso_id = permisos_por_codigo[codigo].id
            if permiso_id not in ya_asignados:
                db.add(RolPermiso(rol_id=rol.id, permiso_id=permiso_id))
