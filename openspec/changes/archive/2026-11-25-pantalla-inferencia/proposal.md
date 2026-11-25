## Why

La ruta `/medico/inferencia` todavía monta `PlaceholderPage` («Vista en preparación»). El servicio de IA ya carga los tres modelos y responde `POST /inferir` con el contrato 1.1, y el backend ya encola trabajos de inferencia, pero el médico no tiene pantalla para lanzarla ni para leer el resultado por nódulo.

## What Changes

- **Pantalla de inferencia por paciente**: `/medico/pacientes/:id/inferencia` monta `InferenciaPacientePage` en lugar del marcador; `/medico/inferencia` la reutiliza sin paciente seleccionado.
- **Ejecución desde la ficha**: se elige una imagen del caso, se lanza la inferencia y se muestra el estado del trabajo hasta que termina.
- **Resultado por nódulo**: índice, clase, probabilidad de benigno y maligno, confianza del detector, caja y artefactos cuando el contrato los trae.
- **Estados explícitos**: carga, vacío y error con reintento; el resultado lleva el aviso «apoyo, no diagnóstico».
- **Sin datos inventados**: si el contrato no trae artefactos o no hay imagen, la pantalla lo dice y no simula contenido.

## Impact

- Interfaz: `InferenciaPacientePage`, `ResultadoNodulo`, `AppRoutes`, `api/pacientes.ts` y el mapa de pantallas.
- API: sin cambios; consume `POST /trabajos`, `GET /trabajos/{id}` e `GET /casos/{id}/inferencias` ya existentes.
- Sin dependencias nuevas ni migraciones.
