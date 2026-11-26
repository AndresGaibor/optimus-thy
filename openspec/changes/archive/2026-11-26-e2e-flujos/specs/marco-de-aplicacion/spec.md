## ADDED Requirements

### Requirement: Recorridos E2E de roles en integración continua

La integración continua SHALL ejecutar recorridos de navegador para los roles médico e investigador con Chromium y una API simulada, sin depender de backend, base de datos ni servicios externos. El gate final SHALL fallar si cualquiera de esos recorridos falla.

#### Scenario: Recorrido médico

- **WHEN** el job E2E de flujos se ejecuta
- **THEN** autentica al médico, abre la lista y ficha del paciente, ejecuta una inferencia y verifica confianza y el aviso de apoyo a la decisión, nunca diagnóstico definitivo

#### Scenario: Recorrido investigador

- **WHEN** el job E2E de flujos se ejecuta
- **THEN** autentica al investigador y consulta métricas y un dataset desidentificado
