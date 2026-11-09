# ADR-003: PII y Datos Sensibles

**Fecha:** 2024-09-23
**Status:** Aceptado
**Decisor:** Equipo OPTIMUS-THY

## Contexto y Problemática

OPTIMUS-THY maneja información personal identificable (PII) de pacientes:
- Nombres completos
- Número de cédula/DNI
- Fecha de nacimiento
- Dirección, teléfono, email
- Información clínica asociada

Esta información requiere protección legal y técnica robusta.

## Decisión

**Cifrado AES-256-GCM en base de datos para campos PII + enmascaramiento en frontend**

## Arquitectura de Cifrado

### Algoritmo

- **Cifrado:** AES-256-GCM (Authenticated Encryption)
- **Nonce:** 12 bytes (96 bits), generado aleatoriamente por operación
- **Clave:** Derivada de `PII_ENCRYPTION_KEY` via SHA-256 (32 bytes)

### Implementación

```python
# app/infrastructure/security/encryption.py

def _get_encryption_key() -> bytes:
    raw_key = os.getenv("PII_ENCRYPTION_KEY", "dev_default...")
    return sha256(raw_key.encode()).digest()  # 32 bytes

def encrypt_pii(plaintext: str | None) -> str | None:
    key = _get_encryption_key()
    aesgcm = AESGCM(key)
    nonce = os.urandom(12)  # 12 bytes nonce para GCM
    ciphertext = aesgcm.encrypt(nonce, plaintext.encode(), None)
    return base64.b64encode(nonce + ciphertext)

def decrypt_pii(ciphertext_b64: str | None) -> str | None:
    # Extrae nonce[0:12], ciphertext[12:]
    # Descifra con AESGCM
```

## Campos Cifrados (Tabla patient_pii)

Todos los campos con sufijos `_enc` están cifrados en la base de datos:

| Campo en BD | Contenido |
|-------------|-----------|
| `first_names_enc` | Nombres del paciente |
| `last_names_enc` | Apellidos del paciente |
| `national_id_enc` | Número de identificación |
| `date_of_birth_enc` | Fecha de nacimiento |
| `phone_enc` | Teléfono de contacto |
| `email_enc` | Correo electrónico |
| `address_enc` | Dirección física |

## Campos en Texto (Tabla patients)

| Campo | Descripción | Razón |
|-------|-------------|-------|
| `id` | UUID | Identificador interno |
| `internal_code` | Código interno | Anónimo |
| `medical_record_number` | MRN hospitalario | Pseudonimizado |
| `sex` | Género | Dato clínico |
| `is_active` | Estado | Operacional |
| `institution_id` | FK a institución | Relación |

## Separación PII / Datos Clínicos

```
┌─────────────────────────────────────────────────────────┐
│                      patients                            │
│  id, internal_code, medical_record_number, sex, etc.    │
│  (Datos pseudonimizados, accesibles por rol doctor)     │
└─────────────────────┬───────────────────────────────────┘
                      │ 1:1
                      ▼
┌─────────────────────────────────────────────────────────┐
│                    patient_pii                          │
│  first_names_enc, last_names_enc, national_id_enc,     │
│  date_of_birth_enc, phone_enc, email_enc, address_enc  │
│  (Datos cifrados, acceso muy restringido)               │
└─────────────────────────────────────────────────────────┘
```

## PIIMask en Frontend

El frontend utiliza un componente `PIIMask` que:

1. **Nunca recibe PII sin cifrar** del backend
2. **Muestra asteriscos** para campos sensibles por defecto
3. **Permite reveal** solo para usuarios con rol `admin` o `doctor` con justificación
4. **Registra auditoría** cada vez que se revela PII

### Ejemplo de Uso

```tsx
// Componente PIIMask
<PIIMask field="names" value={patient.firstNames} />

// Muestra: "****" por defecto
// Doctor puede hacer click para revelar (registra auditoría)
```

## Qué Ve Cada Rol

| Rol | Pacientes | Datos Clínicos | PII |
|-----|-----------|----------------|-----|
| admin | Todos | Todos | Ver con justificación |
| doctor | Propios (institución) | Propios casos | Ver en contexto clínico |
| researcher | Solo anonymized | Solo anonymized | **Nunca** |

## Cifrado de Imágenes

Las imágenes médicas (`medical_images`) no se cifran byte por byte (infeasible para procesamiento de IA). En cambio:

1. Se almacenan en Object Storage (S3) con acceso restringido
2. Acceso solo via presigned URLs temporales
3. URL firmadas expiran en 1 hora por defecto
4. Imágenes marcadas como `is_anonymized=True` si no contienen PII visible

## Key Management

| Entorno | `PII_ENCRYPTION_KEY` | Fuente |
|---------|---------------------|--------|
| Desarrollo | `optimus_pii_dev_secret_key_change_in_prod_32b` | .env |
| Producción | **REQUERIDO** - debe cambiarse | Secret manager |

### Rotación de Claves

La rotación de claves requiere:
1. Nueva clave en `PII_ENCRYPTION_KEY`
2. Re-cifrado de todos los registros `patient_pii`
3. Downtime planificado

## Auditoría de Acceso a PII

Cada vez que un usuario accede a PII (lectura o reveal):

```python
audit_event = AuditEvent(
    action="PII_ACCESS",
    module="PATIENT",
    details=f"User {user.id} accessed PII of patient {patient_id}",
    user_id=user.id,
    ip_address=ip,
    request_id=request_id,
)
```

## OWASP Compliance

| Control | Implementación |
|---------|----------------|
| A02 - Cryptographic Failures | AES-256-GCM, nonce único por operación |
| A03 - Injection | N/A (no SQL raw, usa ORM) |
| A09 - Security Logging | Auditoría de todo acceso a PII |

## Consideraciones Legales

- Los campos cifrados cumplen con normativas de protección de datos
- Auditoría completa permite trazabilidad de accesos
- El sistema no almacena PII en logs
- Presigned URLs limitan exposición temporal

## References

- [AES-GCM (cryptography library)](https://cryptography.io/en/latest/hazmat/primitives/aead/)
- [NIST SP 800-38D](https://csrc.nist.gov/publications/sp800-38d)
