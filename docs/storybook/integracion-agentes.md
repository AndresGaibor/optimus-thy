# Integración de agentes con Storybook

## Servidores y herramientas

- **Desarrollo local:** `http://127.0.0.1:6104/mcp`, disponible al ejecutar `cd frontend && bun run catalogo`.
- **Instancia de evidencia:** `http://127.0.0.1:6114/mcp`.

El MCP ofrece nueve herramientas verificadas:

| Herramienta | Uso |
|---|---|
| `docs-list` | Descubrir componentes y páginas documentadas; con `withStoryIds: true` también devuelve los IDs de historias. |
| `docs-show` | Consultar API, props y ejemplos documentados de un componente o página. |
| `docs-show-story` | Consultar documentación de una historia concreta mediante su `storyId`. |
| `get-storybook-story-instructions` | Obtener las reglas específicas para crear o modificar historias. |
| `stories-preview` | Obtener URL(s) de previsualización directa de historias. |
| `stories-changed` | Consultar metadatos de historias nuevas, modificadas o relacionadas. |
| `stories-find-by-component` | Encontrar historias consumidoras de archivos de componentes. |
| `test-run` | Ejecutar los play y pruebas de accesibilidad de historias seleccionadas. |
| `review-create` | Publicar una revisión visual curada; requiere `features.experimentalReview: true`. |

Ejemplos de llamadas JSON-RPC a la instancia de evidencia (cambie la URL por `6104` para desarrollo local):

```bash
MCP=http://127.0.0.1:6114/mcp
HEADERS=(-H 'Content-Type: application/json' -H 'Accept: application/json, text/event-stream')

# Descubrir componentes, Docs y story IDs
curl -s -X POST "$MCP" "${HEADERS[@]}" -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"docs-list","arguments":{"withStoryIds":true}}}'
# Consultar API/props usando un ID descubierto por docs-list
curl -s -X POST "$MCP" "${HEADERS[@]}" -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"docs-show","arguments":{"id":"sistema-de-diseño-átomos-button--docs"}}}'

# Consultar una variante usando un storyId descubierto por docs-list
curl -s -X POST "$MCP" "${HEADERS[@]}" -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"docs-show-story","arguments":{"storyId":"sistema-de-diseño-átomos-button--predeterminado"}}}'

# Ejecutar una historia seleccionada por su ID real del catálogo
curl -s -X POST "$MCP" "${HEADERS[@]}" -d '{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"test-run","arguments":{"stories":[{"storyId":"sistema-de-diseño-átomos-button--predeterminado"}]}}}'
```

Los IDs de ejemplo corresponden al catálogo medido; para otras historias siempre descubrir los IDs con `docs-list` y no deducirlos de nombres de archivos.

## Flujo obligatorio de trabajo

1. **Buscar** en el catálogo con `docs-list` y localizar piezas existentes.
2. **Consultar la API** con `docs-show` para confirmar props y tipos.
3. **Leer ejemplos** con `docs-show-story` para ver combinaciones y estados reales.
4. **Revisar patrones** de `Patrones` y las instrucciones de historias con `get-storybook-story-instructions`.
5. **Implementar** con la librería real exportada por el sistema de diseño.
6. **Escribir historias** tipadas que cubran los estados relevantes y las interacciones reproducibles.
7. **Probar** con `test-run` para una selección enfocada o `bun run catalogo:test` para las historias del catálogo.
8. **Previsualizar** con `stories-preview` y revisar la historia en el navegador.
9. **Corregir** los problemas observados y repetir las comprobaciones aplicables.
10. **Informar** qué documentación falta y qué no pudo comprobarse.

**Regla dura:** si la API necesaria no existe o la regla funcional no está documentada, se pide aclaración; no se inventan props ni comportamiento.

## Revisión humana de `ai-generated`

Las historias escritas por agentes llevan `tags: ['ai-generated']` hasta que una persona las revise. Una historia con esa etiqueta no cuenta como aprobada aunque compile y pase sus pruebas. Para aprobarla, el PR necesita una persona revisora que:

1. Ejecute la historia en el navegador.
2. Compruebe tokens, estados y accesibilidad usando `Guías y calidad/Gates de calidad`.
3. Elimine `ai-generated` en el mismo PR.

