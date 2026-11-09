---
name: OPTIMUS-THY
description: Interfaz clínica de revisión profesional con apoyo de IA y datos sintéticos.
colors:
  primary: "var(--primary)"
  brand: "var(--brand)"
  background: "var(--background)"
  surface: "var(--surface)"
  surface-subtle: "var(--surface-subtle)"
  foreground: "var(--foreground)"
  muted-foreground: "var(--muted-foreground)"
  border: "var(--border)"
  input: "var(--input)"
  ring: "var(--ring)"
  info: "var(--info)"
  success: "var(--success)"
  warning: "var(--warning)"
  attention: "var(--attention)"
  danger: "var(--danger)"
  class-normal: "var(--class-normal)"
  class-normal-foreground: "var(--class-normal-foreground)"
  class-benigno: "var(--class-benigno)"
  class-benigno-foreground: "var(--class-benigno-foreground)"
  class-maligno: "var(--class-maligno)"
  class-maligno-foreground: "var(--class-maligno-foreground)"
  ai: "var(--ai)"
  role-doctor: "var(--role-doctor)"
  role-researcher: "var(--role-researcher)"
  role-admin: "var(--role-admin)"
typography:
  display:
    fontFamily: "var(--font-sans)"
    fontSize: "var(--text-display)"
    fontWeight: "var(--text-display--font-weight)"
    lineHeight: "var(--text-display--line-height)"
  headline:
    fontFamily: "var(--font-sans)"
    fontSize: "var(--text-headline)"
    fontWeight: "var(--text-headline--font-weight)"
    lineHeight: "var(--text-headline--line-height)"
  title:
    fontFamily: "var(--font-sans)"
    fontSize: "var(--text-title)"
    fontWeight: "var(--text-title--font-weight)"
    lineHeight: "var(--text-title--line-height)"
  body:
    fontFamily: "var(--font-sans)"
    fontSize: "var(--text-body)"
    fontWeight: "var(--text-body--font-weight)"
    lineHeight: "var(--text-body--line-height)"
  small:
    fontFamily: "var(--font-sans)"
    fontSize: "var(--text-small)"
    fontWeight: "var(--text-small--font-weight)"
    lineHeight: "var(--text-small--line-height)"
  caption:
    fontFamily: "var(--font-sans)"
    fontSize: "var(--text-caption)"
    fontWeight: "var(--text-caption--font-weight)"
    lineHeight: "var(--text-caption--line-height)"
  mono:
    fontFamily: "var(--font-mono)"
rounded:
  control: "0.375rem"
  card: "0.5rem"
  panel: "0.75rem"
  pill: "9999px"
spacing:
  base: "var(--spacing)"
  field: "var(--space-field)"
  card: "var(--space-card)"
  section: "var(--space-section)"
  gutter: "var(--space-gutter)"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "var(--primary-foreground)"
    typography: "{typography.small}"
    rounded: "{rounded.control}"
    padding: "0.5rem 1rem"
    height: "2.5rem"
  button-outline:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    typography: "{typography.small}"
    rounded: "{rounded.control}"
    padding: "0.5rem 1rem"
    height: "2.5rem"
  field:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    typography: "{typography.small}"
    rounded: "{rounded.control}"
    padding: "0.5rem 0.75rem"
    height: "2.5rem"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.card}"
    padding: "1.5rem"
  status-chip:
    backgroundColor: "color-mix(in oklab, var(--success) 10%, transparent)"
    textColor: "{colors.success}"
    typography: "{typography.caption}"
    rounded: "{rounded.pill}"
    padding: "0.125rem 0.625rem"
  role-badge:
    backgroundColor: "color-mix(in oklab, {colors.role-doctor} 10%, transparent)"
    textColor: "{colors.role-doctor}"
    typography: "{typography.caption}"
    rounded: "{rounded.pill}"
    padding: "0.125rem 0.625rem"
  dialog:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.panel}"
    padding: "1.5rem"
    width: "min(32rem, calc(100vw - 2rem))"
  navigation-active:
    backgroundColor: "color-mix(in oklab, {colors.brand} 10%, transparent)"
    textColor: "{colors.brand}"
    typography: "{typography.small}"
    rounded: "{rounded.control}"
    padding: "0.5rem 0.75rem"
  synthetic-notice:
    backgroundColor: "color-mix(in oklab, {colors.info} 10%, transparent)"
    textColor: "{colors.foreground}"
    typography: "{typography.small}"
    rounded: "{rounded.card}"
    padding: "1rem"
