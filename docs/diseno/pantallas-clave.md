# Diseño de las pantallas clave (HT-024)

Documento de diseño previo a la implementación. Cubre RDS-12 y los tres flujos
del anteproyecto: médico, investigador y administrador.

**Estado:** propuesto. Los criterios de aceptación piden que el diseño se revise
con el director antes de construirlo; las decisiones abiertas del final son las
que quedan por confirmar.

## Reglas que aplican a todas las pantallas

- Tokens del sistema de diseño (`frontend/src/styles/tokens.css`); nunca colores
- La divulgación de datos sintéticos vive en la documentación del catálogo (Introducción y Convenciones); las pantallas no repiten ese aviso. Las notas de apoyo («apoyo, no diagnóstico») van junto a inferencias e informes.
- Ningún estado se comunica solo con color: siempre etiqueta y texto
  (`StatusBadge`, `TiradsBadge`, `ConfidenceBadge`).
- PII enmascarada por defecto; revelar queda auditado.
- Tres estados obligatorios en cada pantalla con datos: carga (`Spinner` /
  esqueleto), vacío (`EmptyState`) y error (`Callout` con reintento).
- Objetivo WCAG 2.2 AA: foco visible, navegación completa por teclado, contraste
  mínimo 4.5:1 en texto normal.

## Mapa de navegación

| Ruta | Pantalla del catálogo | Historia que la llena |
| --- | --- | --- |
| `/login/recuperar` | `PasswordRecoveryPage` | HU-111 |
| `/medico` | `PacientesPage` (implementada) | HU-031 |
| `/medico/pacientes` | `PacientesPage` (implementada) | HU-031 |
| `/medico/pacientes/:id` | `PatientDetailScreen` | HU-030, HU-033, HU-032 |
| `/medico/pacientes/:id/ficha` | `ClinicalRecordsScreen` | HU-040, HU-041 |
| `/medico/pacientes/:id/imagenes` | `ImagesScreen` | HU-060, HU-061 |
| `/medico/pacientes/:id/inferencia` | `AIInferenceScreen` | HU-070, HU-071 |
| `/medico/resultados` | `ResultsScreen` | HU-072, HU-080 |
| `/investigador` | `Dashboard` | HU-091 |
| `/investigador/cohortes` | `Cohorts` | HU-096, HU-097 |
| `/investigador/datasets` | `Datasets` | HU-090, HU-095 |
| `/investigador/auditoria` | `ModelAudit` | HU-093 |
| `/investigador/errores` | `ErrorAnalysis` | HU-094 |
| `/administrador` | `Dashboard` (admin) | HU-015 |
| `/administrador/usuarios` | `UserManagement` | HU-010 |
| `/administrador/roles` | `RolesPermissions` | HU-011, HU-012 |
| `/administrador/auditoria` | `FullAudit` | HU-020, HU-022 |
| `/administrador/ajustes` | `Settings` | HU-016 |

`/medico` y `/medico/pacientes` ya montan `PacientesPage` contra la API
(`GET/POST /pacientes`); el resto de rutas siguen con `PlaceholderPage` o solo
existen en el catálogo de Storybook.

## Flujo del médico

```
Pacientes ─→ Detalle del paciente ─┬─→ Ficha clínica (secciones)
                                   ├─→ Imágenes y documentos
                                   └─→ Inferencia ─→ Resultado ─→ Reporte PDF
```

### 1. Lista de pacientes

```
┌──────────────────────────────────────────────────────────────┐
│ Pacientes                                    [+ Nuevo paciente] │
│ [ Buscar por código...                          ]             │
├──────────────────────────────────────────────────────────────┤
│ Código     Casos   Alta            Acciones                  │
│ PAC-001    3       15 ene 2026     [Ver detalle]            │
│ PAC-002    0       20 feb 2026     [Ver detalle]            │
└──────────────────────────────────────────────────────────────┘
```

- Componentes: `PageHeader`, `SearchInput`, `Table`, `Pagination`, `Spinner`,
  `EmptyState`, `Callout`, `Dialog`, `Toast`.
- Columnas: **Código · Casos · Alta · Acciones**. `Alta` muestra `creado_en`
  formateado; `Acciones` abre el detalle en un `Dialog`.
- `SearchInput` por código (`GET /pacientes?q=`), con un retraso explícito de
  300 ms antes de consultar.
