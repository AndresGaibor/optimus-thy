# Informe de reorganización del catálogo Storybook

Fecha: 9 de noviembre de 2026. Alcance: las cuatro fases del plan de reorganización sobre `frontend/.storybook`, las historias y la documentación del catálogo.

## 1. Conteos

| Medida | Antes | Después |
|---|---|---|
| Entradas del índice | 390 | 379 |
| Títulos | 96 | 99 |
| Historias | 294 | 280 |
| Páginas Docs | 96 | 99 |

El «antes» es el índice vivo medido al empezar, no las 383 entradas que citaba `docs/storybook/inventario-catalogo.md`, que no contaban las 7 entradas de `Recuperar contraseña` sin commitear. La diferencia se explica así: se eliminaron 21 historias duplicadas por tema o ancho; se añadieron 7 historias (6 flujos y la revisión en tema oscuro) y 3 páginas Docs (`Aplicación/Mapa de pantallas`, `Aplicación/Flujos`, `Sistema de diseño/Fundamentos/Temas en oscuro`).

## 2. Títulos e identificadores que cambian

62 de los 99 títulos cambian. Tabla: título nuevo, identificador nuevo, título anterior, identificador anterior.

|Título nuevo|ID nuevo|Título anterior|ID anterior|
|---|---|---|---|
|`Aplicación/Administrador/Gestión de usuarios (HU-010)`|`aplicación-administrador-gestión-de-usuarios-hu-010`|`Aplicación/Administrador/Gestión de usuarios`|`aplicación-administrador-gestión-de-usuarios`|
|`Aplicación/Administrador/Roles y permisos (HU-011)`|`aplicación-administrador-roles-y-permisos-hu-011`|`Aplicación/Administrador/Roles y permisos`|`aplicación-administrador-roles-y-permisos`|
|`Aplicación/Pública/Acceso (HU-001)`|`aplicación-pública-acceso-hu-001`|`Aplicación/Pública/Acceso`|`aplicación-pública-acceso`|
|`Aplicación/Pública/Recuperar contraseña (HU-111)`|`aplicación-pública-recuperar-contraseña-hu-111`|`Aplicación/Pública/Recuperar contraseña`|`aplicación-pública-recuperar-contraseña`|
|`Guías y calidad/Accesibilidad`|`guías-y-calidad-accesibilidad`|`Calidad/Accesibilidad`|`calidad-accesibilidad`|
|`Guías y calidad/Contenido y microcopy`|`guías-y-calidad-contenido-y-microcopy`|`Calidad/Contenido y microcopy`|`calidad-contenido-y-microcopy`|
|`Guías y calidad/Diseño adaptable`|`guías-y-calidad-diseño-adaptable`|`Calidad/Diseño adaptable`|`calidad-diseño-adaptable`|
|`Guías y calidad/Estados y casos límite`|`guías-y-calidad-estados-y-casos-límite`|`Calidad/Estados y casos límite`|`calidad-estados-y-casos-límite`|
|`Guías y calidad/Evidencias visuales`|`guías-y-calidad-evidencias-visuales`|`Calidad/Evidencias visuales`|`calidad-evidencias-visuales`|
|`Guías y calidad/Evidencias visuales/Imágenes anonimizadas`|`guías-y-calidad-evidencias-visuales-imágenes-anonimizadas`|`Calidad/Evidencias visuales/Imágenes anonimizadas`|`calidad-evidencias-visuales-imágenes-anonimizadas`|
|`Guías y calidad/Gates de calidad`|`guías-y-calidad-gates-de-calidad`|`Calidad/Gates de calidad`|`calidad-gates-de-calidad`|
|`Guías y calidad/Rendimiento`|`guías-y-calidad-rendimiento`|`Calidad/Rendimiento`|`calidad-rendimiento`|
|`Inicio/Arquitectura`|`inicio-arquitectura`|`Documentación/Arquitectura`|`documentación-arquitectura`|
|`Inicio/Changelog`|`inicio-changelog`|`Documentación/Changelog`|`documentación-changelog`|
|`Inicio/Cómo contribuir`|`inicio-cómo-contribuir`|`Documentación/Cómo contribuir`|`documentación-cómo-contribuir`|
|`Inicio/Convenciones de desarrollo`|`inicio-convenciones-de-desarrollo`|`Documentación/Convenciones de desarrollo`|`documentación-convenciones-de-desarrollo`|
|`Inicio/Instalación y configuración`|`inicio-instalación-y-configuración`|`Documentación/Instalación y configuración`|`documentación-instalación-y-configuración`|
|`Inicio/Introducción`|`inicio-introducción`|`Documentación/Introducción`|`documentación-introducción`|
|`Inicio/Primeros pasos`|`inicio-primeros-pasos`|`Documentación/Primeros pasos`|`documentación-primeros-pasos`|
|`Sistema de diseño/Fundamentos/Bordes y radios`|`sistema-de-diseño-fundamentos-bordes-y-radios`|`Fundamentos/Bordes y radios`|`fundamentos-bordes-y-radios`|
|`Sistema de diseño/Fundamentos/Colores`|`sistema-de-diseño-fundamentos-colores`|`Fundamentos/Colores`|`fundamentos-colores`|
|`Sistema de diseño/Fundamentos/Dimensiones`|`sistema-de-diseño-fundamentos-dimensiones`|`Fundamentos/Dimensiones`|`fundamentos-dimensiones`|
|`Sistema de diseño/Fundamentos/Espaciado`|`sistema-de-diseño-fundamentos-espaciado`|`Fundamentos/Espaciado`|`fundamentos-espaciado`|
|`Sistema de diseño/Fundamentos/Grid y breakpoints`|`sistema-de-diseño-fundamentos-grid-y-breakpoints`|`Fundamentos/Grid y breakpoints`|`fundamentos-grid-y-breakpoints`|
|`Sistema de diseño/Fundamentos/Iconografía`|`sistema-de-diseño-fundamentos-iconografía`|`Fundamentos/Iconografía`|`fundamentos-iconografía`|
|`Sistema de diseño/Fundamentos/Ilustraciones`|`sistema-de-diseño-fundamentos-ilustraciones`|`Fundamentos/Ilustraciones`|`fundamentos-ilustraciones`|
|`Sistema de diseño/Fundamentos/Movimiento y animaciones`|`sistema-de-diseño-fundamentos-movimiento-y-animaciones`|`Fundamentos/Movimiento y animaciones`|`fundamentos-movimiento-y-animaciones`|
|`Sistema de diseño/Fundamentos/Sombras y elevación`|`sistema-de-diseño-fundamentos-sombras-y-elevación`|`Fundamentos/Sombras y elevación`|`fundamentos-sombras-y-elevación`|
|`Sistema de diseño/Fundamentos/Temas`|`sistema-de-diseño-fundamentos-temas`|`Fundamentos/Temas`|`fundamentos-temas`|
|`Sistema de diseño/Fundamentos/Temas en oscuro`|`sistema-de-diseño-fundamentos-temas-en-oscuro`|`Fundamentos/Temas en oscuro`|`fundamentos-temas-en-oscuro`|
|`Sistema de diseño/Fundamentos/Tipografía`|`sistema-de-diseño-fundamentos-tipografía`|`Fundamentos/Tipografía`|`fundamentos-tipografía`|
|`Sistema de diseño/Fundamentos/Tipografía en contexto`|`sistema-de-diseño-fundamentos-tipografía-en-contexto`|`Fundamentos/Tipografía en contexto`|`fundamentos-tipografía-en-contexto`|
|`Sistema de diseño/Fundamentos/Tokens semánticos`|`sistema-de-diseño-fundamentos-tokens-semánticos`|`Fundamentos/Tokens semánticos`|`fundamentos-tokens-semánticos`|
|`Sistema de diseño/Moléculas/AiResultCard`|`sistema-de-diseño-moléculas-airesultcard`|`Sistema de diseño/Moléculas/Resultado de IA`|`sistema-de-diseño-moléculas-resultado-de-ia`|
|`Sistema de diseño/Moléculas/OcrField`|`sistema-de-diseño-moléculas-ocrfield`|`Sistema de diseño/Moléculas/Campo OCR`|`sistema-de-diseño-moléculas-campo-ocr`|
|`Sistema de diseño/Moléculas/PatientCard`|`sistema-de-diseño-moléculas-patientcard`|`Sistema de diseño/Moléculas/Tarjeta de paciente`|`sistema-de-diseño-moléculas-tarjeta-de-paciente`|
|`Sistema de diseño/Moléculas/SupportNotice`|`sistema-de-diseño-moléculas-supportnotice`|`Sistema de diseño/Moléculas/Aviso de apoyo clínico`|`sistema-de-diseño-moléculas-aviso-de-apoyo-clínico`|
|`Sistema de diseño/Organismos/AuthLayout`|`sistema-de-diseño-organismos-authlayout`|`Sistema de diseño/Organismos/Marco de acceso`|`sistema-de-diseño-organismos-marco-de-acceso`|
|`Sistema de diseño/Organismos/ConfusionMatrix`|`sistema-de-diseño-organismos-confusionmatrix`|`Sistema de diseño/Organismos/Matriz de confusión`|`sistema-de-diseño-organismos-matriz-de-confusión`|
|`Sistema de diseño/Organismos/Dialog`|`sistema-de-diseño-organismos-dialog`|`Sistema de diseño/Organismos/Diálogo`|`sistema-de-diseño-organismos-diálogo`|
|`Sistema de diseño/Organismos/FileDropzone`|`sistema-de-diseño-organismos-filedropzone`|`Sistema de diseño/Organismos/Zona de archivos`|`sistema-de-diseño-organismos-zona-de-archivos`|
|`Sistema de diseño/Organismos/ImageViewer`|`sistema-de-diseño-organismos-imageviewer`|`Sistema de diseño/Organismos/Visor de imagen`|`sistema-de-diseño-organismos-visor-de-imagen`|
|`Sistema de diseño/Organismos/PublicFooter`|`sistema-de-diseño-organismos-publicfooter`|`Sistema de diseño/Organismos/Pie público`|`sistema-de-diseño-organismos-pie-público`|
|`Sistema de diseño/Organismos/PublicNav`|`sistema-de-diseño-organismos-publicnav`|`Sistema de diseño/Organismos/Navegación pública`|`sistema-de-diseño-organismos-navegación-pública`|
|`Sistema de diseño/Organismos/RoleCard`|`sistema-de-diseño-organismos-rolecard`|`Sistema de diseño/Organismos/Tarjeta de rol`|`sistema-de-diseño-organismos-tarjeta-de-rol`|
|`Sistema de diseño/Organismos/ScanViewport`|`sistema-de-diseño-organismos-scanviewport`|`Sistema de diseño/Organismos/Visor sintético`|`sistema-de-diseño-organismos-visor-sintético`|
|`Sistema de diseño/Organismos/SidebarLayout`|`sistema-de-diseño-organismos-sidebarlayout`|`Sistema de diseño/Organismos/Marco lateral`|`sistema-de-diseño-organismos-marco-lateral`|
|`Sistema de diseño/Organismos/TrendBars`|`sistema-de-diseño-organismos-trendbars`|`Sistema de diseño/Organismos/Barras de tendencia`|`sistema-de-diseño-organismos-barras-de-tendencia`|
|`Sistema de diseño/Patrones/Búsqueda`|`sistema-de-diseño-patrones-búsqueda`|`Patrones/Búsqueda`|`patrones-búsqueda`|
|`Sistema de diseño/Patrones/Carga de archivos`|`sistema-de-diseño-patrones-carga-de-archivos`|`Patrones/Carga de archivos`|`patrones-carga-de-archivos`|
|`Sistema de diseño/Patrones/Confirmaciones`|`sistema-de-diseño-patrones-confirmaciones`|`Patrones/Confirmaciones`|`patrones-confirmaciones`|
|`Sistema de diseño/Patrones/Estados`|`sistema-de-diseño-patrones-estados`|`Patrones/Estados`|`patrones-estados`|
|`Sistema de diseño/Patrones/Filtros`|`sistema-de-diseño-patrones-filtros`|`Patrones/Filtros`|`patrones-filtros`|
|`Sistema de diseño/Patrones/Flujos clínicos`|`sistema-de-diseño-patrones-flujos-clínicos`|`Patrones/Flujos clínicos`|`patrones-flujos-clínicos`|
|`Sistema de diseño/Patrones/Formularios`|`sistema-de-diseño-patrones-formularios`|`Patrones/Formularios`|`patrones-formularios`|
|`Sistema de diseño/Patrones/Modales`|`sistema-de-diseño-patrones-modales`|`Patrones/Modales`|`patrones-modales`|
|`Sistema de diseño/Patrones/Navegación`|`sistema-de-diseño-patrones-navegación`|`Patrones/Navegación`|`patrones-navegación`|
|`Sistema de diseño/Patrones/Notificaciones`|`sistema-de-diseño-patrones-notificaciones`|`Patrones/Notificaciones`|`patrones-notificaciones`|
|`Sistema de diseño/Patrones/Paginación`|`sistema-de-diseño-patrones-paginación`|`Patrones/Paginación`|`patrones-paginación`|
|`Sistema de diseño/Patrones/Permisos`|`sistema-de-diseño-patrones-permisos`|`Patrones/Permisos`|`patrones-permisos`|
|`Sistema de diseño/Patrones/Tablas y listados`|`sistema-de-diseño-patrones-tablas-y-listados`|`Patrones/Tablas y listados`|`patrones-tablas-y-listados`|
|`Sistema de diseño/Patrones/Validación`|`sistema-de-diseño-patrones-validación`|`Patrones/Validación`|`patrones-validación`|

