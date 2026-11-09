> **ESCUELA SUPERIOR POLITÉCNICA DE CHIMBORAZO CARRERA DE SOFTWARE**
> **FACULTAD DE INFORMÁTICA Y ELECTRÓNICA**
> **Integrantes:**
> Andrés Alexander Gaibor Apunte (7255)\
> Daniel Floresmilo Quiguiri Quezada (7270)
> **Curso:**
> Octavo “1”
> **Tema:**
> Historias de usuario, historias técnicas y pila del producto
> **Docente:** Julio Santillan
> **Asignatura:**
> Aplicaciones Informáticas II
> **Periodo Lectivo:**
> Septiembre 2026 - Febrero 2027

**Introducción**

Este documento reúne las historias de usuario, las historias técnicas y la pila del producto del sistema web OPTIMUS-THY. Las historias de usuario salen de los recorridos de los tres roles del sistema (médico, investigador y administrador) y las historias técnicas, de las decisiones de arquitectura del proyecto. En total son 119 elementos, 61 historias de usuario y 58 técnicas, agrupados en 15 épicas.

El trabajo se organiza con Kanban, por lo que no hay sprints: cada elemento se jala al tablero cuando hay espacio. Para ordenar el plan, el periodo entre el martes 13 de octubre y el miércoles 23 de diciembre de 2026 se divide en cinco tramos (S1 a S5), que son bloques de tiempo y no compromisos de lote.

La estimación se da en horas de trabajo concentrado (1, 2, 3, 5 u 8), con pruebas y revisión incluidas, y supone trabajo asistido por herramientas de IA con revisión del equipo. La prioridad sigue MoSCoW: Alta es obligatoria, Media es deseable y Baja es opcional. Las historias técnicas se redactan desde la perspectiva del desarrollador.

**Historias de Usuarios**

**Historia de usuario 1**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HU-001</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Inicio de sesión</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E02 Acceso y sesión</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>S2 (27 oct a 9 nov)</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>3 horas</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Alta</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>HT-005, HT-006</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como usuario, quiero iniciar sesión con mi correo y contraseña, para entrar solo a lo que mi rol permite.</td>
</tr>
</tbody>
</table>

**Pruebas de aceptación:**

> 1\. Dado que ingreso credenciales válidas de una cuenta activa, cuando envío el formulario, entonces accedo al sistema con las opciones de mi rol.
> 2\. Dado que ingreso credenciales incorrectas, cuando envío el formulario, entonces el sistema muestra un mensaje que no revela si falló el correo o la contraseña.
> 3\. Dado que intento abrir una pantalla que mi rol no permite, cuando la solicito, entonces el sistema niega el acceso y explica el motivo.

**Historia de usuario 2**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HU-002</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Cierre de sesión</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E02 Acceso y sesión</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>S2 (27 oct a 9 nov)</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>1 hora</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Alta</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>HU-001</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como usuario, quiero cerrar sesión, para que nadie use mi cuenta después.</td>
</tr>
</tbody>
</table>

**Pruebas de aceptación:**

> 1\. Dado que tengo una sesión abierta, cuando selecciono cerrar sesión, entonces la sesión se invalida en el servidor y debo iniciar sesión de nuevo para entrar.
> 2\. Dado que cerré sesión, cuando uso el botón de retroceso del navegador, entonces no se muestran datos del sistema.

**Historia de usuario 3**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HU-003</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Elección del rol activo</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E02 Acceso y sesión</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>S3 (10 a 23 nov)</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>2 horas</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Alta</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>HU-001, HU-012</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como usuario con más de un rol, quiero elegir mi rol activo entre los que tengo asignados, para trabajar como médico o investigador sin cambiar de cuenta.</td>
</tr>
</tbody>
</table>

**Pruebas de aceptación:**

> 1\. Dado que tengo varios roles asignados, cuando elijo uno, entonces el sistema solo me ofrece los roles que tengo y aplica el elegido.
> 2\. Dado que cambio de rol, cuando confirmo, entonces el cambio queda registrado en la bitácora.
> 3\. Dado que intento activar un rol que no tengo asignado, cuando envío la solicitud, entonces el servidor la rechaza.

**Historia de usuario 4**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HU-004</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Bloqueo por intentos fallidos</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E02 Acceso y sesión</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>S4 (24 nov a 7 dic)</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>1 hora</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Alta</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>HU-001</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como administrador, quiero que una cuenta se bloquee un tiempo tras varios intentos fallidos, para frenar el adivinado de contraseñas.</td>
</tr>
</tbody>
</table>

**Pruebas de aceptación:**

> 1\. Dado que se supera el número de intentos fallidos configurado, cuando se intenta otro inicio de sesión, entonces la cuenta se bloquea por el tiempo configurado y el usuario ve un aviso claro.
> 2\. Dado que ocurre un intento fallido, cuando termina, entonces queda registrado en la bitácora.

**Historia de usuario 5**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HU-005</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Expiración de sesión por inactividad</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E02 Acceso y sesión</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>S4 (24 nov a 7 dic)</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>1 hora</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Alta</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>HU-001</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como usuario, quiero que mi sesión expire por inactividad, para proteger los datos si me alejo del equipo.</td>
</tr>
</tbody>
</table>

**Pruebas de aceptación:**

> 1\. Dado que no uso el sistema, cuando se acerca el tiempo configurado, entonces recibo un aviso antes de que la sesión expire.
> 2\. Dado que mi sesión expiró, cuando vuelvo al sistema, entonces se me pide iniciar sesión.

**Historia de usuario 6**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HU-006</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Cambio de contraseña y perfil</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E02 Acceso y sesión</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>Después</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>2 horas</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Media</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>HU-001</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como usuario, quiero cambiar mi contraseña y mis datos de perfil con una política de contraseñas robusta, para mantener mi cuenta protegida.</td>
</tr>
</tbody>
</table>

**Pruebas de aceptación:**

> 1\. Dado que ingreso una contraseña de menos de 12 caracteres o que figura en listas filtradas, cuando intento guardarla, entonces el sistema la rechaza y explica el motivo.
> 2\. Dado que cambio mi contraseña con éxito, cuando guardo, entonces mi sesión se renueva.

**Historia de usuario 7**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HU-007</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Segundo factor de autenticación</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E02 Acceso y sesión</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>Después</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>3 horas</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Media</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>HU-001</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como administrador, quiero un segundo factor de autenticación, para proteger las cuentas con más poder.</td>
</tr>
</tbody>
</table>

**Pruebas de aceptación:**

> 1\. Dado que soy administrador, cuando inicio sesión, entonces el sistema exige un código de un solo uso además de la contraseña.
> 2\. Dado que no tengo mi dispositivo, cuando uso un código de recuperación válido, entonces puedo entrar y ese código queda inutilizado.

**Historia de usuario 8**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HU-008</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Restablecimiento de contraseña</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E02 Acceso y sesión</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>Después</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>1 hora</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Baja</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>HU-010</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como administrador, quiero restablecer la contraseña de un usuario sin depender de correo externo, para ayudarlo cuando no puede entrar.</td>
</tr>
</tbody>
</table>

**Pruebas de aceptación:**

> 1\. Dado que restablezco la contraseña de un usuario, cuando guardo, entonces el sistema le exige cambiarla en su siguiente inicio de sesión.
> 2\. Dado que restablezco una contraseña, cuando termina la operación, entonces queda registrada en la bitácora.

**Historia de usuario 9**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HU-010</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Gestión de usuarios</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E03 Administración de usuarios y roles</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>S2 (27 oct a 9 nov)</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>3 horas</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Alta</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>HU-001</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como administrador, quiero crear, editar, activar y desactivar usuarios con su rol e institución, para controlar quién entra al sistema.</td>
</tr>
</tbody>
</table>

**Pruebas de aceptación:**

> 1\. Dado que ingreso los datos de un usuario nuevo, cuando guardo, entonces la cuenta queda creada con su rol e institución.
> 2\. Dado que el correo ya pertenece a otro usuario, cuando intento guardar, entonces el sistema lo rechaza.
> 3\. Dado que desactivo a un usuario, cuando guardo, entonces ya no puede entrar y su historial se conserva; cada cambio queda en la bitácora.

**Historia de usuario 10**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HU-011</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Gestión de roles y permisos</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E03 Administración de usuarios y roles</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>S2 (27 oct a 9 nov)</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>3 horas</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Alta</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>HU-010</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como administrador, quiero gestionar roles y asignar permisos con una matriz, para aplicar el mínimo privilegio.</td>
</tr>
</tbody>
</table>

**Pruebas de aceptación:**

> 1\. Dado que abro la matriz de permisos, cuando la consulto, entonces veo los roles médico, investigador y administrador con sus permisos.
> 2\. Dado que modifico un permiso, cuando guardo, entonces el cambio se aplica y queda registrado.

**Historia de usuario 11**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HU-012</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Varios roles por usuario</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E03 Administración de usuarios y roles</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>S2 (27 oct a 9 nov)</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>1 hora</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Alta</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>HU-011</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como administrador, quiero asignar a un usuario más de un rol, para que, si lo necesita, también actúe como médico o investigador.</td>
</tr>
</tbody>
</table>

**Pruebas de aceptación:**

> 1\. Dado que un usuario solo tiene el rol de administrador, cuando navega, entonces no ve datos clínicos.
> 2\. Dado que además tiene otro rol asignado, cuando lo activa, entonces ve datos clínicos únicamente mientras ese rol está activo.

**Historia de usuario 12**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HU-013</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Permisos por operación y denegaciones</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E03 Administración de usuarios y roles</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>S3 (10 a 23 nov)</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>3 horas</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Alta</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>HU-011</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como administrador, quiero que cada operación exija el permiso del rol y que las denegaciones queden registradas, para evitar accesos indebidos.</td>
</tr>
</tbody>
</table>

**Pruebas de aceptación:**

> 1\. Dado que un usuario ejecuta una operación sin el permiso de su rol, cuando envía la solicitud, entonces el sistema la rechaza.
> 2\. Dado que intento acceder a un objeto de otro paciente sin autorización, cuando lo solicito, entonces el sistema lo rechaza.
> 3\. Dado que se produce una denegación, cuando termina la solicitud, entonces se genera un evento de auditoría.

**Historia de usuario 13**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HU-014</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Gestión de instituciones</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E03 Administración de usuarios y roles</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>Después</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>1 hora</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Media</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>HU-010</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como administrador, quiero gestionar instituciones, para asociar usuarios y pacientes a la que corresponde.</td>
</tr>
</tbody>
</table>

**Pruebas de aceptación:**

> 1\. Dado que ingreso los datos de una institución, cuando guardo, entonces queda creada y puedo editarla o desactivarla.
> 2\. Dado que asigno una institución a un usuario, cuando guardo, entonces el usuario pertenece únicamente a esa institución.

**Historia de usuario 14**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HU-015</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Tablero del administrador</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E03 Administración de usuarios y roles</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>Después</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>2 horas</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Baja</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>HU-020</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como administrador, quiero un tablero con el volumen de datos, la actividad reciente y el estado del sistema, para conocer cómo está funcionando.</td>
</tr>
</tbody>
</table>

**Pruebas de aceptación:**

> 1\. Dado que abro el tablero, cuando carga, entonces veo el volumen de datos, la actividad reciente y el estado de los servicios.
> 2\. Dado que consulto una cifra, cuando reviso su origen, entonces proviene de la base de datos y de los servicios reales, sin datos simulados.

