# Proposal

## Why

HU-034 y HU-035 figuran como hechas en el tablero, pero el operativo no tiene la API de consentimientos: solo el modelo. Por eso la inferencia no podía exigir consentimiento vigente y la pantalla del caso no podía deshabilitar «Analizar» con una explicación.

## What Changes

- `GET/POST /casos/{caso_id}/consentimientos` y `POST …/{id}/revocar`, con finalidad (`base_legal`), versión del texto firmado, retiro inmediato, auditoría y 404 para casos ajenos.
- Migración `0013`: `consentimientos.version_texto`.
- `POST /trabajos` rechaza una inferencia sin consentimiento vigente de atención de salud con 409 `sin_consentimiento`; el manejador del worker vuelve a comprobarlo antes de leer la imagen.
- Pantalla del caso: sección de consentimiento con registrar y revocar; «Analizar» deshabilitado con explicación cuando falta el consentimiento.

## Capabilities

### New Capabilities

- `consentimientos`: registro, retiro y consulta del consentimiento por caso.

### Modified Capabilities

- `inferencia`: la ejecución exige consentimiento vigente de atención de salud.

## Non-Goals

- No se implementa la firma electrónica ni el archivo del PDF firmado.
- No se bloquea la investigación: solo la inferencia asistencial.