Los 37 títulos restantes no cambian: átomos, moléculas y organismos con nombre de símbolo, `Primitivos/Tonos`, `Plantillas/*`, `Aplicación/Mapa de pantallas`, `Aplicación/Flujos`, `Aplicación/Shell y navegación` y `Aplicación/Médico/Pacientes (HU-031)`.

## 3. Historias eliminadas y cobertura que las reemplaza

Se eliminaron 21 historias que solo fijaban tema o ancho, sin `args`, `play` ni aserciones propias.

| Historias | Título | Cobertura actual |
|---|---|---|
| 13 (`Oscuro`) | Badge, Button, Input, Select, ActivityTypeBadge, AiResultCard, Callout, ConfidenceBadge, RoleBadge, StatusBadge, SupportNotice, TiradsBadge, Toast | Nueva historia `Sistema de diseño/Fundamentos/Temas en oscuro`, que renderiza esos 13 componentes en un contenedor `.dark` con `a11y: { test: 'error' }`. Sustituye 13 comprobaciones aisladas por una sola que cubre los mismos componentes y pasa axe. |
| 8 (`Movil` o `Móvil`) | Table, FilterBar, PageHeader, Pagination, AuthLayout, SidebarLayout, PublicNav, PublicFooter | El selector de viewport de la barra de herramientas y `bun run capturar --anchos`. Ninguna captura del manifiesto dependía de estas historias. |

