# gestion-de-instituciones Specification

## Purpose
Permitir que la administración mantenga las instituciones del sistema sin acceso directo a la base de datos, conservando el historial y evitando que un usuario quede sin institución.

## Requirements

### Requirement: Alta de institución

La API SHALL crear instituciones activas con nombre y código único, y la pantalla de administración SHALL ofrecer el alta desde el encabezado.

#### Scenario: Alta correcta

- **WHEN** un usuario con permiso `usuario.gestionar` envía un nombre y un código nuevos
- **THEN** la API responde 201 con la institución activa y `usuarios_activos` en cero
- **AND** el código se guarda en mayúsculas
- **AND** se registra `INSTITUTION_CREATE` en la auditoría

#### Scenario: Código duplicado

- **WHEN** el código enviado ya pertenece a otra institución, sin distinguir mayúsculas
- **THEN** la API responde 409 y la pantalla muestra que el código ya existe

### Requirement: Edición de institución

La API SHALL permitir cambiar nombre, código y estado de una institución existente, validando el código único.

#### Scenario: Cambio de nombre y código

- **WHEN** se envía un `PATCH` con nombre y código válidos
- **THEN** la respuesta devuelve la institución actualizada
- **AND** se registra `INSTITUTION_UPDATE` en la auditoría

#### Scenario: Sin cambios

- **WHEN** el cuerpo del `PATCH` no incluye ningún campo
- **THEN** la API responde 422

### Requirement: Desactivación protegida

Una institución con usuarios activos SHALL rechazar la desactivación; sin usuarios activos SHALL desactivarse y dejar de ofrecerse en los selectores que solo muestran activas.

#### Scenario: Con usuarios activos

- **WHEN** se intenta desactivar una institución que tiene al menos un usuario activo
- **THEN** la API responde 409 con un mensaje que pide reasignar a los usuarios
- **AND** la institución conserva `activa = true`

#### Scenario: Sin usuarios activos

- **WHEN** la institución no tiene usuarios activos y se desactiva
- **THEN** la respuesta devuelve `activa = false`
- **AND** `GET /instituciones` sin parámetros no la incluye
- **AND** `GET /instituciones?incluir_inactivas=true` sí la incluye

### Requirement: Autorización de la administración

Todas las rutas de escritura de instituciones SHALL exigir el permiso `usuario.gestionar` y SHALL registrar el actor y el rol activo.

#### Scenario: Sin permiso

- **WHEN** una cuenta sin `usuario.gestionar` intenta crear o modificar una institución
- **THEN** la API responde 403 y no modifica datos

#### Scenario: Navegación

- **WHEN** la cuenta activa es administradora
- **THEN** la navegación muestra «Instituciones» y la ruta `/administrador/instituciones` abre el listado

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
