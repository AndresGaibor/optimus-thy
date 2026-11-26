# Spec Delta: acceso-objetos

## ADDED Requirements

### Requirement: Denegación de objetos de otra institución

Toda ruta con identificador direccionable SHALL limitar la operación a la institución activa del usuario autenticado. Un identificador de otra institución SHALL responder `404` con `error.code = "not_found"`, sin distinguirse de un identificador inexistente. La respuesta SHALL NOT incluir contenido, nombre ni identificador interno del objeto ajeno.

#### Scenario: Lectura de un paciente ajeno

- **DADO** un paciente de la institución A
- **CUANDO** un usuario de la institución B consulta `GET /pacientes/{id}` con ese identificador
- **ENTONCES** la respuesta es `404` con `not_found`
- **Y** el cuerpo no contiene datos del paciente

#### Scenario: Listado de usuarios filtrado

- **DADO** usuarios en las instituciones A y B
- **CUANDO** un administrador de A consulta `GET /usuarios`
- **ENTONCES** solo aparecen usuarios de A
- **Y** el total corresponde a esa institución

#### Scenario: Creación de usuario en otra institución

- **DADO** un administrador de la institución A
- **CUANDO** envía `POST /usuarios` con `institucion_id` de B
- **ENTONCES** la respuesta es `404` con `not_found`
- **Y** no se crea el usuario

#### Scenario: Asignación de roles a un usuario ajeno

- **DADO** un usuario de la institución B
- **CUANDO** un administrador de A envía `PUT /usuarios/{id}/roles`
- **ENTONCES** la respuesta es `404` con `not_found`
- **Y** los roles del usuario de B no cambian

### Requirement: Imagen ajena en el cuerpo de una inferencia

`POST /trabajos` con `tipo = "inferencia"` SHALL verificar que `imagen_id` pertenece a un caso de la institución activa antes de encolar. Una imagen de otra institución, o un `imagen_id` que no corresponde a ninguna imagen, SHALL responder `404` con `not_found` sin crear el trabajo y sin consumir el límite de inferencias.

#### Scenario: Inferencia con imagen ajena

- **DADO** una imagen de la institución B
- **CUANDO** un usuario de A envía `POST /trabajos` con esa `imagen_id`
- **ENTONCES** la respuesta es `404` con `not_found`
- **Y** no se crea ningún trabajo

#### Scenario: Inferencia con imagen propia

- **DADO** una imagen de la institución del usuario y consentimiento vigente
- **CUANDO** envía `POST /trabajos` con esa `imagen_id`
- **ENTONCES** el trabajo se encola con `202`
