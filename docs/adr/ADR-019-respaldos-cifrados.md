# ADR-019: Respaldos cifrados y retención escalonada

- Estado: Aceptada
- Fecha: 2026-11-09

## Contexto

La base PostgreSQL y los archivos MinIO contienen información clínica. Un respaldo legible en disco o una clave almacenada junto a él expone datos; además, un backup no probado puede resultar inútil en una recuperación.

## Decisión

Respaldar base y archivos, cifrar con GPG simétrico AES-256 y generar checksums SHA-256. La clave se conserva fuera del repositorio, con permisos restrictivos y copia de custodia separada. Retener 14 copias diarias, 8 semanales y 6 mensuales. Se permite una copia externa S3 opcional con credenciales de mínimo privilegio. La restauración debe comprobar checksums, descifrado, consistencia entre base/archivos y salud de la aplicación en un entorno de prueba antes de considerarse probada.

## Consecuencias

La pérdida de la clave impide recuperar copias cifradas, por lo que la custodia independiente de la clave forma parte de la política. El destino requiere espacio para la retención y controles de acceso. La copia S3 mejora resiliencia frente a pérdida del host, pero añade credenciales y configuración externa. La evidencia de restauración se documenta sin incluir datos clínicos ni secretos.
