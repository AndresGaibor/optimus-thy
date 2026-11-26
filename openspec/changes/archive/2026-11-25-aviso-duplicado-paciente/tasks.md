# Tareas · Aviso de documento duplicado

- [x] 1.1 Comprobar el documento cifrado por institución antes de insertar en `POST /pacientes`.
- [x] 1.2 Responder `409` con `error.code = "posible_duplicado"` y conservar `response_model=PacienteOut`.
- [x] 1.3 Pruebas de rechazo sin inserciones, confirmación, documento distinto y aislamiento por institución.
- [x] 2.1 Enviar `confirmar_duplicado` desde el cliente y renovar `contracts/openapi.json` y `schema.d.ts`.
- [x] 2.2 Mantener el formulario abierto con el aviso y el botón «Registrar igualmente».
- [x] 2.3 Prueba de interfaz del flujo de dos envíos.
- [x] 3.1 `pytest` de los módulos tocados, `ruff`, `mypy`, `typecheck` y `vitest` del archivo de pacientes.
