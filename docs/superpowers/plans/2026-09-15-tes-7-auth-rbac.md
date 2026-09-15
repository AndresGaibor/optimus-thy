# TES-7 Authentication and RBAC Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement real PostgreSQL-backed authentication, opaque sessions, RBAC, request/audit traceability, and a stable OpenAPI contract for TES-17/TES-8.

**Architecture:** FastAPI exposes `/auth/login`, `/auth/me`, and `/auth/logout`. Application services depend on focused persistence/audit helpers; passwords use Argon2id, browser sessions use opaque 256-bit tokens with only SHA-256 hashes stored in PostgreSQL, and RBAC is enforced server-side through reusable dependencies.

**Tech Stack:** Python 3.12, FastAPI, SQLAlchemy async, PostgreSQL 17, `pwdlib[argon2]`, Pydantic, pytest, httpx2, Alembic, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-09-15-tes-7-auth-rbac-design.md`

## Global Constraints

- Session strategy remains opaque server-side sessions persisted in PostgreSQL; no JWT/localStorage.
- Password hashing uses Argon2id and minimum 15-character passwords for newly created hashes.
- Session tokens contain 256 random bits; PostgreSQL stores only SHA-256(token).
- Default session TTL is 8 hours.
- Cookie is `HttpOnly`, `SameSite=Strict`, `Path=/`, no `Domain`; `Secure=false` only in development.
- Invalid email, invalid password, and inactive user return the same generic 401.
- Authenticated-but-forbidden access returns 403.
- Audit events must never contain passwords, raw session tokens, or clinical content.
- No MFA, OAuth/SSO, recovery, account lockout, patient CRUD, frontend login, or admin acting-view implementation in TES-7.

---

### Task 1: Security primitives and auth settings

**Files:**
- Modify: `apps/api/pyproject.toml`
- Modify: `apps/api/src/optimus_thy/config/settings.py`
- Create: `apps/api/src/optimus_thy/shared/security/passwords.py`
- Create: `apps/api/src/optimus_thy/shared/security/session_tokens.py`
- Test: `apps/api/tests/test_password_security.py`
- Test: `apps/api/tests/test_session_tokens.py`

**Interfaces:**
- Produces: `PasswordService.hash_password(password: str) -> str`
- Produces: `PasswordService.verify_and_update(password: str, stored_hash: str) -> tuple[bool, str | None]`
- Produces: `generate_session_token() -> str`
- Produces: `hash_session_token(token: str) -> str`
- Settings: `auth_cookie_name`, `auth_session_ttl_seconds`, `auth_cookie_secure`

- [x] Write tests that enforce 15-character hashing minimum, successful Argon2 round-trip, wrong-password rejection, 256-bit token entropy, deterministic SHA-256 hashing, and absence of the raw token from its hash.
- [x] Run focused tests and verify RED because the helpers/settings do not exist.
- [x] Add `pwdlib[argon2]` through `uv`, implement `PasswordService` with `PasswordHash.recommended()`, and implement `secrets.token_urlsafe(32)` + SHA-256 token hashing.
- [x] Add auth settings with 8-hour default and development-only insecure cookie default.
- [x] Run focused tests, Ruff, format and mypy; commit the green block.

### Task 2: Extend audit context and request IDs

**Files:**
- Modify: `apps/api/src/optimus_thy/modules/audit/infrastructure/persistence/models.py`
- Create: `apps/api/alembic/versions/20260915_02_auth_audit_context.py`
- Create: `apps/api/src/optimus_thy/shared/http/request_id.py`
- Modify: `apps/api/src/optimus_thy/main.py`
- Test: `apps/api/tests/test_request_id.py`
- Modify: `apps/api/tests/test_migrations_integration.py`

**Interfaces:**
- Audit columns: `actor_role: str | None`, `active_view: str | None`.
- Request state/header: `request.state.request_id` and response `X-Request-ID`.

- [x] Write failing tests for request-ID generation/echo and migration presence of `actor_role`/`active_view`.
- [x] Verify RED before middleware/migration exists.
- [x] Add Alembic revision `20260915_02`, update model metadata, and add request-ID middleware accepting a safe inbound UUID/string or generating a UUID4.
- [x] Verify upgrade/downgrade and request tests GREEN against PostgreSQL.
- [x] Run quality gates and commit.

### Task 3: Database session, auth repository and audit writer

**Files:**
- Create: `apps/api/src/optimus_thy/shared/database/session.py`
- Create: `apps/api/src/optimus_thy/modules/auth/infrastructure/persistence/repository.py`
- Create: `apps/api/src/optimus_thy/modules/audit/application/service.py`
- Test: `apps/api/tests/test_auth_repository_integration.py`

**Interfaces:**
- `get_async_session() -> AsyncIterator[AsyncSession]` for FastAPI dependencies.
- `AuthRepository.get_user_by_email(email: str) -> AuthUserRecord | None`.
- `AuthRepository.create_session(user_id: UUID, token_hash: str, expires_at: datetime) -> UUID`.
- `AuthRepository.get_session_user(token_hash: str, now: datetime) -> AuthenticatedUser | None`.
- `AuthRepository.revoke_session(token_hash: str, revoked_at: datetime) -> bool`.
- `AuditService.record(...) -> None` writes `audit.events` without secrets.

- [x] Write PostgreSQL integration tests for user lookup, active session resolution, expiry/revocation rejection, session revocation, and audit persistence.
- [x] Verify RED because repository/service do not exist.
- [x] Implement minimal SQLAlchemy async repository using joined role data; never return password hash outside credential verification path.
- [x] Implement `AuditService` with explicit fields only; no arbitrary request/body serialization.
- [x] Run integration tests and quality gates; commit.

### Task 4: Authentication application service

**Files:**
- Create: `apps/api/src/optimus_thy/modules/auth/application/models.py`
- Create: `apps/api/src/optimus_thy/modules/auth/application/service.py`
- Test: `apps/api/tests/test_auth_service.py`

**Interfaces:**
- `AuthUser` contains `id`, `email`, `display_name`, `role`.
- `LoginResult` contains `user`, `session_token`, `session_expires_at`.
- `AuthService.login(email: str, password: str, request_id: str | None) -> LoginResult`.
- `AuthService.authenticate_session(raw_token: str) -> AuthUser | None`.
- `AuthService.logout(raw_token: str, request_id: str | None) -> None`.

- [x] Write tests for valid login, wrong password, unknown email, inactive user, hash upgrade, session creation and audit events.
- [x] Verify RED before service exists.
- [x] Implement generic invalid-credentials error so unknown email, bad password and inactive user are externally indistinguishable.
- [x] On success update `last_login_at`, persist only token hash, and audit success; on failure audit without submitted email/password/token payload.
- [x] Implement session authentication and logout/revocation.
- [x] Run focused tests and quality gates; commit.

### Task 5: FastAPI auth endpoints and cookie contract

**Files:**
- Create: `apps/api/src/optimus_thy/modules/auth/api/schemas.py`
- Create: `apps/api/src/optimus_thy/modules/auth/api/dependencies.py`
- Create: `apps/api/src/optimus_thy/modules/auth/api/router.py`
- Modify: `apps/api/src/optimus_thy/main.py`
- Test: `apps/api/tests/test_auth_api_integration.py`

**Interfaces:**
- `POST /auth/login` body `{email,password}`; response `{id,email,display_name,role}` plus session cookie.
- `GET /auth/me` returns the same public user shape.
- `POST /auth/logout` returns HTTP 204 and expires the cookie.
- Missing/invalid/expired/revoked session => generic 401.

- [x] Write PostgreSQL-backed API tests for valid/invalid/inactive login, `/auth/me`, expired/revoked cookie and logout.
- [x] Verify RED because routes do not exist.
- [x] Implement Pydantic schemas, dependency wiring and router using the application service.
- [x] Set cookie with `HttpOnly`, `SameSite=Strict`, `Path=/`, no `Domain`, and environment-driven `Secure`.
- [x] Ensure raw token appears only in `Set-Cookie`, never JSON or audit rows.
- [x] Run focused tests and quality gates; commit.

### Task 6: Reusable RBAC authorization and denied-access audit

**Files:**
- Modify: `apps/api/src/optimus_thy/modules/auth/api/dependencies.py`
- Test: `apps/api/tests/test_rbac_api_integration.py`

**Interfaces:**
- `get_current_user(...) -> AuthUser` requires a valid session.
- `require_roles(*allowed_roles: str)` returns a FastAPI dependency callable.
- Allowed roles for Ola 1 are exactly `medico`, `investigador`, `administrador`.

- [x] Build a test-only FastAPI route protected by `require_roles("administrador")` and write tests for unauthenticated 401, administrator success, and authenticated doctor/researcher 403.
- [x] Verify RED before RBAC factory exists.
- [x] Implement `require_roles` using the real role from the authenticated session; never trust role headers/body/query parameters.
- [x] On 403, record `auth.access.denied` with actor user ID, actor role, request ID, route resource type and no secret material.
- [x] Verify role-denied audit and allowed-role behavior against PostgreSQL.
- [x] Run focused tests and quality gates; commit.

### Task 7: Canonical OpenAPI contract for TES-17

**Files:**
- Create: `apps/api/scripts/export_openapi.py`
- Create: `packages/contracts/openapi.json`
- Modify: `packages/contracts/README.md`
- Modify: `Makefile`
- Test: `apps/api/tests/test_auth_openapi_contract.py`

**Interfaces:**
- `make contracts` deterministically exports FastAPI OpenAPI to `packages/contracts/openapi.json`.
- Contract includes only public response fields for login/me and HTTP 204 logout.
- Authentication routes document their real 401 behavior. RBAC 403 is verified at the reusable guard level; no fictitious 403 is added to `/auth/me` or `/auth/logout`.

- [x] Write contract tests asserting paths, methods, public response schemas, real 401 documentation, `SessionCookie` security metadata and absence of `session_token`/`password_hash` from public schemas.
- [x] Verify contract failure before the cookie security scheme/response metadata is present.
- [x] Implement deterministic OpenAPI export script and `make contracts` target.
- [x] Export from FastAPI and commit `packages/contracts/openapi.json`; document that generated OpenAPI is canonical and must not be hand-edited.
- [x] Regenerate in GitHub Actions and assert zero `git diff` for `packages/contracts/openapi.json` to prove determinism.
- [x] Run contract tests and backend/frontend quality gates in GitHub Actions; run `34995417811` completed successfully including the drift check.

### Task 8: End-to-end verification, documentation and closure evidence

**Files:**
- Modify: `README.md`
- Modify: `docs/development/verification.md`
- Modify: `docs/superpowers/plans/2026-09-15-tes-7-auth-rbac.md`

**Interfaces:**
- Developer docs explain login/me/logout, cookie/session behavior, OpenAPI generation and the TES-7 integration boundary.
- CI remains the authoritative reproducibility gate with PostgreSQL 17.

- [x] Run migrations through latest head and execute the complete PostgreSQL-backed backend suite in GitHub Actions.
- [x] Run all backend/frontend quality gates, regenerate OpenAPI and verify zero generated-contract drift in CI; this is stronger than a local `make check` that skips PostgreSQL tests when `TEST_DATABASE_URL` is absent.
- [x] Exercise login → `/auth/me` → logout through the full FastAPI ASGI stack with a simulated active user and verify, across the auth service/API integration tests, Argon2 hashing, SHA-256 session storage, expiry/revocation and secret-free audit behavior.
- [x] Update README and verification evidence with the implemented contract, commands and exact CI evidence.
- [x] Push the final documentation/plan commit and require fresh GitHub Actions Backend/Frontend success on that exact commit (run `34995755116`, commit `2952453`: Backend/Frontend `success`).
- [ ] Only after that fresh CI succeeds, update TES-7 criteria/subtasks with the explicit TES-8/TES-17 integration boundary and move Linear issue to Done.

## Completion gate

TES-7 is not complete merely because unit tests pass. Completion requires PostgreSQL-backed authentication/RBAC tests, migration verification, deterministic OpenAPI, secret-safety checks, reproducible backend/frontend quality gates, and GitHub Actions success on the final commit. Application of `require_roles(...)` to real patient endpoints belongs to TES-8; frontend session/navigation guards belong to TES-17.