## Seguridad

`bun run catalogo` enlaza el servidor de Storybook a `0.0.0.0` y la configuración de Vite declara `allowedHosts: true`. El subpath `/storybook/` se publica tras Cloudflare/nginx, así que `/storybook/mcp` queda accesible públicamente si el proxy no lo bloquea.

Medición del 2026-11-08: `curl -s -o /dev/null -w '%{http_code}' https://tiroides.andresgaibor.com/storybook/mcp` devolvió **302**. La respuesta no fue HTTP 200, por lo que esta medición no demuestra que el cuerpo MCP sea accesible sin autenticación. Si la ruta llegara a responder 200 con cuerpo MCP, es un riesgo abierto y debe bloquearse en nginx de borde con `location = /storybook/mcp { return 404; }`. Ese nginx pertenece a `optimus-thy-edge`, fuera de este repositorio; aquí no se puede aplicar el bloqueo.

## Prueba de integración

**Resultado: superada.**
> **Nota (2026-11-09).** Los IDs `aplicación-médico-*` citados en esta prueba de integración (por ejemplo `aplicación-médico-caso` y `aplicación-médico-gestión-de-casos--*`) pertenecen a pantallas retiradas del catálogo el 2026-11-08. Hoy el patrón equivalente se consulta con `sistema-de-diseño-patrones-flujos-clínicos` (y las pantallas reales vigentes viven en `aplicación-médico-pacientes-hu-031`, `aplicación-pública-*` y `aplicación-administrador-*` con sufijo HU).

El agente creó la pantalla `frontend/src/screens/doctor/CaseManagementScreen.tsx` y la historia `frontend/src/screens/doctor/CaseManagementScreen.stories.tsx`, con título `Aplicación/Médico/Gestión de casos`.

### Enunciado entregado al agente

> Crear la pantalla de gestión de casos para el perfil Médico, usando `casosClinicos` de `src/screens/fixtures/casos-extra.ts`; cubrir carga, vacío, error y datos, además de los casos «pendiente de revisión» e «información incompleta». Reutilizar componentes existentes, no inventar props y mantener claro que la IA no diagnostica.

### Consultas al catálogo que hizo

- `bun run consulta -- list`
- `bun run consulta -- show --id aplicación-médico-caso`
- `bun run consulta -- show --id patrones-flujos-clínicos`
- `bun run consulta -- show --id aplicación-médico-panel`

### Resultado y criterios de aceptación

La historia incluye seis variantes, todas con `play` y `parameters: { a11y: { test: 'error' } }`:

| Historia | ID |
|---|---|
| `Datos` | `aplicación-médico-gestión-de-casos--datos` |
| `Cargando` | `aplicación-médico-gestión-de-casos--cargando` |
| `Vacio` | `aplicación-médico-gestión-de-casos--vacio` |
| `Error` | `aplicación-médico-gestión-de-casos--error` |
| `PendienteDeRevision` | `aplicación-médico-gestión-de-casos--pendiente-de-revision` |
| `InformacionIncompleta` | `aplicación-médico-gestión-de-casos--informacion-incompleta` |

La historia mantiene `tags: ['ai-generated']`. Sus imports de interfaz provienen únicamente de `../../design-system` y `../shared/ScreenFrame`; no usa HTML crudo ni colores literales (`bun run ui:check` en 0). Las props utilizadas existen en los componentes reales y se verificaron; `bun run tamanos` quedó en 0, bajo el límite de tamaño.

### Defectos encontrados y resolución

- `test-run` detectó que el `play` de `Error` esperaba `role="alert"`, pero el `Callout` de error renderizaba `role="note"`. Se corrigió el componente pasando `role="alert"` al `Callout`; no se rebajó la aserción.
- Axe detectó la regla `heading-order`; se resolvió cambiando `EmptyState` a `as="h2"`.
- Antes del arreglo, `test-run` pasaba cinco historias y fallaba `--error`. Después, la ejecución por archivo informó `Test Files 1 passed (1)` y `Tests 6 passed (6)`.

### Conclusión

El agente consultó el catálogo antes de escribir y no inventó ninguna API; la prueba de integración se considera superada. La etiqueta `ai-generated` permanece a la espera de revisión humana.
