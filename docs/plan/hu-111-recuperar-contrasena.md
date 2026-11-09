# HU-111 — Recuperar contraseña

| Campo | Valor |
| --- | --- |
| Épica | E02 Acceso y sesión |
| Tramo | Después |
| Prioridad | Media |
| Estado | Diseño en catálogo; sin lógica ni endpoints |
| Agregada | 2026-11-09 |
| Superficie | `PasswordRecoveryPage` — `Aplicación/Pública/Recuperar contraseña` |
| Relacionadas | HU-006 (cambio de contraseña), HU-008 (restablecimiento por administrador) |

## Historia

Como usuario que olvidó su contraseña, quiero solicitar un enlace de recuperación a mi correo, para volver a entrar sin depender de un administrador.

## Criterios de aceptación

1. Dado que indico un correo, cuando envío la solicitud, entonces el sistema responde siempre con el mismo mensaje, exista o no la cuenta.
2. Dado que el correo está registrado, cuando llega el enlace, entonces caduca a los 30 minutos y solo sirve una vez.
3. Dado que el enlace caducó o ya se usó, cuando lo abro, entonces veo el estado «Enlace caducado o ya usado» y puedo solicitar otro.
4. Dado que defino la contraseña nueva, cuando guardo, entonces se exige la política vigente (12 caracteres como mínimo y sin contraseñas filtradas) y la sesión anterior deja de valer.

## Alcance de esta entrega

La pantalla existe en el catálogo de Storybook con seis estados (solicitud, solicitud enviada, error al enviar, enlace caducado, contraseña nueva, contraseña actualizada) y **sin lógica**: no hay endpoints, correo saliente ni ruta en `AppRoutes.tsx`.

## Dependencias para implementarla

- Servicio de correo saliente y plantilla del enlace con token de un solo uso.
- Endpoints de solicitud y de consumo del token, con límite de intentos.
- Registro en la bitácora de solicitudes y consumos.

## Por qué no es HU-008

HU-008 la ejecuta un administrador y no depende de correo externo. Esta historia es de autorrecuperación y sí lo requiere.
