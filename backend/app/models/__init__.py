"""Modelos ORM del proyecto OPTIMUS-THY."""

from __future__ import annotations

from app.db import Base
from app.models.auditoria import Auditoria
from app.models.consentimientos import Consentimiento
from app.models.documentos import CampoOCR, Documento, ExtraccionOCR
from app.models.fichas import Caso, FichaClinica, FichaVersion
from app.models.imagenes import DecisionMedica, Imagen, Inferencia, ModeloIA, Nodulo
from app.models.instituciones import Institucion
from app.models.pacientes import IdentidadPaciente, Paciente
from app.models.sesiones import Sesion
from app.models.trabajos import Trabajo
from app.models.usuarios import Permiso, Rol, RolPermiso, Usuario, UsuarioRol

__all__ = [
    "Auditoria",
    "Base",
    "CampoOCR",
    "Caso",
    "Consentimiento",
    "DecisionMedica",
    "Documento",
    "ExtraccionOCR",
    "FichaClinica",
    "FichaVersion",
    "IdentidadPaciente",
    "Imagen",
    "Inferencia",
    "Institucion",
    "ModeloIA",
    "Nodulo",
    "Paciente",
    "Permiso",
    "Rol",
    "RolPermiso",
    "Sesion",
    "Trabajo",
    "Usuario",
    "UsuarioRol",
]

TABLAS: list[str] = [
    "instituciones",
    "usuarios",
    "roles",
    "permisos",
    "usuarios_roles",
    "roles_permisos",
    "pacientes",
    "identidades_paciente",
    "casos",
    "fichas_clinicas",
    "fichas_versiones",
    "documentos",
    "extracciones_ocr",
    "campos_ocr",
    "imagenes",
    "modelos_ia",
    "inferencias",
    "nodulos",
    "decisiones_medicas",
    "consentimientos",
    "auditoria",
    "sesiones",
    "trabajos",
]
