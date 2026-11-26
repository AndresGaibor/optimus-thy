# Spec Delta: verificacion-seguridad

## ADDED Requirements

### Requirement: Escaneo ZAP reproducible y aislado

El repositorio SHALL ofrecer `tests/seguridad/escanear.sh`, que levanta un proyecto Compose con nombre aleatorio, puerto libre en `127.0.0.1`, base de datos y almacenamiento efímeros, espera `/health` y ejecuta `zap-baseline.py` contra el frontend. El script SHALL probar las imágenes `ghcr.io/zaproxy/zap-stable` y `zaproxy/zap-stable`, SHALL dejar los informes HTML y JSON en `docs/cumplimiento/zap/` y SHALL salir con código `3` y un aviso explícito cuando ninguna imagen se pueda obtener. SHALL limpiar su proyecto y sus volúmenes al terminar, incluso si el escaneo falla.

#### Scenario: Escaneo completado

- **DADO** Docker disponible e imagen ZAP obtenible
- **CUANDO** se ejecuta `bash tests/seguridad/escanear.sh`
- **ENTONCES** el script termina con código `0`
- **Y** deja los informes de la ejecución en `docs/cumplimiento/zap/`

#### Scenario: Imagen ZAP no disponible

- **DADO** un registro que niega la descarga en ambas rutas
- **CUANDO** se ejecuta `bash tests/seguridad/escanear.sh`
- **ENTONCES** el script termina con código `3`
- **Y** escribe el motivo y el error del registro en la salida de error

### Requirement: Informe de seguridad con alcance explícito

`docs/cumplimiento/informe-seguridad.md` SHALL registrar el alcance examinado, los comandos ejecutados, el resultado de cada uno y la separación entre hallazgos corregidos, hallazgos abiertos y superficie no examinada. SHALL NOT afirmar resultados de un escaneo que no se ejecutó ni presentar un stack sin datos como cobertura de autorización.

#### Scenario: Escaneo no ejecutado

- **DADO** que la imagen ZAP no se pudo obtener
- **CUANDO** una persona lee el informe
- **ENTONCES** encuentra el código de salida y el motivo del registro
- **Y** la autorización se declara cubierta solo por las pruebas de acceso, no por ZAP
