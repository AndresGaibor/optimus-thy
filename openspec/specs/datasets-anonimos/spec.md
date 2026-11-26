# datasets-anonimos Specification

## Purpose
Construir datasets anonimizados sin identificadores, con huella estable del conjunto y registro auditado de cada consulta.

## Requirements

### Requirement: Construcción de datasets anonimizados

La API SHALL construir un dataset fijo a partir de un filtro clínico, incluyendo únicamente casos con consentimiento vigente de `investigacion_con_anonimizacion`.

#### Scenario: Creación válida

- **WHEN** un usuario con `investigacion.leer` envía nombre, `k` mayor o igual que 5 y un filtro que alcanza al menos `k` casos consentidos
- **THEN** la respuesta es 201 con el identificador, el total, la `k`, la huella y las filas anonimizadas

#### Scenario: k insuficiente

- **WHEN** la petición usa `k` menor que 5
- **THEN** la respuesta es 422 con el código `k_insuficiente`

#### Scenario: Conjunto menor que k

- **WHEN** el filtro devuelve menos casos consentidos que `k`
- **THEN** la respuesta es 422 con el código `conjunto_insuficiente`

#### Scenario: Consentimiento retirado

- **WHEN** un caso tiene el consentimiento de investigación revocado o solo tiene consentimiento de atención de salud
- **THEN** el caso no forma parte del dataset

### Requirement: Anonimización sin identificadores

Cada fila del dataset SHALL publicarse sin identificadores directos ni cuasi-identificadores.

#### Scenario: Identificadores directos ausentes

- **WHEN** se abre un dataset
- **THEN** la respuesta no contiene nombre, apellidos, documento, fecha de nacimiento exacta, código de paciente, código de caso ni institución

#### Scenario: Fechas y edades generalizadas

- **WHEN** se abre un dataset con fichas clínicas
- **THEN** las fechas aparecen como `AAAA-MM` después de un desplazamiento determinista y la edad aparece en un decenio

#### Scenario: Seudónimo por dataset

- **WHEN** se comparan dos datasets distintos
- **THEN** el mismo caso recibe seudónimos diferentes y no se puede enlazar por ese valor

### Requirement: Consulta de datasets

La API SHALL listar y abrir los datasets de la institución de la sesión con permiso `investigacion.leer`.

#### Scenario: Listado

- **WHEN** se consulta el listado
- **THEN** se devuelven los metadatos de los datasets de la institución, del más reciente al más antiguo, sin filas clínicas

#### Scenario: Detalle

- **WHEN** se abre un dataset propio por su identificador
- **THEN** se devuelven sus metadatos y todas sus filas anonimizadas

#### Scenario: Dataset ajeno o inexistente

- **WHEN** el identificador no existe o pertenece a otra institución
- **THEN** la respuesta es 404

#### Scenario: Sin permiso

- **WHEN** el rol activo no tiene `investigacion.leer`
- **THEN** la respuesta es 403

### Requirement: Huella estable del conjunto

El sistema SHALL guardar una huella SHA-256 del contenido anonimizado, estable para los mismos casos y datos clínicos.

#### Scenario: Reconstrucción

- **WHEN** se crean dos datasets con el mismo filtro y los mismos datos
- **THEN** ambos tienen la misma huella

#### Scenario: Cambio de contenido

- **WHEN** cambia un valor clínico publicado de un caso
- **THEN** la nueva huella difiere de la anterior

### Requirement: Auditoría de la consulta

La API SHALL registrar la creación y cada consulta de datasets en la bitácora.

#### Scenario: Eventos registrados

- **WHEN** se crea, se lista o se abre un dataset
- **THEN** la bitácora guarda `RESEARCH.DATASET_CREATE` o `RESEARCH.DATASET_READ` con el dataset y el número de filas

#### Scenario: Sin datos personales en la bitácora

- **WHEN** se revisan los detalles de esos eventos
- **THEN** no aparecen nombres, documentos, códigos de caso ni contenido clínico