- Paginación de 20 por desplazamiento (`LIMITE_POR_PAGINA = 20`,
  `desplazamiento`), `GET /pacientes?limite=&desplazamiento=`.
- Alta con `Dialog` «Nuevo paciente»: nombres, apellidos, documento, fecha de
  nacimiento → `POST /pacientes`; valida documento (5–20 alfanuméricos o
  guiones) antes de enviar.
- Carga: `Spinner` («Cargando pacientes»).
- Vacío: `EmptyState` «Todavía no hay pacientes» con acción «Registrar el
  primero» que abre el diálogo de alta; si la búsqueda no tiene resultados
  muestra «No se encontraron pacientes» con «Limpiar búsqueda».
- Error: `Callout` tone="danger" (role="alert") con «No se pudo cargar la
  lista» y botón «Reintentar» que repite la consulta; nunca muestra el estado
  HTTP ni detalles internos.
- La identidad (historia, nombre, sexo, cédula) **no** se muestra: la API solo
  devuelve `id, codigo, creado_en, total_casos` (RS-ANO-01); el resto del
  paciente vive separado y cifrado.
- `FilterBar` y el detalle completo del paciente (más allá de código, casos y
  alta) quedan para sus historias; el `Dialog` de detalle actual solo muestra
  código, casos, alta y los casos asociados.

### 2. Detalle del paciente

```
┌──────────────────────────────────────────────────────────────┐
│ PT-0001 · María F. N. (••••)              [Revelar] [Editar]  │
│ TI-RADS 4 · 2 casos abiertos · Consentimiento vigente ✓       │
├──────────────┬───────────────────────────────────────────────┤
│ Resumen      │ Casos                                          │
│ Ficha        │ ┌───────────────────────────────────────────┐ │
│ Imágenes     │ │ HC-4471 · Abierto el 12 oct · 2 imágenes  │ │
│ Inferencias  │ │ Nódulo 1,4 cm · TI-RADS 4                 │ │
│ Auditoría    │ └───────────────────────────────────────────┘ │
└──────────────┴───────────────────────────────────────────────┘
```

- Componentes: `Tabs`, `Card`, `TiradsBadge`, `StatusBadge`, `Timeline`.
- Sin consentimiento vigente el bloque de carga e inferencia queda deshabilitado
  con el motivo a la vista (HU-035), no solo en gris.
- Revelar PII abre un `Dialog` que pide justificación y registra el evento.

### 3. Resultado de la inferencia

```
┌──────────────────────────────────────────────────────────────┐
│ Resultado de la inferencia                    [Descargar PDF] │
│ ┌──────────────────────┐ ┌─────────────────────────────────┐ │
│ │  imagen + mapa de    │ │ Resultado del modelo            │ │
│ │  calor superpuesto   │ │ Benigno        [Confianza 87,4 %]│ │
│ │                      │ │ Probabilidades: N 8 % · B 87 % ·│ │
│ │                      │ │ M 5 %                           │ │
│ └──────────────────────┘ └─────────────────────────────────┘ │
│ ⚠ Apoyo a la revisión profesional. No es un diagnóstico.      │
│ Modelo v1.2 · procesado el 30 oct 10:42 · [Ver auditoría]      │
└──────────────────────────────────────────────────────────────┘
```

- Componentes: `Card`, `ScanViewport`, `ConfidenceBadge`, `Callout`, `Table`.
- La clase (normal / benigno / maligno) se muestra con texto y patrón, no solo
  con color; la paleta propia de clases es RDS-03 y todavía no existe en tokens.
- «Normal» se rotula **«Normal (sin nódulo detectado)»** mientras el director no
  confirme el término (decisión abierta 1).
- La confianza se muestra como porcentaje con un decimal y sin umbral implícito
  de «positivo»: el umbral es decisión clínica, no de interfaz.

## Flujo del investigador

```
Dashboard ─→ Cohortes ─→ Métricas ─┬─→ Comparación de resultados
                                   ├─→ Auditoría de predicciones
                                   └─→ Análisis de errores ─→ Exportación anonimizada
```

```
┌──────────────────────────────────────────────────────────────┐
│ Investigación · Cohorte «Ecografías 2026»      [Exportar CSV] │
│ 412 estudios · 318 pacientes · sin datos personales           │
├──────────────────────────────────────────────────────────────┤
│ Sensibilidad 91,2 %   Especificidad 84,7 %   AUC 0,93         │
│ ┌───────────────────────┐ ┌────────────────────────────────┐  │
│ │ matriz de confusión   │ │ curva ROC / distribución       │  │
│ └───────────────────────┘ └────────────────────────────────┘  │
│ Filtros: [clase ▾] [confianza ▾] [fecha ▾]                    │
└──────────────────────────────────────────────────────────────┘
```

