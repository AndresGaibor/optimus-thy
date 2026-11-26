# Tasks

## 1. Validación en el servicio de IA

- [x] 1.1 Añadir pruebas para imagen ecográfica sintética, imagen colorida no compatible y el límite inclusivo del 90%; verificar con `pytest tests/test_validacion_ecografia.py -q`.
- [x] 1.2 Implementar el criterio sobre la imagen decodificada y rechazar antes del pipeline con HTTP 422 y `imagen_no_parece_ecografia`; verificar con `pytest -q` en `ia/`, incluyendo que los modelos no se invoquen ante rechazo.

## 2. Propagación del código en backend

- [x] 2.1 Traducir el código HTTP del servicio a `ServicioRespondioError.codigo` y conservar el código en el trabajo; añadir prueba del cliente que compruebe la traducción con `pytest tests/test_inferencia_ia.py -q` o el archivo real que lo cubra.

## 3. Aviso en inferencia médica

- [x] 3.1 Mostrar un mensaje accionable específico cuando `error_detalle` sea `imagen_no_parece_ecografia`, preservando el aviso genérico para otros errores; verificar el test frontend dirigido del flujo de seguimiento.

## 4. Integración

- [x] 4.1 Ejecutar pytest de IA, la prueba backend dirigida, `ruff check .`, `mypy app` y `openspec validate 2026-11-26-validacion-ecografia --strict`; registrar sus resultados.
