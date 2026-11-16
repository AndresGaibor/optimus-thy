# Design

## Context

Ver `proposal.md`. El académico ya resolvió la cadena real: `ia/app/adaptadores.py` (YOLO11, BGAU-Net, Swin), `carga.py` (carga única con huella y estados), `artefactos.py` (máscara, MGAC, XML, superposición) y contrato 1.1. Está medida en CPU: 25–35 s de carga y 11,8–13,2 s por inferencia.

## Goals / Non-Goals

**Goals:**

- Misma cadena y mismo contrato que el académico en el operativo.
- Administrador reemplaza pesos desde la interfaz, sin rebuild ni variables hardcodeadas.
- Recarga del servicio de IA sin reiniciar el contenedor.

**Non-Goals:**

- OCR en el operativo.
- Entrenamiento o reentrenamiento de modelos.
- Subida de imágenes y endpoints de casos/documentos (otra entrega).

## Decisions

- **Portar en vez de reescribir.** El código del académico ya está probado y medido; se copia y se adapta al esquema del operativo. Alternativa descartada: reimplementar la cadena.
- **Volumen compartido, no descarga desde S3.** Backend escribe en `MODELOS_DIR/<version>/` (montado rw) e `ia` lo lee (ro). Evita credenciales S3 en `ia` y 405 MB de descarga por activación. S3 queda para respaldos.
- **Un paquete, no tres subidas.** El administrador sube un `.zip`; el backend valida nombres esperados (`*.pt`, `*.keras`, `*.pth`), tamaño máximo, ausencia de rutas con `..`, extrae a una carpeta temporal y calcula SHA-256 por archivo y una huella combinada.
- **Una sola versión activa** por transacción: `UPDATE modelos_ia SET activo=false WHERE activo` y activar la elegida; el registro guarda `ruta_pesos`.
- **Recarga explícita.** `ia` expone `POST /recargar` que invalida la caché de `cargar_modelos`, vuelve a leer `IA_MODELOS_DIR` y devuelve estados y huella. El backend lo llama al activar y propaga el resultado al administrador; un fallo no borra la versión previa del disco.
- **Configuración en `Settings`.** `MODELOS_DIR` e `IA_URL` entran a `backend/app/config.py` (hoy no se leen, aunque el compose las define).
- **Auditoría.** La carga y la activación registran `SETTINGS_CHANGE` con el id del modelo; nunca el contenido de los archivos.

## Risks / Trade-offs

- [Recarga con tráfico] → el servicio responde 503 mientras dura la carga (25–35 s); se activa desde administración, no en horario clínico.
- [Zip malicioso] → validación de extensión, tamaño, límite de entradas y rutas relativas; extracción con `zipfile` y comprobación de que cada ruta resuelta cae dentro del destino.
- [Disco lleno] → se verifica espacio y se conserva la versión anterior hasta que la nueva carga y recarga terminan.
- [Divergencia con el académico] → el mismo contrato 1.1 en ambos; el operativo añade solo la administración del modelo.

## Migration Plan

1. `0011` agrega columnas; no borra datos.
2. El volumen `${IA_MODELOS_DIR:-./var/modelos}` se monta en backend (rw) e `ia` (ro); los pesos existentes se copian una vez a `var/modelos/<version>/`.
3. Rollback: retirar la release anterior de `ia` y `alembic downgrade 0010`.

## Open Questions

Ninguna.
