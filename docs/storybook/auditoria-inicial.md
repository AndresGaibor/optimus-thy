# Auditoría inicial de Storybook (Entrega 0)

Documento de auditoría y base de decisiones para el catálogo Storybook del monorepo `optimus-thy-academico`. Toda afirmación se apoya en rutas verificables del repositorio; no se inventan cifras ni se amplían hechos no observados.

## 1. Arquitectura encontrada

- **Monorepo** en la raíz del repositorio, con módulos separados:
  - `frontend/`: React 18.3, TypeScript 5.7 (modo estricto según configuración del proyecto), Vite 6, Tailwind 4 y Bun 1.4 (`frontend/package.json`).
  - `backend/`: FastAPI, SQLAlchemy 2, Alembic, Pydantic v2 y mypy en modo estricto (estructura del módulo `backend/`; validaciones de esquema/contrato en CI: `.github/workflows/ci.yml`).
  - `ia/` y `ocr/`: módulos Python con dependencias instaladas y auditadas en CI (`.github/workflows/ci.yml`, jobs `backend` matriz `[backend, ocr, ia]` y `deps`).
  - `infra/`: nginx, systemd y scripts de respaldo; validación de Compose/nginx en CI (`.github/workflows/ci.yml`, job `compose`; rutas bajo `infra/`).
  - `contracts/openapi.json`: contrato OpenAPI 3.1.0 usado como fuente para el cliente generado (`frontend/package.json` script `gen:api`; verificación en `.github/workflows/ci.yml`).
  - Cliente API generado con `openapi-typescript` hacia `frontend/src/api/schema.d.ts` (`frontend/package.json`; exclusiones del gate UI/tamaños en `frontend/scripts/comprobar-ui.ts` y `frontend/scripts/tamanos.ts`).
- **Frontend UI**: biblioteca propia en `frontend/src/design-system/`, pantallas de demostración/flujo en `frontend/src/screens/**` y páginas reales en `frontend/src/pages/**` (`frontend/src/design-system/index.ts`, estructura bajo `frontend/src/`).
- **Documentación de dirección**: `DESIGN.md` y `PRODUCT.md` en la raíz; decisiones de pantallas en `docs/diseno/pantallas-clave.md`.

## 2. Inventario de componentes

Cifras contadas sobre el árbol actual:

- **Design system** (`frontend/src/design-system/`):
  - `components/atoms/`: **14** componentes de implementación (`*.tsx`, sin stories/tests): `Badge`, `BrandMark`, `Button`, `Card`, `Checkbox`, `Input`, `Label`, `Progress`, `Select`, `Spinner`, `Switch`, `Table`, `Tabs`, `Textarea` (`frontend/src/design-system/components/atoms/`).
  - `components/molecules/`: **19** componentes de implementación: `ActivityTypeBadge`, `AiResultCard`, `Callout`, `ConfidenceBadge`, `EmptyState`, `Field`, `FilterBar`, `OcrField`, `PageHeader`, `Pagination`, `PatientCard`, `RoleBadge`, `SearchInput`, `StatCard`, `StatusBadge`, `SupportNotice`, `Timeline`, `TiradsBadge`, `Toast` (`frontend/src/design-system/components/molecules/`).
  - `components/organisms/`: **11** componentes de implementación: `AuthLayout`, `ConfusionMatrix`, `Dialog`, `FileDropzone`, `ImageViewer`, `PublicFooter`, `PublicNav`, `RoleCard`, `ScanViewport`, `SidebarLayout`, `TrendBars` (`frontend/src/design-system/components/organisms/`).
  - `foundations/`: historias MDX/TSX de fundamentos y documentación (`Introduction.mdx`, `Tokens.stories.tsx`, `TypographyAndLayout.stories.tsx`, `Contenido.stories.tsx`, `Estados.stories.tsx`, `Movimiento.stories.tsx`, `Accesibilidad.stories.tsx`, `Adaptable.stories.tsx`, `Evidencias.stories.tsx`, `Gates.stories.tsx`, `Rendimiento.stories.tsx`, `Shell.stories.tsx`, `Investigación/Imágenes.stories.tsx`) (`frontend/src/design-system/foundations/`).
  - API pública/exportaciones: `frontend/src/design-system/index.ts`; tonos/clases semánticas: `frontend/src/design-system/tones.ts`.
