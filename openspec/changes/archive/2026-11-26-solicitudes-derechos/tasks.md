# Tasks

## 1. Datos

- [x] 1.1 Migración `0023`: tabla `solicitudes_derechos`, checks, índices, permiso `derechos.gestionar` y asignación a `admin`.
- [x] 1.2 Modelo `SolicitudDerecho` y registro en `app/models/__init__.py`.
- [x] 1.3 Permiso en `app/security/permisos.py` (catálogo, matriz y dominio del rol).

## 2. API

- [x] 2.1 `POST /administrador/solicitudes-derechos` con 409 en duplicado.
- [x] 2.2 `GET /administrador/solicitudes-derechos` con `fecha_limite`, `dias_restantes`, `vencida`, conteos y filtro por estado.
- [x] 2.3 `PATCH /administrador/solicitudes-derechos/{id}` con respuesta obligatoria al cerrar.
- [x] 2.4 Acciones y objeto de auditoría `RIGHTS_REQUEST_*`.
- [x] 2.5 Contrato y `schema.d.ts` regenerados.

## 3. Interfaz

- [x] 3.1 Cliente `solicitudes-derechos` con tipo de error.
- [x] 3.2 Página `/administrador/derechos` con formulario, contadores, tabla y diálogo de cierre.
- [x] 3.3 Ruta y entrada «Derechos» en el menú del administrador.

## 4. Verificación

- [x] 4.1 `pytest tests/test_solicitudes_derechos.py tests/test_permisos.py tests/test_roles.py` en verde.
- [x] 4.2 `vitest` de la pantalla en verde.
- [x] 4.3 `ruff`, `mypy`, `typecheck`, `lint`, `format:check`, `ui:check` y `tamanos` en verde.