`Sistema de diseño/Fundamentos/Tokens semánticos` (`Claro` y `Oscuro`) y `Sistema de diseño/Fundamentos/Movimiento y animaciones` (`Reducido`) se mantienen: ilustran tema y movimiento.

## 4. Flujos interactivos nuevos

Viven en `frontend/src/flows/AppFlows.stories.tsx`, bajo el título `Aplicación/Flujos`, con mocks de sesión con estado en `frontend/src/mocks/flujos.ts`.

| Historia | Recorrido que verifica |
|---|---|
| Médico, del acceso a pacientes (HU-001, HU-031) | Entra en `/` sin sesión, redirige a `/login`, inicia sesión como médica sintética, aterriza en `/medico` con `PAC-0001`, comprueba `Pacientes` e `Inferencia` en la barra lateral y cierra sesión volviendo a `/login`. |
| Administrador, usuarios y roles (HU-010, HU-011) | Inicia sesión como administrador, aterriza en `Usuarios`, navega a `Roles` y verifica la tabla `Matriz de permisos por rol`, y regresa a `Usuarios`. |
| Acceso denegado por rol | Abre `/administrador/usuarios` con sesión de médico, ve `Acceso denegado` y usa `Volver a tu inicio` para llegar a `/medico`. |
| Recuperación de contraseña (HU-111) | Desde `/login` abre `¿Olvidaste tu contraseña?`, llega a `/login/recuperar`, escribe un correo y comprueba que `Enviar enlace` no envía nada (la pantalla es presentacional, sin endpoints). |
| Cambio de rol activo (HU-003) | Con una cuenta de dos roles aterriza en `/medico`, cambia a `Administrador` desde el grupo `Cambiar de rol` y llega a `/administrador`. |
| Ruta inexistente | Abre `/cualquier-cosa` y verifica `Página no encontrada`. |

