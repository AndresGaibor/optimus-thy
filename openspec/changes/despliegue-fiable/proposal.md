## Por qué

El despliegue automático de producción (`.deploy` y `scripts/desplegar.sh`) no entregaba los cambios: el 25-11 el merge de `main` quedó en el directorio de despliegue sin publicar y el sitio siguió sirviendo un bundle de cuatro días atrás. El script deducía «ya desplegado» de `HEAD` y de la existencia de `frontend/dist/index.html`, dos señales que no dicen qué versión corre en el servidor, y nunca reconstruía el servicio `frontend` porque el contenedor se construye desde su imagen y no desde `dist`.

## Qué cambia

- El estado del despliegue es el commit que terminó bien (`= .deploy/desplegado`), no el checkout: un merge hecho a mano deja de saltarse el despliegue.
- Qué reconstruir se mide contra ese commit anterior, no contra `HEAD`; sin estado previo se reconstruye todo.
- Cambios en `frontend/` reconstruyen y recrean el servicio `frontend`; cambios en `backend/`, `ia/` o el compose, el `backend` con sus migraciones.
- El despliegue solo se marca terminado cuando el bundle que sirve el sitio es el que tiene la imagen recién construida.

## Impacto

- Contrato de API: sin cambios.
- Esquema: sin cambios.
- Operación: `.deploy/` se ignora en git; el timer sigue siendo el disparador y el merge en `main` la autorización.
