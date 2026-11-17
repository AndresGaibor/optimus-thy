# Spec Delta

## Purpose

Presentar la administración de usuarios como una tabla de producción: una identidad por fila, roles legibles como información, estado de solo lectura y acciones explícitas.

## ADDED Requirements

### Requirement: Identidad unificada

La tabla SHALL mostrar nombre y correo en una sola columna «Usuario», con el nombre como línea principal y el correo como línea secundaria.

#### Scenario: Fila con nombre y correo

- **WHEN** el listado devuelve un usuario con nombre
- **THEN** la primera línea de la celda muestra el nombre en semibold y la segunda el correo en color secundario
- **AND** no existen columnas separadas de correo y nombre

#### Scenario: Usuario sin nombre

- **WHEN** el usuario no tiene nombre registrado
- **THEN** la celda muestra «Sin nombre» y conserva el correo

#### Scenario: Datos largos

- **WHEN** el nombre o el correo exceden el ancho de la columna
- **THEN** el texto se recorta con puntos suspensivos y el valor completo queda disponible como título
- **AND** la fila no provoca desbordamiento horizontal de la página

### Requirement: Roles como texto

La columna «Roles» SHALL mostrar las etiquetas separadas por « · » en texto, sin insignias por rol.

#### Scenario: Varios roles

- **WHEN** un usuario tiene más de un rol
- **THEN** la celda muestra «Administrador · Médico · Investigador» en la misma celda
- **AND** los roles pueden ocupar más de una línea

### Requirement: Estado de solo lectura

La columna «Estado» SHALL mostrar «Activo» o «Inactivo» como indicador textual, sin control que cambie el estado desde la celda.

#### Scenario: Cambio de estado

- **WHEN** el administrador quiere cambiar el estado de una cuenta
- **THEN** la operación vive en el menú de acciones de la fila
- **AND** desactivar pide confirmación y activar no la pide
- **AND** la fila refleja el estado devuelto por el servidor

### Requirement: Acciones de fila

«Editar» y «Gestionar roles» SHALL estar visibles en cada fila; el menú de tres puntos SHALL contener únicamente Activar o Desactivar.

#### Scenario: Uso con teclado

- **WHEN** el foco está en el disparador del menú y se pulsa Enter
- **THEN** el menú se abre con el foco en su primer elemento
- **AND** Escape lo cierra y devuelve el foco al disparador

### Requirement: Paginación informativa

La paginación SHALL indicar el recuento visible sobre el total filtrado y SHALL ocultar los controles cuando solo hay una página.

#### Scenario: Una sola página

- **WHEN** el total filtrado cabe en una página
- **THEN** se muestra «Mostrando N de N usuarios» y no aparecen botones de navegación

#### Scenario: Varias páginas

- **WHEN** el total filtrado supera el tamaño de página
- **THEN** se muestra «Mostrando A–B de N usuarios» con Anterior y Siguiente
