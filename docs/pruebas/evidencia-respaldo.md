# Evidencia: respaldo cifrado y restauración (HT-013)

## 2026-11-26 · restauración de archivos incluida

Prueba: `make respaldo-prueba` sobre la base y el volumen de archivos del despliegue. Solo recuentos.

| Comprobación | Resultado |
| --- | --- |
| Base, archivos y huellas | `db-*.sql.gz.gpg`, `archivos-*.tar.gz.gpg`, `sha256sum -c` correcto |
| Otra clave no abre el respaldo | Falla, como se espera |
| Restauración de la base en Postgres limpio | Correcta; migración 0021, 28 tablas, usuarios 5, roles 3, permisos 17, roles_permisos 19, pacientes 1, casos 0, auditoría 122 |
| Restauración de archivos a directorio temporal | Correcta; 60 entradas |
| Comparación de archivos con el tar | 25 archivos y 28 720 bytes en ambos lados |

Prueba negativa del comparador: un tar de laboratorio con 2 archivos y 9 bytes coincide; al añadir un tercero la comparación informa 3 archivos y 13 bytes y falla.

## 2026-11-05 · línea base

Fecha: 2026-11-05. Prueba: `make respaldo-prueba` (`infra/scripts/probar-respaldo.sh`) sobre la base y el volumen de archivos reales del despliegue. Solo se anotan recuentos; ningún dato de pacientes.

| Comprobación | Resultado |
| --- | --- |
| Respaldo de la base (`pg_dump` + gzip + AES-256) | Archivo `db-*.sql.gz.gpg` generado |
| Respaldo del volumen de archivos (MinIO) | Archivo `archivos-*.tar.gz.gpg` generado |
| Huellas SHA-256 de ambos archivos | `sha256sum -c` correcto |
| El archivo cifrado no es legible sin la clave | Correcto: no aparece SQL en claro |
| Restaurar con una clave incorrecta | Falla, como se espera |
| Restaurar con la clave correcta en un Postgres limpio y desechable | Correcto |
| Migración de Alembic en lo restaurado | 0008 (la misma que la base respaldada) |
| Tablas restauradas | 24 de 24 |
| Recuentos restaurados (usuarios, roles, permisos, roles_permisos, pacientes, casos, auditoría) | 2, 3, 8, 12, 0, 0, 6: coinciden con la base respaldada |

## Lo que todavía falta

- Una **copia fuera del equipo principal** (RS-CIF-05): hoy el respaldo queda en el mismo disco. `subir-respaldo.sh` existe y se omite sin credenciales S3; falta configurarlas.
- **Programación periódica** (RNF-CON-01): las unidades `infra/systemd/optimus-thy-respaldo.*` existen, falta enlazarlas y activarlas en el host de destino y registrar su estado.
- Restaurar al volumen real de MinIO: la prueba extrae a un directorio temporal y compara; no ejercita la escritura al volumen.
