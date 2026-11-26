# Informe de seguridad — 2026-11-26

Cambio OpenSpec: `2026-11-26-pruebas-seguridad` · TES-349 · HT-083.

## Alcance

| Superficie | Cómo se examinó | Resultado |
|---|---|---|
| Acceso a objetos entre instituciones | `backend/tests/test_acceso_objetos.py` (11 pruebas) | 4 fugas corregidas |
| Matriz de permisos por ruta y rol | `backend/tests/test_permisos.py` (existente, 290 pruebas con `test_usuarios.py`) | Sin regresiones |
| Superficie HTTP anónima del frontend | ZAP baseline contra un stack aislado | 0 fallos, 9 avisos, 59 comprobaciones en verde |
| Rutas autenticadas | No examinadas por ZAP | Cubiertas solo por las pruebas de acceso |

No se examinó la instancia desplegada, no se usaron datos reales y no se probó carga ni inferencia con pesos.

## Hallazgos corregidos

| Hallazgo | Prueba que lo demuestra | Corrección |
|---|---|---|
| `GET /usuarios` devolvía usuarios de otras instituciones | `test_listado_usuarios_no_revela_otra_institucion` | Filtro por `institucion_id` del usuario autenticado |
| `POST /usuarios` aceptaba `institucion_id` ajena | `test_id_de_institucion_en_cuerpo_no_permite_crear_usuario_ajeno` | `404 not_found` si la institución no es la activa |
| `PATCH /usuarios/{id}` y `PUT /usuarios/{id}/roles` operaban sobre usuarios ajenos | `test_rol_de_usuario_ajeno_no_se_puede_cambiar` | Búsqueda limitada a la institución activa |
| `POST /trabajos` encolaba inferencia con `imagen_id` de otra institución | `test_id_de_imagen_en_el_cuerpo_no_permite_encolar_inferencia` | `404 not_found` antes de encolar |
| Rutas con identificador sustituido devolvían contenido ajeno | `test_objeto_de_otra_institucion_no_se_expone` (parametrizada) | `404` sin distinguir de inexistente |

## Escaneo ZAP

```
bash tests/seguridad/escanear.sh
```

- Imagen: `zaproxy/zap-stable:latest` desde Docker Hub (ghcr.io respondió `denied` a la descarga anónima).
- Objetivo: frontend del stack aislado, 9 URLs, `zap-baseline.py`.
- Resultado: `FAIL-NEW: 0`, `WARN-NEW: 9`, `PASS: 59`. Código de salida del script: `2` (avisos).
- Informes: `docs/cumplimiento/zap/zap.html` y `docs/cumplimiento/zap/zap.json`.

### Avisos abiertos

| Riesgo | Alerta | Instancias | Acción propuesta |
|---|---|---:|---|
| High | nginx con versión vulnerable conocida (20020) | 1 | Actualizar la imagen base de `frontend/nginx.conf` |
| Medium | Sin `Content-Security-Policy` (10038) | 3 | Declarar CSP acorde a los assets propios |
| Medium | Sin protección anti-clickjacking (10020) | 3 | `X-Frame-Options: DENY` o `frame-ancestors 'none'` |
| Low | Sin `Cross-Origin-*-Policy` (90004) | 9 | COOP, CORP y COEP |
| Low | Sin `Permissions-Policy` (10063) | 4 | Deshabilitar cámara, geolocalización y micrófono |
| Low | Fuga de versión en `Server` (10036) | 5 | `server_tokens off` |
| Low | Sin `X-Content-Type-Options` (10021) | 5 | `nosniff` |
| Informational | Aplicación web moderna (10109) | 3 | Sin acción |
| Informational | Contenido almacenable en caché (10049) | 6 | Revisar `Cache-Control` de assets |

Los avisos son de cabeceras y de versión de la imagen base: no hay inyección, exposición de datos ni bypass de autorización en la superficie examinada.

## Superficie no examinada y por qué

- **Autorización en rutas autenticadas:** ZAP corre sin sesión; la cobertura viene de `test_acceso_objetos.py` y `test_permisos.py`, no del escáner.
- **Ataques con sesión iniciada (CSRF, IDOR en formularios):** requieren un guion con credenciales; no se implementó.
- **`Documento`:** el modelo existe sin superficie HTTP individual ni anidada; no hay ruta que probar.
- **Inferencia real:** el stack de escaneo no carga pesos.
- **Revisión OWASP ASVS nivel 2 completa:** no se ejecutó; este informe cubre solo lo anterior.

## Reproducción

```bash
bash tests/seguridad/escanear.sh            # 0 sin avisos, 2 con avisos, 3 sin imagen
cd backend && pytest tests/test_acceso_objetos.py
```
