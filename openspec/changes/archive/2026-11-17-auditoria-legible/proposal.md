## Why

La bitácora muestra códigos técnicos (`AUTH.SESSION_START`) como información principal, parte las fechas en varias líneas por falta de ancho, presenta los detalles como `role_code=admin` y registra `172.28.0.1` en todos los eventos: la IP del proxy, no la del cliente. Sin eso, la pantalla sirve para mirar registros, no para investigar.

## What Changes

- Fecha y hora en una sola línea, formato de 24 horas y zona horaria UTC explícita en la cabecera y junto a los filtros; los filtros del backend también son UTC.
- Cada evento muestra una descripción legible y conserva el código original debajo; un código desconocido se muestra tal cual.
- Detalle técnico plegable por fila: código, módulo, recurso con identificador completo, origen y todos los metadatos.
- Filtro «Evento» con el catálogo de acciones conocidas en lugar de un campo con placeholder ambiguo; «Limpiar filtros» cuando hay alguno activo; validación de que la fecha inicial no supere la final.
- Filas compactas (56–72 px) y sin cambios de color ni de estructura.
- `uvicorn` arranca con `--proxy-headers` y confía solo en la IP del proxy (172.28.0.1) para tomar la dirección real de `X-Forwarded-For`.

## Impact

- Solo presentación en el frontend; sin cambios de contrato ni de esquema.
- Configuración de despliegue del backend: cabeceras de proxy.
- Los eventos históricos conservan la IP que se guardó; no se reescriben.
