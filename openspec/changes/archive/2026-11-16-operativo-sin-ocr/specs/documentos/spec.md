# Spec Delta

## Purpose

Gestionar los documentos de un caso con almacenamiento íntegro y versionado, sin procesamiento OCR en producción.

## ADDED Requirements

### Requirement: Documentos sin extracción automática

El sistema SHALL almacenar los documentos del caso con su nombre original, huella SHA-256 y versión, y SHALL NOT ejecutar extracción OCR ni ofrecer estados de procesamiento OCR.

#### Scenario: Documento almacenado sin OCR

- **WHEN** el médico adjunta un documento a un caso
- **THEN** el documento queda registrado con su huella y su versión
- **AND** el sistema no crea registros de extracción ni campos extraídos

#### Scenario: Estado de un documento

- **WHEN** se consulta un documento
- **THEN** su estado no incluye valores de procesamiento OCR

### Requirement: Sin servicio de OCR en producción

El despliegue de producción SHALL NOT exponer un servicio de OCR ni una variable de entorno que apunte a uno.

#### Scenario: Contenedores desplegados

- **WHEN** se levanta el entorno de producción con Docker Compose
- **THEN** no existe el servicio `ocr`
- **AND** el backend no recibe `OCR_URL`