Cada flujo usa `step` y `expect` de `storybook/test` sobre nombres accesibles, sin clases ni selectores de estructura.

## 5. Lo que se hizo distinto y lo que queda pendiente

- No hay rama, commit ni PR. El repositorio bloquea `git commit` y el checkout ya tenía 245 cambios sin commitear cuando empezó este trabajo, en parte del mismo catálogo (`frontend/.storybook/`, `frontend/src/mocks/`, `docs/storybook/`) y en parte trabajo previo; `omp commit` habría mezclado ambos. Falta que Andrés indique la HT y decida cómo separar los commits.
- `Aplicación/Flujos` es un solo título con seis historias con nombre, no seis títulos: en CSF cada archivo declara un único `meta`.
- `Temas en oscuro` usa título propio porque `Sistema de diseño/Fundamentos/Temas` ya es una página MDX; se añadió al `storySort` justo después de `Temas`.
- Los enlaces entre entradas desde MDX con `href="?path=/story/<id>"` relativo rompen el manager (lo dejan en `iframe.html`). Se resolvió con `frontend/src/pages/enlacesCatalogo.ts`, que calcula la base real (raíz o `/storybook/`) y devuelve una ruta absoluta; los 18 enlaces del mapa se verificaron en navegador.
- `bun run format:check` sigue fallando en cuatro archivos previos que no forman parte de este trabajo: `src/screens/admin/Settings.tsx`, `src/screens/doctor/ClinicalRecordsScreen.tsx`, `src/screens/doctor/ImageUploadDialog.tsx` y `src/screens/public/RoleSelectionScreen.tsx`. No se reformatearon para no mezclar trabajo ajeno.
- Las capturas contra el Storybook de desarrollo de `127.0.0.1:6104` no son fiables: esa instancia está desplegada con base `/storybook/` y devuelve 404 en los recursos. La evidencia se generó contra el build estático servido en `127.0.0.1:6105`.
- `docs/storybook/integracion-agentes.md` conserva los identificadores `aplicación-médico-*` de una prueba histórica; se añadió una nota que los marca como pantallas retiradas y señala el identificador vigente del patrón de flujos clínicos.