**Historia de usuario 15**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HU-016</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Ajustes no sensibles del sistema</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E03 Administración de usuarios y roles</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>Después</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>1 hora</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Baja</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>Ninguna</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como administrador, quiero editar ajustes no sensibles del sistema sin exponer secretos, para adaptar su funcionamiento sin tocar el código.</td>
</tr>
</tbody>
</table>

**Pruebas de aceptación:**

> 1\. Dado que abro los ajustes, cuando los consulto, entonces los secretos no se muestran.
> 2\. Dado que cambio un ajuste, cuando guardo, entonces el cambio queda registrado en la bitácora.

**Historia de usuario 16**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HU-020</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Consulta de la bitácora</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E04 Auditoría</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>S4 (24 nov a 7 dic)</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>3 horas</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Alta</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>HT-030</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como administrador, quiero consultar la bitácora y filtrarla por usuario, acción, fecha y recurso, para saber qué pasó y quién lo hizo.</td>
</tr>
</tbody>
</table>

**Pruebas de aceptación:**

> 1\. Dado que aplico filtros combinados, cuando consulto, entonces el sistema lista solo los eventos que coinciden, con paginación.
> 2\. Dado que consulto con el volumen de datos de prueba, cuando aplico los filtros, entonces el sistema responde en menos de 2 segundos.

**Historia de usuario 17**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HU-021</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Estados de carga, vacío y error</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E01 Sistema de diseño y experiencia</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>S5 (8 a 23 dic)</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>2 horas</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Alta</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>HT-021</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como usuario, quiero ver estados claros de carga, vacío y error en cada pantalla, para saber qué está pasando.</td>
</tr>
</tbody>
</table>

**Pruebas de aceptación:**

> 1\. Dado que una pantalla está cargando datos, cuando espero, entonces veo un indicador de carga.
> 2\. Dado que una pantalla no tiene datos, cuando la abro, entonces veo un mensaje de vacío.
> 3\. Dado que ocurre un error, cuando se muestra el aviso, entonces está en español y dice qué hacer.

**Historia de usuario 18**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HU-022</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Exportación de la bitácora</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E04 Auditoría</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>Después</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>1 hora</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Media</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>HU-020</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como administrador, quiero exportar la bitácora y que esa exportación también quede registrada, para entregar evidencia sin perder el control.</td>
</tr>
</tbody>
</table>

**Pruebas de aceptación:**

> 1\. Dado que apliqué filtros, cuando exporto, entonces el archivo respeta esos filtros.
> 2\. Dado que exporto la bitácora, cuando termina la descarga, entonces la exportación genera su propio evento.

**Historia de usuario 19**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HU-030</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Registro de paciente</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E05 Pacientes, consentimiento y casos</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>S3 (10 a 23 nov)</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>3 horas</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Alta</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>HT-011, HU-013</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como médico, quiero registrar un paciente con solo los datos mínimos necesarios, para empezar su atención.</td>
</tr>
</tbody>
</table>

**Pruebas de aceptación:**

> 1\. Dado que ingreso los datos mínimos, cuando guardo, entonces el paciente queda registrado con un código interno.
> 2\. Dado que guardo un paciente, cuando se almacenan sus datos, entonces los identificadores directos van cifrados en una tabla aparte.
> 3\. Dado que faltan datos obligatorios, cuando intento guardar, entonces el sistema muestra los errores y no guarda.

**Historia de usuario 20**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HU-031</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Búsqueda de pacientes</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E05 Pacientes, consentimiento y casos</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>S3 (10 a 23 nov)</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>2 horas</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Alta</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>HU-030</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como médico, quiero buscar y consultar mis pacientes con filtros, para encontrar rápido el que necesito.</td>
</tr>
</tbody>
</table>

**Pruebas de aceptación:**

> 1\. Dado que busco por código o aplico filtros, cuando consulto, entonces veo los pacientes que coinciden y que mi rol puede ver.
> 2\. Dado que consulto pacientes, cuando termina la búsqueda, entonces la consulta queda en la bitácora.

**Historia de usuario 21**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HU-032</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Corrección de datos del paciente</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E05 Pacientes, consentimiento y casos</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>S5 (8 a 23 dic)</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>2 horas</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Alta</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>HU-030</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como médico, quiero corregir los datos de un paciente conservando el historial de cambios, para mantener su información al día.</td>
</tr>
</tbody>
</table>

**Pruebas de aceptación:**

> 1\. Dado que edito los datos de un paciente, cuando guardo, entonces los datos actualizados se reflejan en su detalle.
> 2\. Dado que guardo un cambio, cuando consulto el historial, entonces veo quién, cuándo y qué cambió.

**Historia de usuario 22**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HU-033</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Apertura de casos</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E05 Pacientes, consentimiento y casos</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>S3 (10 a 23 nov)</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>2 horas</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Alta</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>HU-030</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como médico, quiero abrir un caso por paciente que agrupe ficha, documentos, imágenes e inferencias, para tener su información clínica en un solo lugar.</td>
</tr>
</tbody>
</table>

**Pruebas de aceptación:**

> 1\. Dado que abro un paciente, cuando creo un caso, entonces queda asociado a ese paciente.
> 2\. Dado que un paciente tiene varios casos, cuando abro uno, entonces veo su ficha, documentos, imágenes e inferencias.

**Historia de usuario 23**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HU-034</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Consentimiento del paciente</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E05 Pacientes, consentimiento y casos</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>S3 (10 a 23 nov)</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>3 horas</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Alta</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>HU-030, HT-080</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como médico, quiero registrar y retirar el consentimiento del paciente con finalidades separadas para atender y para investigar, para tratar sus datos solo con su autorización.</td>
</tr>
</tbody>
</table>

**Pruebas de aceptación:**

> 1\. Dado que registro un consentimiento, cuando guardo, entonces queda con la versión del texto, la fecha y las finalidades de atención e investigación por separado.
> 2\. Dado que registro el retiro del consentimiento, cuando guardo, entonces tiene efecto desde ese momento y queda registrado.

**Historia de usuario 24**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HU-035</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Bloqueo sin consentimiento vigente</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E05 Pacientes, consentimiento y casos</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>S3 (10 a 23 nov)</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>1 hora</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Alta</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>HU-034</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como médico, quiero que el sistema impida inferir o incluir a un paciente en investigación sin consentimiento vigente, para no tratar datos sin autorización.</td>
</tr>
</tbody>
</table>

**Pruebas de aceptación:**

> 1\. Dado que el paciente no tiene consentimiento vigente, cuando abro su imagen, entonces el botón de inferencia aparece desactivado con una explicación.
> 2\. Dado que el paciente no tiene consentimiento de investigación, cuando se arman los datasets, entonces no aparece en ellos.

**Historia de usuario 25**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HU-036</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Pacientes por institución</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E05 Pacientes, consentimiento y casos</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>Después</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>2 horas</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Media</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>HU-014</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como médico, quiero ver solo los pacientes de mi institución o de mi asignación, para no acceder a datos que no me corresponden.</td>
</tr>
</tbody>
</table>

**Pruebas de aceptación:**

> 1\. Dado que soy médico de una institución, cuando listo pacientes, entonces solo veo los de mi institución o asignación.
> 2\. Dado que solicito un paciente de otra institución, cuando el servidor procesa la petición, entonces devuelve acceso denegado.

**Historia de usuario 26**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HU-037</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Archivado de pacientes</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E05 Pacientes, consentimiento y casos</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>Después</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>2 horas</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Media</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>HU-030</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como médico, quiero archivar un paciente sin perder su historial, para mantener las listas limpias.</td>
</tr>
</tbody>
</table>

**Pruebas de aceptación:**

> 1\. Dado que archivo un paciente, cuando consulto las listas, entonces ya no aparece, pero su historial se conserva.
> 2\. Dado que intento eliminar un paciente, cuando confirmo, entonces el sistema exige permiso y la acción queda registrada.

**Historia de usuario 27**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HU-038</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Aviso de posible duplicado</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E05 Pacientes, consentimiento y casos</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>Después</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>1 hora</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Media</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>HU-030</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como médico, quiero un aviso de posible duplicado al registrar un paciente, para no crear dos registros de la misma persona.</td>
</tr>
</tbody>
</table>

**Pruebas de aceptación:**

> 1\. Dado que registro un paciente cuyos datos no identificables o cuyo identificador de institución ya existen, cuando guardo, entonces el sistema avisa de un posible duplicado.
> 2\. Dado que recibo el aviso, cuando confirmo que es otra persona, entonces puedo continuar con el registro.

**Historia de usuario 28**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HU-039</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Exportación de datos del paciente</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E05 Pacientes, consentimiento y casos</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>Después</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>2 horas</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Media</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>HU-033</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como médico, quiero exportar los datos de un paciente en formato estructurado cuando lo solicita, para atender su derecho de acceso.</td>
</tr>
</tbody>
</table>

**Pruebas de aceptación:**

> 1\. Dado que un paciente solicita sus datos, cuando exporto, entonces obtengo sus datos y resultados de inferencia en JSON o CSV.
> 2\. Dado que exporto, cuando termina la descarga, entonces la exportación queda registrada.

**Historia de usuario 29**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HU-040</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Ficha clínica por secciones</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E06 Ficha clínica</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>S3 (10 a 23 nov)</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>5 horas</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Alta</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>HU-033</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como médico, quiero registrar la ficha clínica por secciones (consulta, laboratorio, ecografía, PAAF y Bethesda, antecedentes y diagnóstico con CIE-10), para tener el contexto clínico junto a las imágenes.</td>
</tr>
</tbody>
</table>

**Pruebas de aceptación:**

> 1\. Dado que abro un caso, cuando completo las secciones y guardo, entonces la ficha queda almacenada en ese caso.
> 2\. Dado que abro una ficha guardada, cuando la consulto, entonces veo todas sus secciones con los campos del catálogo.

**Historia de usuario 30**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HU-041</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Validación de la ficha</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E06 Ficha clínica</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>S3 (10 a 23 nov)</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>2 horas</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Alta</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>HU-040</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como médico, quiero validaciones con mensajes claros, para no guardar valores imposibles.</td>
</tr>
</tbody>
</table>

**Pruebas de aceptación:**

> 1\. Dado que ingreso un valor de TSH, T3, T4 o tamaño fuera del rango configurado, cuando guardo, entonces el sistema muestra un mensaje en español y no guarda.
> 2\. Dado que ingreso un TI-RADS o un Bethesda inválido, cuando guardo, entonces el sistema solo acepta valores válidos.

**Historia de usuario 31**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HU-042</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Historial de cambios de la ficha</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E06 Ficha clínica</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>S5 (8 a 23 dic)</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>2 horas</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Alta</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>HU-040</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como médico, quiero ver quién cambió la ficha, cuándo y qué cambió, para confiar en la información registrada.</td>
</tr>
</tbody>
</table>

**Pruebas de aceptación:**

> 1\. Dado que modifico una ficha, cuando guardo, entonces se registra quién, cuándo y qué cambió.
> 2\. Dado que abro el historial de la ficha, cuando lo consulto, entonces puedo ver y comparar sus versiones.

**Historia de usuario 32**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HU-043</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Cronología del caso</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E06 Ficha clínica</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>Después</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>2 horas</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Media</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>HU-040</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como médico, quiero ver la cronología de un caso, para seguir su evolución.</td>
</tr>
</tbody>
</table>

**Pruebas de aceptación:**

> 1\. Dado que abro un caso, cuando selecciono la cronología, entonces veo en orden las fichas, los documentos y las inferencias.

