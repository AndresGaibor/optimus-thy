## Why

El modelo de decisiones médicas existe en la base de datos desde el primer esquema, pero ninguna ruta lo usa: el médico no puede dejar su conclusión sobre una inferencia, y la decisión no guarda autor porque la tabla no tiene esa columna.

## What Changes

- **Registro de la conclusión**: `POST /casos/{caso_id}/inferencias/{inferencia_id}/decision` acepta `acepta`, `corrige` o `descarta` con observaciones opcionales y guarda el usuario del token.
- **Autor de la decisión**: migración que añade `usuario_id` a `decisiones_medicas`.
- **Lectura del estado**: el detalle de inferencias devuelve la decisión registrada, con fecha y autor (identificador y rol, sin datos personales).
- **Una sola conclusión por inferencia**: el segundo envío responde `409`; la inferencia original nunca se modifica.
- **Auditoría**: acción propia con el identificador de la inferencia y el sentido de la decisión, sin contenido clínico.

## Impact

- Base de datos: migración con `usuario_id` en `decisiones_medicas`.
- API: ruta de alta y lectura de decisión; contrato regenerado.
- Interfaz: el formulario de conclusión ya integrado pasa a guardar de verdad.
