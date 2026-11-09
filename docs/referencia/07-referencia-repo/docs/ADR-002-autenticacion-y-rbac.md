# ADR-002: Autenticación y Control de Acceso Basado en Roles (RBAC)

**Fecha:** 2024-09-23
**Status:** Aceptado
**Decisor:** Equipo OPTIMUS-THY

## Contexto y Problemática

La plataforma OPTIMUS-THY gestiona datos médicos sensibles y requiere:
- Autenticación segura de usuarios (médicos, administradores, investigadores)
- Control de acceso basado en roles para proteger información de pacientes
- Auditoría completa de accesos y modificaciones
- Protección contra ataques de enumeración de usuarios y fuerza bruta

## Decisión

**Sesiones opacas con HttpOnly Cookies + RBAC**

### NO se usa JWT para autenticación. Se usa un token de sesión opaco almacenado en base de datos.

## Mecanismo de Sesión

### Flujo de Login

```
1. Usuario envía POST /auth/login con {email, password}
2. Server busca usuario por email (case-insensitive)
3. Server verifica password con Argon2id
4. Server genera token de sesión aleatorio (32 bytes, base64url)
5. Server almacena SHA-256 del token en tabla sessions
6. Server retorna cookie HttpOnly "session_id" con el token raw
```

### Validación de Sesión

```
1. Request llega con cookie session_id
2. Server calcula SHA-256 del token
3. Server busca sesión por token_hash donde expires_at > now
4. Server carga usuario relacionado y verifica is_active
5. Si válido, request continúa; si no, retorna 401
```

### Características de Seguridad

| Característica | Implementación |
|----------------|----------------|
| Token de sesión | 32 bytes aleatorios, base64url encoded |
| Hash almacenado | SHA-256 del token raw |
| Expiración | 24 horas |
| Cookie | HttpOnly, SameSite=Lax, Secure en producción |
| Rate limiting | 5 intentos por minuto por IP |

## Roles Definidos

| Rol | Descripción | Acceso |
|-----|-------------|--------|
| `admin` | Administrador del sistema | Gestión completa de usuarios, configuración del sistema |
| `doctor` | Médico tratante | Pacientes propios, casos clínicos, estudios, inferencias |
| `researcher` | Investigador clínico | Datos anonimizados/anonymized para investigación |

## Permisos por Rol

### admin

- Gestión de usuarios (crear, editar, activar/desactivar)
- Gestión de instituciones
- Acceso a configuración del sistema
- Acceso a todos los logs de auditoría
- Gestión de proyectos CMS

### doctor

- CRUD de pacientes (institución propia)
- Gestión de casos clínicos y encuentros
- Subida de imágenes médicas
- Creación y consulta de estudios
- Solicitud de inferencias IA
- Revisión de resultados OCR
- Consulta de logs de auditoría propios

### researcher

- Lectura de pacientes (solo datos anonymized)
- Lectura de casos clínicos (sin PII)
- Acceso a proyectos CMS publicados
- No puede modificar datos clínicos

## Permisos Granulares (Tabla permissions)

La tabla `permissions` define permisos individuales que se asignan a roles via `role_permissions`:

```
roles ───< role_permissions >─── permissions
```

### Permisos Implementados

| Permission | Descripción |
|------------|-------------|
| `patients:read` | Leer datos de pacientes |
| `patients:write` | Crear/modificar pacientes |
| `patients:delete` | Eliminar pacientes |
| `clinical:read` | Leer casos clínicos |
| `clinical:write` | Crear/modificar casos clínicos |
| `images:upload` | Subir imágenes médicas |
| `images:read` | Leer imágenes médicas |
| `inference:request` | Solicitar inferencia IA |
| `inference:read` | Ver resultados de inferencia |
| `ocr:request` | Solicitar OCR de documentos |
| `ocr:review` | Revisar/corregir resultados OCR |
| `admin:users` | Gestionar usuarios |
| `admin:system` | Configuración del sistema |
| `audit:read` | Leer logs de auditoría |

## Middleware de Autorización

```python
# Dependency factory para verificar roles
def require_roles(*allowed_roles: str) -> Callable:
    async def role_checker(
        user: Annotated[models.User, Depends(get_current_user)]
    ) -> models.User:
        if user.role not in allowed_roles:
            raise HTTPException(status_code=403)
        return user
    return role_checker

# Uso en rutas
@router.post("/patients")
async def create_patient(
    current_user: Annotated[models.User, Depends(require_roles("admin", "doctor"))]
):
    ...
```

## Auditoría de Accesos

Todos los eventos de autenticación y accesos denegados se registran en `audit_events`:

| Campo | Descripción |
|-------|-------------|
| `user_id` | UUID del usuario |
| `user_role` | Rol del usuario al momento |
| `action` | LOGIN_SUCCESS, LOGIN_FAILED, ACCESS_DENIED, etc. |
| `module` | Módulo que generó el evento (AUTH, RBAC, etc.) |
| `ip_address` | IP del cliente |
| `request_id` | Request ID para tracing |

## OWASP Security Controls

| Control OWASP | Implementación |
|---------------|----------------|
| A01 - Broken Access Control | RBAC via require_roles, institution isolation |
| A02 - Cryptographic Failures | Argon2id passwords, SHA-256 session tokens |
| A07 - Auth Failures | Rate limiting, uniform error messages, audit logging |

## References

- [OWASP Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [Argon2id](https://argon2-cffi.readthedocs.io/)
