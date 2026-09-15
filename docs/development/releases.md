# Estrategia de versiones y releases — OPTIMUS-THY

## Objetivo

Mantener puntos de referencia reproducibles del producto para demostraciones, pruebas, tesis y defensa sin crear releases vacías antes de que exista software verificable.

## Versiones previstas

- `v0.1.0` — cierre de Ola 1: base técnica, autenticación y primer flujo vertical de pacientes.
- `v0.5.0` — corte de medio ciclo (13/11/2026): producto aproximadamente al 75% y módulos principales demostrables.
- `v0.9.0-rc.1` — segundo avance (23/12/2026): release candidata, integración y pruebas finales.
- `v1.0.0` — exposición de fin de ciclo (05/01/2027): producto 100% demostrable y documentación técnica actualizada.

## Regla de creación

Una release se crea únicamente cuando el hito asociado cumple su Definition of Done. No usar tags para simular progreso.

## Evidencia mínima de cada release

- commit/tag exacto;
- fecha;
- milestone/hito relacionado;
- principales issues incluidos;
- tests/verificaciones ejecutadas;
- limitaciones conocidas;
- enlace a evidencias relevantes de la tesis.

## Convención

Usar versionado semántico de forma pragmática. Las versiones `0.x` representan el desarrollo previo a la entrega final; `v1.0.0` representa la versión defendible del trabajo de titulación.

## Relación con Linear y la tesis

El milestone define **qué resultado debe existir**. La release conserva **qué versión exacta del software demostró ese resultado**. El Sheet `Evidencias` registra después dónde se utilizó esa versión en pruebas, capturas, métricas o anexos.