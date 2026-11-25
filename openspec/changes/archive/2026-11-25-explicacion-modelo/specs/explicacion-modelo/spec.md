## ADDED Requirements

### Requirement: Explicación y límites del modelo

El sistema SHALL mostrar al médico qué hace el modelo, cómo se leen sus resultados y qué límites tiene.

#### Scenario: Página de explicación

- **WHEN** el médico abre `/medico/modelo`
- **THEN** ve la cadena del modelo, el significado de cada resultado y los límites explícitos
- **AND** se indica que el sistema no emite diagnóstico ni sustituye al patólogo

#### Scenario: Modelo en uso

- **WHEN** la API devuelve el modelo de la última inferencia
- **THEN** se muestran nombre, versión, huella de pesos y fecha

#### Scenario: Fallo del bloque de modelo

- **WHEN** la consulta del modelo falla
- **THEN** solo ese bloque muestra error con reintento
- **AND** la explicación y los límites siguen visibles

#### Scenario: Sin modelo disponible

- **WHEN** no hay ningún modelo registrado
- **THEN** se avisa de que no hay modelo activo sin inventar una versión
