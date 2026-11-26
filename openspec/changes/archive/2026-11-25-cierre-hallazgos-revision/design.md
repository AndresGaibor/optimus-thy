# Design

## Context

Los tres controles afectados ya existen y están especificados. Este cambio
corrige defectos observados en revisión, no introduce capacidades nuevas. La
base de datos es PostgreSQL 16; el backend usa SQLAlchemy sincrónico con
PyTest sobre una instancia desechable.

## Goals / Non-Goals

**Goals:**

- Que dos altas simultáneas con el mismo documento no pasen sin aviso.
- Que el aviso compare documentos equivalentes (`ab12345` = `AB-12345`).
- Que el 409 no entregue identificadores de otro paciente.
- Que el listado de datasets no cargue filas en memoria.
- Que recortar la cola de la bitácora se detecte.
- Contratos tipados para las respuestas nuevas.

**Non-Goals:**

- Anclar el hash fuera de la base de datos (firma externa, WORM): el ancla
  comparte base con la bitácora, así que protege frente a borrados parciales y
  errores de aplicación, no frente a un administrador que reescriba ambas.
- Detectar manipulaciones dentro de un evento cuyo hash y ancla se recalculen
  en bloque.

## Decisions

**Bloqueo asesor por institución y documento.** `pg_advisory_xact_lock` sobre
un entero derivado de `hashtext(institucion_id || documento_canonico)`,
adquirido antes de consultar identidades y liberado al cerrar la transacción.
Se descarta `SELECT ... FOR UPDATE` porque no hay fila que bloquear cuando el
documento todavía no existe, y se descarta un índice único porque la
confirmación explícita permite duplicados.

**Clave canónica sin columna nueva.** Se normaliza al comparar: mayúsculas,
sin espacios, guiones ni puntos. Guardar además una columna canónica obligaría
a migrar las identidades existentes y a reescribir sus blobs cifrados; el
número de pacientes por institución hace viable descifrar y comparar en la
comprobación, que ya descifra hoy. Si el volumen lo exige, la columna canónica
cifrada es la evolución natural y queda anotada en el informe de riesgo.

**Ancla de la bitácora en tabla de una fila.** `auditoria_ancla` guarda
`hash_actual` y `registros`, actualizados por `AuditService.record` en la misma
transacción que ya toma el bloqueo de la tabla. La verificación recorre la
cadena y compara al final con el ancla; un recorte cambia el recuento o el
hash final. Se descarta una tabla de checkpoints por tramo: aporta detección
del punto de corte, que la verificación ya obtiene al recorrer la cadena.

**Agregación SQL para `k_efectivo` del listado.** Una sola consulta con
`jsonb` agrupa por la misma clave de once campos que usa la creación y devuelve
el mínimo por dataset; se evita `selectinload(Dataset.casos)`. Se descarta
persistir el mínimo: los casos de un dataset son inmutables, pero persistirlo
exige migración y coherencia con datasets antiguos.

**Contrato 409 tipado.** Modelo `ErrorDuplicado` con `code`, `message` y
`request_id` (el mismo envoltorio de error del resto de la API). Se quita
`paciente_id` de la respuesta y de la spec.

## Risks / Trade-offs

- El bloqueo asesor serializa las altas del mismo documento; no afecta a altas
  de documentos distintos.
- Descifrar todas las identidades de la institución en cada alta es lineal con
  el número de pacientes; aceptable hoy y con evolución definida.
- El ancla comparte base con la bitácora: no protege frente a un administrador
  que reescriba ambas. Queda escrito como riesgo residual.
- El cálculo agrupado del listado se apoya en `jsonb`; las claves ausentes se
  tratan como nulas y agrupan juntas, igual que en la creación.
