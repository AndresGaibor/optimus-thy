# ADR-016 — Despliegue de producción en tiroides2

**Estado:** Aceptada.  
**Fecha:** 2026-11-09.

## Contexto

El dominio `tiroides2.andresgaibor.com` debe servirse desde el repositorio operativo, con el borde alcanzando la API en el host.

## Decisión

El dominio `tiroides2.andresgaibor.com` se sirve desde el repo `optimus-thy-operativo`: build estático `frontend/dist` montado en `/srv` del contenedor `optimus-thy-edge`, API en `127.0.0.1:8000` publicada por el compose (contenedor `optimus-thy-backend-1`), PostgreSQL y MinIO en la red `optimus-thy-net`, y Storybook en `127.0.0.1:6104` bajo `/storybook/` con Cloudflare Access y Sablier.

## Consecuencias

- Los units systemd, el runbook y el mount del edge deben apuntar al path del repo operativo.
- El corte exige reconstruir frontend, recrear el edge y verificar `/`, `/login`, un asset, `/api/auth/me` y `/storybook/`.
- El backend no puede quedar solo dentro de la red del compose: el edge lo alcanza por `127.0.0.1:8000`.
- Al preparar el corte se observó `502` en `/api/auth/me` porque nada escuchaba en 8000; la verificación post-corte queda pendiente de ejecución.