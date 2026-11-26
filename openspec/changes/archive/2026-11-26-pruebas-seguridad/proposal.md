# Proposal

## Why

TES-349 · HT-083 requiere evidencia ejecutable de que los límites por institución y permiso se mantienen al sustituir identificadores de objetos, además de un escaneo reproducible y un informe que distinga hallazgos corregidos de lo que no se examinó. Hoy las pruebas están repartidas por recurso y no dejan una matriz ni un resultado ZAP auditable.

## What Changes

- Añadir pruebas parametrizadas de acceso cruzado entre instituciones para los recursos con operaciones HTTP direccionables, junto con una prueba de sustitución de `imagen_id` en el cuerpo de una inferencia.
- Corregir las denegaciones de objetos de otra institución en las operaciones de usuario e inferencia cuando las pruebas demuestren acceso indebido; mantener las respuestas sin revelar existencia o contenido.
- Aprovechar `backend/tests/test_permisos.py`, que ya recorre cada ruta protegida con cada rol y exige 403 cuando falta el permiso, sin duplicar esa cobertura.
- Añadir `tests/seguridad/escanear.sh`: proyecto Compose aleatorio, puertos libres, PostgreSQL efímero, espera de `/health`, ZAP contra el frontend y salida 3 con aviso explícito si la imagen no se puede obtener.
- Documentar alcance, versión, comandos, matriz de resultados, hallazgos y revisión OWASP ASVS nivel 2 en `docs/cumplimiento/informe-seguridad.md`; conservar los informes ZAP bajo `docs/cumplimiento/zap/`.
- Documentar que `Documento` solo existe como modelo y no tiene superficie HTTP individual ni anidada: no se inventa una ruta para probarlo.

## Capabilities

### New Capabilities

- `acceso-objetos`: comprobación de acceso por institución a recursos clínicos, administrativos y de inferencia con identificadores sustituidos.
- `verificacion-seguridad`: ejecución aislada del escaneo ZAP y registro verificable de su alcance y resultados.

### Modified Capabilities

- Ninguna.

## Non-Goals

- No añadir rutas para documentos ni cambiar autenticación, pacientes, OCR, retención o investigación.
- No escanear la instancia desplegada ni usar datos reales.
- No afirmar un resultado ZAP cuando no se pudo descargar o ejecutar su imagen.
