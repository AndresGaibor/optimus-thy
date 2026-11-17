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
