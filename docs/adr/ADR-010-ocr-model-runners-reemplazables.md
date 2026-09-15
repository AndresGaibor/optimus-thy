# ADR-010 — OCRRunner y ModelRunner reemplazables

- **Estado:** Aceptada
- **Fecha:** 2026-09-15
- **Responsable:** Andrés
- **Issue Linear:** TES-4

## Contexto

El OCR definitivo y el modelo oficial pueden cambiar durante el proyecto. Acoplar casos de uso a PaddleOCR, Tesseract, PyTorch o scripts concretos haría costosa cualquier sustitución.

## Alternativas consideradas

1. Invocar directamente cada librería/modelo desde los casos de uso.
2. Crear un servicio genérico único para OCR e IA.
3. Definir puertos independientes `OCRRunner` y `ModelRunner` con adaptadores reemplazables.

## Decisión

OCR e inferencia tiroidea se integran mediante puertos separados y reemplazables.

## Justificación

Permite sustituir motores/modelos sin reescribir dominio/API y mantiene separados dos procesos con entradas, resultados y métricas distintas.

## Consecuencias

- Los adaptadores deben normalizar errores y resultados hacia contratos internos.
- Benchmarks de OCR y de IA se evalúan por separado.
- Las implementaciones demo no se confunden con el modelo/servicio definitivo.

## Evidencia

- Linear: TES-4.
- Registro académico: pestaña `Decisiones` del Sheet Tesis.