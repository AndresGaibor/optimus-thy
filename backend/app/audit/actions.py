"""Vocabulario de la bitácora: acciones, módulos y tipos de objeto (HT-030)."""

from __future__ import annotations

from enum import StrEnum


class AuditAction(StrEnum):
    """Acciones registrables, una por cada hecho que cita el anteproyecto."""

    # Sesión (RF-AUD-01)
    SESSION_START = "SESSION_START"
    SESSION_END = "SESSION_END"
    LOGIN_FAILED = "LOGIN_FAILED"
    ROLE_SWITCH = "ROLE_SWITCH"

    # Consultas (RF-AUD-02)
    PATIENT_READ = "PATIENT_READ"
    RECORD_READ = "RECORD_READ"
    DOCUMENT_READ = "DOCUMENT_READ"
    IMAGE_READ = "IMAGE_READ"
    INFERENCE_READ = "INFERENCE_READ"

    # Altas y correcciones del registro clínico
    PATIENT_CREATE = "PATIENT_CREATE"
    PATIENT_UPDATE = "PATIENT_UPDATE"
    CASE_CREATE = "CASE_CREATE"

    # Cargas (RF-AUD-03)
    DOCUMENT_UPLOAD = "DOCUMENT_UPLOAD"
    IMAGE_UPLOAD = "IMAGE_UPLOAD"

    # Consentimiento (HU-034)
    CONSENT_CREATE = "CONSENT_CREATE"
    CONSENT_REVOKE = "CONSENT_REVOKE"

    # Informes (HU-080, HU-082)
    REPORT_DOWNLOAD = "REPORT_DOWNLOAD"

    # Procesamiento (RF-AUD-04)
    INFERENCE_REQUEST = "INFERENCE_REQUEST"

    # Exportaciones (RF-AUD-05)
    EXPORT = "EXPORT"

    # Administración (RF-AUD-06)
    USER_CREATE = "USER_CREATE"
    USER_UPDATE = "USER_UPDATE"
    USER_ROLE_CHANGE = "USER_ROLE_CHANGE"
    INSTITUTION_CREATE = "INSTITUTION_CREATE"
    INSTITUTION_UPDATE = "INSTITUTION_UPDATE"
    PERMISSION_CHANGE = "PERMISSION_CHANGE"
    SETTINGS_CHANGE = "SETTINGS_CHANGE"

    # Acceso denegado (RF-AUD-07)
    ACCESS_DENIED = "ACCESS_DENIED"

    # Datos personales y consulta de la propia bitácora
    PII_REVEAL = "PII_REVEAL"
    AUDIT_READ = "AUDIT_READ"

    # Recuperación de contraseña (TES-377)
    PASSWORD_RESET = "PASSWORD_RESET"

    # Decisión médica sobre una inferencia (TES-337)
    INFERENCE_DECISION = "INFERENCE_DECISION"


class AuditModule(StrEnum):
    """Módulo que originó el evento."""

    AUTH = "AUTH"
    PATIENTS = "PATIENTS"
    CLINICAL = "CLINICAL"
    FILES = "FILES"
    INFERENCE = "INFERENCE"
    ADMIN = "ADMIN"
    AUDIT = "AUDIT"
    EXPORT = "EXPORT"


class AuditObjectType(StrEnum):
    """Tipo de recurso al que apunta el evento; siempre una referencia."""

    PATIENT = "PATIENT"
    CASE = "CASE"
    RECORD = "RECORD"
    DOCUMENT = "DOCUMENT"
    IMAGE = "IMAGE"
    INFERENCE = "INFERENCE"
    CONSENT = "CONSENT"
    USER = "USER"
    ROLE = "ROLE"
    INSTITUTION = "INSTITUTION"
    SYSTEM = "SYSTEM"
    DATASET = "DATASET"
    REPORT = "REPORT"
    AUDIT = "AUDIT"
