# TES-7 Authentication, Sessions and RBAC Design

**Status:** approved design, pending implementation plan  
**Date:** 2026-09-15  
**Issue:** TES-7  

## 1. Purpose

Implement the minimum real security baseline required by Ola 1 without reusing the simulated login from the reference repository. The subsystem must authenticate users, persist revocable sessions, enforce role-based authorization, expose a stable HTTP contract for the frontend, and record security-relevant audit events without secrets.

This design inherits the decisions already approved in TES-4 and the persistence model materialized in TES-6. It does not redefine the thesis scope.

## 2. Fixed architectural decisions

- Authentication uses opaque server-side sessions stored in PostgreSQL.
- The browser receives only an opaque session token in a cookie.
- No JWT is persisted in `localStorage`.
- Passwords use Argon2id through `pwdlib[argon2]`.
- Each user has exactly one real role: `medico`, `investigador`, or `administrador`.
- PostgreSQL remains the durable source of truth for users, sessions and audit events.
- FastAPI/OpenAPI remains the canonical HTTP contract.
## 3. Password handling

New and updated password hashes use `PasswordHash.recommended()`, which uses Argon2. Verification uses `verify_and_update()` so a successful login can transparently refresh a hash when parameters become outdated.

The minimum password length for credentials created by the application is 15 characters. TES-7 does not add composition rules such as mandatory uppercase, digits, or symbols. Existing hashes are never logged or returned by the API.

The development seed remains non-loginable by default. Authentication tests create simulated active users with real hashes inside the test database.

## 4. Session model

A successful login generates a cryptographically secure random token with 256 bits of entropy. The raw token exists only in the client cookie and transiently in application memory during response creation.

PostgreSQL stores `SHA-256(token)` in `security.sessions.token_hash`, never the raw token. Session validity requires all of the following:

- the session exists;
- `revoked_at IS NULL`;
- `expires_at` is in the future;
- the linked user exists and is active.

The default session TTL is 8 hours and is configurable through application settings.
## 5. Cookie policy

Cookie name is application-configurable and defaults to `optimus_session`.

Cookie attributes:

- `HttpOnly=true`;
- `SameSite=Strict`;
- `Path=/`;
- no explicit `Domain`;
- session cookie, without browser-persistent lifetime;
- `Secure=true` outside development;
- `Secure=false` only for local HTTP development.

Logout revokes the server-side session and instructs the browser to delete the cookie.

## 6. HTTP contract

### `POST /auth/login`

Request body:

```json
{"email":"usuario@example.test","password":"..."}
```

On success: HTTP 200, session cookie set, and a public user representation in the response body. The token is never returned in JSON.
Success response shape:

```json
{
  "id":"uuid",
  "display_name":"Nombre simulado",
  "email":"usuario@example.test",
  "role":"medico"
}
```

Invalid email, invalid password and inactive user all return the same generic HTTP 401 response to avoid account enumeration.

### `GET /auth/me`

Requires a valid session cookie. Returns the same public user representation. Missing, expired or revoked sessions return HTTP 401.

### `POST /auth/logout`

If the presented session exists, it is revoked and the cookie is cleared. The operation is idempotent from the client perspective and returns HTTP 204.

## 7. Authorization

`get_current_user()` resolves the session and authenticated actor. `require_roles(...)` composes authorization requirements at endpoint level.
Authorization semantics:

- missing/invalid authentication → HTTP 401;
- authenticated actor without required role → HTTP 403;
- frontend route visibility is UX only and never the security boundary.

TES-7 provides the reusable authorization primitives and verifies them with isolated test routes. It does not invent patient endpoints solely to satisfy the task. Real patient endpoints introduced by TES-8 must apply these guards according to the patient permission policy validated in TES-8/TES-10.

The initial roles are identity categories, not a complete permission matrix. TES-7 proves role enforcement without prematurely deciding every future clinical/research permission.

## 8. Administrator operational view

The real role remains `administrador`. TES-7 does not implement the frontend/admin acting-view flow. `active_view` therefore remains unset during TES-7.

The security model must remain compatible with a later session-scoped operational view where authorization and audit still retain the real administrative identity.

## 9. Audit and request traceability

Security-relevant events:

- `auth.login.success`;
- `auth.login.failed`;
- `auth.logout`;
- `auth.access.denied`.

Audit records never contain raw passwords, password hashes, raw session tokens, cookie values, or complete clinical content.
TES-7 adds a migration that extends `audit.events` with nullable `actor_role` and `active_view` snapshots. `request_id` already exists and is preserved. A request-id middleware supplies a correlation identifier to requests and audit calls.

For failed login attempts where no user can be safely identified, `actor_user_id` remains null. The audit action may record the attempt outcome, but not the submitted email or password.

## 10. Error contract

Authentication and authorization errors follow the project's uniform API error representation. At minimum the client can distinguish:

- `401 AUTHENTICATION_REQUIRED`;
- `401 INVALID_CREDENTIALS`;
- `403 FORBIDDEN`.

Error `detail` remains generic for invalid login credentials.

## 11. Implementation boundaries

Backend capability remains under `modules/auth/` with domain/application/infrastructure/api boundaries as justified by complexity. Password hashing, token generation/hashing and cookie configuration are infrastructure/security concerns; FastAPI handlers translate HTTP to application use cases.

Audit persistence belongs to `modules/audit/`; authentication calls it through a narrow application-facing service rather than embedding audit SQL in route handlers.

No authentication logic is implemented in the React application during TES-7; TES-17 will consume the OpenAPI contract.

## 12. Test strategy

Integration tests run against PostgreSQL 17 and cover:

- valid credentials create a session and cookie;
- wrong password, unknown email and inactive user return generic 401;
- password is stored only as an Argon2 hash;
- raw session token is not stored in PostgreSQL;
- `/auth/me` accepts valid sessions and rejects missing, expired and revoked sessions;
- logout revokes the current session and clears the cookie;
- allowed role passes and denied role returns 403;
- denied access creates an audit event;
- audit rows do not contain submitted passwords or raw session tokens;
- cookie attributes differ only where local HTTP development requires `Secure=false`.

Unit tests cover password/token helpers and application decisions that do not require PostgreSQL. OpenAPI tests pin the login/me/logout response contract used by TES-17.

## 13. Out of scope

TES-7 does not implement MFA, OAuth/OIDC, SSO, password recovery, email verification, account lockout policy, patient CRUD, frontend login screens, or the administrator acting-view UI.

Rate limiting and breach-password checks remain candidates for later security hardening if TES-10 or deployment requirements justify them.

## 14. Completion evidence

TES-7 can close only after local quality gates, PostgreSQL-backed integration tests, OpenAPI contract checks and GitHub Actions all pass on the final commit. The Linear issue must record the exact final commit and CI run.