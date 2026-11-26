# Modelo de datos v1

## Diagrama

```mermaid
erDiagram
    instituciones ||--o{ usuarios : tiene
    instituciones ||--o{ pacientes : tiene
    instituciones ||--o{ casos : tiene
    instituciones ||--o{ auditoria : registra
    usuarios ||--o{ usuarios_roles : asigna
    roles ||--o{ usuarios_roles : compone
    roles ||--o{ roles_permisos : otorga
    permisos ||--o{ roles_permisos : incluye
    pacientes ||--|| identidades_paciente : cifrada
    pacientes ||--o{ casos : tiene
    casos ||--|| fichas_clinicas : contiene
    casos ||--o{ fichas_versiones : versiona
    casos ||--o{ documentos : adjunta
    casos ||--o{ imagenes : contiene
    casos ||--o{ consentimientos : requiere
    imagenes ||--o{ inferencias : analiza
    modelos_ia ||--o{ inferencias : ejecuta
    inferencias ||--o{ nodulos : detecta
    inferencias ||--|| decisiones_medicas : decide
    usuarios ||--o{ fichas_versiones : autor
    usuarios ||--o{ consentimientos : otorga
    usuarios ||--o{ auditoria : realiza
```

## Tablas

| Tabla | Propósito | Requisito |
|---|---|---|
| instituciones | Instituciones (pertenencia A12) | A12 |
| usuarios | Usuarios del sistema | RF-PAC-02 |
| roles | Roles (admin/doctor/researcher) | RF-PAC-02 |
| permisos | Permisos | RF-PAC-02 |
| usuarios_roles | Asignación usuario-rol | RF-PAC-02 |
| roles_permisos | Asignación rol-permiso | RF-PAC-02 |
| pacientes | Paciente seudonimizado (sin datos personales) | RF-PAC-02, A10 |
| identidades_paciente | Identidad cifrada aparte | RF-PAC-02, A10 |
| casos | Caso clínico | RF-PAC-01 |
| fichas_clinicas | Ficha con valores clínicos tipados | RF-CLI-05/06 |
| fichas_versiones | Historial con snapshot | RF-CLI-05 |
| documentos | Documentos con hash y versión (S3) | RF-DOC-03/04, A9 |
| imagenes | Imágenes sin metadatos EXIF/DICOM | RF-IMG-03 |
| modelos_ia | Modelos IA versionados con ruta de pesos | RF-INF-05/06/07 |
| inferencias | Resultado con contrato, umbrales y huella de pesos | RF-INF-05/06/07, RIA-05 |
| nodulos | Nódulo con caja, confianza, clase, probabilidades, región y artefactos | RF-INF-13/14, RIA-09 |
| decisiones_medicas | Decisión médica separada | RF-INF-09 |
| consentimientos | Consentimiento con base legal, versión del texto y vigencia | RF-PAC-06/07 |
| auditoria | Auditoría solo inserción | RF-AUD-08/09, A13 |

## Decisiones

- Identidad cifrada aparte: `pacientes` no contiene datos personales; `identidades_paciente` guarda solo criptogramas (`LargeBinary`).
- Auditoría insert-only: sin `actualizado_en`; PK `BigInteger` con `Identity`; nunca datos clínicos.
- Enums por CHECK: `String` + `CheckConstraint`, no `ENUM` nativo.
- PK UUID con `gen_random_uuid()`.
- Ficha: columnas tipadas para valores clínicos + `fichas_versiones` con `snapshot` JSONB para historial. El cierre guarda `cerrada_en` y `cerrada_por_id` en la ficha; una versión solo se escribe cuando hay cambios reales.
- Documentos nunca sobrescritos: unique (caso_id, nombre_original, version).
- Nódulos: `indice` 1..3 con unique (inferencia_id, indice).
- Inferencia sin `actualizado_en`: resultado en benigno/maligno/sin_nodulo, con ancho, alto, versión del contrato, umbrales y huella de los pesos; el nódulo guarda caja, confianza, origen de la máscara y las rutas de máscara, MGAC, XML y superposición.
- Sin OCR en producción: no existen `extracciones_ocr` ni `campos_ocr` (ADR-020).
- Sin nódulos no se clasifica (RF-INF-13/14): manejado en lógica; el esquema permite cero nódulos.
