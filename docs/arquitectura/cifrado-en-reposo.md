# Cifrado en reposo y gestión de claves (HT-011)

Implementado en `backend/app/security/`. Cumple RNF-SEG-05, RS-CIF-02 y
RS-CIF-03: los datos que identifican al paciente se guardan cifrados con una
clave que no vive en el repositorio.

## Qué se cifra

Solo las cuatro columnas de `identidades_paciente`, que son las que identifican
a una persona:

| Columna | Dato |
| --- | --- |
| `nombres_cifrados` | Nombres |
| `apellidos_cifrados` | Apellidos |
| `documento_cifrado` | Cédula o documento |
| `fecha_nacimiento_cifrada` | Fecha de nacimiento |

La tabla `pacientes` sigue guardando solo el seudónimo, la institución y las
fechas de control, así que se puede listar y buscar sin descifrar nada. La
separación entre `pacientes` e `identidades_paciente` viene del modelo v1
(HT-006) y es lo que permite que el resto del sistema trabaje sin datos
personales.

Las imágenes y documentos no se cifran byte por byte (haría inviable el OCR y la
inferencia); su protección es el bucket privado con enlaces firmados de corta
duración (HT-007).

## Algoritmo y formato

- **AES-256-GCM**: cifra y autentica; un byte alterado invalida el dato.
- **Nonce de 12 bytes aleatorio** por cada operación: el mismo texto produce
  criptogramas distintos, así que no se puede comparar por igualdad en la base.
- **Clave de 32 bytes** derivada con SHA-256 del secreto configurado.
- **Formato guardado**: `nonce (12 bytes) | cifrado + etiqueta`, en la misma
  columna `BYTEA`. Así el esquema del modelo v1 no cambia: la migración `0001`
  sigue siendo válida y no hace falta una migración nueva.

El tipo `EncryptedBytes` (`app/security/types.py`) hace el trabajo en la frontera
con la base: la aplicación lee y escribe `str` y la base solo ve el criptograma.
Un repositorio no puede «olvidarse» de cifrar porque el cifrado no está en el
servicio, está en la columna.

`identidades_paciente.clave_version` guarda `PiiCipher.key_id()` de la fila, de
modo que se sabe con qué clave se escribió sin exponerla.

## Gestión de la clave

```bash
# Generar una clave propia
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

1. La clave se lee de `PII_ENCRYPTION_KEY`, en `.env` (que está en `.gitignore`)
   o en el gestor de secretos del entorno real.
2. `.env.example` solo trae el valor de ejemplo.
3. Fuera de `local`, `development` y `test` el backend **se niega a arrancar**
   con el valor de ejemplo (`app/config.py`).
4. `PiiCipher.key_id()` devuelve 16 caracteres del hash de la clave: sirve para
   saber qué clave cifró un dato, en logs y auditoría, sin revelar el secreto.

### Rotación

1. Publicar la clave nueva como `PII_ENCRYPTION_KEY`.
2. Descifrar con la clave anterior y volver a cifrar con la nueva cada fila de
   `identidades_paciente`, en una tarea de mantenimiento con ventana de
   indisponibilidad.
3. Conservar la clave anterior hasta terminar y comprobar que no queda ninguna
   fila con el `clave_version` viejo.

Al abrir un dato, un fallo de autenticación o un valor incompleto lanzan
`PiiDecryptionError` con un mensaje genérico: nunca se filtra el contenido ni la
clave, y el error al cliente sigue el formato seguro del backend.

## Almacenamiento y respaldos

| Elemento | Estado |
| --- | --- |
| Bucket de archivos | Privado y con enlaces firmados (HT-007); cifrado del lado del servidor AES-256 al subir |
| Respaldos de PostgreSQL | Pendiente en la tarjeta HT-013 (respaldo y restauración), que debe cifrarlos con la misma política |
| Volumen de MinIO | El cifrado real depende del disco del host; en producción se monta un volumen cifrado |

## Pruebas

`backend/tests/test_encryption.py` comprueba: ida y vuelta con acentos y
caracteres especiales, nonce distinto por operación, rechazo de un criptograma
alterado, rechazo con otra clave, rechazo de un valor incompleto o no binario,
que la base solo guarda el criptograma, que las cuatro columnas de
`identidades_paciente` usan el tipo cifrado y que producción no acepta la clave
de ejemplo.
