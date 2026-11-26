# Spec Delta

## Purpose

Definir una retención operativa activada explícitamente y evitar que producción arranque con secretos o conexiones locales inseguros.

## ADDED Requirements

### Requirement: Plazos operativos configurables

La configuración DEBE establecer 90 días para trabajos terminados y 365 días para alertas revisadas; ambos plazos DEBEN ser al menos un día. La purga DEBE estar deshabilitada por defecto.

#### Scenario: Valores por defecto
- **WHEN** no se configuran los plazos ni la activación de purga
- **THEN** se usan 90 días para trabajos, 365 días para alertas y la purga permanece deshabilitada

#### Scenario: Plazo inválido
- **WHEN** un plazo de retención es menor que un día
- **THEN** la configuración se rechaza antes de iniciar la aplicación

### Requirement: Purga explícita y simulación

El comando de retención DEBE simular sin `--si`; solo DEBE borrar datos si recibe `--si` y `PURGA_HABILITADA` está activa. La salida DEBE informar conteos y estados sin datos personales.

#### Scenario: Simulación predeterminada
- **WHEN** se ejecuta el comando sin `--si`
- **THEN** muestra los conteos que corresponderían a la purga y no borra filas

#### Scenario: Activación de purga ausente
- **WHEN** se ejecuta con `--si` y `PURGA_HABILITADA` está deshabilitada
- **THEN** informa «purga deshabilitada» y conserva todas las filas

#### Scenario: Purga autorizada
- **WHEN** se ejecuta con `--si` y `PURGA_HABILITADA` está habilitada
- **THEN** elimina únicamente los datos operativos vencidos y muestra los conteos sin exponer datos personales

### Requirement: Alcance operativo y bitácora íntegra

La retención DEBE eliminar solo trabajos en estado `completado` o `error` vencidos y alertas revisadas vencidas; DEBE conservar íntegra la bitácora y cualquier dato clínico o de identidad.

#### Scenario: Trabajos y alertas vencidos
- **WHEN** una purga habilitada encuentra trabajos terminales vencidos y alertas revisadas cuyo `creado_en` excede su plazo
- **THEN** elimina esos registros y conserva trabajos no terminales y alertas no revisadas

#### Scenario: Tabla de alertas ausente
- **WHEN** se ejecuta la purga y no existe la tabla `alertas`
- **THEN** no consulta ni modifica esa tabla, informa `alertas: 0` y `omitido.alertas: tabla ausente`

#### Scenario: Bitácora append-only
- **WHEN** se ejecuta una simulación o una purga
- **THEN** la bitácora completa se conserva y la salida informa que no se purga por su cadena y ancla de integridad

#### Scenario: Datos fuera del alcance
- **WHEN** se ejecuta una purga habilitada
- **THEN** no elimina pacientes, casos, fichas, documentos, imágenes, inferencias ni usuarios

### Requirement: Separación segura de entornos

Producción DEBE requerir una clave PII distinta de la clave de ejemplo, `SESSION_COOKIE_SECURE=true` y una `DATABASE_URL` no local. En desarrollo, una base que parezca de producción DEBE generar una advertencia sin revelar secretos.

#### Scenario: Configuración de producción insegura
- **WHEN** producción carece de clave PII propia, cookie segura o base no local
- **THEN** el arranque se rechaza con un mensaje sin secretos

#### Scenario: Base de producción en desarrollo
- **WHEN** desarrollo usa una base que parece de producción
- **THEN** la configuración emite una advertencia y no incluye credenciales en ella

### Requirement: Ejecución periódica documentada

La operación DEBE ofrecer una ejecución diaria a las 04:30 y un procedimiento para simular, autorizar y comprobar la retención.

#### Scenario: Ejecución programada
- **WHEN** vence el temporizador diario de retención
- **THEN** se ejecuta el comando explícito de purga y el resultado queda consultable en el registro de servicio
