## ADDED Requirements

### Requirement: Alertas ante patrones raros de uso

El sistema SHALL detectar y exponer patrones inusuales en los eventos de auditoría de las últimas 24 horas. La consulta SHALL requerir `auditoria.leer`, SHALL limitar los eventos a la institución del usuario autenticado y SHALL registrar la consulta como `AUDIT_READ` sin incluir direcciones IP ni detalles de alertas. Las descripciones SHALL omitir correos, nombres y contenido clínico.

#### Scenario: Muchos fallos de acceso

- **WHEN** se registran cinco o más acciones `LOGIN_FAILED`, `AUTH_2FA_FAILED` o `ACCESS_DENIED` del mismo usuario y dirección IP en quince minutos
- **THEN** el sistema devuelve una alerta `fallos_de_acceso` con cantidad, ventana y severidad
- **AND** cuatro eventos o menos no generan esa alerta

#### Scenario: Descargas masivas

- **WHEN** el mismo usuario registra treinta o más acciones `EXPORT`, `DATASET_EXPORT` o `REPORT_DOWNLOAD` en veinticuatro horas
- **THEN** el sistema devuelve una alerta `descargas_masivas` con cantidad, ventana y severidad
- **AND** veintinueve eventos o menos no generan esa alerta

#### Scenario: Exportación fuera de horario

- **WHEN** se registra una acción `EXPORT`, `DATASET_EXPORT` o `REPORT_DOWNLOAD` antes de las 07:00 o desde las 19:00 en la zona `America/Guayaquil`
- **THEN** el sistema devuelve una alerta `exportaciones_fuera_de_horario`
- **AND** las acciones entre 07:00 inclusive y 19:00 exclusive no generan esa alerta

#### Scenario: Aislamiento por institución

- **WHEN** se consultan alertas con una sesión perteneciente a una institución
- **THEN** solo se consideran y exponen eventos con el `institucion_id` de esa sesión
- **AND** los eventos de otra institución no aparecen ni alteran los conteos