## 6. Discrepancias entre el plan y el repositorio

- `contexto-storybook.md`, que el plan cita como fuente, no existe en el repositorio ni en `docs/`. Los datos se tomaron del código y del índice reales.
- No existe `scripts/qa` ni un subcomando `storybook` con parámetro `--vista`. El único script de consulta es `frontend/scripts/storybook-consulta.ts` (`bun run consulta`) y el de contexto es `scripts/contexto.ts`.
- HU-111 no figura en `docs/referencia/05-backlog/`; existe en `docs/plan/hu-111-recuperar-contrasena.md` con el estado «Diseño en catálogo; sin lógica ni endpoints». Se usó HU-111 y la pantalla se documenta como presentacional.
- El plan no menciona el gate `frontend/src/test/taxonomia-stories.test.ts`, que fijaba las seis raíces y los segundos niveles de `Sistema de diseño` y `Aplicación`; se actualizó para aceptar las cuatro raíces nuevas sin relajarlo.
- `frontend/e2e/capturas.json` tenía 121 filas, de las cuales más de un centenar apuntaban a historias retiradas o a identificadores que ya no existían; `capturar.ts` no falla ante un identificador inexistente y capturaba la página de «historia no encontrada». Se reconstruyó a 91 filas (18 críticas), todas verificadas contra el índice.

