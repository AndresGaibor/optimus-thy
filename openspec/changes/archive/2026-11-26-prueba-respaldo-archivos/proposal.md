# Proposal

## Why

`probar-respaldo.sh` respalda la base y el volumen de archivos, verifica las huellas y restaura la base en un Postgres limpio, pero no restaura ni compara los archivos. TES-317 exige «restauración probada en un entorno limpio con guion y evidencia», y ADR-019 pide comprobar la consistencia entre base y archivos. Hoy nada demuestra que `archivos-*.tar.gz.gpg` se pueda restaurar ni que su contenido coincida con lo respaldado.

## What Changes

- La prueba de punta a punta restaura el tar de archivos a un directorio temporal y compara el conjunto de rutas y el tamaño total con el listado del propio tar.
- Si el respaldo no contiene archivos porque el volumen no existe, la prueba lo declara y falla: un respaldo sin archivos no cumple el criterio.
- La prueba elimina el directorio temporal al terminar, incluso si falla.

## Capabilities

### New Capabilities

- `respaldos`: respaldo cifrado de base y archivos con restauración verificada.

### Modified Capabilities

## Non-Goals

- No cambia el cifrado, la retención ni el destino de la copia externa.
- No configura S3 ni la copia fuera del equipo: eso queda en TES-317 como pendiente de infraestructura.
- No restaura al volumen real de MinIO; la prueba extrae a un directorio temporal para comparar sin tocar producción.
