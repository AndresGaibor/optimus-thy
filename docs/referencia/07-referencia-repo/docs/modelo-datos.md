# Modelo de Datos - OPTIMUS-THY

**Fecha:** 2024-09-23
**Versión:** 1.0

## ER Simplificado

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                  USERS & AUTH                                    │
│                                                                                  │
│  ┌──────────────┐       ┌──────────────┐       ┌─────────────────────────────┐ │
│  │    User      │───1:N─│   Session    │       │         Role                │ │
│  │──────────────│       │──────────────│       │──────────────│              │ │
│  │ id (PK)      │       │ id (PK)      │       │ id (PK)       │              │ │
│  │ email (UK)   │       │ user_id (FK) │       │ name          │              │ │
│  │ hashed_pwd   │       │ token_hash   │       └───────┬──────┘              │ │
│  │ name         │       │ expires_at   │               │                     │ │
│  │ role         │       └──────────────┘       ┌───────┴───────┐              │ │
│  │ institution_ │                              │ role_        │              │ │
│  │   id (FK)    │                              │ permissions  │              │ │
│  │ is_active    │                              │ (join table) │              │ │
│  └──────┬───────┘                              └───────┬───────┘              │ │
│         │                                            │                        │ │
│         │              ┌──────────────────────────────┘                        │ │
│         │              │                                                      │ │
│         └──────────────┼──────────────────────────────────────────────────────┘ │
│                        │                                                          │
└────────────────────────┼──────────────────────────────────────────────────────────┘
                         │
                         │ 1:N
                         ▼
┌───────────────────────────────────────────────────────────────────────────────────┐
│                              PATIENT & PII                                        │
│                                                                                    │
│  ┌──────────────┐       ┌──────────────┐       ┌──────────────────────────────┐  │
│  │   Patient    │───1:1─│  PatientPII  │       │    PatientConsent            │  │
│  │──────────────│       │──────────────│       │──────────────│               │  │
│  │ id (PK)      │       │ id (PK)      │       │ id (PK)       │               │  │
│  │ internal_    │       │ patient_id   │       │ patient_id    │               │  │
│  │   code (UK)  │       │ (FK, unique) │       │ (FK)          │               │  │
│  │ mrn          │       │ first_names_ │       │ consent_type  │               │  │
│  │ sex          │       │   enc (enc)  │       │ granted       │               │  │
│  │ is_active    │       │ last_names_  │       │ signed_by     │               │  │
│  │ institution_ │       │   enc (enc)  │       └──────────────┘               │  │
│  │   id (FK)    │       │ national_id_│                                            │  │
│  └──────┬───────┘       │   enc (enc)  │                                            │  │
│         │               │ dob_enc(enc) │                                            │  │
│         │               │ phone_enc    │                                            │  │
│         │               │ email_enc    │                                            │  │
│         │               │ address_enc  │                                            │  │
│         │               └──────────────┘                                            │  │
│         │                                                                       │  │
│         │ 1:N                                                                    │  │
│         ▼                                                                        │  │
│  ┌────────────────────────────────────────────────────────────────────────────┐  │
│  │                          CLINICAL CASE & ENCOUNTER                          │  │
│  │                                                                             │  │
│  │  ┌──────────────┐       ┌──────────────────┐       ┌─────────────────────┐ │  │
│  │  │ ClinicalCase │───1:N─│ ClinicalEncounter│───1:N─│ ClinicalDiagnosis   │ │  │
│  │  │──────────────│       │──────────────────│       │─────────────────────│ │  │
│  │  │ id (PK)      │       │ id (PK)          │       │ id (PK)            │ │  │
│  │  │ patient_id   │       │ case_id (FK)     │       │ encounter_id (FK)   │ │  │
│  │  │ case_number  │       │ doctor_id (FK)   │       │ icd10_code         │ │  │
│  │  │ status       │       │ encounter_type  │       │ description        │ │  │
│  │  │ doctor_id    │       │ encounter_date  │       │ diagnosis_type     │ │  │
│  │  │ notes        │       │ clinical_notes  │       │ diagnosed_by_id    │ │  │
│  │  └──────────────┘       └──────────────────┘       └─────────────────────┘ │  │
│  │          │                                                                   │  │
│  │          │ 1:N                                                                 │  │
│  │          ▼                                                                   │  │
│  │  ┌──────────────────┐                                                         │  │
│  │  │  ThyroidProfile  │                                                         │  │
│  │  │──────────────────│                                                         │  │
│  │  │ id (PK)         │                                                         │  │
│  │  │ case_id (FK)    │                                                         │  │
│  │  │ encounter_id    │                                                         │  │
│  │  │ tsh, t3, t4     │                                                         │  │
│  │  │ nodule_size_mm  │                                                         │  │
│  │  │ ti_rads         │                                                         │  │
│  │  │ bethesda        │                                                         │  │
│  │  │ paaf_performed  │                                                         │  │
│  │  └──────────────────┘                                                         │  │
│  │                                                                             │  │
│  └─────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                    │
└───────────────────────────────────────────────────────────────────────────────────┘
                         │
                         │ 1:N
                         ▼
