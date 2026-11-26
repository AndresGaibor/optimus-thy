# rendimiento Specification

## Purpose
TBD - created by archiving change 2026-11-26-rendimiento-demo. Update Purpose after archive.

## Requirements

### Requirement: ejecución aislada

El sistema SHALL iniciar la medición con un nombre de proyecto Compose único, puertos HTTP/HTTPS libres y almacenamiento efímero separado de recursos ajenos; si `/health` no queda disponible, SHALL terminar con código 3 e indicar el motivo.

#### Scenario: stack saludable
- **GIVEN** Docker Compose está disponible y hay recursos suficientes
- **WHEN** se ejecuta `bash tests/rendimiento/medir.sh`
- **THEN** el stack aislado llega a `/health` en verde y se mide el tiempo de arranque en frío

#### Scenario: stack no saludable
- **GIVEN** Docker no logra iniciar un servicio o el puerto falla
- **WHEN** vence la espera de disponibilidad
- **THEN** el proceso sale con código 3, muestra el motivo y limpia únicamente su proyecto Compose

### Requirement: datos sintéticos y rutas

La medición SHALL usar credenciales y datos sintéticos, cargar pacientes y casos mediante el seed disponible y autenticar las solicitudes protegidas; SHALL medir 50 ejecuciones de cada ruta requerida y presentar p50, p95 y p99.

#### Scenario: captura de latencias
- **GIVEN** el stack está saludable y contiene un caso sintético
- **WHEN** se miden `/health`, `/auth/login`, `/pacientes`, `/casos/{id}` y el encolado en `/trabajos`
- **THEN** el informe contiene p50, p95 y p99 de las 50 muestras de cada operación

### Requirement: procedencia e interpretación

El informe SHALL incluir fecha, CPU, arquitectura, RAM del host, versión de Docker, commit medido, uso de memoria de contenedores, identidad del equipo como laptop de demostración o no, y las limitaciones conocidas de la inferencia.

#### Scenario: contexto no es laptop de demostración
- **GIVEN** la ejecución ocurre en un host distinto a la laptop de demostración
- **WHEN** se genera el informe
- **THEN** su primera línea advierte que el número no sustituye la medición en la laptop y solo la prefigura

### Requirement: cierre seguro del stack

Al finalizar, el sistema SHALL detener y retirar solo los recursos de su proyecto Compose, sin borrar volúmenes de proyectos ajenos ni usar `down -v`.

#### Scenario: limpieza tras medición
- **GIVEN** la medición creó un proyecto Compose aislado
- **WHEN** la ejecución termina por éxito o error
- **THEN** se detienen sus servicios sin eliminar volúmenes ajenos
