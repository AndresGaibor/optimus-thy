# Proposal

## Why

La auditoría UX/UI del 2026-11-17 encontró tres problemas altos en la barra lateral: los tres roles se ofrecen como botones grandes que compiten con la navegación principal, el rol se repite tres veces (bajo la marca, en la insignia y en la opción seleccionada) y el elemento activo se confunde con un botón deshabilitado. El cambio de contexto no explica qué hace ni mantiene el foco en la tarea.

## What Changes

- El pie de la barra lateral pasa a un **control de perfil compacto** (avatar con iniciales, nombre, rol activo y chevron) que abre un panel con «Cambiar área de trabajo» y «Cerrar sesión».
- Desaparecen los botones grandes de rol y el botón de cierre a ancho completo.
- La marca deja de mostrar el rol; el rol aparece una sola vez, en el control de perfil.
- Los ítems de navegación suben a una altura mínima de 44 px y conservan `aria-current="page"` del enrutador.
- El cambio de área sigue llamando al endpoint existente `POST /auth/rol-activo`; la interfaz no otorga permisos.

## Capabilities

### New Capabilities

- `marco-de-aplicacion`: barra lateral autenticada con un contexto activo explícito y control de perfil accesible.

### Modified Capabilities

Ninguna.

## Impact

- `frontend/src/design-system/components/molecules/ProfileMenu.tsx` (nuevo) con su historia y pruebas.
- `frontend/src/layout/AppShell.tsx`, `frontend/src/design-system/components/organisms/SidebarLayout.tsx`.
- Historias de flujos (`AppFlows.stories.tsx`) que hoy buscan el grupo «Cambiar de rol».
- Sin cambios de API ni de base de datos: reutiliza `/auth/rol-activo` y la auditoría existente.

## Fuera de alcance

- Barra lateral contraíble en escritorio (P2 de la auditoría).
- Pruebas de usabilidad y auditoría completa de contraste no textual (P2).