**Historia de usuario 33**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HU-044</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Cierre de ficha</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E06 Ficha clínica</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>Después</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>1 hora</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Baja</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>HU-040</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como médico, quiero cerrar una ficha para bloquear ediciones, para dar por definitivo su contenido.</td>
</tr>
</tbody>
</table>

**Pruebas de aceptación:**

> 1\. Dado que cierro una ficha, cuando intento editarla, entonces el sistema no lo permite.
> 2\. Dado que tengo permiso para reabrirla, cuando la reabro, entonces la acción queda registrada.

**Historia de usuario 34**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HU-050</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Carga de fichas clínicas</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E07 Documentos y OCR</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>S4 (24 nov a 7 dic)</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>3 horas</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Alta</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>HT-007, HU-033</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como médico, quiero cargar una ficha en PDF o imagen asociada a un paciente y a un caso, para tener la documentación junto a sus imágenes.</td>
</tr>
</tbody>
</table>

**Pruebas de aceptación:**

> 1\. Dado que selecciono un PDF o una imagen permitida, cuando lo cargo, entonces queda asociado al caso, guardado en almacenamiento privado y registrado en la bitácora.
> 2\. Dado que el archivo es de un tipo no permitido o está dañado, cuando lo cargo, entonces el sistema lo rechaza y explica el motivo.

**Historia de usuario 35**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HU-051</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Estado del OCR</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E07 Documentos y OCR</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>S4 (24 nov a 7 dic)</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>1 hora</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Alta</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>HT-010, HU-050</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como médico, quiero ver el estado del OCR, para saber cuándo puedo revisar la ficha.</td>
</tr>
</tbody>
</table>

**Pruebas de aceptación:**

> 1\. Dado que el OCR está en curso, cuando miro el documento, entonces veo su estado (en cola, procesando, listo o error), que se actualiza sin recargar la página.
> 2\. Dado que el OCR falla, cuando termina el proceso, entonces el aviso indica el motivo.

**Historia de usuario 36**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HU-052</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Revisión lado a lado del OCR</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E07 Documentos y OCR</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>S4 (24 nov a 7 dic)</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>5 horas</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Alta</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>HT-041, HT-022, HU-040</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como médico, quiero revisar lado a lado los campos que leyó el OCR con su confianza y corregirlos antes de aceptarlos en la ficha, para reducir la digitación manual sin guardar datos sin verificar.</td>
</tr>
</tbody>
</table>

**Pruebas de aceptación:**

> 1\. Dado que el OCR terminó, cuando abro la revisión, entonces veo el documento original junto a los campos propuestos y los de baja confianza aparecen resaltados.
> 2\. Dado que corrijo y confirmo los campos, cuando guardo, entonces los datos pasan a la ficha y se conservan el valor leído y el corregido; si no confirmo, no se guarda nada.
> 3\. Dado que el OCR falla o el documento es ilegible, cuando termina el proceso, entonces puedo ingresar los datos a mano.

**Historia de usuario 37**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HU-053</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Visualización y descarga de documentos</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E07 Documentos y OCR</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>S4 (24 nov a 7 dic)</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>1 hora</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Alta</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>HU-050</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como médico, quiero visualizar y descargar documentos según mi permiso, para consultarlos cuando los necesite.</td>
</tr>
</tbody>
</table>

**Pruebas de aceptación:**

> 1\. Dado que tengo permiso sobre el caso, cuando abro o descargo un documento, entonces el acceso se hace con un enlace firmado.
> 2\. Dado que accedo a un documento, cuando termina la operación, entonces el acceso queda en la bitácora.

**Historia de usuario 38**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HU-054</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Reintento del OCR</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E07 Documentos y OCR</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>Después</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>1 hora</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Media</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>HU-051</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como médico, quiero reintentar un OCR fallido sin volver a subir el archivo, para ahorrar tiempo.</td>
</tr>
</tbody>
</table>

**Pruebas de aceptación:**

> 1\. Dado que un OCR falló, cuando selecciono reintentar, entonces se procesa de nuevo con el archivo ya guardado.
> 2\. Dado que reintento varias veces, cuando consulto el documento, entonces veo el historial de intentos.

**Historia de usuario 39**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HU-055</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Aviso de baja calidad del escaneo</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E07 Documentos y OCR</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>Después</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>1 hora</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Baja</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>HU-050</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como médico, quiero un aviso cuando un escaneo tiene baja calidad antes de procesarlo, para evitar lecturas deficientes.</td>
</tr>
</tbody>
</table>

**Pruebas de aceptación:**

> 1\. Dado que cargo un escaneo cuya nitidez o contraste está bajo el umbral configurado, cuando termina la carga, entonces el sistema me avisa antes de procesarlo.
> 2\. Dado que recibo el aviso, cuando decido continuar, entonces el documento se procesa.

**Historia de usuario 40**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HU-060</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Carga de ecografías</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E08 Imágenes ecográficas</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>S3 (10 a 23 nov)</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>3 horas</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Alta</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>HT-007, HU-033</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como médico, quiero cargar la imagen ecográfica de un caso y que el sistema la valide, para poder solicitar la inferencia sobre ella.</td>
</tr>
</tbody>
</table>

**Pruebas de aceptación:**

> 1\. Dado que selecciono una imagen en un formato admitido y de dimensiones mínimas, cuando la cargo, entonces queda asociada al caso y puedo verla.
> 2\. Dado que la imagen es ilegible o de un formato no admitido, cuando la cargo, entonces el sistema la rechaza y explica el motivo.
> 3\. Dado que cargo una imagen, cuando se guarda, entonces el original se conserva intacto.

**Historia de usuario 41**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HU-061</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Visor de imágenes</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E08 Imágenes ecográficas</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>Después</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>2 horas</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Media</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>HT-022</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como médico, quiero acercar la imagen y ajustar brillo y contraste, para observar mejor los detalles.</td>
</tr>
</tbody>
</table>

**Pruebas de aceptación:**

> 1\. Dado que veo una ecografía, cuando uso zoom, desplazamiento, brillo y contraste, entonces la vista cambia según el ajuste.
> 2\. Dado que ajusto la vista, cuando termino, entonces el archivo original no se altera.

**Historia de usuario 42**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HU-062</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Varias imágenes por caso</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E08 Imágenes ecográficas</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>Después</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>1 hora</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Media</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>HU-060</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como médico, quiero asociar varias imágenes a un caso y elegir cuál se usa, para ejecutar la inferencia sobre la más adecuada.</td>
</tr>
</tbody>
</table>

**Pruebas de aceptación:**

> 1\. Dado que un caso tiene varias imágenes, cuando elijo una para la inferencia, entonces el sistema usa esa imagen.
> 2\. Dado que abro una inferencia, cuando consulto su detalle, entonces indica con qué imagen se hizo.

**Historia de usuario 43**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HU-070</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Ejecución de la inferencia</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E09 Servicio de IA e inferencia</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>S4 (24 nov a 7 dic)</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>3 horas</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Alta</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>HT-063, HU-035, HU-060</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como médico, quiero elegir paciente, caso e imagen y ejecutar la inferencia, para obtener una clasificación de apoyo sin ejecutar scripts.</td>
</tr>
</tbody>
</table>

**Pruebas de aceptación:**

> 1\. Dado que el paciente tiene consentimiento vigente, cuando selecciono caso e imagen y ejecuto, entonces el sistema procesa la imagen y muestra el estado.
> 2\. Dado que ejecuto una inferencia, cuando termina la solicitud, entonces queda en la bitácora.
> 3\. Dado que el servicio de IA no responde, cuando termina el tiempo máximo, entonces el sistema informa el error y no guarda un resultado inventado.

**Historia de usuario 44**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HU-071</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Resultado por nódulo</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E09 Servicio de IA e inferencia</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>S4 (24 nov a 7 dic)</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>5 horas</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Alta</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>HU-070, HT-022</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como médico, quiero ver por cada nódulo la clase, la probabilidad, la caja, la máscara, la región analizada y la superposición, con el aviso de que es apoyo y no diagnóstico, para apoyar mi criterio clínico.</td>
</tr>
</tbody>
</table>

**Pruebas de aceptación:**

> 1\. Dado que abro una inferencia, cuando consulto el resultado, entonces veo por cada nódulo la clase, la probabilidad, la caja, la máscara, la región analizada y la superposición.
> 2\. Dado que veo el resultado, cuando reviso la pantalla, entonces el aviso de que es solo un apoyo está siempre visible.
> 3\. Dado que veo la clase y la probabilidad, cuando reviso la pantalla, entonces también aparecen en texto, no solo con color.

**Historia de usuario 45**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HU-072</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Historial de inferencias</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E09 Servicio de IA e inferencia</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>S4 (24 nov a 7 dic)</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>1 hora</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Alta</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>HU-070</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como médico, quiero ver el historial de inferencias de un caso, para dar seguimiento.</td>
</tr>
</tbody>
</table>

**Pruebas de aceptación:**

> 1\. Dado que abro un caso, cuando consulto el historial, entonces veo una lista ordenada con la fecha, la imagen, el resultado y la versión del modelo.

**Historia de usuario 46**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HU-073</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Conclusión del médico</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E09 Servicio de IA e inferencia</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>S5 si hay espacio</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>2 horas</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Media</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>HU-071</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como médico, quiero registrar mi propia conclusión aparte de la predicción, para dejar constancia de mi criterio.</td>
</tr>
</tbody>
</table>

**Pruebas de aceptación:**

> 1\. Dado que reviso un resultado, cuando registro mi conclusión, entonces se guarda separada de la predicción, con fecha y autor.
> 2\. Dado que guardo mi conclusión, cuando consulto el resultado, entonces la salida original del modelo no cambia.

**Historia de usuario 47**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HU-074</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Explicación y límites del modelo</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E09 Servicio de IA e inferencia</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>Después</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>1 hora</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Media</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>HU-071</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como médico, quiero entender cómo se obtiene la predicción y cuáles son sus límites, para interpretar bien el resultado.</td>
</tr>
</tbody>
</table>

**Pruebas de aceptación:**

> 1\. Dado que abro un resultado, cuando selecciono la ayuda, entonces veo un texto breve del flujo del modelo y de sus límites.

**Historia de usuario 48**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HU-080</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Reporte PDF de una inferencia</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E10 Reportes</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>S4 (24 nov a 7 dic)</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>5 horas</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Alta</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>HU-071</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como médico, quiero generar un reporte PDF por inferencia con los datos mínimos del paciente, las imágenes, el resultado, la confianza, la versión del modelo y el aviso de apoyo, para adjuntarlo al expediente.</td>
</tr>
</tbody>
</table>

**Pruebas de aceptación:**

> 1\. Dado que abro una inferencia, cuando genero el reporte, entonces se crea un PDF con el encabezado de ESPOCH y SOLCA, las imágenes, el resultado, la confianza, la versión del modelo y el aviso de apoyo.
> 2\. Dado que genero el reporte, cuando reviso su contenido, entonces no incluye datos del paciente que no sean necesarios.

**Historia de usuario 49**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HU-081</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Consulta de resultados guardados</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E10 Reportes</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>S4 (24 nov a 7 dic)</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>2 horas</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Alta</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>HU-072</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como médico, quiero consultar los resultados guardados con filtros por paciente, fecha y clase, para encontrar un resultado anterior.</td>
</tr>
</tbody>
</table>

**Pruebas de aceptación:**

