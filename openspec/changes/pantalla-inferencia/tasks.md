## 1. Interfaz

- [x] 1.1 `InferenciaPacientePage` con selección de imagen del caso.
- [x] 1.2 Lanzamiento del trabajo y seguimiento de su estado.
- [x] 1.3 Resultado por nódulo con clase, probabilidades, confianza y caja.
- [x] 1.4 Artefactos del contrato cuando existan; aviso cuando no.
- [x] 1.5 Estados de carga, vacío y error con reintento.
- [x] 1.6 Aviso «apoyo, no diagnóstico» en el resultado.

## 2. Rutas y datos

- [x] 2.1 `/medico/pacientes/:id/inferencia` monta la pantalla real.
- [x] 2.2 Cliente de API con los endpoints existentes, sin inventar rutas.
- [x] 2.3 Mapa de pantallas actualizado.

## 3. Pruebas

- [x] 3.1 Pruebas de la pantalla: ejecución, resultado, vacío y error.
- [x] 3.2 Historias del catálogo para los estados reales.

## 4. Cierre

- [x] 4.1 `bun run typecheck`, `lint`, `test`, `ui:check` y build en verde.
- [ ] 4.2 Despliegue y archivo del change.