┌───────────────────────────────────────────────────────────────────────────────────┐
│                              IMAGING & STUDIES                                     │
│                                                                                    │
│  ┌──────────────┐       ┌──────────────────┐       ┌────────────────────────────┐ │
│  │    Study     │───1:N─│  MedicalImage     │───1:N─│  MedicalImageROI          │ │
│  │──────────────│       │──────────────────│       │────────────────────────────│ │
│  │ id (PK)      │       │ id (PK)          │       │ id (PK)                   │ │
│  │ patient_id   │       │ study_id (FK)    │       │ medical_image_id (FK)     │ │
│  │ case_id (FK) │       │ patient_id (FK)  │       │ patient_id (FK)           │ │
│  │ title        │       │ case_id (FK)     │       │ case_id (FK)              │ │
│  │ study_type   │       │ file_name        │       │ x, y, width, height       │ │
│  │ modality     │       │ content_type     │       │ x_pct, y_pct, etc.        │ │
│  │ performed_at │       │ size_bytes       │       │ crop_storage_path          │ │
│  │ storage_path │       │ sha256_hash      │       │ crop_storage_bucket        │ │
│  └──────────────┘       │ storage_path     │       │ crop_sha256               │ │
│                          │ storage_bucket   │       │ label                     │ │
│                          │ is_anonymized   │       │ notes                     │ │
│                          └──────────────────┘       └────────────────────────────┘ │
│                                                                                    │
└───────────────────────────────────────────────────────────────────────────────────┘
                         │
                         │ 1:N
                         ▼
┌───────────────────────────────────────────────────────────────────────────────────┐
│                            INFERENCE & OCR JOBS                                    │
│                                                                                    │
│  ┌──────────────────┐       ┌──────────────────────┐       ┌────────────────────┐ │
│  │  InferenceJob    │───1:1─│ InferenceResultRecord │       │ InferenceArtifact  │ │
│  │──────────────────│       │──────────────────────│       │────────────────────│ │
│  │ id (PK)         │       │ id (PK)              │       │ id (PK)           │ │
│  │ patient_id (FK) │       │ job_id (FK, unique) │       │ job_id (FK)       │ │
│  │ roi_id (FK)     │       │ prediction          │       │ artifact_type     │ │
│  │ study_id (FK)   │       │ probability         │       │ storage_bucket    │ │
│  │ case_id (FK)    │       │ is_malignant       │       │ storage_path      │ │
│  │ status          │       │ confidence_score    │       │ content_type      │ │
│  │ model_name      │       │ processing_time_ms  │       │ size_bytes        │ │
│  │ model_version   │       │ heatmap_grid_json   │       │ sha256_hash       │ │
│  │ created_by_id   │       └──────────────────────┘       └────────────────────┘ │
│  │ retries         │                                                               │
│  └──────────────────┘       ┌──────────────────────┐                            │
│                              │      OCRJob          │───1:N─► OCRFieldResult      │
│                              │──────────────────────│    (ver ARD-004)           │
│                              │ id (PK)              │                            │
│                              │ document_id (FK)     │                            │
│                              │ patient_id (FK)     │                            │
│                              │ status               │                            │
│                              │ full_text           │                            │
│                              │ global_confidence   │                            │
│                              └──────────────────────┘                            │
│                                                                                    │
└───────────────────────────────────────────────────────────────────────────────────┘
                         │
                         │ 1:N
                         ▼
