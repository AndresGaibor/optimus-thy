# exportacion-datasets Specification

## Purpose
TBD - created by archiving change exportacion-dataset. Update Purpose after archive.

## Requirements

### Requirement: Exportación con ficha técnica y sin identificadores

El API MUST exponer `GET /investigacion/datasets/{id}/exportar` con el permiso `investigacion.exportar`. La respuesta MUST incluir una ficha técnica con nombre, descripción, fecha de creación, `k`, `k_efectivo`, huella, criterios, columnas y nota de desidentificación, y MUST contener solo las filas anonimizadas ya persistidas, sin identificadores de pacientes ni vínculo con el caso.

#### Scenario: Exportación en CSV

- **GIVEN** un dataset de la institución del usuario y una sesión con `investigacion.exportar`
- **WHEN** el usuario pide `/exportar` sin formato o con `formato=csv`
- **THEN** el API responde 200 con `text/csv`, la ficha en líneas `#` y una fila por caso anonimizado

#### Scenario: Exportación en JSON

- **GIVEN** el mismo dataset y permiso
- **WHEN** el usuario pide `/exportar?formato=json`
- **THEN** el API responde 200 con un objeto `{ficha, filas}`

#### Scenario: Formato no admitido

- **GIVEN** una sesión con permiso
- **WHEN** el usuario pide `formato=xlsx`
- **THEN** el API responde 422 con el código `formato_invalido`

### Requirement: Exportación registrada

Cada exportación MUST dejar un evento `RESEARCH.DATASET_EXPORT` en la bitácora con el identificador del dataset, el número de filas y el formato. Los detalles MUST NOT contener contenido clínico ni identificadores.

#### Scenario: Descarga registrada

- **GIVEN** un dataset exportado correctamente
- **WHEN** se consulta la bitácora
- **THEN** aparece un evento `RESEARCH.DATASET_EXPORT` con `resource_count` y `format`, y ningún dato de pacientes

### Requirement: Permiso e institución

El API MUST rechazar con 403 la exportación cuando el rol activo no tiene `investigacion.exportar`, y con 404 cuando el dataset no existe o pertenece a otra institución.

#### Scenario: Rol sin permiso

- **GIVEN** una sesión con rol `doctor`
- **WHEN** intenta exportar un dataset
- **THEN** el API responde 403 y no crea evento de exportación

#### Scenario: Dataset ajeno

- **GIVEN** una sesión con permiso y un identificador que no corresponde a un dataset de su institución
- **WHEN** pide exportar
- **THEN** el API responde 404
