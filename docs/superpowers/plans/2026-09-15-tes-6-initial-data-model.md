# TES-6 Initial Data Model Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Materialize the smallest traceable PostgreSQL model needed for authentication/RBAC, the first patient flow, PII protection, sessions, and baseline audit evidence.

**Architecture:** Keep persistence models inside module infrastructure and expose no SQLAlchemy model as a domain entity. Use PostgreSQL schemas `security`, `clinical`, and `audit`; UUIDs for business entities and BIGINT identity for append-only audit events. Encrypt patient identity in the Python application with AES-256-GCM using a key supplied only through environment configuration.

**Tech Stack:** Python 3.12, SQLAlchemy 2, Alembic, PostgreSQL 17, asyncpg, cryptography/AESGCM, pytest, uv.

**Spec:** `docs/superpowers/specs/2026-09-15-optimus-thy-architecture-design.md`

## Global Constraints

- The signed anteproyecto is authoritative for academic scope; the reference DDL is only design evidence.
- Implement only tables required for auth + first patient flow + baseline audit.
- One effective role per user; do not recreate `usuarios_roles` many-to-many.
- UUID is canonical for user, role, institution, session, patient and patient identity references.
- Patient PII is physically separated from the operational patient row.
- PII encryption keys never live in Git, SQL migrations, seeds, database tables, or logs.
- No real patient/user data in seeds or tests.
- Consent, clinical cases, thyroid profile, documents, images, OCR and IA tables are deferred.

---

### Task 1: Document the Ola 1 model and divergences

**Files:**
- Create: `docs/data-model/README.md`
- Modify: `.env.example`

**Produces:** ER diagram, canonical patient vocabulary, PII list, ON DELETE policy, deferred tables, and DDL-reference comparison.

- [x] Document tables: `security.institutions`, `security.roles`, `security.users`, `security.sessions`, `clinical.patients`, `clinical.patient_identity`, `audit.events`.
- [x] Define canonical patient fields for Ola 1: `id`, `public_code`, `status`, `first_names`, `last_names`; keep other identity/clinical attributes deferred until TES-10 validates them.
- [x] Document AES-256-GCM application-level encryption and `PII_ENCRYPTION_KEY_B64`.
- [x] Document that institution is affiliation metadata, not a multi-tenant feature.
- [x] Document differences from `backend/sql/DDL.sql`, including single-role FK and deferred consent/clinical tables.

### Task 2: Add PII encryption adapter test-first

**Files:**
- Modify: `apps/api/pyproject.toml`
- Modify: `apps/api/src/optimus_thy/config/settings.py`
- Create: `apps/api/src/optimus_thy/shared/security/pii_cipher.py`
- Create: `apps/api/src/optimus_thy/shared/security/__init__.py`
- Create: `apps/api/tests/test_pii_cipher.py`

**Produces:** `PiiCipher.from_base64_key()` plus `encrypt_text()` / `decrypt_text()`.

- [x] Write tests for successful round-trip, randomized ciphertext, and invalid key length.
- [x] Run tests and verify RED because the adapter is absent.
- [x] Add `cryptography` and implement minimal AESGCM adapter using a fresh 12-byte nonce per value.
- [x] Re-run tests GREEN and quality gates.

### Task 3: Define SQLAlchemy persistence models

**Files:**
- Modify: `apps/api/src/optimus_thy/shared/database/base.py`
- Create: `apps/api/src/optimus_thy/shared/database/models.py`
- Create: `apps/api/src/optimus_thy/modules/auth/infrastructure/persistence/models.py`
- Create: `apps/api/src/optimus_thy/modules/patients/infrastructure/persistence/models.py`
- Create: `apps/api/src/optimus_thy/modules/audit/infrastructure/persistence/models.py`
- Add required package `__init__.py` files.

**Produces:** SQLAlchemy metadata for seven initial tables with explicit schemas, constraints, FKs and indexes.

- [x] Add naming convention for deterministic Alembic constraint names.
- [x] Add UUID-backed institution, role, user, session, patient and identity models.
- [x] Enforce one role through `security.users.role_id` rather than a join table.
- [x] Use encrypted binary columns only for first/last names in the first migration.
- [x] Add append-only `audit.events` with BIGINT identity and nullable actor FK using `ON DELETE SET NULL`.
- [x] Verify metadata contains only the seven approved tables.

### Task 4: Generate and verify the initial Alembic migration

**Files:**
- Modify: `apps/api/alembic/env.py`
- Create: `apps/api/alembic/versions/*_initial_ola1_model.py`
- Create: `apps/api/tests/test_migrations_integration.py`

**Produces:** reproducible `upgrade head -> downgrade base -> upgrade head` from an empty PostgreSQL database.

- [x] Import model aggregator before assigning Alembic target metadata and enable schema-aware comparisons.
- [x] Generate migration, review it manually, and add creation/drop of the three schemas.
- [x] Add integration test using `TEST_DATABASE_URL` that verifies upgrade/downgrade/re-upgrade and the expected table set.
- [x] Verify unique/FK behavior and explicit `ON DELETE` rules.

### Task 5: Add reproducible development seed

**Files:**
- Create: `apps/api/src/optimus_thy/shared/database/seed_dev.py`
- Modify: `Makefile`
- Create: `apps/api/tests/test_seed_integration.py`

**Produces:** idempotent simulated institution, three roles, disabled simulated users, and one encrypted simulated patient.

- [x] Use deterministic UUID constants and reserved `.example.test` emails; no real identities.
- [x] Mark seeded users inactive/disabled until TES-7 implements password hashing/login.
- [x] Encrypt simulated patient names with configured `PII_ENCRYPTION_KEY_B64`.
- [x] Run the seed twice and assert counts do not increase.

### Task 6: Run migration tests in CI and close TES-6 evidence

**Files:**
- Modify: `.github/workflows/ci.yml`
- Modify: `docs/data-model/README.md`
- Modify: `docs/development/verification.md`

**Produces:** PostgreSQL-backed migration/seed tests in GitHub Actions and local clean-database evidence.

- [x] Add PostgreSQL 17 service to backend CI with development-only test credentials and `TEST_DATABASE_URL`.
- [x] Run complete local quality gates.
- [x] Verify empty DB upgrade, downgrade, re-upgrade, PII roundtrip, FK/unique constraints and idempotent seed.
- [x] Confirm GitHub Actions backend/frontend jobs succeed on the final commit.
- [x] Record exact evidence and update TES-6 only after all checks are green.


## Completion evidence

- Functional verification commit: `52a043481d503f98ca8b6399984d4bfd7b026e38`.
- Local dedicated PostgreSQL integration suite: 2/2 passed.
- Local seed idempotency: `3:3:1` after two executions.
- GitHub Actions run `34967909019`: backend and frontend succeeded; backend executed 10/10 tests with PostgreSQL 17.
- Detailed evidence: `docs/development/verification.md`.
