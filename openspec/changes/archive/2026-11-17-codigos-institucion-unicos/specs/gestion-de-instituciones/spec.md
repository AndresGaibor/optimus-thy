## ADDED Requirements

### Requirement: Código de institución normalizado y único

El sistema SHALL guardar el código de una institución en minúsculas, sin espacios en los extremos, y SHALL impedir que existan dos instituciones cuyo código coincida ignorando mayúsculas y minúsculas.

#### Scenario: Alta con mayúsculas

- **WHEN** un administrador crea una institución con código `Clin-Norte`
- **THEN** la institución queda guardada con el código `clin-norte`

#### Scenario: Alta duplicada con otra caja

- **WHEN** existe una institución con código `espoch` y se intenta crear otra con `ESPOCH`
- **THEN** la API responde `409 conflict` y no se crea ningún registro

#### Scenario: Edición a un código ocupado

- **WHEN** se edita una institución para usar un código que ya tiene otra, con cualquier combinación de mayúsculas
- **THEN** la API responde `409 conflict` y el código no cambia

#### Scenario: Duplicados existentes

- **WHEN** la migración encuentra dos o más instituciones con el mismo código ignorando la caja
- **THEN** conserva la que tiene más referencias y, a igualdad, la más antigua
- **AND** reasigna a esa institución las referencias de las demás antes de eliminarlas
- **AND** deja un único registro con el código en minúsculas