> 1\. Dado que aplico filtros por paciente, fecha y clase, cuando consulto, entonces el sistema lista los resultados que coinciden, con paginación.

**Historia de usuario 50**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HU-082</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Descarga registrada del reporte</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E10 Reportes</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>S4 (24 nov a 7 dic)</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>1 hora</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Alta</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>HU-080</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como médico, quiero descargar el reporte y que la descarga quede registrada, para tener control de quién lo obtuvo.</td>
</tr>
</tbody>
</table>

**Pruebas de aceptación:**

> 1\. Dado que descargo un reporte, cuando termina la descarga, entonces el evento de bitácora incluye el usuario, el reporte y la hora.

**Historia de usuario 51**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HU-083</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Reporte consolidado del caso</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E10 Reportes</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>Después</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>2 horas</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Baja</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>HU-080</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como médico, quiero un reporte consolidado de un caso con un identificador verificable, para presentar el historial completo.</td>
</tr>
</tbody>
</table>

**Pruebas de aceptación:**

> 1\. Dado que genero el consolidado de un caso, cuando reviso el PDF, entonces reúne todas las inferencias del caso.
> 2\. Dado que recibo el consolidado, cuando uso su identificador, entonces puedo comprobar su autenticidad.

**Historia de usuario 52**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HU-090</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Consulta de datasets anonimizados</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E11 Investigación y evaluación</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>S5 (8 a 23 dic)</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>3 horas</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Alta</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>HT-070</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como investigador, quiero consultar datasets anonimizados construidos a partir de casos con consentimiento, para trabajar sin ver datos de pacientes.</td>
</tr>
</tbody>
</table>

**Pruebas de aceptación:**

> 1\. Dado que consulto datasets, cuando los abro, entonces solo incluyen casos con consentimiento de investigación.
> 2\. Dado que reviso un dataset, cuando lo exploro, entonces no se ve ningún identificador.
> 3\. Dado que consulto un dataset, cuando termina la consulta, entonces queda en la bitácora.

**Historia de usuario 53**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HU-091</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Métricas del modelo</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E11 Investigación y evaluación</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>S5 (8 a 23 dic)</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>3 horas</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Alta</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>HU-090, HU-072</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como investigador, quiero calcular las métricas del modelo contra la referencia clínica, para conocer su desempeño.</td>
</tr>
</tbody>
</table>

**Pruebas de aceptación:**

> 1\. Dado que selecciono un dataset y un modelo, cuando calculo, entonces veo sensibilidad, especificidad, precisión, F1, AUC y la matriz de confusión, usando como referencia la histopatología o el Bethesda.
> 2\. Dado que repito el cálculo con los mismos datos, cuando termina, entonces obtengo el mismo resultado.

**Historia de usuario 54**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HU-092</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Comparación de resultados</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E11 Investigación y evaluación</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>S5 (8 a 23 dic)</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>2 horas</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Alta</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>HU-091</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como investigador, quiero comparar resultados entre conjuntos de datos o versiones del modelo, para ver si hubo mejora.</td>
</tr>
</tbody>
</table>

**Pruebas de aceptación:**

> 1\. Dado que selecciono dos conjuntos de datos o dos versiones del modelo, cuando comparo, entonces veo sus métricas lado a lado.

**Historia de usuario 55**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HU-093</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Auditoría de predicciones</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E11 Investigación y evaluación</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>S5 (8 a 23 dic)</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>2 horas</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Alta</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>HU-091</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como investigador, quiero auditar predicciones individuales, para revisar caso por caso.</td>
</tr>
</tbody>
</table>

**Pruebas de aceptación:**

> 1\. Dado que abro la lista de predicciones, cuando la consulto, entonces veo la predicción, la referencia clínica y la diferencia, con filtros.

**Historia de usuario 56**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HU-094</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Análisis de errores</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E11 Investigación y evaluación</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>S5 (8 a 23 dic)</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>2 horas</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Alta</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>HU-091</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como investigador, quiero analizar los errores del modelo, para entender dónde falla.</td>
</tr>
</tbody>
</table>

**Pruebas de aceptación:**

> 1\. Dado que consulto los errores, cuando aplico filtros, entonces veo la lista de falsos positivos y falsos negativos.

**Historia de usuario 57**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HU-095</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Exportación anonimizada</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E11 Investigación y evaluación</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>S5 (8 a 23 dic)</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>2 horas</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Alta</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>HU-091, HT-070</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como investigador, quiero exportar datos y métricas anonimizados, para usarlos en mis publicaciones.</td>
</tr>
</tbody>
</table>

**Pruebas de aceptación:**

> 1\. Dado que mi rol tiene permiso, cuando exporto, entonces el archivo incluye la ficha técnica del dataset y no contiene identificadores.
> 2\. Dado que exporto, cuando termina la descarga, entonces la exportación queda registrada.
> 3\. Dado que mi rol no tiene permiso, cuando intento exportar, entonces el sistema lo niega.

**Historia de usuario 58**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HU-096</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Cohortes de investigación</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E11 Investigación y evaluación</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>Después</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>3 horas</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Media</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>HU-091</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como investigador, quiero definir cohortes con filtros por fecha, clase, TI-RADS y otros campos, para analizar subgrupos.</td>
</tr>
</tbody>
</table>

**Pruebas de aceptación:**

> 1\. Dado que defino los filtros de una cohorte, cuando guardo, entonces queda disponible para reutilizarla.
> 2\. Dado que calculo métricas, cuando selecciono una cohorte guardada, entonces el cálculo usa esa cohorte.

**Historia de usuario 59**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HU-097</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Curva ROC y distribución de probabilidades</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E11 Investigación y evaluación</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>Después</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>2 horas</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Media</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>HU-091</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como investigador, quiero ver la curva ROC y la distribución de probabilidades, para evaluar el modelo de forma visual.</td>
</tr>
</tbody>
</table>

**Pruebas de aceptación:**

> 1\. Dado que calculo las métricas, cuando abro los gráficos, entonces veo la curva ROC y la distribución de probabilidades.
> 2\. Dado que veo un gráfico, cuando lo reviso, entonces tiene una tabla equivalente accesible.

**Historia de usuario 60**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HU-100</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Solicitudes de derechos de titulares</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E12 Seguridad y cumplimiento legal</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>S5 si hay espacio</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>1 hora</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Media</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>HU-020</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como administrador, quiero registrar las solicitudes de derechos de los titulares con su plazo de respuesta, para cumplir la ley de protección de datos.</td>
</tr>
</tbody>
</table>

**Pruebas de aceptación:**

> 1\. Dado que registro una solicitud, cuando guardo, entonces queda con fecha, tipo, responsable y plazo de 15 días.
> 2\. Dado que consulto las solicitudes, cuando abro el listado, entonces veo el plazo restante de cada una.

**Historia de usuario 61**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HU-110</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Medición de usabilidad con el UnUQ</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E14 Calidad, usabilidad y entrega</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>S5 (8 a 23 dic)</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>8 horas</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Alta</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>Ninguna</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como tesista, quiero medir la usabilidad con el UnUQ con 10 evaluadores (médicos, investigadores y administradores), para cumplir el objetivo 3.</td>
</tr>
</tbody>
</table>

**Pruebas de aceptación:**

> 1\. Dado que preparo la evaluación, cuando la reviso, entonces hay tareas definidas por rol y un consentimiento informado para cada evaluador.
> 2\. Dado que los evaluadores contestan los 22 ítems en escala de 5 puntos, cuando calculo, entonces obtengo una puntuación de 0 a 100 con la fórmula del artículo y el análisis por los 7 atributos.
> 3\. Dado que se calcula la puntuación, cuando la comparo con la meta, entonces el resultado es de 70 o más.

**Historias técnicas**

**Historia técnica 1**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HT-001</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Repositorio y estructura del proyecto</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E00 Fundación técnica</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>S1 (13 a 26 oct)</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>2 horas</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Alta</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>Ninguna</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como desarrollador, necesito crear el repositorio optimus con carpetas frontend, backend, ia, ocr, docs e infra, README, plantillas de pull request e issues y ramas protegidas, para trabajar en un solo lugar con cambios revisados.</td>
</tr>
</tbody>
</table>

**Criterios de aceptación:**

> 1\. Repositorio creado en GitHub.
> 2\. La rama principal solo recibe cambios por pull request con integración continua en verde.
> 3\. La plantilla de pull request pide el requisito que cubre.

**Historia técnica 2**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HT-002</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Entorno local con un solo comando</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E00 Fundación técnica</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>S1 (13 a 26 oct)</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>5 horas</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Alta</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>HT-001</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como desarrollador, necesito levantar frontend, API, PostgreSQL, almacenamiento compatible con S3, OCR e IA con Docker Compose, para ejecutar todo el sistema en una laptop sin GPU.</td>
</tr>
</tbody>
</table>

**Criterios de aceptación:**

> 1\. Un comando levanta todo en una laptop sin GPU.
> 2\. El README explica los pasos.
> 3\. Variables de ejemplo sin secretos.
> 4\. Cada servicio tiene chequeo de salud.

**Historia técnica 3**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HT-003</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Integración continua</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E00 Fundación técnica</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>S1 (13 a 26 oct)</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>3 horas</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Alta</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>HT-001</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como desarrollador, necesito automatizar formato, tipos, pruebas, construcción y escaneos en GitHub Actions, para detectar fallos antes de fusionar los cambios.</td>
</tr>
</tbody>
</table>

**Criterios de aceptación:**

> 1\. Cada pull request corre formato, tipos, pruebas y construcción.
> 2\. Escaneo de secretos y de dependencias.
> 3\. Un pull request con fallos no se fusiona.

**Historia técnica 4**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HT-004</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Esqueleto del backend</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E00 Fundación técnica</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>S1 (13 a 26 oct)</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>3 horas</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Alta</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>HT-001</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como desarrollador, necesito dejar listo el backend en Python (FastAPI, SQLAlchemy, Alembic) con configuración, logs estructurados y manejo de errores, para construir las funciones sobre una base común.</td>
</tr>
</tbody>
</table>

**Criterios de aceptación:**

> 1\. Endpoint de salud.
> 2\. Los errores no muestran detalles internos.
> 3\. Los logs son JSON sin datos personales ni clínicos.
> 4\. Las migraciones corren desde cero.

**Historia técnica 5**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HT-005</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Esqueleto del frontend</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E00 Fundación técnica</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>S1 (13 a 26 oct)</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>3 horas</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Alta</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>HT-001</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como desarrollador, necesito dejar listo el frontend en React con enrutado, cliente de API tipado y manejo de sesión, para construir las pantallas sobre una base común.</td>
</tr>
</tbody>
</table>

**Criterios de aceptación:**

> 1\. Navegación base por rol.
> 2\. El cliente se genera desde el contrato de la API.
> 3\. Pantallas de carga y error por defecto.

**Historia técnica 6**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HT-006</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Modelo de datos v1</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E00 Fundación técnica</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>S2 (27 oct a 9 nov)</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>5 horas</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Alta</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>HT-004</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como desarrollador, necesito definir el modelo de datos con migraciones y su diagrama entidad-relación, para almacenar de forma ordenada usuarios, pacientes, archivos, inferencias y auditoría.</td>
</tr>
</tbody>
</table>

**Criterios de aceptación:**

> 1\. Tablas de usuarios, roles, permisos, pacientes con identificadores aparte, casos, fichas, documentos, imágenes, OCR, inferencias, consentimientos y auditoría.
> 2\. Diagrama en docs.
> 3\. Migración reproducible.

