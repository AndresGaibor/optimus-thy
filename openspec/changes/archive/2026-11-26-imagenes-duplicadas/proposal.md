# Proposal

## Why

Subir dos veces los mismos bytes al mismo caso crea registros y archivos redundantes, y no informa al usuario que la imagen ya existe. El hash del archivo permite identificar la repetición antes de persistirla.

## What Changes

- Calcular la huella SHA-256 del archivo recibido y rechazar una imagen idéntica ya cargada en el mismo caso con HTTP 409.
- Propagar a la interfaz el mensaje de conflicto para que el diálogo informe el motivo sin duplicar el archivo.
- Permitir el mismo contenido en casos distintos y archivos distintos en el mismo caso.

## Capabilities

### New Capabilities
- `carga-imagenes`: detectar y comunicar imágenes duplicadas dentro de un caso.

### Modified Capabilities
- Ninguna.