---

# Design System: OPTIMUS-THY

## Overview

**Creative North Star:** No se documenta una metáfora con nombre en el registro disponible; la referencia solicitada y el sistema visible son la autoridad visual.

La solicitud fija una URL de referencia como horizonte; no consta una aprobación explícita de una metáfora, un mood o una identidad estética más específica. Esta guía registra decisiones observables en la implementación: tipografía de sistema, superficies neutras, índigo de marca, acentos semánticos por rol y estado, y temas claro/oscuro.

OPTIMUS-THY organiza información clínica para revisión profesional. Las pantallas completas de los roles viven en Storybook y usan datos sintéticos; la divulgación de que los datos son sintéticos vive en la documentación del catálogo (Introducción y Convenciones), y las notas ilustrativas puntuales (curva ROC, lectura OCR, marcas del visor) siguen dentro de las pantallas donde aportan información.

**Key Characteristics:**

- Tokens semánticos claro/oscuro; los componentes consumen variables, no valores de paleta aislados.
- Jerarquía de lectura con fondo neutro, texto de alto contraste y acento de marca índigo.
- Médico, investigador y administrador conservan igual peso; cada rol mantiene un tono propio además de su etiqueta textual.
- Los estados, métricas y resultados de demostración se explican con texto; el color nunca es el único canal.
- Navegación lateral en escritorio y menú modal en móvil.

## Colors

La paleta se organiza en torno a neutrales de superficie y texto; el índigo identifica la marca, mientras que los tonos semánticos distinguen información, estados, apoyo de IA y roles. Los valores y sus equivalentes oscuros viven en `frontend/src/styles/tokens.css`; las variables de este frontmatter son la referencia normativa.

### Primary

- **Acción primaria neutra** (`--primary`): botones de acción principal; se mantiene separada del color de marca.
- **Índigo de marca** (`--brand`): marca, foco visible, enlaces y navegación activa.

### Secondary

- **Azul informativo** (`--info`): avisos de contexto y demostración.
- **Verde de éxito** (`--success`): estados completados o activos, siempre con etiqueta.
- **Ámbar de espera** (`--warning`): estados pendientes.
- **Naranja de atención** (`--attention`): estados que requieren atención; comparte familia cromática con el rol administrativo, pero conserva un token semántico independiente.
- **Rojo de riesgo** (`--danger`): acciones destructivas y estados de error.
- **Morado de IA** (`--ai`): identifica funciones de apoyo de IA sin sugerir autoridad diagnóstica.

### Tertiary

- **Azul médico** (`--role-doctor`), **morado investigador** (`--role-researcher`) y **naranja administrador** (`--role-admin`): distinguen identidades de rol; las etiquetas textuales y los iconos siguen visibles.

### Clasificación clínica

- **Normal** (`--class-normal`), **benigno** (`--class-benigno`) y **maligno** (`--class-maligno`) tienen tonos propios, independientes de `--success` y `--danger`; los tokens `-foreground` proporcionan el texto contrastante.
- Cada clasificación conserva siempre texto o icono además del color; nunca depende solo del color.

### Neutral

- **Lienzo** (`--background`) y **superficie** (`--surface`): fondo de página y contenedores.
- **Superficie sutil** (`--surface-subtle`): fondos secundarios y estados de interacción discretos.
- **Texto principal** (`--foreground`) y **texto secundario** (`--muted-foreground`): jerarquía de lectura.
- **Borde** (`--border`) y **borde de control** (`--input`): separación de tarjetas, campos y controles.

