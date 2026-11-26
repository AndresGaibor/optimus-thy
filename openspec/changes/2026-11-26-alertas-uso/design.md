# Design

## Context

Los eventos necesarios ya se guardan en `auditoria`. Las acciones se almacenan con su módulo (`AUTH.LOGIN_FAILED`, `AUTH.ACCESS_DENIED`, `EXPORT.EXPORT`, entre otras). El servicio no dispone de una zona horaria configurada. La alerta debe derivarse en tiempo de consulta sin alterar la bitácora de solo inserción.

## Decisions

- El detector recibe solo fecha, usuario, dirección IP y acción, sin leer la base de datos.
- Agrupar fallos por usuario (o «anónimo») y dirección IP; alertar desde cinco eventos en una ventana de quince minutos.
- Agrupar exportaciones y descargas por usuario; alertar desde treinta eventos en una ventana de veinticuatro horas.
- Revisar cada evento de exportación en la zona `America/Guayaquil`; el horario permitido es 07:00 inclusive a 19:00 exclusive.
- El endpoint lee exclusivamente las cuatro columnas necesarias, limita la consulta por institución y por las últimas 24 horas, y exige `auditoria.leer`.
- Registrar `AUDIT_READ` con el número de alertas, sin IP ni texto de detalle. Las descripciones de alertas no incluyen datos personales.
- Calcular las alertas en cada consulta: no se agregan cron, persistencia, migraciones o nuevas dependencias.

## Risks

- Los umbrales iniciales son heurísticos y pueden necesitar ajuste con evidencia de uso real.
- Las alertas no persisten entre consultas y no se revisan ni notifican de forma proactiva; esta capacidad solo las expone cuando un usuario autorizado las solicita.
- Las fechas almacenadas deben ser conscientes de zona horaria para compararlas y convertirlas a la hora de referencia.