- Componentes: `StatCard`, `ConfusionMatrix`, `TrendBars`, `FilterBar`, `Table`.
- El investigador nunca ve PII: la pantalla no ofrece «Revelar».
- Toda exportación pide motivo, queda auditada y descarga por enlace firmado.
- Los conteos pequeños se muestran como «menos de 5» para evitar
  reidentificación (HT-071).

## Flujo del administrador

```
Dashboard ─→ Usuarios ─→ Roles y permisos ─→ Auditoría ─→ Ajustes
```

```
┌──────────────────────────────────────────────────────────────┐
│ Usuarios                              [+ Invitar usuario]     │
│ [ Buscar por correo ]                                        │
├──────────────────────────────────────────────────────────────┤
│ Correo               Roles            Institución   Estado     │
│ a@hospital.gob.ec    Médico           Hospital A   Activo     │
│ b@hospital.gob.ec    Médico, Invest.  Hospital A   Activo     │
└──────────────────────────────────────────────────────────────┘
│ Roles: ☑ Médico  ☑ Investigador  ☐ Administrador   [Guardar]  │
```

- Componentes: `Table`, `Dialog`, `Switch`, `StatusBadge`, `RoleBadge`, `Toast`.
- Un usuario puede tener varios roles (HU-012); el rol activo se elige al entrar.
- La bitácora es de solo lectura: no hay botones de editar ni borrar (HT-030).
- Desactivar un usuario pide confirmación y explica que sus sesiones se cierran.

## Estados comunes

| Estado | Patrón | Texto de ejemplo |
| --- | --- | --- |
| Carga | `Spinner` centrado o esqueleto de tabla, sin bloquear la navegación | «Cargando pacientes…» |
| Vacío | `EmptyState` con acción | «Todavía no hay imágenes en este caso» + «Subir imagen» |
| Error | `Callout` de tono `danger` + «Reintentar» | «No se pudo cargar el caso» |
| Sin permiso | `Callout` informativo, sin datos | «Tu rol no permite ver esta sección» |
| Bloqueado | `Callout` de advertencia con motivo | «Falta el consentimiento del paciente» |

## Decisiones abiertas para la revisión

1. **«Normal» = «sin nódulo detectado»**: confirmar el rótulo con el director.
2. **Umbral de confianza para destacar un resultado**: ¿se muestra siempre el
   porcentaje sin semáforo, o se marca un umbral clínico?
3. **Revelar PII**: ¿basta la justificación escrita o el director quiere además
   aprobación de un segundo usuario?
4. **Exportación del investigador**: ¿CSV y JSON, o solo CSV en la primera
   entrega?

## Registro de revisión con el director

El estado pasa de «propuesto» a «aprobado» solo cuando este registro tenga la fecha, el
revisor y una decisión por cada punto. Hasta entonces la historia HT-024 sigue en
`In Progress` con la etiqueta «En revisión» en Linear, no en `Done`; construir sobre
el diseño propuesto es un riesgo conocido (si el director cambia algo, se corrige la
pantalla).

| Dato | Valor |
| --- | --- |
| Fecha de la reunión de revisión | _por completar_ |
| Quién revisó (director) | _por completar_ |
| Material mostrado | Este documento y `bun run catalogo` (20 pantallas con stories, por rol) |

| Punto | Decisión del director | Cambio pedido |
| --- | --- | --- |
| Flujo del médico (lista, detalle, resultado) | _por completar_ | _por completar_ |
| Flujo del investigador | _por completar_ | _por completar_ |
| Flujo del administrador | _por completar_ | _por completar_ |
| 1. «Normal» = «sin nódulo detectado» | _por completar_ | _por completar_ |
| 2. Umbral de confianza para destacar un resultado | _por completar_ | _por completar_ |
| 3. Revelar PII: justificación escrita o segundo usuario | _por completar_ | _por completar_ |
| 4. Exportación del investigador: CSV y JSON o solo CSV | _por completar_ | _por completar_ |

Resultado final: _por completar_ (aprobado / aprobado con cambios / rechazado).
