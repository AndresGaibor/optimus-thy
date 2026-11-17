# administracion-roles Specification

## Purpose
Mantener la matriz de permisos por rol acotada al dominio de cada rol, con el rol administrador fuera de la edición.

## Requirements

### Requirement: Rol administrador fuera de la matriz

El sistema SHALL excluir el rol `admin` de la matriz de permisos y SHALL rechazar cualquier intento de cambiar sus permisos.

#### Scenario: La matriz no lista al administrador

- **WHEN** un administrador consulta `GET /roles`
- **THEN** la respuesta contiene solo los roles `doctor` y `researcher`
- **AND** sus permisos administrativos siguen sembrados en la base

#### Scenario: Intento de editar el rol administrador

- **WHEN** se envía `PUT /roles/{id}/permisos` con el id del rol `admin`
- **THEN** la API responde 422 `unprocessable_entity` con un mensaje explícito
- **AND** las filas de `roles_permisos` del rol no cambian

### Requirement: Permisos asignables por dominio del rol

El sistema SHALL exponer, para cada rol, únicamente los permisos de su dominio y SHALL rechazar la asignación de un permiso fuera de ese dominio.

#### Scenario: Interruptores por rol

- **WHEN** se consulta la matriz
- **THEN** cada rol incluye `asignables` con los códigos que le aplican
- **AND** la interfaz no ofrece interruptores para los códigos fuera de esa lista

#### Scenario: Permiso fuera del dominio

- **WHEN** se envía `PUT /roles/{id}/permisos` con un código que no pertenece al dominio del rol, por ejemplo `usuario.gestionar` para `researcher`
- **THEN** la API responde 422 `unprocessable_entity`
- **AND** la matriz del rol no cambia

### Requirement: Guardado atómico de la matriz de permisos

El sistema SHALL guardar los cambios de permisos de varios roles en una sola transacción y SHALL rechazar el guardado completo si el estado de la base ya no coincide con el que el cliente cargó.

#### Scenario: Guardado correcto

- **WHEN** un administrador envía la nueva selección de dos roles junto con el estado del que partió
- **THEN** ambos roles quedan con sus nuevos permisos en la misma transacción
- **AND** se registra un cambio de permisos por rol en la bitácora
- **AND** la respuesta contiene la matriz actualizada

#### Scenario: Otro administrador cambió la matriz

- **WHEN** el estado actual de algún rol enviado difiere del `esperado`
- **THEN** la API responde `409 conflict`
- **AND** no se modifica ningún rol

#### Scenario: Permiso fuera del ámbito del rol

- **WHEN** el estado enviado incluye un permiso que no pertenece al ámbito del rol
- **THEN** la API responde `422` y no se modifica ningún rol

#### Scenario: Rol administrador

- **WHEN** el estado enviado incluye el rol administrador
- **THEN** la API responde `422` y no se modifica ningún rol

### Requirement: Matriz editable con cambios pendientes explícitos

La pantalla SHALL distinguir permiso concedido, no concedido y no aplicable, SHALL indicar cuántos cambios están pendientes y SHALL no considerar ningún cambio efectivo hasta que el servidor confirme el guardado.

#### Scenario: Permiso no aplicable

- **WHEN** un permiso no pertenece al ámbito de un rol
- **THEN** la celda muestra «No aplica» y no ofrece ningún control

#### Scenario: Cambios pendientes

- **WHEN** el administrador marca o desmarca una casilla
- **THEN** la pantalla muestra cuántos cambios hay sin guardar
- **AND** el botón Guardar se habilita y aparece la opción de descartarlos

#### Scenario: Conflicto al guardar

- **WHEN** el servidor responde `409`
- **THEN** la pantalla conserva lo editado, avisa de que la matriz cambió y ofrece recargar