- **Pantallas** (`frontend/src/screens/**`): historias y componentes por dominio `admin/`, `doctor/`, `public/`, `researcher/`, con fixtures compartidas en `frontend/src/screens/fixtures/` y utilidades en `frontend/src/screens/shared/`.
- **Páginas reales** (`frontend/src/pages/**`): incluye `medico/PacientesPage.tsx` con su historia `PacientesPage.stories.tsx`, además de páginas de login, admin y placeholders (`frontend/src/pages/`).

## 3. Estado de Storybook

- **Versión y stack**: Storybook **10.6.6** con framework `@storybook/react-vite` (`frontend/package.json`, `frontend/.storybook/main.ts`).
- **Addons**: `@storybook/addon-docs`, `@storybook/addon-a11y`, `@storybook/addon-themes`, `@storybook/addon-mcp`, `@storybook/addon-vitest` y `msw-storybook-addon` (`frontend/package.json`, `frontend/.storybook/main.ts`).
- **Configuración relevante** (`frontend/.storybook/main.ts`): carga MDX e historias TS/TSX, excluye `__screenshots__`, habilita `componentsManifest` y `experimentalReview`, usa `react-docgen-typescript`, telemetría desactivada y `@tailwindcss/vite`.
- **Preview** (`frontend/.storybook/preview.tsx`): `tags: ['autodocs']` global (no `docs.autodocs`), `a11y: { test: 'todo' }` global, MSW mediante `mswLoader`, cuatro viewports (`movil` 360×800, `tablet` 768×1024, `escritorio` 1366×768 y `escritorioAmplio` 1440×900), globals `theme`, `shell` y `motion`, y las seis raíces ordenadas: `Documentación`, `Fundamentos`, `Sistema de diseño`, `Patrones`, `Aplicación` y `Calidad`.
- **Catálogo vivo**: el índice de `http://127.0.0.1:6114/index.json` y `frontend/catalogo-static/index.json`, medidos el 2026-11-08, coinciden y contienen **591 entradas: 133 páginas de Docs y 458 historias**.
- **Pantallas públicas mantenidas**: `Aplicación/Pública` sigue incluida en la taxonomía aprobada (`PRODUCT.md`) y en el catálogo.

## 4. Dependencias existentes

Dependencias relevantes observadas en `frontend/package.json`:

