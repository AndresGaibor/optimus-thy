# tablero-administrador Specification

## Purpose
Dar al administrador una portada con los indicadores operativos del sistema (usuarios, casos, inferencias y trabajos pendientes) y los avisos que exigen su atención, sin obligarlo a recorrer cada módulo.

## Requirements

### Requirement: Resumen institucional
El sistema MUST devolver desde `GET /administrador/tablero` los recuentos reales de pacientes, casos, imágenes, inferencias y usuarios de la institución del administrador.

#### Scenario: Cifras desde la base
- WHEN un administrador autorizado consulta el tablero
- THEN el volumen contiene los cinco recuentos reales y cada tabla o relación queda limitada a su institución

### Requirement: Actividad reciente
El sistema MUST agregar los registros de auditoría de los últimos siete días por acción, ordenados por total descendente, con máximo diez acciones, total y última fecha.

#### Scenario: Actividad agregada
- WHEN existen varios eventos recientes para una acción de la institución
- THEN el tablero devuelve una sola fila con el total y la fecha más reciente

### Requirement: Estado de dependencias
El sistema MUST informar el estado de base de datos, servicio de IA y almacenamiento sin que un fallo individual de servicio interrumpa la respuesta; la IA sin modelos cargados MUST aparecer como degradada.

#### Scenario: Servicio caído se informa
- WHEN una dependencia no está disponible o el servicio de IA no tiene modelos cargados
- THEN el tablero informa `caido` o `degradado`, respectivamente, y devuelve el resto del resumen

### Requirement: Autorización y auditoría de lectura
El sistema MUST exigir el permiso existente `auditoria.leer` y registrar cada lectura con acción `RECORD_READ`, módulo `ADMIN` y objeto `SYSTEM`.

#### Scenario: Sin permiso
- WHEN un usuario sin `auditoria.leer` consulta el tablero
- THEN la API responde con HTTP 403
