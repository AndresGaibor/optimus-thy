# Design

## Context

El módulo de usuarios administrativos ya comparte router, dependencias de sesión y helper de errores. La autenticación del endpoint reutiliza `auditoria.leer`; la consulta es solo agregada y se limita por institución, usando la relación `casos` para imágenes e inferencias.

## Decisions

- Mantener la consulta en la ruta existente, sin endpoint ni permiso nuevo.
- Usar `ClienteIA.health()` para consultar el health del servicio configurado y `ObjectStorage.health()` para llamar `head_bucket` sin crear ni modificar recursos.
- Tratar errores de dependencias como estados informativos, no como fallos HTTP del tablero.
- Renderizar los datos recibidos con los componentes del design system y no introducir datos de presentación ficticios.

## Risks

- La forma de respuesta de salud de IA determina `modelos_cargados`; una respuesta incompleta se trata como falta de modelos y por tanto como degradación.
- La disponibilidad de la base es necesaria para autenticar y consultar los datos; el indicador de base confirma además una sentencia `SELECT 1`.