- **UI/runtime**: `react`, `react-dom`, `react-router-dom`, `tailwindcss`/`@tailwindcss/vite`, Radix (`@radix-ui/react-dialog`, `react-slot`, `react-tabs`), `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`, `openapi-fetch`.
- **Storybook/documentación**: `storybook` 10.6.6, `@storybook/react-vite`, `@storybook/addon-docs`, `@storybook/addon-a11y`, `@storybook/addon-themes`, `@storybook/addon-mcp`, `@storybook/addon-vitest`, `react-docgen-typescript`.
- **Mocking/datos**: `msw` 2.15.0 y `msw-storybook-addon`; `frontend/public/` incluido como `staticDirs` en `frontend/.storybook/main.ts`.
- **Pruebas**: `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `jsdom`.
- **Capturas/E2E visual manual**: `playwright` 1.65.0 y script `frontend/e2e/capturar.ts` (`frontend/package.json` scripts `capturar`).
- **Calidad/gates**: ESLint, Prettier, TypeScript, scripts `ui:check`, `tamanos`, `calidad`, `consulta` (`frontend/package.json`, `frontend/scripts/`).

## 5. Documentación y taxonomía

El catálogo medido contiene **133 páginas de Docs**. Las fichas de componentes documentan cinco secciones JSDoc y su guardia automática.
- **Fichas de componentes**: los 44 componentes (14 átomos, 19 moléculas y 11 organismos) documentan uso, casos en que no aplican, anatomía, accesibilidad y comportamiento responsive mediante cinco secciones JSDoc. `frontend/src/test/componentes-documentados.test.ts` comprueba esas secciones.
- **Distribución de historias**: coexisten documentos de fundamentos, historias de componentes, patrones y superficies de aplicación en `frontend/src/`; los títulos mantienen la taxonomía del catálogo.
- **Taxonomía**: `frontend/src/test/taxonomia-stories.test.ts` valida raíces y segmentos de navegación. La raíz vigente es `Aplicación`, no `Pantallas`.
- **Fuente visual**: `DESIGN.md` conserva la dirección visual; las guías del catálogo la complementan sin duplicarla.

### Excepciones del gate de tamaños

`frontend/scripts/tamanos.ts` registra `src/design-system/components/organisms/SidebarLayout.tsx` en el baseline con **275** líneas (antes 252; límite 220), porque la ficha JSDoc obligatoria de cinco secciones añadió 23 líneas de documentación; el resto del archivo no creció. Es una excepción consciente al ratchet, registrada aquí para que quede trazable.

## 6. Problemas de diseño

- **Controles disponibles**: tema claro/oscuro, shell, movimiento y viewports para móvil, tableta y escritorio. Densidad, idioma y alto contraste siguen sin soporte real en la aplicación y no se simulan en Storybook.
- **Tokens**: `frontend/src/styles/tokens.css` define tokens semánticos, tipografía, espaciado, elevación, movimiento y temas claro/oscuro; no define variantes de densidad, internacionalización ni alto contraste.
- **Superficies de aplicación**: las historias bajo `Aplicación` presentan pantallas y flujos; su agrupación no duplica implementaciones entre `frontend/src/screens/**` y `frontend/src/pages/**`.

## 7. Integraciones

- **MCP de Storybook**: el addon está activo y el endpoint de evidencia es `http://127.0.0.1:6114/mcp`; el catálogo de desarrollo local se sirve en `http://127.0.0.1:6104/mcp` al ejecutar `bun run catalogo`. Se verificaron nueve herramientas: `stories-preview`, `get-storybook-story-instructions`, `stories-changed`, `stories-find-by-component`, `review-create`, `test-run`, `docs-list`, `docs-show` y `docs-show-story`. `review-create` está habilitada por `features.experimentalReview: true`; `test-run` está disponible.
- **Pruebas de historias**: `@storybook/addon-vitest` ejecuta las historias del catálogo con `bun run catalogo:test`; `bun run test` ejecuta el proyecto `app`.
- **Capturas Playwright**: el manifiesto `frontend/e2e/capturas.json` contiene **120** capturas, de las cuales **12** son críticas. `capturar:criticas` genera capturas y `capturar:comparar` las compara con una línea base local versionada. CI captura las 12 críticas, publica el artefacto y no compara imágenes entre máquinas.
- **CI**: el workflow ejecuta lint, `ui:check`, `tamanos`, formato, tipos, pruebas, build, `catalogo:build` y `catalogo:test` como gates.

## 8. Dependencias y configuración activa

- Se mantiene la política de no añadir dependencias para capacidades que ya cubren Storybook, MSW, Vitest y Playwright.
- `@storybook/addon-mcp`, `@storybook/addon-vitest`, `msw-storybook-addon` y `@storybook/addon-a11y` forman parte del flujo activo del catálogo.
- No se añaden Chromatic ni controles de densidad, idioma o contraste: no existe soporte equivalente en la aplicación.

## 9. Riesgos y decisiones vigentes

| Riesgo | Impacto | Evidencia / mitigación |
|---|---|---|
| La comparación visual usa fuentes y línea base locales | Los resultados pueden diferir entre máquinas; CI no compara imágenes | `capturar:comparar` compara localmente contra la línea base versionada. CI captura y publica las 12 historias críticas sin comparar. |
| `Aplicación/Pública` se conserva | Difiere de propuestas antiguas que retiraban esa superficie | Alcance aprobado en `PRODUCT.md`; la decisión está documentada en `docs/storybook/decisiones.md`. |
| Accesibilidad con niveles graduales | Historias legadas pueden mostrar hallazgos sin bloquear el catálogo | El estado global permanece en `todo`; los componentes y patrones nuevos deben usar `error`. No hay marcadores `a11y-deuda` en `frontend/src` al medir esta auditoría. |
| MCP bajo el subpath público | El servidor MCP podría quedar expuesto si el proxy no bloquea la ruta | La petición medida a `https://tiroides.andresgaibor.com/storybook/mcp` respondió **302**; el endpoint local escucha con `allowedHosts: true`. Ver `docs/storybook/integracion-agentes.md`. |
| Densidad, idioma y alto contraste sin soporte | No se pueden verificar variantes inexistentes | No simularlas en Storybook; reevaluar cuando la app las implemente. |
| Crecimiento de archivos UI | Reduce mantenibilidad | `frontend/scripts/tamanos.ts` aplica límites con baseline ratchet. |
