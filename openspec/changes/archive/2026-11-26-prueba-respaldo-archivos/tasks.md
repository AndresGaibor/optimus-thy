# Tasks

## 1. Prueba de punta a punta

- [x] 1.1 Restaurar `archivos-*.tar.gz.gpg` a un directorio temporal con `restaurar-archivos.sh --extraer`.
- [x] 1.2 Comparar número de archivos regulares y tamaño total con el listado del tar; fallar con la diferencia si no coinciden.
- [x] 1.3 Fallar cuando el respaldo no trae tar de archivos.
- [x] 1.4 Limpiar el directorio temporal al salir, con éxito o con error.

## 2. Verificación

- [x] 2.1 `make respaldo-prueba` en verde con el volumen de archivos presente.
- [x] 2.2 Prueba negativa: tar de laboratorio donde un archivo añadido al destino rompe la comparación.
- [x] 2.3 Registrar la evidencia en `docs/pruebas/evidencia-respaldo.md`.
