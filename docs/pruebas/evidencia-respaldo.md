# Evidencia: respaldo cifrado y restauración (HT-013)

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

- Una **copia fuera del equipo principal** (RS-CIF-05): hoy el respaldo queda en el mismo disco.
- **Programación periódica** (RNF-CON-01): las unidades `infra/systemd/optimus-thy-respaldo.*` existen, falta enlazarlas y activarlas en el host.
- Restaurar también el volumen de archivos en un entorno limpio y comparar objetos; hoy solo se prueba que el archivo se genera y su huella.
