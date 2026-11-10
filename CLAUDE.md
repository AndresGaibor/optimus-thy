# OPTIMUS-THY — instrucciones para agentes

Sistema web de gestión de datos clínicos con IA para cáncer de tiroides (tesis ESPOCH, Gaibor y Quiguiri). Se construye desde cero. `docs/referencia/` es material de consulta (solo lectura): el repo mockup anterior no es fuente de verdad y nada de lo que hay allí cuenta como hecho.

## Estructura

| Carpeta | Contenido |
| --- | --- |
| `frontend/` | React + TypeScript + Vite, gestor `bun` |
| `backend/` | Python 3.12, FastAPI, SQLAlchemy, Alembic, PostgreSQL |
| `ia/` | Servicio de IA aparte (cadena YOLO, MGAC, BGAU-Net, Swin) |
| `ocr/` | OCR local: Tesseract (español) + PyMuPDF + reglas por campo |
| `infra/` | Docker, scripts y configuración de despliegue |
| `contracts/` | `openapi.json`, contrato de la API (lo exporta el backend) |
| `docs/` | Requisitos, ADR, decisiones. `docs/referencia/` = paquete de consulta |

## Comandos

- `make up` / `make down`: entorno completo con Docker Compose, sin GPU.
- `make check`: formato, tipos, pruebas y build de todo lo que exista (lo mismo que corre CI).
- Backend (desde `backend/`): `ruff format --check .`, `ruff check .`, `mypy app`, `pytest`.
- Frontend (desde `frontend/`): `bun run lint`, `bun run format:check`, `bun run typecheck`, `bun run test`, `bun run build`.

## Flujo de trabajo

- Linear es la única fuente de verdad del trabajo: equipo `TESIS`, proyecto «OPTIMUS-THY · Backlog de producto». Cada historia es un issue `TES-nnn` que lleva su ID de backlog en el título (`HU-001 · …`, `HT-007 · …`).
- GitHub es solo para código, PR e integración continua: no se abren issues en GitHub ni se replica el estado de las tareas en archivos del repositorio.
- Este repo (producción) consulta el tablero, solo en lectura, con `make tareas`; filtra con `ARGS="--estado progress"`, `ARGS="--estado revision"`, `ARGS="--estado done"`, `ARGS="--estado todo"` o `ARGS="--persona daniel"`.
- Desde aquí **no** se cambia el estado ni ningún otro campo del issue: el estado lo mueve únicamente el repo `optimus-thy-academico`, su dueño.
- El progreso de este repo se registra como comentario: `make comentar ISSUE=TES-nnn TEXTO="…"`. Las notas locales que no se commitean también valen.
- Un pull request por historia (`HT-xxx` / `HU-xxx`). Rama `ht-001-estructura`, commit `tipo(HT-001): resumen`.
- La rama `main` solo recibe cambios por PR con integración continua en verde. El PR cita requisito, historia e issue de Linear.
- Catálogo de requisitos y backlog: `docs/referencia/04-requisitos/`, `docs/referencia/05-backlog/`.
- Una historia de más de 8 h se parte.

## Reglas

- Sin secretos en el repo: solo `.env.example` con valores de ejemplo.
- Sin datos personales ni clínicos en logs, errores, fixtures ni commits. Pacientes y fichas de prueba son sintéticos.
- Los errores al cliente nunca muestran detalles internos (trazas, SQL, rutas).
- Pesos de modelos (`*.keras`, `*.pt`, `*.onnx`) no se commitean.
- Diseño: tokens del sistema de diseño, nunca colores ni espaciados literales. Normal / benigno / maligno no dependen solo del color.
- "Normal" significa "sin nódulo detectado" (pendiente visto bueno del director).
- Tooling elegido: pytest, Vitest, Playwright. No añadir dependencias para lo que hacen unas líneas.

## Diseño y verificación de UI

- El dueño visual es `frontend/src/design-system/`. Fuera de ahí no se escriben controles HTML crudos, colores literales, valores arbitrarios de Tailwind ni `style={{}}`.
- Escalera: token (`frontend/src/styles/tokens.css`) → átomo → molécula → organismo → página. La página solo elige, ordena y pasa datos.
- Ejecuta `cd frontend && bun run ui:check` y `cd frontend && bun run tamanos` al cambiar UI; `make check` encadena ambos gates.
- `DESIGN.md` es la dirección que se preserva. `no-ai-design-slop` es un gate pasivo de criterio, no permiso para rediseñar; un rediseño se pide.
- Antes de barrer el repo, obtiene contexto con `bun scripts/contexto.ts task <área>`.
- Para afirmar cómo se ve algo, abre el PNG o el `iframe.html` de su historia; el código por sí solo no es evidencia visual.

## Estilo

Prosa mínima en el chat; código, documentos, commits e issues en español normal y claro.

## Storybook y sistema de diseño

- Antes de implementar UI, consulta el MCP `storybook` (`http://127.0.0.1:6104/mcp`): `docs-list` para el índice, `docs-show` para la documentación de un componente, `docs-show-story` para una historia concreta.
- No inventes props, variantes, tonos ni tamaños: lo que no aparezca en la documentación del componente o en sus historias no existe.
- Reutiliza `frontend/src/design-system/` (barril `index.ts`) antes de componer nada nuevo; fuera de ahí no hay controles ni estilos propios.
- Raíces del catálogo: `Inicio`, `Aplicación`, `Sistema de diseño`, `Guías y calidad`. Ubica cada historia en la raíz que le corresponde.
- Toda historia nueva es CSF3 tipada (`Meta`/`StoryObj`) y cubre sus estados reales: carga, vacío, error y los que apliquen. Los estados interactivos llevan `play` con `expect`.
- Datos sintéticos y rotulados como tales; nunca datos de pacientes ni información clínica real.
- Verifica con `cd frontend && bun run ui:check`, `bun run tamanos` y `bun run catalogo:build`; para evidencia visual usa `bun run capturar --base http://127.0.0.1:6114` y abre el PNG antes de opinar.

- Al crear o modificar un componente, documenta sus cinco secciones JSDoc (`Cuándo usarlo`, `Cuándo no usarlo`, `Anatomía`, `Accesibilidad`, `Responsive`); la guardia `componentes-documentados` debe cubrirlo.
- Toda historia escrita por un agente lleva `tags: ['ai-generated']` hasta que una persona la revise en navegador, valide tokens/estados/accesibilidad y elimine la etiqueta.
- Sigue el flujo obligatorio de `docs/storybook/integracion-agentes.md`: buscar en catálogo → consultar API → leer ejemplos → revisar patrones → implementar con la librería real → escribir historias → probar → previsualizar → corregir → informar de documentación faltante. Si falta API o regla funcional, pide aclaración; no inventes props.
- Antes de terminar: `bun run catalogo:test`, accesibilidad, `typecheck`, `lint`, `catalogo:build`, revisar la previsualización e informar de la documentación que falte.
- No crear componentes duplicados, no saltarse el sistema de diseño, no tocar la inferencia clínica ni exponer datos sensibles.
