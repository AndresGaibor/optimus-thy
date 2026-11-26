"""Modelos ORM del proyecto OPTIMUS-THY."""

from __future__ import annotations

from app.db import Base
from app.models.auditoria import Auditoria, AuditoriaAncla
from app.models.consentimientos import Consentimiento
from app.models.correo import ConfiguracionCorreo, PlantillaCorreo, TokenRecuperacion
from app.models.cumplimiento import SolicitudDerecho
from app.models.datasets import Dataset, DatasetCaso
from app.models.documentos import Documento
from app.models.fichas import Caso, FichaClinica, FichaVersion
from app.models.imagenes import DecisionMedica, Imagen, Inferencia, ModeloIA, Nodulo
from app.models.instituciones import Institucion
from app.models.pacientes import IdentidadPaciente, Paciente
from app.models.sesiones import Sesion
from app.models.trabajos import Trabajo
from app.models.usuarios import Permiso, Rol, RolPermiso, Usuario, UsuarioRol

__all__ = [
    "Auditoria",
    "AuditoriaAncla",
    "Base",
    "Caso",
    "ConfiguracionCorreo",
    "Consentimiento",
    "Dataset",
    "DatasetCaso",
    "DecisionMedica",
    "Documento",
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
    "PlantillaCorreo",
    "Rol",
    "RolPermiso",
    "Sesion",
    "SolicitudDerecho",
    "TokenRecuperacion",
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
    "imagenes",
    "modelos_ia",
    "inferencias",
    "nodulos",
    "decisiones_medicas",
    "consentimientos",
    "datasets",
    "datasets_casos",
    "auditoria",
    "auditoria_ancla",
    "sesiones",
    "trabajos",
    "configuracion_correo",
    "plantillas_correo",
    "tokens_recuperacion",
    "solicitudes_derechos",
]