## 7. Verificación ejecutada

| Comprobación | Resultado |
|---|---|
| `bun run catalogo:build` | Correcto. 379 entradas: 280 historias y 99 Docs. |
| `bun run catalogo:test` | 81 archivos y 280 pruebas correctas. |
| `bun run test` | 15 archivos y 187 pruebas correctas. |
| `bun run typecheck` | Sin errores. |
| `bun run lint` | 0 errores y 4 avisos previos de `react-refresh`. |
| `bun run ui:check` | Sin violaciones nuevas. |
| `bun run tamanos` | Correcto. |
| `bun run format:check` | Falla solo en los 4 archivos previos indicados en la sección 5. |
| `bun run capturar --base http://127.0.0.1:6105 --anchos 1440x900` | 91 capturas, 0 fallos. |
| Barra lateral en navegador | Orden real: Inicio, Aplicación (Mapa de pantallas, Flujos, Pública, Médico, Administrador, Shell y navegación), Sistema de diseño (Fundamentos, Primitivos, Átomos, Moléculas, Organismos, Plantillas, Patrones) y Guías y calidad (Accesibilidad, Diseño adaptable, Contenido y microcopy, Estados y casos límite, Rendimiento, Evidencias visuales, Gates de calidad). |
| Enlaces del mapa en navegador | 18 enlaces, todos con ruta absoluta; Roles y permisos, Pacientes y el flujo del médico abren la historia correcta sin pasar por `iframe.html`. |

## 8. Archivos creados y movidos

- Nuevos: `frontend/src/mocks/flujos.ts`, `frontend/src/flows/AppFlows.stories.tsx`, `frontend/src/pages/MapaPantallas.mdx`, `frontend/src/pages/enlacesCatalogo.ts`, `frontend/src/design-system/foundations/TemasEnOscuro.stories.tsx`, `frontend/src/design-system/quality/` (8 historias) y `frontend/src/design-system/inicio/` (7 MDX).
- Movidos: `Estados.stories.tsx` a `design-system/patterns/`, `Shell.stories.tsx` a `pages/`, `TypographyAndLayout.stories.tsx` renombrado a `TipografiaEnContexto.stories.tsx`.
- Regenerados: `docs/storybook/inventario-catalogo.md` y `frontend/e2e/capturas.json`; actualizados `docs/storybook/decisiones.md`, `docs/storybook/integracion-agentes.md`, `AGENTS.md` y `CLAUDE.md`.
- Cambiado el script `frontend/e2e/capturar.ts`: espera la red sin fallar cuando una petición queda pendiente a propósito y trata el 401 de `GET /auth/me` como ruido esperado.

