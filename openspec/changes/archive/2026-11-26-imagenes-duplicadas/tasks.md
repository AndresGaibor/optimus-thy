# Tasks

## 1. Rechazo de duplicados en el backend

- [x] 1.1 Calcular y consultar la huella del archivo antes de subirlo, rechazando duplicados del mismo caso con HTTP 409.
- [x] 1.2 Cubrir duplicados del mismo caso, contenido distinto y el mismo contenido en otro caso con una prueba backend.

## 2. Aviso en el diálogo de carga

- [x] 2.1 Propagar el mensaje del servidor y mostrar el motivo en el estado de error del archivo.
- [x] 2.2 Cubrir el mensaje HTTP 409 en el flujo real del diálogo de carga.

## 3. Validación

- [x] 3.1 Validar el cambio con las pruebas backend, frontend dirigidas y `openspec validate 2026-11-26-imagenes-duplicadas --strict`.
