# Calidad de Storybook

Ejecuta los comandos desde `frontend/`. Cada nivel verifica una parte distinta del catálogo; los gates se complementan y no se sustituyen entre sí.

## Niveles de verificación

| Nivel | Qué verifica | Comando / comprobación |
|---|---|---|
| Render | Renderizado de historias del catálogo | `bun run catalogo:test` |
| Interacciones | Funciones `play`, acciones y aserciones de interacción | `bun run catalogo:test` (o `test-run` MCP para historias seleccionadas) |
| Accesibilidad | Auditorías a11y de las historias | `bun run catalogo:test` (o `test-run` MCP; ejecuta a11y por defecto) |
| Responsive | Revisión de historias con los presets `movil`, `tablet`, `escritorio` y `escritorioAmplio`; capturas críticas en el ancho de referencia | `bun run capturar:criticas` |
| Regresión visual local | Comparación de capturas críticas con la línea base versionada | `bun run capturar:comparar` |
| Gates | Tipos, lint, composición, tamaño, formato y build/catalogación | Comandos de la tabla de gates de abajo |

La regresión visual se compara localmente. CI captura las historias críticas y publica el artefacto, pero no compara PNG entre máquinas porque las fuentes del sistema pueden diferir.

## Regresión visual

La comparación local está implementada en `frontend/e2e/capturar.ts`. `--criticas` limita la ejecución a las capturas críticas, `--comparar` contrasta cada PNG con su línea base en `frontend/e2e/linea-base/` y `--aprobar` actualiza esa línea base. Actualmente hay 12 PNG versionados, todos de 1440×900.

Para comparar, ambas imágenes se cargan en una página de Chromium y se procesan con `createImageBitmap`, `OffscreenCanvas` y `getImageData`. Se cuentan los píxeles en los que algún canal difiere en más de 8/255; la comparación falla si cambian las dimensiones o si la fracción de píxeles diferentes supera 0,005 (0,5 %). El resultado se escribe en `test-results/capturas/diferencias.json`, con `{ nombre, fraccion }` por captura. Si falta la línea base, la captura falla con `sin línea base: ejecuta --aprobar`.

Para aprobar capturas explícitamente contra una instancia, ejecutar desde `frontend/`:

```bash
bun e2e/capturar.ts --base <url> --criticas --anchos 1440x900 --aprobar
bun e2e/capturar.ts --base <url> --criticas --anchos 1440x900 --comparar
```

Los scripts `bun run capturar:criticas` y `bun run capturar:comparar` no especifican `--base`: usan el catálogo por defecto en `http://127.0.0.1:6104` (el de `bun run catalogo`). Para comparar contra otra instancia, hay que pasar `--base` explícitamente.

La sensibilidad medida depende del alcance de cada captura: sustituir `--brand` por `--primitive-red-700` produjo fracciones de hasta 0,0011 y no superó el umbral; sustituir `--background` por `--primitive-gray-900` hizo fallar las 12 capturas, con fracciones de 0,29 a 0,99. Por tanto, el umbral tolera cambios cosméticos de poco peso, como acentos o bordes finos, y detecta cambios de superficie. Para vigilar detalles pequeños, usar una captura de una historia concreta en lugar de una vista completa.

En CI no se comparan imágenes: solo se capturan las 12 historias críticas a 1440×900 y se publica el artefacto `capturas-criticas`. Así se evita comparar PNG entre máquinas cuyas fuentes del sistema pueden diferir.

## Política de accesibilidad

- `todo` es el nivel global heredado para las historias existentes; hace visibles hallazgos sin bloquear retroactivamente el catálogo completo.
- `error` es obligatorio en componentes y patrones nuevos, y en historias que se estabilizan.
- No se desactivan reglas globales para ocultar fallos. Si se deja una excepción justificada, se registra en esta guía con el marcador `a11y-deuda` y la regla axe correspondiente.
- Deudas medidas el 2026-11-08: **ninguna**. La búsqueda `grep -rn "a11y-deuda" frontend/src` no encontró coincidencias.

## Historias pendientes de revisión humana

Las historias con `ai-generated` necesitan revisión en navegador y no cuentan como aprobadas hasta que el revisor elimine esa etiqueta. Para enumerarlas:

```bash
grep -rl "ai-generated" frontend/src --include='*.stories.tsx'
```

## Gates

| Gate | Comando | Alcance |
|---|---|---|
| TypeScript | `bun run typecheck` | Comprueba tipos del frontend. |
| Lint | `bun run lint` | Comprueba reglas ESLint. |
| Render | `bun run catalogo:test` | Ejecuta historias en el navegador del proyecto Storybook. |
| Interacciones | `bun run catalogo:test` | Ejecuta las funciones `play` y sus aserciones. |
| Accesibilidad | `bun run catalogo:test` | Ejecuta pruebas a11y según el nivel declarado por historia. |
| Responsive | `bun run capturar:criticas` | Captura historias críticas en el ancho de referencia; los presets también se pueden seleccionar en la toolbar. |
| Build | `bun run build` y `bun run catalogo:build` | Compila la aplicación y el catálogo Storybook. |
| Documentación | `bun run catalogo:build` y `bun run catalogo:test` | Comprueba que la documentación y las historias integran el catálogo; guardias de JSDoc y tokens forman parte de `bun run test`. |

Excepción consciente al ratchet: `src/design-system/components/organisms/SidebarLayout.tsx` registra 275 líneas en el baseline (antes 252; límite 220) por las 23 líneas añadidas para la ficha JSDoc obligatoria; el resto del archivo no creció. Revísala con `bun run tamanos`.

## Comandos de verificación

```bash
bun run catalogo:test
bun run capturar:criticas
bun run capturar:comparar
bun run ui:check
bun run tamanos
bun run typecheck
bun run lint
bun run format:check
bun run build
bun run catalogo:build
```
