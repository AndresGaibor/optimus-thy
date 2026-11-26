# Capability: Cronología del caso

## ADDED Requirements

### Requirement: Read a case chronology
The system SHALL return a concise chronology from all specified case sources, scoped to the caller's institution and authorized by `paciente.leer`. It SHALL sort items newest first, limit results to 100, and audit successful reads as `RECORD_READ` on `CASE`.
#### Scenario: Ordered, institution-scoped timeline
- **GIVEN** a user with `paciente.leer` opens a case in their institution
- **WHEN** chronology is requested
- **THEN** the response contains no more than 100 items in descending time order with the specified event types and fields

### Requirement: Display chronology
The case page SHALL show the chronology, render dates using the `es-EC` locale, and provide loading, empty, error, and retry states.

#### Scenario: Loading and recovery
- **GIVEN** the chronology is loading or unavailable
- **WHEN** the case page is opened or the user retries
- **THEN** it shows loading feedback or an error with a retry action
