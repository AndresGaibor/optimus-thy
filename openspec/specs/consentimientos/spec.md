# consentimientos Specification

## Purpose
Registrar el consentimiento informado del caso y usarlo como condición de la inferencia.

## Requirements

### Requirement: Consentimiento por caso

El sistema SHALL registrar consentimientos con finalidad y versión del texto, y SHALL retirarlos con efecto inmediato.

#### Scenario: Registro

- **WHEN** un usuario con permiso `paciente.escribir` registra un consentimiento de atención de salud con su versión
- **THEN** el consentimiento queda vigente y auditado con `CONSENT_CREATE`

#### Scenario: Retiro

- **WHEN** se revoca un consentimiento vigente
- **THEN** deja de estar vigente desde ese momento
- **AND** un segundo retiro responde 409

#### Scenario: Caso ajeno

- **WHEN** el caso pertenece a otra institución
- **THEN** el sistema responde 404