**Historia técnica 7**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HT-007</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Almacenamiento de archivos compatible con S3</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E00 Fundación técnica</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>S2 (27 oct a 9 nov)</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>3 horas</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Alta</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>HT-002</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como desarrollador, necesito un almacenamiento de archivos con buckets privados, nombres opacos y enlaces firmados, para guardar documentos e imágenes sin exponer su ubicación real.</td>
</tr>
</tbody>
</table>

**Criterios de aceptación:**

> 1\. Subir y bajar archivos solo con enlace firmado de corta duración.
> 2\. Los nombres no contienen datos personales.
> 3\. La base guarda solo metadatos y ubicación.

**Historia técnica 8**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HT-008</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Tablero Kanban en GitHub Projects</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E00 Fundación técnica</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>S1 (13 a 26 oct)</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>1 hora</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Alta</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>HT-001</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como desarrollador, necesito un tablero Kanban con los cuatro estados aprobados y todas las historias como tarjetas, para dar seguimiento al trabajo y conservar evidencia del avance.</td>
</tr>
</tbody>
</table>

**Criterios de aceptación:**

> 1\. Columnas pendiente, en proceso, revisión y finalizado.
> 2\. Cada tarjeta enlaza requisito, historia y pull request.
> 3\. El historial se puede exportar como evidencia.

**Historia técnica 9**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HT-009</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Contrato OpenAPI versionado</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E00 Fundación técnica</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>Después</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>2 horas</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Media</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>HT-004</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como desarrollador, necesito que el contrato OpenAPI esté versionado y se verifique en la integración continua, para que un cambio en la API no rompa el frontend sin aviso.</td>
</tr>
</tbody>
</table>

**Criterios de aceptación:**

> 1\. La integración continua falla si el contrato cambia sin subir la versión.

**Historia técnica 10**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HT-010</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Trabajos en segundo plano</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E00 Fundación técnica</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>S3 (10 a 23 nov)</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>2 horas</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Alta</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>HT-004</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como desarrollador, necesito ejecutar los trabajos largos en segundo plano con estados y reintentos, para que el OCR y la inferencia no bloqueen las peticiones.</td>
</tr>
</tbody>
</table>

**Criterios de aceptación:**

> 1\. Estados en cola, procesando, listo y error.
> 2\. Tiempo máximo por trabajo.
> 3\. Reintento manual.
> 4\. Un fallo no tumba el sistema.

**Historia técnica 11**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HT-011</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Cifrado en reposo y gestión de claves</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E00 Fundación técnica</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>S2 (27 oct a 9 nov)</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>2 horas</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Alta</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>HT-006</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como desarrollador, necesito cifrar los datos en reposo y manejar las claves fuera del repositorio, para proteger los datos que identifican al paciente.</td>
</tr>
</tbody>
</table>

**Criterios de aceptación:**

> 1\. Los datos que identifican al paciente se guardan cifrados con una clave fuera del repositorio.
> 2\. Almacenamiento y respaldos cifrados.

**Historia técnica 12**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HT-012</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Proxy inverso con TLS</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E00 Fundación técnica</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>S3 (10 a 23 nov)</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>2 horas</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Alta</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>HT-002</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como desarrollador, necesito un proxy inverso con TLS y cabeceras de seguridad como único punto expuesto, para proteger los demás servicios.</td>
</tr>
</tbody>
</table>

**Criterios de aceptación:**

> 1\. Base de datos, almacenamiento, IA y OCR sin puertos públicos.
> 2\. HSTS, CSP y CORS restrictivo.
> 3\. Comprobado con un escaneo de puertos.

**Historia técnica 13**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HT-013</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Respaldo y restauración</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E00 Fundación técnica</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>S5 (8 a 23 dic)</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>3 horas</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Alta</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>HT-007</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como desarrollador, necesito un respaldo automático cifrado con una restauración probada, para recuperar el sistema ante una pérdida de datos.</td>
</tr>
</tbody>
</table>

**Criterios de aceptación:**

> 1\. Respaldo cifrado de base de datos y archivos.
> 2\. Restauración probada en un entorno limpio con guion y evidencia.

**Historia técnica 14**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HT-014</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Documentación de arquitectura</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E00 Fundación técnica</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>Después</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>2 horas</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Media</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>Ninguna</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como desarrollador, necesito documentar la arquitectura y registrar las decisiones importantes (ADR), para que el equipo y el tribunal entiendan por qué se diseñó así.</td>
</tr>
</tbody>
</table>

**Criterios de aceptación:**

> 1\. Diagrama de contexto y de despliegue.
> 2\. Un ADR por cada decisión importante.

**Historia técnica 15**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HT-020</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Principios de diseño y tokens</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E01 Sistema de diseño y experiencia</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>S1 (13 a 26 oct)</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>3 horas</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Alta</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>Ninguna</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como desarrollador, necesito definir los principios de diseño y los tokens (color, tipografía, espaciado, radios, sombras, movimiento) en tema claro y oscuro, para que toda la interfaz comparta un mismo estilo.</td>
</tr>
</tbody>
</table>

**Criterios de aceptación:**

> 1\. Los tokens son la única fuente de estilo.
> 2\. Colores propios para normal, benigno y maligno que no dependen solo del color.
> 3\. Temas claro y oscuro sobre los mismos tokens.

**Historia técnica 16**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HT-021</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Biblioteca de componentes base</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E01 Sistema de diseño y experiencia</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>S2 (27 oct a 9 nov)</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>5 horas</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Alta</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>HT-020</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como desarrollador, necesito una biblioteca de componentes base con un catálogo navegable, para construir las pantallas con piezas consistentes.</td>
</tr>
</tbody>
</table>

**Criterios de aceptación:**

> 1\. Botón, campo, selector, tabla, tarjeta, modal, aviso, pestañas, navegación y paginación.
> 2\. Cada uno documentado con sus estados normal, foco, deshabilitado, error y carga.

**Historia técnica 17**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HT-022</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Patrones clínicos reutilizables</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E01 Sistema de diseño y experiencia</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>S3 (10 a 23 nov)</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>3 horas</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Alta</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>HT-021</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como desarrollador, necesito patrones clínicos reutilizables sobre los componentes base, para mostrar de la misma forma pacientes, resultados de IA y campos del OCR.</td>
</tr>
</tbody>
</table>

**Criterios de aceptación:**

> 1\. Tarjeta de paciente, resultado de IA con confianza, aviso de apoyo, campo OCR con confianza, visor de imagen y línea de tiempo, cada uno en el catálogo.

**Historia técnica 18**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HT-023</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Accesibilidad WCAG 2.2 AA</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E01 Sistema de diseño y experiencia</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>S5 (8 a 23 dic)</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>2 horas</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Alta</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>HT-021</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como desarrollador, necesito que el sistema de diseño cumpla WCAG 2.2 AA, para que la interfaz sea usable con teclado y con buen contraste.</td>
</tr>
</tbody>
</table>

**Criterios de aceptación:**

> 1\. Pruebas automáticas de accesibilidad en la integración continua sin errores graves.
> 2\. Todo funciona con teclado.
> 3\. Contraste verificado.

**Historia técnica 19**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HT-024</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Diseño de las pantallas clave</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E01 Sistema de diseño y experiencia</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>S2 (27 oct a 9 nov)</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>3 horas</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Alta</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>Ninguna</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como desarrollador, necesito diseñar las pantallas clave antes de construirlas, para evitar rehacer la interfaz.</td>
</tr>
</tbody>
</table>

**Criterios de aceptación:**

> 1\. Flujos del médico, del investigador y del administrador diseñados y revisados contigo antes de implementarlos.

**Historia técnica 20**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HT-025</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Guía de contenido y glosario clínico</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E01 Sistema de diseño y experiencia</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>S3 (10 a 23 nov)</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>1 hora</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Alta</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>Ninguna</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como desarrollador, necesito una guía de contenido en español y un glosario clínico, para que los mensajes de la interfaz sean claros y uniformes.</td>
</tr>
</tbody>
</table>

**Criterios de aceptación:**

> 1\. Glosario de términos, tono de los mensajes y regla de que cada error diga qué hacer.

**Historia técnica 21**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HT-026</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Regla automática de tokens</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E01 Sistema de diseño y experiencia</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>Después</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>1 hora</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Media</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>HT-020</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como desarrollador, necesito una regla automática que impida colores y espaciados sueltos, para que la interfaz use siempre los tokens del sistema de diseño.</td>
</tr>
</tbody>
</table>

**Criterios de aceptación:**

> 1\. La verificación falla si una pantalla usa un valor que no sea un token.

**Historia técnica 22**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HT-027</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Diseño adaptable</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E01 Sistema de diseño y experiencia</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>Después</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>2 horas</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Media</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>Ninguna</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como desarrollador, necesito un diseño adaptable para escritorio, tableta y consulta en móvil, para usar el sistema en distintos dispositivos.</td>
</tr>
</tbody>
</table>

**Criterios de aceptación:**

> 1\. Los flujos principales se usan sin desplazamiento horizontal en tableta.
> 2\. La consulta funciona en móvil.

**Historia técnica 23**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HT-030</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Servicio de auditoría</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E04 Auditoría</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>S2 (27 oct a 9 nov)</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>5 horas</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Alta</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>HT-006</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como desarrollador, necesito un servicio de auditoría de solo escritura, para registrar quién hizo qué y cuándo sin exponer datos clínicos.</td>
</tr>
</tbody>
</table>

**Criterios de aceptación:**

> 1\. Hay un evento por cada acción que cita el anteproyecto.
> 2\. Solo referencias, nunca datos clínicos.
> 3\. No se puede editar ni borrar desde la aplicación.
> 4\. La hora está sincronizada.

**Historia técnica 24**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HT-031</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Integridad de la bitácora</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E04 Auditoría</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>Después</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>2 horas</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Baja</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>HT-030</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como desarrollador, necesito encadenar las huellas de los eventos de la bitácora, para poder detectar si alguno fue alterado.</td>
</tr>
</tbody>
</table>

**Criterios de aceptación:**

> 1\. Una herramienta detecta si se alteró un evento.

**Historia técnica 25**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HT-040</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Servicio de OCR local</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E07 Documentos y OCR</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>S4 (24 nov a 7 dic)</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>5 horas</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Alta</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>HT-002</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como desarrollador, necesito un servicio de OCR local con contrato versionado (Tesseract en español y PyMuPDF), para leer fichas clínicas sin enviar datos a servicios externos.</td>
</tr>
</tbody>
</table>

**Criterios de aceptación:**

> 1\. Recibe un PDF o una imagen y devuelve texto, campos y confianza.
> 2\. No hace llamadas a internet.
> 3\. Funciona en CPU.

**Historia técnica 26**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HT-041</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Extracción de campos por reglas</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E07 Documentos y OCR</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>S4 (24 nov a 7 dic)</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>3 horas</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Alta</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>HT-040, HT-091</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como desarrollador, necesito extraer los campos de la ficha por reglas con normalización de unidades y decimales, para proponer valores con su confianza.</td>
</tr>
</tbody>
</table>

**Criterios de aceptación:**

> 1\. TSH, T3, T4, tamaño del nódulo, lateralidad, TI-RADS y Bethesda con confianza por campo.
> 2\. Coma o punto decimal.
> 3\. Pruebas con las variaciones de las plantillas.

