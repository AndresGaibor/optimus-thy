# despliegue Specification

## Purpose
Informar qué commit está publicado y publicar el frontend desde el propio sistema.

## Requirements

### Requirement: Estado del despliegue por commit publicado

El despliegue automático SHALL considerar desplegado un commit solo cuando terminó su publicación y lo SHALL registrar en `.deploy/desplegado`.

#### Scenario: Merge hecho a mano en el directorio de despliegue

- **WHEN** `HEAD` del directorio ya es `origin/main` pero el último despliegue registrado es otro commit
- **THEN** el script despliega ese commit en lugar de responder «sin cambios»

#### Scenario: Despliegue terminado

- **WHEN** el sitio sirve el bundle de la imagen recién construida y las comprobaciones de salud pasan
- **THEN** el commit se registra como desplegado y las ejecuciones siguientes no reconstruyen nada

### Requirement: Publicación del frontend

El despliegue SHALL reconstruir y recrear el servicio `frontend` cuando cambie `frontend/`, `package.json` o `bun.lock`, y SHALL fallar si el bundle servido no coincide con el de la imagen.

#### Scenario: Cambio solo de interfaz

- **WHEN** el commit desplegado cambia archivos de `frontend/`
- **THEN** se reconstruye la imagen del frontend, se recrea el contenedor y el bundle público coincide con el del contenedor

#### Scenario: Bundle desactualizado

- **WHEN** transcurridos los reintentos el sitio sigue sirviendo un bundle distinto del construido
- **THEN** el despliegue termina en error y el commit no se registra como desplegado