┌───────────────────────────────────────────────────────────────────────────────────┐
│                              AUDIT & SYSTEM                                         │
│                                                                                    │
│  ┌──────────────────┐       ┌──────────────────┐       ┌────────────────────┐   │
│  │   AuditEvent    │       │   CMSProject     │       │   SystemSetting    │   │
│  │──────────────────│       │──────────────────│       │────────────────────│   │
│  │ id (PK)         │       │ id (PK)          │       │ id (PK)           │   │
│  │ user_id (FK)    │       │ title            │       │ site_name         │   │
│  │ user_name       │       │ summary          │       │ notifications_en  │   │
│  │ user_role       │       │ description      │       │ default_language  │   │
│  │ action          │       │ status           │       │ max_file_upload   │   │
│  │ module          │       │ budget           │       │ maintenance_mode   │   │
│  │ details         │       └──────────────────┘       │ ai_auto_triage    │   │
│  │ ip_address      │                                  └────────────────────┘   │
│  │ request_id      │       ┌──────────────────┐                                 │
│  │ created_at      │       │    AIModel       │                                 │
│  └──────────────────┘       │──────────────────│                                 │
│                              │ id (PK)         │                                 │
│                              │ name            │                                 │
│                              │ version         │                                 │
│                              │ architecture    │                                 │
│                              │ weights_path    │                                 │
│                              │ threshold       │                                 │
│                              │ is_active       │                                 │
│                              └──────────────────┘                                 │
└───────────────────────────────────────────────────────────────────────────────────┘
```

## Tablas Principales

### users

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | UUID (PK) | Identificador único |
| email | VARCHAR(255) | Email único |
| hashed_password | VARCHAR(255) | Argon2id hash |
| name | VARCHAR(150) | Nombre completo |
| role | VARCHAR(50) | admin, doctor, researcher |
| institution_id | UUID (FK) | FK → institutions |
| is_active | BOOLEAN | Estado |
| created_at | TIMESTAMPTZ | Fecha creación |
| updated_at | TIMESTAMPTZ | Última modificación |

### institutions

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | UUID (PK) | Identificador único |
| code | VARCHAR(50) | Código único |
| name | VARCHAR(200) | Nombre |
| city | VARCHAR(100) | Ciudad |
| is_active | BOOLEAN | Estado |

### patients

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | UUID (PK) | Identificador único |
| internal_code | VARCHAR(50) | Código interno único |
| medical_record_number | VARCHAR(50) | MRN hospitalario |
| institution_id | UUID (FK) | FK → institutions |
| sex | VARCHAR(20) | Género |
| is_active | BOOLEAN | Estado |

### patient_pii

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | UUID (PK) | Identificador único |
| patient_id | UUID (FK, UK) | FK → patients |
| first_names_enc | TEXT | Nombres cifrados |
| last_names_enc | TEXT | Apellidos cifrados |
| national_id_enc | TEXT | DNI cifrado |
| date_of_birth_enc | TEXT | Fecha nacimiento cifrada |
| phone_enc | TEXT | Teléfono cifrado |
| email_enc | TEXT | Email cifrado |
| address_enc | TEXT | Dirección cifrada |

### clinical_cases

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | UUID (PK) | Identificador único |
| patient_id | UUID (FK) | FK → patients |
| doctor_id | UUID (FK) | FK → users |
| case_number | VARCHAR(50) | Número de caso único |
| status | VARCHAR(30) | open, closed |
| notes | TEXT | Notas |

### clinical_encounters

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | UUID (PK) | Identificador único |
| case_id | UUID (FK) | FK → clinical_cases |
| doctor_id | UUID (FK) | FK → users |
| encounter_type | VARCHAR(50) | consulta, control, urgencia |
| encounter_date | TIMESTAMPTZ | Fecha encuentro |
| clinical_notes | TEXT | Notas clínicas |

### thyroid_profiles

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | UUID (PK) | Identificador único |
| case_id | UUID (FK) | FK → clinical_cases |
| encounter_id | UUID (FK) | FK → clinical_encounters |
| tsh, t3, t4 | FLOAT | Laboratory values |
| nodule_size_mm | FLOAT | Tamaño nódulo |
| ti_rads | VARCHAR(20) | TI-RADS classification |
| bethesda | VARCHAR(50) | Bethesda category |
| paaf_performed | BOOLEAN | PAAF realizada |

### medical_images

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | UUID (PK) | Identificador único |
| study_id | UUID (FK) | FK → studies |
| patient_id | UUID (FK) | FK → patients |
| file_name | VARCHAR(255) | Nombre archivo |
| content_type | VARCHAR(100) | MIME type |
| size_bytes | INTEGER | Tamaño |
| sha256_hash | VARCHAR(64) | Checksum |
| storage_path | VARCHAR(500) | Path en S3 |
| storage_bucket | VARCHAR(100) | Bucket S3 |
| is_anonymized | BOOLEAN | Anonimizado |

### inference_jobs

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | UUID (PK) | Identificador único |
| patient_id | UUID (FK) | FK → patients |
| roi_id | UUID (FK) | FK → medical_image_rois |
| status | VARCHAR(30) | pending, processing, completed, failed |
| model_name | VARCHAR(50) | Nombre modelo |
| model_version | VARCHAR(50) | Versión modelo |
| threshold_used | FLOAT | Threshold usado |
| retries | INTEGER | Intentos |
| error_message | TEXT | Mensaje error |

### audit_events

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | UUID (PK) | Identificador único |
| user_id | UUID (FK) | FK → users |
| user_name | VARCHAR(150) | Nombre usuario |
| user_role | VARCHAR(50) | Rol usuario |
| action | VARCHAR(100) | Acción |
| module | VARCHAR(50) | Módulo |
| details | TEXT | Detalles |
| ip_address | VARCHAR(45) | IP cliente |
| request_id | VARCHAR(64) | Request ID |
| created_at | TIMESTAMPTZ | Fecha evento |

## Relaciones Clave

```
User 1:N Session (un usuario muchas sesiones)
User N:1 Institution (muchos usuarios una institución)
Patient 1:1 PatientPII (un paciente su PII)
Patient 1:N ClinicalCase (un paciente muchos casos)
ClinicalCase 1:N ClinicalEncounter (un caso muchos encuentros)
ClinicalEncounter 1:N ClinicalDiagnosis (un encuentro muchos diagnósticos)
ClinicalCase 1:N ThyroidProfile (un caso muchos perfiles tiroideos)
Study 1:N MedicalImage (un estudio muchas imágenes)
MedicalImage 1:N MedicalImageROI (una imagen muchos ROIs)
Patient 1:N InferenceJob (un paciente muchos jobs de inferencia)
MedicalImageROI 1:N InferenceJob (un ROI muchos jobs - reintentos)
InferenceJob 1:1 InferenceResultRecord (un job un resultado)
InferenceJob 1:N InferenceArtifact (un job muchos artefactos)
```

## Notas de Implementación

- Todas las FK tienen `ON DELETE` apropiado (SET NULL o CASCADE)
- PII en `patient_pii` usa cifrado AES-256-GCM
- Tokens de sesión se almacenan como SHA-256 hash
- UUIDs como primary keys para distribución
- Timestamps con timezone (TIMESTAMPTZ)
