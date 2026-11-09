# Decisiones de Storybook (Entrega 0)

Decisiones iniciales para el catálogo Storybook de `optimus-thy-academico`. Cada decisión incluye su razón y, cuando aplica, evidencia en el repositorio. No se duplica el contenido de `DESIGN.md`; la dirección visual se mantiene en ese archivo.

## 1. Estructura de navegación elegida

**Decisión.** La navegación del catálogo usa las raíces `Inicio`, `Aplicación`, `Sistema de diseño` y `Guías y calidad`, con orden explícito en Storybook.

**Razón.** La taxonomía está implementada en `frontend/.storybook/preview.tsx` y validada por `frontend/src/test/taxonomia-stories.test.ts`. Los perfiles de aplicación incluyen Médico, Investigador, Administrador y Pública. No se mantiene la raíz histórica `Pantallas`.

## 2. Mantener `Aplicación/Pública`

**Decisión.** Se mantiene `Aplicación/Pública`.

**Razón.** La superficie pública forma parte del alcance aprobado en `PRODUCT.md` y sus historias siguen en el catálogo. La retirada sugerida por borradores anteriores no aplica.

## 3. No añadir controles sin soporte real en la aplicación

**Decisión.** No se añaden controles/globales de **densidad**, **idioma** ni **contraste** en Storybook.

**Razón.** La aplicación no soporta estas capacidades y Storybook no debe simular funcionalidad inexistente. `frontend/src/styles/tokens.css` define variantes claro/oscuro, pero no tokens de densidad, infraestructura de i18n ni modo de alto contraste. Storybook sí expone tema, shell, movimiento y viewports.

## 4. MSW para estados sin backend

**Decisión.** Usar **MSW** (`msw` + `msw-storybook-addon`) para representar estados sin backend en historias.

**Razón.** Las dependencias ya están instaladas (`frontend/package.json`: `msw` 2.15.0, `msw-storybook-addon`; `msw.workerDirectory` apunta a `public`) y el preview inicializa MSW (`frontend/.storybook/preview.tsx`: `initialize`, `mswLoader`, advertencia de requests no manejadas solo para `/api`). Esto permite cubrir datos, vacío, carga, error y flujos simulados sin acoplar Storybook a un backend vivo. Los handlers deben ser explícitos por historia/área para evitar mocks globales opacos.

## 5. Capturas Playwright en vez de Chromatic

**Decisión.** Usar capturas Playwright y manifiesto local, sin Chromatic. Las capturas críticas se capturan en CI; la comparación contra la línea base versionada es exclusivamente local.

**Razón.** `frontend/e2e/capturas.json` tiene **91** entradas y **18** marcadas como críticas, medidas en el archivo tras la reestructuración del catálogo (2026-11-09). `bun run capturar:comparar` compara en la máquina local; CI no compara porque las fuentes del sistema pueden diferir entre runners. CI ejecuta captura de las críticas y conserva el artefacto.

## 6. Accesibilidad: `a11y` en `todo` global, `error` para lo nuevo

**Decisión.** Mantener `a11y: { test: 'todo' }` global como nivel heredado y exigir `a11y: { test: 'error' }` en componentes y patrones nuevos.

**Razón.** El nivel global permite visibilizar sin bloquear retroactivamente toda historia antigua. Los componentes nuevos declaran `error`. La búsqueda `grep -rn "a11y-deuda" frontend/src` no encontró deuda etiquetada al medir este cierre.

## 7. Baseline de tamaños que solo baja

**Decisión.** El gate de tamaños usa un **baseline ratchet que solo baja**: no se aceptan nuevos archivos sobre límite y los archivos ya baselined no pueden crecer.

**Razón.** `frontend/scripts/tamanos.ts` mide líneas físicas y aplica límites: 220 para UI, 150 para hooks y 300 para el resto y fixtures; excluye tests, specs, stories y el cliente OpenAPI generado. El baseline vive en `frontend/scripts/tamanos-baseline.json` (**9 entradas**, medido en el archivo) y `bun run tamanos --actualizar` registra excesos sin permitir crecimientos. CI ejecuta `bun run ui:check && bun run tamanos` (`.github/workflows/ci.yml`).

