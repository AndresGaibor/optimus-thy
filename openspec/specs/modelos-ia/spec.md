# modelos-ia Specification

## Purpose
Permitir que el administrador reemplace los pesos del modelo sin tocar imágenes ni variables del despliegue.

## Requirements

### Requirement: Carga de pesos por el administrador

El administrador SHALL poder subir un paquete de pesos, y el sistema SHALL verificar su contenido y su SHA-256 antes de registrarlo como modelo disponible.

#### Scenario: Paquete válido

- **WHEN** el administrador sube un paquete con los pesos de la cadena
- **THEN** el sistema verifica los archivos y su SHA-256
- **AND** crea un registro en `modelos_ia` con nombre, versión, huella y ruta

#### Scenario: Paquete inválido

- **WHEN** el paquete no contiene los archivos esperados o el hash no coincide
- **THEN** el sistema rechaza la carga con un motivo y no registra el modelo

### Requirement: Una sola versión activa

El sistema SHALL mantener una sola versión activa de los pesos y SHALL NOT permitir que dos versiones queden activas a la vez.

#### Scenario: Activación

- **WHEN** el administrador activa una versión registrada
- **THEN** esa versión queda activa y las demás se desactivan
- **AND** el servicio de IA recarga los pesos desde el volumen compartido

#### Scenario: Recarga fallida

- **WHEN** el servicio de IA no puede cargar los pesos activos
- **THEN** responde con el motivo y el sistema lo informa al administrador
- **AND** no se inventa una inferencia

### Requirement: Los pesos viven fuera del código

La ruta de los pesos SHALL venir de configuración y de un volumen compartido, nunca de una constante en el código.

#### Scenario: Cambio de versión

- **WHEN** se activa otra versión
- **THEN** el servicio de IA lee los pesos de la ruta configurada
- **AND** la huella registrada cambia con el contenido de los archivos
