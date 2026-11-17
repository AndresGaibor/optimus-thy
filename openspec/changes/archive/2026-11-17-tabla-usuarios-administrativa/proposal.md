# Proposal

## Why

La primera iteración de la pantalla de Usuarios mejoró los filtros y sacó el estado del control directo, pero mantenía seis columnas con correo y nombre separados, roles como insignias de tres colores y «Gestionar roles» escondido en el menú de tres puntos. Recorrer una fila obligaba a saltar entre columnas para identificar a la persona y a abrir un menú para una acción frecuente.

## What Changes

- Correo y nombre se unifican en una columna **Usuario**: nombre en semibold y correo debajo en color secundario.
- La tabla pasa a cinco columnas: Usuario, Institución, Roles, Estado y Acciones.
- Los roles se muestran como texto compacto separado por « · », sin insignias.
- El estado queda como indicador de solo lectura (`StatusBadge`), sin control editable en la celda.
- «Editar» y «Gestionar roles» quedan visibles en la fila; el menú de tres puntos conserva solo Activar/Desactivar.
- La barra de filtros se mantiene sin contenedor, con anchos de 320/240/160 px y «Limpiar filtros» condicional.
- La paginación muestra «Mostrando N de N usuarios» cuando hay una sola página.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `gestion-de-usuarios`: identificación unificada del usuario, roles como texto, estado de solo lectura y acciones de fila explícitas.

## Impact

- `frontend/src/pages/admin/UsuariosTabla.tsx`, `UsuariosFiltros.tsx`, `UsuariosEncabezadoOrdenable.tsx`.
- `frontend/src/design-system/components/molecules/Pagination.tsx` y su historia de patrón.
- `frontend/src/test/usuarios-admin.test.tsx`, `frontend/src/test/pagination.test.tsx`.
- Sin cambios de API ni de base de datos.

## Fuera de alcance

- Filtro por rol.
- Versión móvil específica: la pantalla está pensada para escritorio, aunque mantiene los datos esenciales en pantallas estrechas.