### Named Rules

**The Semantic Token Rule.** Usa el nombre semántico; no sustituyas un token de marca por uno de estado ni escribas un color literal en un componente.

**The Text-Is-State Rule.** Roles, estados y clasificaciones conservan texto o icono visible además del color; nunca comuniques información únicamente con color.

## Typography

Las familias sans-serif y monoespaciada son `--font-sans` y `--font-mono`. La escala declara tamaño, interlineado y peso en cada token para mantener uniforme la lectura del catálogo y las pantallas.

| Token | Uso |
| --- | --- |
| `--font-sans` | Texto general, controles y encabezados. |
| `--font-mono` | Códigos, identificadores y datos tabulares que requieren alineación monoespaciada. |

### Hierarchy

| Token de escala | Interlineado y peso | Uso |
| --- | --- | --- |
| `--text-display` | `--text-display--line-height`, `--text-display--font-weight` | Titular principal de portada. |
| `--text-headline` | `--text-headline--line-height`, `--text-headline--font-weight` | Encabezado de pantalla. |
| `--text-title` | `--text-title--line-height`, `--text-title--font-weight` | Títulos de tarjetas y secciones. |
| `--text-body` | `--text-body--line-height`, `--text-body--font-weight` | Texto principal y explicaciones. |
| `--text-small` | `--text-small--line-height`, `--text-small--font-weight` | Controles, navegación y contenido secundario. |
| `--text-caption` | `--text-caption--line-height`, `--text-caption--font-weight` | Insignias, etiquetas y metadatos breves. |

| Peso semántico | Uso |
| --- | --- |
| `--font-weight-regular` | Texto de lectura. |
| `--font-weight-medium` | Controles y etiquetas secundarias. |
| `--font-weight-semibold` | Titulares y títulos de sección. |

**The Hierarchy Rule.** Mantén el orden semántico de los encabezados; el tamaño visual no sustituye la estructura H1/H2/H3.

## Layout

El contenido de escritorio se alinea junto a una barra lateral de 17rem (272px), con área central limitada a 88rem (1408px). A partir de 64rem (1024px), la barra lateral permanece fija y la navegación ocupa el borde izquierdo; por debajo, la barra se reemplaza por un encabezado compacto y un cajón modal de hasta 20rem o 85vw. Las pantallas públicas pasan de columnas a flujo vertical; tablas y fichas densas conservan desplazamiento horizontal cuando hace falta.

La escala base de espaciado usa la unidad Tailwind `--spacing`; los valores semánticos se mantienen constantes entre temas.

## Spacing

| Token | Uso |
| --- | --- |
| `--spacing` / `--space-unit` | Unidad base de 0.25rem que conserva la escala nativa de espaciado Tailwind. |
| `--space-field` | Espacio interno de campos y controles. |
| `--space-card` | Padding interno de tarjetas base. |
| `--space-section` | Separación entre secciones relacionadas. |
| `--space-gutter` | Margen horizontal del contenido respecto al viewport. |

## Elevation & Depth

Las sombras distinguen niveles sin sustituir bordes ni superficies. Cada token tiene una variante oscura de mayor contraste; el scrim de modal es una capa aparte, no una sombra.

| Token | Uso |
| --- | --- |
| `--shadow-xs` | Separación mínima para elementos pequeños. |
| `--shadow-sm` | Tarjetas base y superficies que requieren una elevación tenue. |
| `--shadow-md` | Menús y capas intermedias. |
| `--shadow-panel` | Diálogos y navegación modal. |

**The Flat-By-Default Rule.** Reserva la elevación profunda para diálogos y navegación modal; las superficies de contenido permanecen planas o con sombra tenue.

## Motion