**Historia técnica 27**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HT-042</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Campos adicionales del OCR</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E07 Documentos y OCR</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>Después</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>2 horas</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Media</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>HT-041</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como desarrollador, necesito que el OCR extraiga también la fecha de laboratorio, la histopatología y el CIE-10, para completar más campos de la ficha.</td>
</tr>
</tbody>
</table>

**Criterios de aceptación:**

> 1\. Se extraen con confianza y se muestran en la revisión.

**Historia técnica 28**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HT-043</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Medición de la calidad del OCR</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E07 Documentos y OCR</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>S4 (24 nov a 7 dic)</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>2 horas</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Alta</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>HT-041, HT-093</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como desarrollador, necesito medir la calidad del OCR con fichas de muestra, para saber qué tan confiable es la lectura.</td>
</tr>
</tbody>
</table>

**Criterios de aceptación:**

> 1\. Informe repetible con la exactitud por campo sobre las fichas digitales y las escaneadas.
> 2\. La meta se fija antes de medir.

**Historia técnica 29**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HT-044</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Huella del archivo y duplicados</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E07 Documentos y OCR</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>Después</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>1 hora</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Media</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>HU-050</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como desarrollador, necesito calcular la huella de cada archivo cargado, para avisar cuando una ficha ya fue subida.</td>
</tr>
</tbody>
</table>

**Criterios de aceptación:**

> 1\. Una ficha idéntica ya cargada se avisa al usuario.

**Historia técnica 30**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HT-050</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Limpieza de metadatos de las imágenes</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E08 Imágenes ecográficas</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>S3 (10 a 23 nov)</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>2 horas</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Alta</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>HU-060</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como desarrollador, necesito eliminar los metadatos de las imágenes al guardarlas, para que no queden datos personales en los archivos.</td>
</tr>
</tbody>
</table>

**Criterios de aceptación:**

> 1\. La copia guardada no trae EXIF ni DICOM con datos personales.

**Historia técnica 31**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HT-051</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Detección de texto incrustado en la ecografía</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E08 Imágenes ecográficas</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>S4 (24 nov a 7 dic)</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>3 horas</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Alta</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>HT-040, HT-050</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como desarrollador, necesito detectar y ocultar texto incrustado en la ecografía, como nombres o fechas, para evitar que se filtren datos personales.</td>
</tr>
</tbody>
</table>

**Criterios de aceptación:**

> 1\. Un OCR sobre la imagen marca las zonas con texto sospechoso.
> 2\. Se tapan o se envían a revisión.
> 3\. La zona del nódulo no se altera.

**Historia técnica 32**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HT-061</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Servicio de IA a partir de base.py</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E09 Servicio de IA e inferencia</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>S2 (27 oct a 9 nov)</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>8 horas</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Alta</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>Ninguna</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como desarrollador, necesito convertir base.py en una función que recibe una imagen y devuelve un resultado, sin rutas fijas ni variables globales, para reemplazar el app.py de Streamlit por un servicio reutilizable.</td>
</tr>
</tbody>
</table>

**Criterios de aceptación:**

