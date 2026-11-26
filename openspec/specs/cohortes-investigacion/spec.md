# cohortes-investigacion Specification

## Purpose
Permitir que el personal investigador guarde filtros clínicos institucionales y vuelva a aplicarlos al calcular agregados.

## Requirements

### Requirement: Guardar y reutilizar cohortes institucionales

La API MUST permitir a usuarios con `investigacion.leer` crear cohortes, listarlas y borrarlas, siempre dentro de su institución. Cada cohorte MUST tener nombre de hasta 120 caracteres, filtros conocidos (`edad_min`, `edad_max`, `tirads`, `bethesda`, `tipo_diagnostico`, `desde`, `hasta`) y fechas de creación y actualización.

#### Scenario: Guardar y reutilizar

- **GIVEN** un investigador guarda filtros válidos en una cohorte
- **WHEN** consulta sus cohortes
- **THEN** ve el nombre, filtros, total de casos que cumplen y fechas
- **AND** los casos de otra institución no se cuentan
- **AND** una cohorte de otra institución se trata como inexistente al borrarla

#### Scenario: Auditoría de la consulta

- **GIVEN** un investigador lista sus cohortes
- **WHEN** la consulta termina
- **THEN** se registra un evento `RECORD_READ` con objeto `DATASET`

### Requirement: Validar filtros y nombres de cohorte

Los filtros desconocidos, mal tipados, fuera de rango, o con fecha inicial posterior a la final MUST responder 422 `filtro_invalido`. Un nombre duplicado en la institución MUST responder 409 `cohorte_duplicada`. Un nombre de más de 120 caracteres MUST responder 422 `filtro_invalido`.

Nombres que solo difieran por mayúsculas/minúsculas MUST ser únicos por institución. Las lecturas MUST registrarse como `RECORD_READ` y las escrituras como `EXPORT`, con objeto `DATASET`.

#### Scenario: Nombre duplicado

- **GIVEN** la institución ya tiene una cohorte
- **WHEN** se intenta crear otro nombre equivalente sin distinguir mayúsculas
- **THEN** la API responde 409 con `cohorte_duplicada`

#### Scenario: Filtros inválidos

- **GIVEN** los filtros incluyen una clave desconocida o un valor inválido
- **WHEN** se crea la cohorte
- **THEN** la API responde 422 con `filtro_invalido`

### Requirement: Filtro de edad sin almacenar sexo

La edad MUST evaluarse en memoria descifrando la fecha de nacimiento después de acotar por institución y filtros SQL; no hay índice sobre la fecha cifrada y se acepta este coste para el conjunto institucional. El sistema no almacena sexo, por lo que las cohortes MUST NOT admitir un filtro de sexo.

#### Scenario: Edad fuera del rango

- **GIVEN** dos pacientes de la institución con edades distintas
- **WHEN** la cohorte filtra un rango de edad que solo cubre a uno
- **THEN** el total de casos cuenta únicamente al que cae dentro del rango

### Requirement: Calcular métricas con una cohorte

`GET /investigacion/metricas` MUST aceptar `cohorte_id` opcional. Al proporcionarlo, MUST incluir solo inferencias de casos que cumplen los filtros guardados y pertenezcan a la institución del investigador. Una cohorte inexistente o ajena MUST responder 404 `not_found`. Sin `cohorte_id`, el comportamiento MUST conservarse.

#### Scenario: Métricas con cohorte

- **GIVEN** dos casos de la institución tienen valores distintos de tirads y una cohorte selecciona solo uno
- **WHEN** el investigador solicita métricas con esa cohorte
- **THEN** solo se cuentan las inferencias del caso seleccionado

#### Scenario: Cohorte ajena

- **GIVEN** la cohorte pertenece a otra institución
- **WHEN** el investigador intenta usarla para métricas
- **THEN** la API responde 404 `not_found`

### Requirement: Interfaz para gestionar cohortes

La navegación de investigación MUST ofrecer una pantalla de cohortes conectada a la API, con listado, creación validada, confirmación antes de borrar, selección para métricas y estados accesibles de carga, vacío y error recuperable. La interfaz MUST NOT ofrecer un filtro de sexo.

#### Scenario: Crear y listar

- **GIVEN** la pantalla termina de cargar sin errores
- **WHEN** el investigador crea una cohorte válida
- **THEN** la cohorte creada aparece en la lista sin datos simulados

#### Scenario: Error recuperable

- **GIVEN** una petición de cohortes falla
- **WHEN** se muestra el estado de error
- **THEN** el investigador puede reintentar y la pantalla vuelve a consultar la API