| Token | Uso |
| --- | --- |
| `--duration-fast` | Respuesta breve de controles; utilidad `duration-fast`. |
| `--duration-base` | Transiciones habituales y duración base de Tailwind; utilidad `duration-base`. |
| `--duration-slow` | Cambios de contexto que necesitan una transición más pausada; utilidad `duration-slow`. |
| `--ease-standard` | Curva de transición cotidiana; utilidad `ease-standard`. |
| `--ease-emphasized` | Curva más marcada para cambios de contexto; utilidad `ease-emphasized`. |

Con `prefers-reduced-motion: reduce`, las duraciones se neutralizan y las curvas pasan a `linear`; conserva siempre el mismo estado y la misma información sin depender del movimiento.

## Shapes

Los controles tienen esquinas suavemente redondeadas (6px), las tarjetas una curva media (8px), y los paneles modales una curva más amplia (12px). Las insignias son cápsulas; los campos y tarjetas conservan un borde de 1px. Evita formas decorativas que compitan con los datos.

## Components

### Buttons

- **Shape:** radio de control (6px).
- **Primary:** acción principal con fondo neutro oscuro y texto de contraste; 40px de alto, padding 8px 16px.
- **Secondary / Outline:** el botón outline conserva fondo de superficie y borde; los estados hover usan una capa neutra sutil.
- **Hover / Focus:** transición de color; foco visible de 2px con separación de 2px y token `--ring`.
- **Disabled / Loading:** baja opacidad; el estado de carga conserva nombre accesible y bloquea activación.

### Chips

- **Style:** cápsula con borde, fondo teñido al 10% y texto del mismo tono semántico.
- **State:** el texto nombra el estado o el rol; el color sólo refuerza esa lectura.

### Cards / Containers

- **Corner Style:** radio de tarjeta (8px).
- **Background:** `--surface`, con borde de `--border`; `--surface-subtle` para agrupaciones secundarias.
- **Shadow Strategy:** sombra tenue en tarjetas; sin elevación profunda por defecto.
- **Internal Padding:** 24px en tarjetas base; pantallas densas pueden usar 12px o 16px.

### Inputs / Fields

- **Style:** fondo de página, borde de control de 1px, radio de 6px, altura 40px y padding horizontal 12px.
- **Focus:** contorno visible de 2px con `--ring`; los errores cambian el borde a `--danger`.
- **Disabled:** cursor no interactivo y opacidad reducida.

### Navigation

- **Desktop:** navegación lateral de 272px; el elemento activo usa una superficie índigo tenue y texto índigo, y los elementos inactivos usan texto secundario.
- **Mobile:** barra superior y cajón modal con scrim; el cajón cierra al navegar y devuelve el foco al disparador.
- **Keyboard:** enlace de salto al contenido, nombres accesibles en navegación y foco visible.

### Synthetic Notice

El aviso de demostración usa un fondo informativo tenue, icono decorativo y texto explícito sobre datos sintéticos y límites de IA. Mantén visible esta información junto a métricas, imágenes o registros de muestra.

### Dialog

El diálogo centrado usa superficie y borde de panel, radio de 12px, scrim y elevación profunda. Conserva título, descripción cuando corresponda, foco contenido/restaurado y una acción clara de cierre.

## Do's and Don'ts

### Do:

- **Do**: usa variables semánticas de `tokens.css` para superficies, texto, foco, roles y estados.
- **Do**: conserva etiquetas textuales para roles, estados y clasificaciones; evita que el color sea el único indicador.
- **Do**: identifica todas las pantallas y métricas de demostración como sintéticas y mantiene el aviso visible.
- **Do**: conserva el mismo peso visual para médico, investigador y administrador.
- **Do**: valida la jerarquía de encabezados y el menú modal en teclado y pantalla estrecha.

### Don't:

- **Don't**: no presentes métricas sintéticas como rendimiento real ni imágenes vectoriales como estudios clínicos.
- **Don't**: no sugieras que la IA diagnostica o reemplaza la decisión profesional.
- **Don't**: no incluyas datos personales o clínicos reales.
- **Don't**: no añadas pantallas, enlaces, permisos, tarjetas, datos o acciones relacionadas con proyectos.
