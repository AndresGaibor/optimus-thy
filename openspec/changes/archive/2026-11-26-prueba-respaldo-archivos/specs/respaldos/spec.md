# Spec Delta: respaldos

## ADDED Requirements

### Requirement: Restauración de archivos verificada

La prueba de punta a punta del respaldo MUST restaurar el tar de archivos con la clave correcta y MUST comparar el conjunto de rutas y el tamaño total restaurado con el listado del tar, sin imprimir nombres de archivos ni contenido.

#### Scenario: Archivos restaurados y equivalentes

- **GIVEN** un respaldo recién creado con `archivos-*.tar.gz.gpg` y su clave
- **WHEN** se ejecuta la prueba de punta a punta
- **THEN** la prueba extrae el tar a un directorio temporal, cuenta las mismas rutas y el mismo tamaño que el listado del tar, y lo informa

#### Scenario: Respaldo sin archivos

- **GIVEN** que el volumen de archivos no existe y el respaldo no trae tar de archivos
- **WHEN** se ejecuta la prueba de punta a punta
- **THEN** la prueba falla con un mensaje que dice que el respaldo no incluye archivos

#### Scenario: Conjunto restaurado distinto

- **GIVEN** un tar de archivos cuyo contenido restaurado no coincide en número de rutas o tamaño con el listado del tar
- **WHEN** se ejecuta la prueba de punta a punta
- **THEN** la prueba falla e informa de la diferencia, sin listar rutas del contenido clínico
