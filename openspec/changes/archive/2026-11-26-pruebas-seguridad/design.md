# Design

## Pruebas de acceso por institución

`backend/tests/test_acceso_objetos.py` parametriza los recursos con identificador direccionable que hoy existen: pacientes, casos, imágenes, trabajos, usuarios, roles y solicitudes de derechos. Para cada uno crea dos instituciones con un usuario administrador propio, siembra el objeto en la institución A y consulta con el usuario de la institución B, exigiendo `404` o `403` sin distinción entre «no existe» y «no es tuyo».

La prueba de inferencia usa un caso real: sustituye `imagen_id` en el cuerpo de `POST /trabajos` por una imagen de la otra institución. Este camino no pasa por la ruta del recurso, así que la comprobación de pertenencia vive en el servicio de trabajos y no en el manejador de imágenes.

`backend/tests/test_permisos.py` ya recorre cada ruta protegida con cada rol; no se duplica esa matriz.

## Denegación en las rutas

Las rutas de usuario filtran por `institucion_id` del usuario autenticado en listar, crear, editar y asignar roles. `POST /trabajos` con `tipo = "inferencia"` responde `404` cuando `imagen_id` apunta a un caso de otra institución, antes de encolar y sin consumir el límite de inferencia.

La comprobación reutiliza el `404` con `error.code = "not_found"` que ya devuelven esas rutas: no se añade un código nuevo que revele la existencia del objeto ajeno.

## Escaneo ZAP

`tests/seguridad/escanear.sh` levanta un proyecto Compose propio con nombre aleatorio, puerto libre en `127.0.0.1`, PostgreSQL y almacenamiento efímeros, y espera `/health` antes de lanzar `zap-baseline.py` contra el frontend. Prueba primero `ghcr.io/zaproxy/zap-stable` y luego `zaproxy/zap-stable`; si ninguna imagen se puede obtener, sale con código 3 y un aviso explícito. Los informes quedan en `docs/cumplimiento/zap/`.

El escaneo contra un stack sin datos no ejerce autenticación ni rutas con sesión: sus hallazgos cubren configuración y superficie anónima, no autorización. Esa limitación se documenta en el informe y no se compensa con una conclusión inventada.

## Fuera de alcance

- No se añaden rutas para `Documento`: el modelo existe sin superficie HTTP individual ni anidada.
- No se escanea la instancia desplegada ni se usan datos reales.
