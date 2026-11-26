# Spec Delta: administracion-roles

## MODIFIED Requirements

### Requirement: Permisos asignables por dominio del rol

El sistema SHALL exponer, para cada rol, únicamente los permisos de su dominio y SHALL rechazar la asignación de un permiso fuera de ese dominio. El dominio del administrador SHALL incluir `derechos.gestionar`, que habilita el registro y la atención de solicitudes de derechos de los titulares. El dominio del rol `doctor` SHALL incluir `paciente.archivar`, y la migración SHALL asignarlo a los roles que ya cuentan con `paciente.escribir`.

#### Scenario: Interruptores por rol

- **WHEN** se consulta la matriz
- **THEN** cada rol incluye `asignables` con los códigos que le aplican
- **Y** la interfaz no ofrece interruptores para los códigos fuera de esa lista

#### Scenario: Permiso fuera del dominio

- **WHEN** se envía `PUT /roles/{id}/permisos` con un código que no pertenece al dominio del rol, por ejemplo `usuario.gestionar` para `researcher`
- **THEN** la API responde `422` `unprocessable_entity`
- **Y** la matriz del rol no cambia

#### Scenario: Derechos en el dominio del administrador

- **WHEN** se consulta la matriz del rol administrador
- **THEN** `derechos.gestionar` aparece entre sus permisos asignables
- **Y** el médico y el investigador no pueden recibirlo

#### Scenario: Archivado en el dominio del médico

- **GIVEN** un rol que ya cuenta con `paciente.escribir`
- **WHEN** se aplica la migración que incorpora el archivado
- **THEN** el rol recibe `paciente.archivar` sin duplicar asignaciones existentes
- **Y** el rol `doctor` lo ofrece entre sus permisos asignables
