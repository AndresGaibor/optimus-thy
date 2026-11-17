# Spec Delta

## Purpose

Ofrecer una barra lateral autenticada con un único contexto de trabajo visible y un control de perfil compacto y accesible.

## ADDED Requirements

### Requirement: Contexto activo único

La barra lateral SHALL mostrar el área de trabajo activa en un solo lugar y SHALL ofrecer el cambio de área desde un control de perfil compacto.

#### Scenario: Barra lateral con varias áreas disponibles

- **WHEN** una cuenta con más de un rol abre la aplicación
- **THEN** el pie de la barra muestra una fila con nombre, iniciales y rol activo
- **AND** el rol no aparece repetido bajo la marca ni en otra etiqueta de la barra

#### Scenario: Cambio de área

- **WHEN** el usuario abre el control de perfil y elige otra área
- **THEN** la aplicación llama a `POST /auth/rol-activo` y navega al inicio del área elegida
- **AND** el panel se cierra y el control muestra el área nueva

### Requirement: Control de perfil accesible

El control de perfil SHALL comportarse como un disclosure accesible: expandido anunciado, cierre con Escape con retorno de foco, opción activa marcada y acciones con nombre comprensible.

#### Scenario: Abrir y cerrar el panel con teclado

- **WHEN** el usuario enfoca el control y pulsa Enter o Espacio
- **THEN** el panel se abre y `aria-expanded` pasa a `true`
- **AND** al pulsar Escape el panel se cierra y el foco vuelve al control

#### Scenario: Área activa en el panel

- **WHEN** el panel está abierto
- **THEN** la opción del área activa está marcada con `aria-pressed="true"`
- **AND** las demás áreas siguen disponibles y visibles

#### Scenario: Cerrar sesión

- **WHEN** el usuario elige «Cerrar sesión» en el panel
- **THEN** la sesión termina por el flujo existente y se navega al inicio de sesión

### Requirement: Densidad y navegación

Los ítems de navegación SHALL medir al menos 44 px de alto, usar iconos de 20 px y texto de 14 px con separación de 4 px, y SHALL exponer el estado activo también a tecnologías de asistencia.

#### Scenario: Elemento activo

- **WHEN** el usuario está en una ruta del menú
- **THEN** el enlace activo tiene `aria-current="page"` y un indicador visual por token
- **AND** los demás enlaces no lo tienen

### Requirement: La interfaz no concede permisos

El cambio de área SHALL limitarse a fijar el rol activo en el servidor; ninguna selección de la interfaz SHALL habilitar acciones por sí sola.

#### Scenario: Intento de acción sin permiso

- **WHEN** el rol activo no tiene el permiso de la ruta solicitada
- **THEN** la API responde 403 y registra el evento de acceso denegado
- **AND** la interfaz muestra el error sin habilitar la acción
