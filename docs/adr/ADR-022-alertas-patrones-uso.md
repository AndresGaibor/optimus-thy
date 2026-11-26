# ADR-022 — Alertas ante patrones raros de uso

**Estado:** Aceptada.  
**Fecha:** 2026-11-26.

## Contexto

La bitácora ya registra fallos de inicio de sesión, denegaciones de acceso, exportaciones y descargas. Sin embargo, esos eventos solo se pueden revisar uno por uno; una ráfaga de fallos, una extracción masiva o una exportación en horas inusuales puede pasar inadvertida. Las alertas deben reutilizar los eventos existentes, respetar el aislamiento institucional y evitar guardar o divulgar datos personales en su descripción.

## Decisión

1. El detector es una función pura sobre eventos de auditoría: cinco `LOGIN_FAILED`, `AUTH_2FA_FAILED` o `ACCESS_DENIED` en quince minutos por usuario e IP generan una alerta; treinta `EXPORT`, `DATASET_EXPORT` o `REPORT_DOWNLOAD` en veinticuatro horas por usuario generan otra.
2. Cada exportación o descarga fuera de 07:00–19:00 genera una alerta individual. El backend no configura zona horaria; se usa `America/Guayaquil` como hora civil de referencia de la institución.
3. Las alertas se calculan al consultar `GET /seguridad/alertas`, a partir de la bitácora de la institución de la sesión y de las últimas 24 horas. La consulta exige `auditoria.leer` y queda registrada como `AUDIT_READ` sin copiar IP ni detalle de las alertas.
4. No se añade cron, tabla, migración ni dependencia. La detección es una lectura derivada y no modifica los eventos inmutables de auditoría.
5. El texto de cada alerta describe únicamente el patrón y su cantidad; nunca incluye correo, nombre, IP ni contenido clínico.

## Consecuencias

- Las alertas reflejan los datos existentes al momento de consultar y no persisten ni se marcan como revisadas.
- Los umbrales son reglas explícitas, deterministas y verificables; pueden ajustarse en código si la operación aporta evidencia para ello.
- La zona de Guayaquil es una decisión de producto, necesaria para que «fuera de horario» no dependa de la zona del proceso o la base de datos.
- El detector no realiza consultas propias ni añade carga de escritura; el endpoint limita la lectura por institución y por una ventana temporal de 24 horas.
