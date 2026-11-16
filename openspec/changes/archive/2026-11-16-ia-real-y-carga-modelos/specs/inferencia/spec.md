# Spec Delta

## REMOVED Requirements

### Requirement: Registro acotado al modelo entregado

Una inferencia SHALL registrar el resultado, su confianza, el tiempo de ejecución y, por cada nódulo, su índice, su caja y la confianza del detector. El sistema SHALL NOT exigir máscara, región analizada ni probabilidades separadas.

## ADDED Requirements

### Requirement: Evidencia por nódulo

Una inferencia SHALL registrar, por cada nódulo, su índice, su caja, la confianza del detector y el origen de la máscara. Cuando el contrato traiga artefactos, SHALL guardar las rutas de la máscara final, la máscara MGAC, el XML Pascal-VOC y la superposición.

#### Scenario: Contrato con artefactos

- **WHEN** el servicio de IA devuelve una inferencia con artefactos por nódulo
- **THEN** cada nódulo guarda las rutas de sus cuatro artefactos
- **AND** la inferencia guarda ancho, alto, versión del contrato, umbrales y huella de los modelos

#### Scenario: Contrato sin artefactos

- **WHEN** el servicio devuelve una inferencia sin artefactos
- **THEN** las rutas quedan nulas y la inferencia se registra igual

### Requirement: Inferencia inmutable

Una inferencia registrada SHALL NOT modificarse; la corrección del médico vive en `decisiones_medicas`.

#### Scenario: Corrección posterior

- **WHEN** el médico corrige el resultado
- **THEN** se crea una decisión médica y la inferencia original no cambia
