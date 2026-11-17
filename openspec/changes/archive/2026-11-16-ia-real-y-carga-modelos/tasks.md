# Tasks

## 1. Servicio de IA

- [x] 1.1 Portar `ia/app/{adaptadores,carga,artefactos,contrato,main,modelos,pipeline}.py` del repo académico, con contrato 1.1 y sin dependencias de OCR.
- [x] 1.2 Añadir `POST /recargar` que invalide la caché de modelos y devuelva estados y huella.
- [x] 1.3 Portar las pruebas de `ia/tests/` y ejecutarlas en local sin pesos.
- [x] 1.4 Portar `ia/README.md`, `ia/requirements-modelos.txt`, `ia/modelos.sha256` y `ia/scripts/descargar_modelos.py`.

## 2. Esquema

- [x] 2.1 Migración `0011`: `nodulos.{origen_mascara,mascara_ruta_s3,mgac_ruta_s3,xml_ruta_s3,superposicion_ruta_s3}`, `inferencias.{ancho,alto,version_contrato,umbrales,huella_modelos,inmutable}` y `modelos_ia.ruta_pesos`.
- [x] 2.2 Actualizar `backend/app/models/imagenes.py` y verificar con `alembic check` sobre una base desechable.

## 3. Administración del modelo

- [x] 3.1 `Settings`: `MODELOS_DIR` e `IA_URL`.
- [x] 3.2 `POST /modelos-ia` (admin): recibe el paquete, valida, extrae con límites, calcula hashes y registra `modelos_ia`.
- [x] 3.3 `POST /modelos-ia/{id}/activar`: desactiva el resto, activa una, llama a `POST /recargar` y audita.
- [x] 3.4 `GET /modelos-ia`: lista versiones y estado activo.
- [x] 3.5 Pruebas de validación del paquete, activación única y fallo de recarga.

## 4. Despliegue y documentación

- [x] 4.1 `docker-compose.yml` y `compose.server.example.yaml`: volumen `MODELOS_DIR` en backend (rw) e `ia` (ro), `IA_MODELOS_DIR` fijo.
- [x] 4.2 Actualizar `ADR-020` (OCR fuera, artefactos dentro), `docs/arquitectura/modelo-de-datos-v1.md` y `ia/README.md`.
- [x] 4.3 Verificar `make check`, migración `0011` subir/bajar y `docker compose config -q`.