> 1\. Configuración por variables de entorno.
> 2\. Cada solicitud en su propio espacio.
> 3\. Con imágenes de ejemplo da los mismos resultados que \`app.py\`.
> 4\. Hasta 3 nódulos por imagen.

**Historia técnica 33**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HT-062</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Carga única de modelos y chequeo de salud</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E09 Servicio de IA e inferencia</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>S2 (27 oct a 9 nov)</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>2 horas</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Alta</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>HT-061</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como desarrollador, necesito cargar los modelos una sola vez y registrar su versión, para responder rápido y saber con qué pesos se hizo cada inferencia.</td>
</tr>
</tbody>
</table>

**Criterios de aceptación:**

> 1\. Los modelos se cargan una vez.
> 2\. La salud confirma los tres.
> 3\. La huella de los pesos y los umbrales quedan guardados en cada inferencia.

**Historia técnica 34**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HT-063</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Integración de la API con el servicio de IA</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E09 Servicio de IA e inferencia</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>S3 (10 a 23 nov)</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>5 horas</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Alta</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>HT-061, HT-010, HT-007</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como desarrollador, necesito integrar la API con el servicio de IA, para ejecutar inferencias desde el sistema y guardar sus resultados.</td>
</tr>
</tbody>
</table>

**Criterios de aceptación:**

> 1\. Tiempo máximo y errores manejados.
> 2\. Si el servicio no responde se informa y no se inventa un resultado.
> 3\. Se guardan resultado, XML, máscaras y superposición en el almacenamiento.

**Historia técnica 35**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HT-064</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Resultado normal sin nódulo detectado</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E09 Servicio de IA e inferencia</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>S4 (24 nov a 7 dic)</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>2 horas</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Alta</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>HT-063</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como desarrollador, necesito devolver «normal» cuando no se detecta ningún nódulo, sin clasificar la imagen completa, para evitar resultados engañosos.</td>
</tr>
</tbody>
</table>

**Criterios de aceptación:**

> 1\. Sin detección devuelve «normal (sin nódulo detectado)» con aviso.
> 2\. Con varias detecciones, un resultado por nódulo.

**Historia técnica 36**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HT-065</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Validación de que la imagen sea una ecografía tiroidea</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E09 Servicio de IA e inferencia</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>Después</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>2 horas</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Media</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>HT-063</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como desarrollador, necesito validar que la imagen parezca una ecografía tiroidea antes de inferir, para no gastar una inferencia sobre un archivo equivocado.</td>
</tr>
</tbody>
</table>

**Criterios de aceptación:**

> 1\. Una imagen que no lo parece avisa al médico antes de gastar la inferencia.

**Historia técnica 37**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HT-066</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Explicación visual con Grad-CAM</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E09 Servicio de IA e inferencia</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>Después</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>3 horas</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Baja</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>Ninguna</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como desarrollador, necesito mostrar una explicación visual con Grad-CAM, para ayudar a interpretar la predicción.</td>
</tr>
</tbody>
</table>

**Criterios de aceptación:**

> 1\. Se implementa solo si el equipo del modelo entrega la explicación, porque el modelo actual no la incluye.
> 2\. Si se implementa, la explicación se muestra junto al resultado y no reemplaza el aviso de apoyo.

**Historia técnica 38**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HT-070</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Anonimización de datasets</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E11 Investigación y evaluación</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>S5 (8 a 23 dic)</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>3 horas</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Alta</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>HU-035</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como desarrollador, necesito un proceso de anonimización de datasets, para que los investigadores trabajen sin identificadores.</td>
</tr>
</tbody>
</table>

**Criterios de aceptación:**

> 1\. Quita identificadores directos, desplaza fechas y agrupa edades.
> 2\. Genera la ficha técnica del dataset.
> 3\. Pruebas que verifican que no quedan identificadores.

**Historia técnica 39**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HT-071</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Riesgo de reidentificación con k-anonimato</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E11 Investigación y evaluación</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>Después</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>2 horas</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Media</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>HT-070</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como desarrollador, necesito medir el riesgo de reidentificación con k-anonimato (k = 5), para suprimir combinaciones que identifiquen a pocas personas.</td>
</tr>
</tbody>
</table>

**Criterios de aceptación:**

> 1\. Informa las combinaciones de edad, sexo, institución y fecha que identifican a menos de 5 personas y las suprime.

**Historia técnica 40**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HT-080</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Documentos de cumplimiento</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E12 Seguridad y cumplimiento legal</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>S3 (10 a 23 nov)</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>3 horas</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Alta</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>Ninguna</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como desarrollador, necesito preparar el mapa normativo, el registro de tratamientos, el texto de consentimiento y el aviso de privacidad, para demostrar el cumplimiento de la ley de protección de datos.</td>
</tr>
</tbody>
</table>

**Criterios de aceptación:**

> 1\. Cada obligación legal enlazada con su requisito y su evidencia.
> 2\. Los textos revisados por tu director.

**Historia técnica 41**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HT-081</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Plan de respuesta a incidentes</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E12 Seguridad y cumplimiento legal</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>S5 (8 a 23 dic)</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>1 hora</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Alta</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>Ninguna</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como desarrollador, necesito un plan de respuesta a incidentes y una plantilla de notificación con los plazos legales, para actuar a tiempo ante una brecha.</td>
</tr>
</tbody>
</table>

**Criterios de aceptación:**

> 1\. Pasos para detectar, contener, evaluar y notificar.
> 2\. Plantilla para la autoridad y para los titulares.

**Historia técnica 42**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HT-082</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Defensas de la aplicación</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E12 Seguridad y cumplimiento legal</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>S5 (8 a 23 dic)</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>3 horas</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Alta</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>HT-004</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como desarrollador, necesito defensas contra inyección, XSS, CSRF, SSRF y recorrido de rutas, con límites de peticiones, para proteger la aplicación de los ataques comunes.</td>
</tr>
</tbody>
</table>

**Criterios de aceptación:**

> 1\. Pruebas que intentan cada ataque y fallan.
> 2\. Límite de peticiones y de tamaño en la inferencia.

**Historia técnica 43**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HT-083</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Pruebas de seguridad con informe</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E12 Seguridad y cumplimiento legal</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>Después</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>3 horas</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Media</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>HT-082</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como desarrollador, necesito ejecutar pruebas de seguridad y documentar sus hallazgos, para demostrar que las vulnerabilidades encontradas se corrigieron.</td>
</tr>
</tbody>
</table>

**Criterios de aceptación:**

> 1\. OWASP ZAP, pruebas de permisos por rol y de acceso a objetos de otros.
> 2\. Informe con los hallazgos corregidos.

**Historia técnica 44**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HT-084</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Evaluación de impacto en protección de datos</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E12 Seguridad y cumplimiento legal</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>S5 si hay espacio</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>2 horas</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Media</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>HT-080</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como desarrollador, necesito una evaluación de impacto en protección de datos, para conocer los riesgos y las medidas antes de tratar datos reales.</td>
</tr>
</tbody>
</table>

**Criterios de aceptación:**

> 1\. Documento escrito antes de tratar datos reales, con riesgos y medidas.

**Historia técnica 45**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HT-085</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Retención, borrado y separación de entornos</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E12 Seguridad y cumplimiento legal</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>Después</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>2 horas</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Media</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>Ninguna</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como desarrollador, necesito definir plazos de retención y separar los entornos, para borrar o anonimizar datos al vencer su plazo y no copiar nunca datos reales a desarrollo.</td>
</tr>
</tbody>
</table>

**Criterios de aceptación:**

> 1\. Plazos por tipo de dato.
> 2\. Borrado o anonimización al vencer.
> 3\. Nunca se copian datos reales a desarrollo.

**Historia técnica 46**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HT-086</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Alertas ante patrones raros de uso</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E12 Seguridad y cumplimiento legal</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>Después</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>2 horas</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Baja</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>HT-030</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como desarrollador, necesito alertas ante patrones raros de uso, para detectar accesos o exportaciones sospechosas.</td>
</tr>
</tbody>
</table>

**Criterios de aceptación:**

> 1\. Aviso ante muchos fallos de acceso, descargas masivas o exportaciones fuera de horario.

**Historia técnica 47**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HT-090</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Generador de pacientes y fichas sintéticos</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E13 Datos sintéticos</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>S2 (27 oct a 9 nov)</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>3 horas</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Alta</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>Ninguna</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como desarrollador, necesito un generador reproducible de pacientes y fichas coherentes con la etiqueta de cada imagen, para probar el sistema sin usar datos reales.</td>
</tr>
</tbody>
</table>

**Criterios de aceptación:**

> 1\. La misma semilla da el mismo resultado.
> 2\. Hay casos benignos, malignos y sin nódulo.
> 3\. Ninguna persona real.
> 4\. Las fichas son coherentes con el diagnóstico de referencia.

**Historia técnica 48**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HT-091</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Fichas PDF digitales</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E13 Datos sintéticos</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>S3 (10 a 23 nov)</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>2 horas</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Alta</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>HT-090</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como desarrollador, necesito fichas PDF digitales con tres plantillas y variaciones al escribir los valores, para probar la extracción del OCR.</td>
</tr>
</tbody>
</table>

**Criterios de aceptación:**

> 1\. Tres diseños de ficha.
> 2\. Coma o punto decimal, con o sin unidad.

**Historia técnica 49**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HT-092</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Fichas escaneadas</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E13 Datos sintéticos</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>S3 (10 a 23 nov)</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>1 hora</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Alta</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>HT-091</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como desarrollador, necesito versiones escaneadas de las fichas con ruido e inclinación, para probar el OCR en condiciones más difíciles.</td>
</tr>
</tbody>
</table>

**Criterios de aceptación:**

> 1\. Cada ficha tiene su versión escaneada reproducible.

**Historia técnica 50**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HT-093</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Conjunto de referencia del OCR</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E13 Datos sintéticos</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>S3 (10 a 23 nov)</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>1 hora</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Alta</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>HT-091</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como desarrollador, necesito un conjunto de referencia con el valor correcto de cada campo, para medir la exactitud del OCR.</td>
</tr>
</tbody>
</table>

**Criterios de aceptación:**

> 1\. Un archivo con el valor correcto de cada campo, usado para medir el OCR.

**Historia técnica 51**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HT-094</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Revisión de las imágenes anonimizadas</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E13 Datos sintéticos</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>S1 (13 a 26 oct)</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>1 hora</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Alta</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>Ninguna</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como desarrollador, necesito revisar una muestra de las imágenes anonimizadas y registrar su origen y permiso de uso, para asegurar que no traen datos personales grabados.</td>
</tr>
</tbody>
</table>

**Criterios de aceptación:**

> 1\. Muestra revisada sin texto ni datos personales grabados.
> 2\. Origen y permiso de uso documentados en docs.

**Historia técnica 52**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HT-100</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Matriz de pruebas y registro de errores</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E14 Calidad, usabilidad y entrega</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>S2 (27 oct a 9 nov)</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>1 hora</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Alta</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>Ninguna</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como desarrollador, necesito la estructura de la matriz de pruebas y del registro de errores, para tener evidencia de cada requisito obligatorio.</td>
</tr>
</tbody>
</table>

**Criterios de aceptación:**

> 1\. Una fila por requisito M con caso de prueba, resultado, evidencia y error asociado.

**Historia técnica 53**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HT-101</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Pruebas de integración</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E14 Calidad, usabilidad y entrega</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>S5 (8 a 23 dic)</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>3 horas</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Alta</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>HT-063, HT-040, HT-007</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como desarrollador, necesito pruebas de integración entre API y modelo, API y OCR, y API y almacenamiento, para detectar fallos entre servicios.</td>
</tr>
</tbody>
</table>

**Criterios de aceptación:**

> 1\. Corren en la integración continua con servicios reales o contenedores de prueba.
> 2\. Sus resultados entran a la matriz.

**Historia técnica 54**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HT-102</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Ejecución de la matriz de pruebas</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E14 Calidad, usabilidad y entrega</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>S5 (8 a 23 dic)</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>3 horas</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Alta</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>HT-100</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como desarrollador, necesito ejecutar la matriz de pruebas completa y corregir los errores, para dejar evidencia de que lo obligatorio funciona.</td>
</tr>
</tbody>
</table>

**Criterios de aceptación:**

> 1\. Todas las pruebas M ejecutadas.
> 2\. Evidencias guardadas.
> 3\. Errores críticos corregidos.

**Historia técnica 55**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HT-103</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Prueba de extremo a extremo</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E14 Calidad, usabilidad y entrega</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>S5 (8 a 23 dic)</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>3 horas</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Alta</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>Ninguna</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como desarrollador, necesito una prueba de extremo a extremo del flujo del médico y del investigador, para comprobar que el recorrido completo funciona.</td>
</tr>
</tbody>
</table>

**Criterios de aceptación:**

> 1\. Automatizada con Playwright y corre en la integración continua.

**Historia técnica 56**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HT-104</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Medición de rendimiento en la laptop de la demostración</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E14 Calidad, usabilidad y entrega</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>Después</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>2 horas</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Media</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>Ninguna</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como desarrollador, necesito medir los tiempos de consulta, OCR e inferencia en la laptop de la demostración, para compararlos con las metas.</td>
</tr>
</tbody>
</table>

**Criterios de aceptación:**

> 1\. Tiempos de consulta, OCR e inferencia medidos y comparados con las metas.

**Historia técnica 57**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HT-105</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Matriz de trazabilidad</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E14 Calidad, usabilidad y entrega</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>S5 (8 a 23 dic)</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>1 hora</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Alta</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>Ninguna</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como desarrollador, necesito mantener actualizada la matriz de trazabilidad (compromiso, requisito, historia y prueba), para que el tribunal vea la evidencia de cada compromiso.</td>
</tr>
</tbody>
</table>

**Criterios de aceptación:**

> 1\. Cada compromiso aprobado enlaza a historias con pruebas aprobadas.

**Historia técnica 58**

<table>
<colgroup>
<col style="width: 27%" />
<col style="width: 72%" />
</colgroup>
<thead>
<tr>
<th><strong>Identificación</strong></th>
<th>HT-106</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Título</strong></td>
<td>Evidencias para los capítulos de resultados</td>
</tr>
<tr>
<td><strong>Épica</strong></td>
<td>E14 Calidad, usabilidad y entrega</td>
</tr>
<tr>
<td><strong>Tramo</strong></td>
<td>Después</td>
</tr>
<tr>
<td><strong>Estimación</strong></td>
<td>2 horas</td>
</tr>
<tr>
<td><strong>Prioridad</strong></td>
<td>Media</td>
</tr>
<tr>
<td><strong>Dependencias</strong></td>
<td>Ninguna</td>
</tr>
<tr>
<td colspan="2" style="text-align: center;"><strong>Descripción</strong></td>
</tr>
<tr>
<td colspan="2" style="text-align: left;">Como desarrollador, necesito guardar capturas, datos y tablas citables, para escribir los capítulos de resultados.</td>
</tr>
</tbody>
</table>

**Criterios de aceptación:**

> 1\. Capturas, datos y tablas guardados y citables.

**Pila del producto**

| **ID** | **Título** | **Tipo** | **Estimación** | **Prioridad** | **Dependencias** | **Tramo** |
|----|----|----|----|----|----|----|
| HT-001 | Repositorio y estructura del proyecto | Técnica | 2 horas | Alta | Ninguna | S1 |
| HT-002 | Entorno local con un solo comando | Técnica | 5 horas | Alta | HT-001 | S1 |
| HT-003 | Integración continua | Técnica | 3 horas | Alta | HT-001 | S1 |
| HT-004 | Esqueleto del backend | Técnica | 3 horas | Alta | HT-001 | S1 |
| HT-005 | Esqueleto del frontend | Técnica | 3 horas | Alta | HT-001 | S1 |
| HT-008 | Tablero Kanban en GitHub Projects | Técnica | 1 hora | Alta | HT-001 | S1 |
| HT-020 | Principios de diseño y tokens | Técnica | 3 horas | Alta | Ninguna | S1 |
| HT-094 | Revisión de las imágenes anonimizadas | Técnica | 1 hora | Alta | Ninguna | S1 |
| HT-006 | Modelo de datos v1 | Técnica | 5 horas | Alta | HT-004 | S2 |
| HT-007 | Almacenamiento de archivos compatible con S3 | Técnica | 3 horas | Alta | HT-002 | S2 |
| HT-011 | Cifrado en reposo y gestión de claves | Técnica | 2 horas | Alta | HT-006 | S2 |
| HT-021 | Biblioteca de componentes base | Técnica | 5 horas | Alta | HT-020 | S2 |
| HT-024 | Diseño de las pantallas clave | Técnica | 3 horas | Alta | Ninguna | S2 |
| HT-030 | Servicio de auditoría | Técnica | 5 horas | Alta | HT-006 | S2 |
| HT-061 | Servicio de IA a partir de base.py | Técnica | 8 horas | Alta | Ninguna | S2 |
| HT-062 | Carga única de modelos y chequeo de salud | Técnica | 2 horas | Alta | HT-061 | S2 |
| HT-090 | Generador de pacientes y fichas sintéticos | Técnica | 3 horas | Alta | Ninguna | S2 |
| HT-100 | Matriz de pruebas y registro de errores | Técnica | 1 hora | Alta | Ninguna | S2 |
| HU-001 | Inicio de sesión | Usuario | 3 horas | Alta | HT-005, HT-006 | S2 |
| HU-002 | Cierre de sesión | Usuario | 1 hora | Alta | HU-001 | S2 |
| HU-010 | Gestión de usuarios | Usuario | 3 horas | Alta | HU-001 | S2 |
| HU-011 | Gestión de roles y permisos | Usuario | 3 horas | Alta | HU-010 | S2 |
| HU-012 | Varios roles por usuario | Usuario | 1 hora | Alta | HU-011 | S2 |
| HT-010 | Trabajos en segundo plano | Técnica | 2 horas | Alta | HT-004 | S3 |
| HT-012 | Proxy inverso con TLS | Técnica | 2 horas | Alta | HT-002 | S3 |
| HT-022 | Patrones clínicos reutilizables | Técnica | 3 horas | Alta | HT-021 | S3 |
| HT-025 | Guía de contenido y glosario clínico | Técnica | 1 hora | Alta | Ninguna | S3 |
| HT-063 | Integración de la API con el servicio de IA | Técnica | 5 horas | Alta | HT-061, HT-010, HT-007 | S3 |
| HT-080 | Documentos de cumplimiento | Técnica | 3 horas | Alta | Ninguna | S3 |
| HT-091 | Fichas PDF digitales | Técnica | 2 horas | Alta | HT-090 | S3 |
| HT-092 | Fichas escaneadas | Técnica | 1 hora | Alta | HT-091 | S3 |
| HT-093 | Conjunto de referencia del OCR | Técnica | 1 hora | Alta | HT-091 | S3 |
| HU-003 | Elección del rol activo | Usuario | 2 horas | Alta | HU-001, HU-012 | S3 |
| HU-013 | Permisos por operación y denegaciones | Usuario | 3 horas | Alta | HU-011 | S3 |
| HU-030 | Registro de paciente | Usuario | 3 horas | Alta | HT-011, HU-013 | S3 |
| HU-031 | Búsqueda de pacientes | Usuario | 2 horas | Alta | HU-030 | S3 |
| HU-033 | Apertura de casos | Usuario | 2 horas | Alta | HU-030 | S3 |
| HU-034 | Consentimiento del paciente | Usuario | 3 horas | Alta | HU-030, HT-080 | S3 |
| HU-035 | Bloqueo sin consentimiento vigente | Usuario | 1 hora | Alta | HU-034 | S3 |
| HU-040 | Ficha clínica por secciones | Usuario | 5 horas | Alta | HU-033 | S3 |
| HU-041 | Validación de la ficha | Usuario | 2 horas | Alta | HU-040 | S3 |
| HU-060 | Carga de ecografías | Usuario | 3 horas | Alta | HT-007, HU-033 | S3 |
| HT-050 | Limpieza de metadatos de las imágenes | Técnica | 2 horas | Alta | HU-060 | S3 |
| HT-040 | Servicio de OCR local | Técnica | 5 horas | Alta | HT-002 | S4 |
| HT-041 | Extracción de campos por reglas | Técnica | 3 horas | Alta | HT-040, HT-091 | S4 |
| HT-043 | Medición de la calidad del OCR | Técnica | 2 horas | Alta | HT-041, HT-093 | S4 |
| HT-051 | Detección de texto incrustado en la ecografía | Técnica | 3 horas | Alta | HT-040, HT-050 | S4 |
| HT-064 | Resultado normal sin nódulo detectado | Técnica | 2 horas | Alta | HT-063 | S4 |
| HU-004 | Bloqueo por intentos fallidos | Usuario | 1 hora | Alta | HU-001 | S4 |
| HU-005 | Expiración de sesión por inactividad | Usuario | 1 hora | Alta | HU-001 | S4 |
| HU-020 | Consulta de la bitácora | Usuario | 3 horas | Alta | HT-030 | S4 |
| HU-050 | Carga de fichas clínicas | Usuario | 3 horas | Alta | HT-007, HU-033 | S4 |
| HU-051 | Estado del OCR | Usuario | 1 hora | Alta | HT-010, HU-050 | S4 |
| HU-052 | Revisión lado a lado del OCR | Usuario | 5 horas | Alta | HT-041, HT-022, HU-040 | S4 |
| HU-053 | Visualización y descarga de documentos | Usuario | 1 hora | Alta | HU-050 | S4 |
| HU-070 | Ejecución de la inferencia | Usuario | 3 horas | Alta | HT-063, HU-035, HU-060 | S4 |
| HU-071 | Resultado por nódulo | Usuario | 5 horas | Alta | HU-070, HT-022 | S4 |
| HU-072 | Historial de inferencias | Usuario | 1 hora | Alta | HU-070 | S4 |
| HU-080 | Reporte PDF de una inferencia | Usuario | 5 horas | Alta | HU-071 | S4 |
| HU-081 | Consulta de resultados guardados | Usuario | 2 horas | Alta | HU-072 | S4 |
| HU-082 | Descarga registrada del reporte | Usuario | 1 hora | Alta | HU-080 | S4 |
| HT-013 | Respaldo y restauración | Técnica | 3 horas | Alta | HT-007 | S5 |
| HT-023 | Accesibilidad WCAG 2.2 AA | Técnica | 2 horas | Alta | HT-021 | S5 |
| HT-070 | Anonimización de datasets | Técnica | 3 horas | Alta | HU-035 | S5 |
| HT-081 | Plan de respuesta a incidentes | Técnica | 1 hora | Alta | Ninguna | S5 |
| HT-082 | Defensas de la aplicación | Técnica | 3 horas | Alta | HT-004 | S5 |
| HT-101 | Pruebas de integración | Técnica | 3 horas | Alta | HT-063, HT-040, HT-007 | S5 |
| HT-102 | Ejecución de la matriz de pruebas | Técnica | 3 horas | Alta | HT-100 | S5 |
| HT-103 | Prueba de extremo a extremo | Técnica | 3 horas | Alta | Ninguna | S5 |
| HT-105 | Matriz de trazabilidad | Técnica | 1 hora | Alta | Ninguna | S5 |
| HU-021 | Estados de carga, vacío y error | Usuario | 2 horas | Alta | HT-021 | S5 |
| HU-032 | Corrección de datos del paciente | Usuario | 2 horas | Alta | HU-030 | S5 |
| HU-042 | Historial de cambios de la ficha | Usuario | 2 horas | Alta | HU-040 | S5 |
| HU-090 | Consulta de datasets anonimizados | Usuario | 3 horas | Alta | HT-070 | S5 |
| HU-091 | Métricas del modelo | Usuario | 3 horas | Alta | HU-090, HU-072 | S5 |
| HU-092 | Comparación de resultados | Usuario | 2 horas | Alta | HU-091 | S5 |
| HU-093 | Auditoría de predicciones | Usuario | 2 horas | Alta | HU-091 | S5 |
| HU-094 | Análisis de errores | Usuario | 2 horas | Alta | HU-091 | S5 |
| HU-095 | Exportación anonimizada | Usuario | 2 horas | Alta | HU-091, HT-070 | S5 |
| HU-110 | Medición de usabilidad con el UnUQ | Usuario | 8 horas | Alta | Ninguna | S5 |
| HT-084 | Evaluación de impacto en protección de datos | Técnica | 2 horas | Media | HT-080 | S5 si hay espacio |
| HU-073 | Conclusión del médico | Usuario | 2 horas | Media | HU-071 | S5 si hay espacio |
| HU-100 | Solicitudes de derechos de titulares | Usuario | 1 hora | Media | HU-020 | S5 si hay espacio |
| HT-009 | Contrato OpenAPI versionado | Técnica | 2 horas | Media | HT-004 | Después |
| HT-014 | Documentación de arquitectura | Técnica | 2 horas | Media | Ninguna | Después |
| HT-026 | Regla automática de tokens | Técnica | 1 hora | Media | HT-020 | Después |
| HT-027 | Diseño adaptable | Técnica | 2 horas | Media | Ninguna | Después |
| HT-031 | Integridad de la bitácora | Técnica | 2 horas | Baja | HT-030 | Después |
| HT-042 | Campos adicionales del OCR | Técnica | 2 horas | Media | HT-041 | Después |
| HT-044 | Huella del archivo y duplicados | Técnica | 1 hora | Media | HU-050 | Después |
| HT-065 | Validación de que la imagen sea una ecografía tiroidea | Técnica | 2 horas | Media | HT-063 | Después |
| HT-066 | Explicación visual con Grad-CAM | Técnica | 3 horas | Baja | Ninguna | Después |
| HT-071 | Riesgo de reidentificación con k-anonimato | Técnica | 2 horas | Media | HT-070 | Después |
| HT-083 | Pruebas de seguridad con informe | Técnica | 3 horas | Media | HT-082 | Después |
| HT-085 | Retención, borrado y separación de entornos | Técnica | 2 horas | Media | Ninguna | Después |
| HT-086 | Alertas ante patrones raros de uso | Técnica | 2 horas | Baja | HT-030 | Después |
| HT-104 | Medición de rendimiento en la laptop de la demostración | Técnica | 2 horas | Media | Ninguna | Después |
| HT-106 | Evidencias para los capítulos de resultados | Técnica | 2 horas | Media | Ninguna | Después |
| HU-006 | Cambio de contraseña y perfil | Usuario | 2 horas | Media | HU-001 | Después |
| HU-007 | Segundo factor de autenticación | Usuario | 3 horas | Media | HU-001 | Después |
| HU-008 | Restablecimiento de contraseña | Usuario | 1 hora | Baja | HU-010 | Después |
| HU-014 | Gestión de instituciones | Usuario | 1 hora | Media | HU-010 | Después |
| HU-015 | Tablero del administrador | Usuario | 2 horas | Baja | HU-020 | Después |
| HU-016 | Ajustes no sensibles del sistema | Usuario | 1 hora | Baja | Ninguna | Después |
| HU-022 | Exportación de la bitácora | Usuario | 1 hora | Media | HU-020 | Después |
| HU-036 | Pacientes por institución | Usuario | 2 horas | Media | HU-014 | Después |
| HU-037 | Archivado de pacientes | Usuario | 2 horas | Media | HU-030 | Después |
| HU-038 | Aviso de posible duplicado | Usuario | 1 hora | Media | HU-030 | Después |
| HU-039 | Exportación de datos del paciente | Usuario | 2 horas | Media | HU-033 | Después |
| HU-043 | Cronología del caso | Usuario | 2 horas | Media | HU-040 | Después |
| HU-044 | Cierre de ficha | Usuario | 1 hora | Baja | HU-040 | Después |
| HU-054 | Reintento del OCR | Usuario | 1 hora | Media | HU-051 | Después |
| HU-055 | Aviso de baja calidad del escaneo | Usuario | 1 hora | Baja | HU-050 | Después |
| HU-061 | Visor de imágenes | Usuario | 2 horas | Media | HT-022 | Después |
| HU-062 | Varias imágenes por caso | Usuario | 1 hora | Media | HU-060 | Después |
| HU-074 | Explicación y límites del modelo | Usuario | 1 hora | Media | HU-071 | Después |
| HU-083 | Reporte consolidado del caso | Usuario | 2 horas | Baja | HU-080 | Después |
| HU-096 | Cohortes de investigación | Usuario | 3 horas | Media | HU-091 | Después |
| HU-097 | Curva ROC y distribución de probabilidades | Usuario | 2 horas | Media | HU-091 | Después |

Total: 119 elementos y 283 horas. Prioridad Alta: 214 horas; Media: 54 horas; Baja: 15 horas.

**Planificación por tramos**

| **Tramo** | **Fechas** | **Elementos** | **Horas** |
|----|----|----|----|
| Tramo 1 | 13 a 26 oct | HT-001, HT-002, HT-003, HT-004, HT-005, HT-008, HT-020, HT-094 | 21 |
| Tramo 2 | 27 oct a 9 nov | HT-006, HT-007, HT-011, HT-021, HT-024, HT-030, HT-061, HT-062, HT-090, HT-100, HU-001, HU-002, HU-010, HU-011, HU-012 | 48 |
| Tramo 3 | 10 a 23 nov | HT-010, HT-012, HT-022, HT-025, HT-063, HT-080, HT-091, HT-092, HT-093, HU-003, HU-013, HU-030, HU-031, HU-033, HU-034, HU-035, HU-040, HU-041, HU-060, HT-050 | 48 |
| Tramo 4 | 24 nov a 7 dic | HT-040, HT-041, HT-043, HT-051, HT-064, HU-004, HU-005, HU-020, HU-050, HU-051, HU-052, HU-053, HU-070, HU-071, HU-072, HU-080, HU-081, HU-082 | 47 |
| Tramo 5 | 8 a 23 dic | HT-013, HT-023, HT-070, HT-081, HT-082, HT-101, HT-102, HT-103, HT-105, HU-021, HU-032, HU-042, HU-090, HU-091, HU-092, HU-093, HU-094, HU-095, HU-110 | 50 |
| S5 si hay espacio | 8 a 23 dic | HT-084, HU-073, HU-100 | 5 |
| Después | fuera del plazo | HT-009, HT-014, HT-026, HT-027, HT-031, HT-042, HT-044, HT-065, HT-066, HT-071, HT-083, HT-085, HT-086, HT-104, HT-106, HU-006, HU-007, HU-008, HU-014, HU-015, HU-016, HU-022, HU-036, HU-037, HU-038, HU-039, HU-043, HU-044, HU-054, HU-055, HU-061, HU-062, HU-074, HU-083, HU-096, HU-097 | 64 |

La capacidad estimada es de 446 horas (dos personas, unas 30 horas por semana cada una y un factor de foco del 80 %), repartidas en 48 horas para S1, 96 para cada uno de S2 a S4 y 110 para S5. Los tramos S1 a S5 reúnen solo los elementos de prioridad Alta (214 horas, el 48 % de la capacidad); el resto sirve de colchón para integración con modelos, OCR con fichas reales y depuración. Si el tiempo no alcanza, se recorta de abajo hacia arriba: primero los de prioridad Baja y luego los de Media.