## 8. No duplicar la librería dentro de Storybook

**Decisión.** No duplicar componentes, pantallas ni estilos dentro de Storybook; el catálogo debe consumir la implementación real del repositorio.

**Razón.** La fuente de verdad ya existe en `frontend/src/design-system/` (14 átomos, 19 moléculas, 11 organismos, `foundations/`, `tones.ts`, `index.ts`) y en `frontend/src/screens/**`/`frontend/src/pages/**`. Storybook ya está configurado para cargar código fuente con `@storybook/react-vite`, alias/base de Vite, Tailwind 4 y estilos reales (`frontend/.storybook/main.ts`, `frontend/.storybook/preview.tsx`, `frontend/src/styles/tokens.css`). Duplicar implementaciones para “documentarlas” crearía deriva entre catálogo y producto, rompería los gates (`frontend/scripts/comprobar-ui.ts`, `frontend/scripts/tamanos.ts`) y contradiría la política de cutover limpio.

## 9. Despliegue en subpath con HMR y Sablier

**Decisión.** El catálogo se publica en `https://tiroides.andresgaibor.com/storybook/` con HMR y scale-to-zero, servido por nginx del edge hacia Storybook en `127.0.0.1:6104`.

**Razón.** Storybook usa `STORYBOOK_BASE=/storybook/`; HMR usa WebSocket seguro tras Cloudflare. MSW sirve su Service Worker bajo el mismo subpath. La ruta MCP puede quedar expuesta si nginx no la bloquea; el código HTTP observado para `/storybook/mcp` fue **302** al medirlo el 2026-11-08.

## 10. Línea base de regresión visual

**Decisión.** La comparación de capturas contra la línea base versionada se ejecuta localmente; CI solo captura las historias críticas y publica el artefacto.

**Razón.** Las fuentes del sistema pueden variar entre máquinas y generar diferencias irrelevantes en CI. La comparación local se ejecuta con `bun run capturar:comparar`; CI no la ejecuta.

## 11. Estados del patrón

**Decisión.** `Sistema de diseño/Patrones/Estados` es una sola página que cubre vacío, carga, error y sin permiso.

**Razón.** Son estados de una misma superficie y se pueden consultar juntos; no hace falta dividirlos en páginas independientes.

## 12. Documentación de arquitectura y convenciones

**Decisión.** No crear `docs/storybook/arquitectura.md` ni `docs/storybook/convenciones.md`.

**Razón.** Las páginas ya existen como MDX del catálogo en `frontend/src/design-system/foundations/Arquitectura.mdx` y `Convenciones.mdx`.

## 13. Tipos de archivo no admitidos

**Decisión.** `FileDropzone` descarta en silencio los tipos que no cumplen `accept`; el contenedor debe comunicar el error mediante su prop `error`.

**Razón.** El componente no notifica el rechazo por sí mismo. El patrón documenta esta limitación y deja al contenedor la responsabilidad de mostrar el estado sin cambiar la API del componente.

## 14. Errores del listado de pacientes

**Decisión.** Se conserva el comportamiento actual del listado de pacientes, que no distingue respuestas 401, 403 y 500.

**Razón.** Es una carencia conocida de la pantalla. Las historias documentan el resultado observable actual, sin inventar mensajes ni comportamiento no implementados.

## 15. Exposición del endpoint MCP

**Decisión.** El proxy de borde debe bloquear `/storybook/mcp` si el servidor MCP no debe ser accesible públicamente; esta modificación del nginx `optimus-thy-edge` queda fuera de este repositorio.

**Razón.** `bun run catalogo` escucha en `0.0.0.0` y Storybook permite hosts (`allowedHosts: true`). La consulta pública medida devolvió HTTP **302**; el acceso efectivo depende de las reglas de Cloudflare/nginx.
