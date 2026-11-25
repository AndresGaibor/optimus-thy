## Why

Un paciente registrado no puede corregirse: la API solo ofrece alta, listado, detalle y apertura de casos. La identidad se guarda cifrada y nunca se lee, así que no hay forma de precargar un formulario, y la auditoría no registra cambios de paciente porque la acción no existe.

## What Changes

- **Corrección de la identidad**: `PATCH /pacientes/{id}` acepta nombres, apellidos, documento y fecha de nacimiento con las mismas validaciones que el alta, vuelve a cifrar la identidad y devuelve el paciente sin exponerla.
- **Lectura controlada de la identidad**: `GET /pacientes/{id}/identidad` descifra y devuelve la identidad solo para precargar la corrección, dejando su evento en la bitácora.
- **Auditoría del cambio**: acción `PATIENT_UPDATE` con la lista de campos modificados, nunca sus valores.
- **Permisos**: corregir exige `paciente.escribir`; leer la identidad exige `paciente.leer`.

## Impact

- API: dos rutas nuevas en `backend/app/api/pacientes.py` y la acción de auditoría en `backend/app/audit/actions.py`.
- Contrato: `contracts/openapi.json` regenerado.
- Sin migraciones: el esquema actual ya guarda la identidad cifrada.
- Interfaz: formulario de corrección sobre la ficha del paciente.
