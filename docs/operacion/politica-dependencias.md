# Política de auditoría de dependencias

## Umbrales de bloqueo

La CI audita el lockfile del frontend con `bun audit --audit-level=high`: los hallazgos high y critical bloquean el job. En `backend`, `ocr` e `ia`, `pip-audit` bloquea ante cualquier vulnerabilidad reportada. Una indisponibilidad del registro o del servicio de avisos también produce un fallo visible; no se omite ni se convierte en éxito.

La revisión de dependencias de GitHub Actions (`dependency-review`) requiere GitHub Advanced Security (GHAS). Está apagada por defecto y solo se ejecuta en pull requests si la variable de repositorio `HABILITAR_DEPENDENCY_REVIEW` vale `true` y GHAS está disponible.

## Excepciones temporales

Las excepciones se guardan en `.github/auditoria-excepciones.txt`, una por línea, con el formato exacto `ID|AAAA-MM-DD|motivo`. Las líneas vacías y las que empiezan por `#` son comentarios. La fecha es el último día de vigencia; una excepción con fecha anterior al día actual hace fallar la validación y la auditoría. El motivo debe identificar por qué se difiere la corrección; no se incluyen secretos.

Para aplicar una excepción al escaneo se usa el ID del aviso (GHSA/CVE u otro identificador que acepte el auditor). Las excepciones se revisan al modificar dependencias y durante cada ciclo de release. Toda excepción nueva o renovación requiere aprobación de la persona responsable de seguridad del proyecto y de quien mantiene el componente afectado; se debe preferir actualizar o reemplazar la dependencia en vez de renovar. La renovación exige una nueva fecha límite y motivo actualizado, con aprobación registrada en el pull request. No se permiten excepciones indefinidas.

La comprobación local de formato y vencimientos es `bash scripts/auditoria-dependencias.sh --comprobar-excepciones`. Para ejecutar una auditoría desde el proyecto correspondiente, usa `bash scripts/auditoria-dependencias.sh bun` o `bash scripts/auditoria-dependencias.sh pip`.
