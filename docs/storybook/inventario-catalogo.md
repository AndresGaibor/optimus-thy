# Inventario del catálogo Storybook de OPTIMUS-THY

Catálogo vivo en http://127.0.0.1:6104 (local), https://tiroides2.andresgaibor.com/storybook/ (Cloudflare Access) y https://oracle.tail4a8b59.ts.net/storybook/ (tailnet).

Contiene **379 entradas**: 99 títulos, 99 páginas Docs y 280 historias. Todo el contenido es código real del repositorio: componentes de `frontend/src/design-system`, páginas de `frontend/src/pages` y documentación en `frontend/src/design-system`. No hay maquetas: las pantallas de `frontend/src/screens` se retiraron del catálogo.

Raíces (orden del sidebar): **Inicio** (guías), **Aplicación** (mapa, flujos y pantallas reales por perfil), **Sistema de diseño** (fundamentos, primitivos, átomos, moléculas, organismos, plantillas y patrones) y **Guías y calidad** (accesibilidad, adaptabilidad, contenido, rendimiento, evidencias y gates).

## Inicio (7 títulos)

### Inicio/Arquitectura

Visión general de las capas del monorepo, el flujo de datos y las fuentes de verdad del proyecto

Contenido: Docs + solo Docs. Fuente: `./src/design-system/inicio/Arquitectura.mdx`.

### Inicio/Changelog

Registro de cambios relevantes del catálogo y sus herramientas de verificación

Contenido: Docs + solo Docs. Fuente: `./src/design-system/inicio/Changelog.mdx`.

### Inicio/Convenciones de desarrollo

Reglas prácticas para mantener coherencia, accesibilidad y calidad en el código y el catálogo

Contenido: Docs + solo Docs. Fuente: `./src/design-system/inicio/Convenciones.mdx`.

### Inicio/Cómo contribuir

Flujo de trabajo para cambios en el monorepo y en el catálogo de interfaz

Contenido: Docs + solo Docs. Fuente: `./src/design-system/inicio/Contribuir.mdx`.

### Inicio/Instalación y configuración

Pasos para preparar el entorno local y verificar el proyecto

Contenido: Docs + solo Docs. Fuente: `./src/design-system/inicio/Instalacion.mdx`.

### Inicio/Introducción

La biblioteca define los controles y patrones visuales compartidos por OPTIMUS-THY. Los componentes exponen una API tipada, estados accesibles y tonos semánticos; las pantallas de esta colección son e

Contenido: Docs + solo Docs. Fuente: `./src/design-system/inicio/Introduction.mdx`.

### Inicio/Primeros pasos

Esta guía orienta la navegación del catálogo de interfaz de OPTIMUS-THY y el uso de sus herramientas de consulta

Contenido: Docs + solo Docs. Fuente: `./src/design-system/inicio/PrimerosPasos.mdx`.

## Aplicación (8 títulos)

### Aplicación/Administrador/Gestión de usuarios (HU-010)

Pantalla real de administración de cuentas: listado con búsqueda y filtros, alta, edición, activación/desactivación y reasignación de roles. Consume /api/usuarios e /api/instituciones.

Contenido: Docs + 4 historias. Fuente: `./src/pages/admin/UsuariosPage.stories.tsx`.
Historias: Cargando, Con Usuarios, Error De Carga, Sin Usuarios.

### Aplicación/Administrador/Roles y permisos (HU-011)

Matriz real de permisos por rol: concede y revoca permisos por columna y guarda con PUT /api/roles/{id}/permisos.

Contenido: Docs + 4 historias. Fuente: `./src/pages/admin/RolesPage.stories.tsx`.
Historias: Cargando, Error De Carga, Predeterminada, Sin Roles.

### Aplicación/Flujos

Recorridos de extremo a extremo entre pantallas reales (acceso, pacientes, usuarios/roles, recuperación, cambio de rol y ruta inexistente).

Contenido: Docs + 6 historias. Fuente: `./src/flows/AppFlows.stories.tsx`.
Historias: Acceso denegado por rol, Administrador, usuarios y roles (HU-010, HU-011), Cambio de rol activo, Médico, del acceso a pacientes (HU-001, HU-031), Recuperación de contraseña (HU-111), Ruta inexistente.

### Aplicación/Mapa de pantallas

Índice de pantallas reales registradas en el catálogo, con perfil, ruta y enlace a su historia.

Contenido: Docs + solo Docs. Fuente: `./src/pages/MapaPantallas.mdx`.

### Aplicación/Médico/Pacientes (HU-031)

Pantalla real del medico con el listado de pacientes por codigo interno (sin identidad), paginacion y estados de carga, error, sesion y permisos

Contenido: Docs + 10 historias. Fuente: `./src/pages/medico/PacientesPage.stories.tsx`.
Historias: Cargando, Con Pacientes, Datos Parciales, Error De Carga, Error De Validacion, No Autenticado, Respuesta Lenta, Sesion Expirada, Sin Pacientes, Sin Permiso.

### Aplicación/Pública/Acceso (HU-001)

Formulario real de inicio de sesión (LoginPage): sesión por cookie, errores de credenciales y estado de envío.

Contenido: Docs + 3 historias. Fuente: `./src/pages/LoginPage.stories.tsx`.
Historias: Credenciales Invalidas, Enviando, Predeterminada.

### Aplicación/Pública/Recuperar contraseña (HU-111)

Flujo real de recuperación: solicitud por correo, enlace caducado y definición de nueva contraseña.

Contenido: Docs + 6 historias. Fuente: `./src/pages/PasswordRecoveryPage.stories.tsx`.
Historias: Contrasena Actualizada, Enlace Caducado, Error Al Enviar, Nueva Contrasena, Solicitud, Solicitud Enviada.

### Aplicación/Shell y navegación

Elemento de navegación del marco lateral

Contenido: Docs + 1 historia. Fuente: `./src/pages/Shell.stories.tsx`.
Historias: Guia.

## Sistema de diseño (76 títulos)

### Sistema de diseño/Fundamentos/Bordes y radios

Radios y bordes por nivel (control, tarjeta, panel) con tokens semánticos

Contenido: Docs + solo Docs. Fuente: `./src/design-system/foundations/BordesYRadios.mdx`.

### Sistema de diseño/Fundamentos/Colores

Primitivas cromáticas y tokens semánticos que cambian entre tema claro y oscuro

Contenido: Docs + solo Docs. Fuente: `./src/design-system/foundations/Colores.mdx`.

### Sistema de diseño/Fundamentos/Dimensiones

Anchos de panel lateral y máximo de contenido; alturas consistentes de control

Contenido: Docs + solo Docs. Fuente: `./src/design-system/foundations/Dimensiones.mdx`.

### Sistema de diseño/Fundamentos/Espaciado

Escala de espaciado en cuartos de rem entre controles, tarjetas y secciones

Contenido: Docs + solo Docs. Fuente: `./src/design-system/foundations/Espaciado.mdx`.

### Sistema de diseño/Fundamentos/Grid y breakpoints

Breakpoints de Tailwind CSS 4 y ancho máximo de lectura

Contenido: Docs + solo Docs. Fuente: `./src/design-system/foundations/Breakpoints.mdx`.

### Sistema de diseño/Fundamentos/Iconografía

Iconos de lucide-react y mapas tipados por tono y rol

Contenido: Docs + solo Docs. Fuente: `./src/design-system/foundations/Iconografia.mdx`.

### Sistema de diseño/Fundamentos/Ilustraciones

No hay ilustraciones propias: diez imágenes sintéticas de referencia y la marca BrandMark

Contenido: Docs + solo Docs. Fuente: `./src/design-system/foundations/Ilustraciones.mdx`.

### Sistema de diseño/Fundamentos/Movimiento y animaciones

Duraciones, curvas y reglas de movimiento; respeta prefers-reduced-motion

Contenido: Docs + 5 historias. Fuente: `./src/design-system/foundations/Movimiento.stories.tsx`.
Historias: Aviso, Curvas, Dialogo, Duraciones, Reducido.

### Sistema de diseño/Fundamentos/Sombras y elevación

Niveles de elevación con sombras ajustadas a cada tema

Contenido: Docs + solo Docs. Fuente: `./src/design-system/foundations/Sombras.mdx`.

### Sistema de diseño/Fundamentos/Temas

Tema claro y oscuro mediante la clase .dark sobre tokens semánticos

Contenido: Docs + solo Docs. Fuente: `./src/design-system/foundations/Temas.mdx`.

### Sistema de diseño/Fundamentos/Temas en oscuro

Guía visual del tema oscuro aplicado a componentes reales y su contraste sobre tokens semánticos.

Contenido: Docs + 1 historia. Fuente: `./src/design-system/foundations/TemasEnOscuro.stories.tsx`.
Historias: Guia.

### Sistema de diseño/Fundamentos/Tipografía

Familia, escala, alturas de línea y pesos; no cambia entre temas

Contenido: Docs + solo Docs. Fuente: `./src/design-system/foundations/Tipografia.mdx`.

### Sistema de diseño/Fundamentos/Tipografía en contexto

Escala tipográfica aplicada sobre pantallas y bloques reales

Contenido: Docs + 1 historia. Fuente: `./src/design-system/foundations/TipografiaEnContexto.stories.tsx`.
Historias: Default.

### Sistema de diseño/Fundamentos/Tokens semánticos

Mapa de tokens semánticos y su correspondencia entre temas

Contenido: Docs + 2 historias. Fuente: `./src/design-system/foundations/Tokens.stories.tsx`.
Historias: Claro, Oscuro.

### Sistema de diseño/Moléculas/ActivityTypeBadge

Para etiquetar una actividad de auditoría mediante el catálogo `ActivityType`

Contenido: Docs + 8 historias. Fuente: `./src/design-system/components/molecules/ActivityTypeBadge.stories.tsx`.
Historias: Administración, Auditoría, Carga, Exportación, Inferencia, Lectura, Playground, Seguridad.

### Sistema de diseño/Moléculas/AiResultCard

(sin descripción previa registrada).

Contenido: Docs + 4 historias. Fuente: `./src/design-system/components/molecules/AiResultCard.stories.tsx`.
Historias: Benigno, Maligno, Normal, Playground.

### Sistema de diseño/Moléculas/Callout

Para presentar información, avisos o alertas vinculados al contenido cercano

Contenido: Docs + 6 historias. Fuente: `./src/design-system/components/molecules/Callout.stories.tsx`.
Historias: Atención, Contenido Largo, Correcto, Error, Informativo, Playground.

### Sistema de diseño/Moléculas/ConfidenceBadge

Para acompañar una cifra de confianza ya calculada por quien llama

Contenido: Docs + 5 historias. Fuente: `./src/design-system/components/molecules/ConfidenceBadge.stories.tsx`.
Historias: Dato Sintético, Playground, Tono Correcto, Tono Informativo, Tono Neutral.

### Sistema de diseño/Moléculas/EmptyState

Para comunicar una lista vacía y, si corresponde, ofrecer una acción

Contenido: Docs + 4 historias. Fuente: `./src/design-system/components/molecules/EmptyState.stories.tsx`.
Historias: Con Acción, Contenido Largo, Playground, Vacío.

### Sistema de diseño/Moléculas/Field

Para etiquetar un control y comunicar sus instrucciones o validación

Contenido: Docs + 5 historias. Fuente: `./src/design-system/components/molecules/Field.stories.tsx`.
Historias: Con Ayuda, Contenido Largo, Obligatorio Con Error, Playground, Predeterminado.

### Sistema de diseño/Moléculas/FilterBar

En listados que necesitan filtros relacionados bajo un nombre común

Contenido: Docs + 2 historias. Fuente: `./src/design-system/components/molecules/FilterBar.stories.tsx`.
Historias: Con Restablecimiento, Sin Filtros Activos.

### Sistema de diseño/Moléculas/OcrField

(sin descripción previa registrada).

Contenido: Docs + 5 historias. Fuente: `./src/design-system/components/molecules/OcrField.stories.tsx`.
Historias: Confianza Alta, Confianza Baja, Estados, Playground, Valor Corregido.

### Sistema de diseño/Moléculas/PageHeader

Al inicio de una página para presentar su título y contexto

Contenido: Docs + 3 historias. Fuente: `./src/design-system/components/molecules/PageHeader.stories.tsx`.
Historias: Con Acciones, Contenido Largo, Predeterminado.

### Sistema de diseño/Moléculas/Pagination

Debajo de una lista con paginación por desplazamiento

Contenido: Docs + 4 historias. Fuente: `./src/design-system/components/molecules/Pagination.stories.tsx`.
Historias: Intermedia, Primera Página, Sin Resultados, Última Página.

### Sistema de diseño/Moléculas/PatientCard

(sin descripción previa registrada).

Contenido: Docs + 4 historias. Fuente: `./src/design-system/components/molecules/PatientCard.stories.tsx`.
Historias: Caso Completo, Caso En Revision, Contenido Largo, Playground.

### Sistema de diseño/Moléculas/RoleBadge

Para mostrar un rol dentro de una interfaz administrativa o clínica

Contenido: Docs + 4 historias. Fuente: `./src/design-system/components/molecules/RoleBadge.stories.tsx`.
Historias: Administrador, Investigador, Médico, Playground.

### Sistema de diseño/Moléculas/SearchInput

Para filtrar una lista mediante una consulta textual

Contenido: Docs + 4 historias. Fuente: `./src/design-system/components/molecules/SearchInput.stories.tsx`.
Historias: Con Texto Y Limpieza, Deshabilitado, Playground, Vacío.

### Sistema de diseño/Moléculas/StatCard

Para resumir una cifra en paneles de métricas

Contenido: Docs + 6 historias. Fuente: `./src/design-system/components/molecules/StatCard.stories.tsx`.
Historias: Contenido Largo, Playground, Predeterminada, Tono Correcto, Tono Informativo, Tono Pendiente.

### Sistema de diseño/Moléculas/StatusBadge

Para mostrar un estado conocido de los tipos compartidos en `tones.ts`

Contenido: Docs + 13 historias. Fuente: `./src/design-system/components/molecules/StatusBadge.stories.tsx`.
Historias: Ficha Completa, Ficha En OCR, Ficha En Revisión, Ficha Pendiente, Inferencia Completada, Inferencia Con Error, Inferencia En Cola, Inferencia En Proceso, Playground, Solicitud Aprobada, Solicitud Pendiente, Solicitud Rechazada, Usuario Activo.

### Sistema de diseño/Moléculas/SupportNotice

(sin descripción previa registrada).

Contenido: Docs + 3 historias. Fuente: `./src/design-system/components/molecules/SupportNotice.stories.tsx`.
Historias: En Inferencia, En Informe, Playground.

### Sistema de diseño/Moléculas/Timeline

Para mostrar una secuencia de eventos con fechas y contexto

Contenido: Docs + 2 historias. Fuente: `./src/design-system/components/molecules/Timeline.stories.tsx`.
Historias: Con Eventos Sintéticos, Sin Eventos.

### Sistema de diseño/Moléculas/TiradsBadge

Para mostrar la categoría TI-RADS ya obtenida por la aplicación

Contenido: Docs + 4 historias. Fuente: `./src/design-system/components/molecules/TiradsBadge.stories.tsx`.
Historias: Categoría Cuatro, Categoría Tres, Categoría Uno, Sin Clasificar.

### Sistema de diseño/Moléculas/Toast

Para anunciar un cambio o mensaje breve mediante una región de estado

Contenido: Docs + 8 historias. Fuente: `./src/design-system/components/molecules/Toast.stories.tsx`.
Historias: Atención, Con Acción, Contenido Largo, Correcta, Error, Informativa, Neutra, Playground.

### Sistema de diseño/Organismos/AuthLayout

(sin descripción previa registrada).

Contenido: Docs + 3 historias. Fuente: `./src/design-system/components/organisms/AuthLayout.stories.tsx`.
Historias: Ancho Predeterminado, Panel Amplio, Playground.

### Sistema de diseño/Organismos/ConfusionMatrix

(sin descripción previa registrada).

Contenido: Docs + 2 historias. Fuente: `./src/design-system/components/organisms/ConfusionMatrix.stories.tsx`.
Historias: Muchas Categorias, Valores Sinteticos.

### Sistema de diseño/Organismos/Dialog

(sin descripción previa registrada).

Contenido: Docs + 4 historias. Fuente: `./src/design-system/components/organisms/Dialog.stories.tsx`.
Historias: Abierto, Cierre Con Escape, Playground, Sin Descripcion.

### Sistema de diseño/Organismos/FileDropzone

(sin descripción previa registrada).

Contenido: Docs + 5 historias. Fuente: `./src/design-system/components/organisms/FileDropzone.stories.tsx`.
Historias: Con Error, Deshabilitada, Playground, Predeterminada, Seleccion Multiple.

### Sistema de diseño/Organismos/ImageViewer

(sin descripción previa registrada).

Contenido: Docs + 6 historias. Fuente: `./src/design-system/components/organisms/ImageViewer.stories.tsx`.
Historias: Arrastrando, Con Brillo, Con Imagen, Con Imagen De Prueba, Con Zoom, Sin Imagen.

### Sistema de diseño/Organismos/PublicFooter

(sin descripción previa registrada).

Contenido: Docs + 2 historias. Fuente: `./src/design-system/components/organisms/PublicFooter.stories.tsx`.
Historias: Predeterminada, Solo Identidad.

### Sistema de diseño/Organismos/PublicNav

(sin descripción previa registrada).

Contenido: Docs + 2 historias. Fuente: `./src/design-system/components/organisms/PublicNav.stories.tsx`.
Historias: Etiquetas Accesibles, Predeterminada.

### Sistema de diseño/Organismos/RoleCard

(sin descripción previa registrada).

Contenido: Docs + 4 historias. Fuente: `./src/design-system/components/organisms/RoleCard.stories.tsx`.
Historias: Administrador, Investigador, Medico, Playground.

### Sistema de diseño/Organismos/ScanViewport

(sin descripción previa registrada).

Contenido: Docs + 3 historias. Fuente: `./src/design-system/components/organisms/ScanViewport.stories.tsx`.
Historias: Con Marcas, Playground, Sin Marcas.

### Sistema de diseño/Organismos/SidebarLayout

(sin descripción previa registrada).

Contenido: Docs + 3 historias. Fuente: `./src/design-system/components/organisms/SidebarLayout.stories.tsx`.
Historias: Contenido Largo, Escritorio, Playground.

### Sistema de diseño/Organismos/TrendBars

(sin descripción previa registrada).

Contenido: Docs + 3 historias. Fuente: `./src/design-system/components/organisms/TrendBars.stories.tsx`.
Historias: Conteos, Playground, Valores Cero.

### Sistema de diseño/Patrones/Búsqueda

Patron de busqueda con campo, filtros asociados y resultados

Contenido: Docs + 3 historias. Fuente: `./src/design-system/patterns/Busqueda.stories.tsx`.
Historias: Limpiar, Resultados, Sin Resultados.

### Sistema de diseño/Patrones/Carga de archivos

Seleccion y arrastre de archivos, con estados de subida y error

Contenido: Docs + 3 historias. Fuente: `./src/design-system/patterns/CargaArchivos.stories.tsx`.
Historias: Con Error, Multiple, Predeterminado.

### Sistema de diseño/Patrones/Confirmaciones

Dialogos de confirmacion para acciones destructivas o irreversibles

Contenido: Docs + 2 historias. Fuente: `./src/design-system/patterns/Confirmaciones.stories.tsx`.
Historias: Destructiva, Reversible.

### Sistema de diseño/Patrones/Estados

Como representar carga, vacio y error dentro de listados y tablas

Contenido: Docs + 1 historia. Fuente: `./src/design-system/patterns/Estados.stories.tsx`.
Historias: Guia.

### Sistema de diseño/Patrones/Filtros

Barra de filtros con reinicio y contadores activos

Contenido: Docs + 1 historia. Fuente: `./src/design-system/patterns/Filtros.stories.tsx`.
Historias: Criterios Activos.

### Sistema de diseño/Patrones/Flujos clínicos

Secuencia de pasos de atencion: ficha, documentos, imagenes e inferencia

Contenido: Docs + 3 historias. Fuente: `./src/design-system/patterns/FlujosClinicos.stories.tsx`.
Historias: Apoyo A Decision, Confirmacion Ocr, Historial De Versiones.

### Sistema de diseño/Patrones/Formularios

Estructura de formularios con etiquetas, ayuda, validacion y errores

Contenido: Docs + 3 historias. Fuente: `./src/design-system/patterns/Formularios.stories.tsx`.
Historias: Con Errores, Con Secciones, Simple.

### Sistema de diseño/Patrones/Modales

Apertura, foco atrapado y cierre de dialogos

Contenido: Docs + 2 historias. Fuente: `./src/design-system/patterns/Modales.stories.tsx`.
Historias: Con Formulario, Informativo.

### Sistema de diseño/Patrones/Navegación

Navegacion lateral y por roles dentro del marco de aplicacion

Contenido: Docs + 1 historia. Fuente: `./src/design-system/patterns/Navegacion.stories.tsx`.
Historias: Pestañas.

### Sistema de diseño/Patrones/Notificaciones

Avisos, toasts y mensajes de estado

Contenido: Docs + 2 historias. Fuente: `./src/design-system/patterns/Notificaciones.stories.tsx`.
Historias: Con Accion, Tonos.

### Sistema de diseño/Patrones/Paginación

Control de paginas, tamano y navegacion entre resultados

Contenido: Docs + 2 historias. Fuente: `./src/design-system/patterns/Paginacion.stories.tsx`.
Historias: Por Desplazamiento, PáginaÚnica.

### Sistema de diseño/Patrones/Permisos

Interfaz condicionada por permisos y roles, con estados de acceso denegado

Contenido: Docs + 2 historias. Fuente: `./src/design-system/patterns/Permisos.stories.tsx`.
Historias: Acceso Denegado, Matriz De Permisos.

### Sistema de diseño/Patrones/Tablas y listados

Tablas densas con orden, acciones por fila y estados

Contenido: Docs + 4 historias. Fuente: `./src/design-system/patterns/Tablas.stories.tsx`.
Historias: Cargando, Con Datos, Densa, Vacia.

### Sistema de diseño/Patrones/Validación

Reglas y mensajes de validacion en campos de formulario

Contenido: Docs + 2 historias. Fuente: `./src/design-system/patterns/Validacion.stories.tsx`.
Historias: Al Salir Del Campo, Con Errores.

### Sistema de diseño/Plantillas/Formulario de registro

Plantilla de formulario completo con secciones, validacion y resumen final

Contenido: Docs + 3 historias. Fuente: `./src/design-system/templates/FormularioRegistro.stories.tsx`.
Historias: Con Errores, Guardando, Inicial.

### Sistema de diseño/Plantillas/Lista y detalle

Plantilla maestro-detalle: listado a la izquierda y detalle en panel lateral

Contenido: Docs + 3 historias. Fuente: `./src/design-system/templates/ListaDetalle.stories.tsx`.
Historias: Con Datos, Seleccion Inicial, Sin Datos.

### Sistema de diseño/Plantillas/Panel de métricas

Plantilla de tablero con tarjetas de metrica y graficas de apoyo

Contenido: Docs + 3 historias. Fuente: `./src/design-system/templates/PanelMetricas.stories.tsx`.
Historias: Cargando, Con Datos, Un Panel Con Error.

### Sistema de diseño/Primitivos/Tonos

Mapa de tonos semánticos (información, éxito, atención, peligro) y sus combinaciones

Contenido: Docs + 1 historia. Fuente: `./src/design-system/primitives/Tonos.stories.tsx`.
Historias: Default.

### Sistema de diseño/Átomos/Badge

Para mostrar una etiqueta breve que identifique un estado o categoría

Contenido: Docs + 4 historias. Fuente: `./src/design-system/components/atoms/Badge.stories.tsx`.
Historias: Contenido Largo, Playground, Predeterminado, Tonos.

### Sistema de diseño/Átomos/BrandMark

Para identificar visualmente la marca con su símbolo y, de forma predeterminada, el nombre

Contenido: Docs + 4 historias. Fuente: `./src/design-system/components/atoms/BrandMark.stories.tsx`.
Historias: Playground, Predeterminado, Solo Simbolo, Tamaños.

### Sistema de diseño/Átomos/Button

Para acciones activables dentro de formularios o flujos de interfaz

Contenido: Docs + 6 historias. Fuente: `./src/design-system/components/atoms/Button.stories.tsx`.
Historias: Contenido Largo, Estados, Playground, Predeterminado, Tamaños, Variantes.

### Sistema de diseño/Átomos/Card

Para agrupar contenido relacionado en una superficie con borde y fondo

Contenido: Docs + 3 historias. Fuente: `./src/design-system/components/atoms/Card.stories.tsx`.
Historias: Con Subcomponentes, Contenido Largo, Predeterminado.

### Sistema de diseño/Átomos/Checkbox

Para permitir seleccionar o deseleccionar una opción independiente

Contenido: Docs + 5 historias. Fuente: `./src/design-system/components/atoms/Checkbox.stories.tsx`.
Historias: Con Error, Deshabilitado, Marcado, Normal, Playground.

### Sistema de diseño/Átomos/Input

Para campos de entrada de una sola línea, usando `type` según el dato requerido

Contenido: Docs + 3 historias. Fuente: `./src/design-system/components/atoms/Input.stories.tsx`.
Historias: Estados, Playground, Predeterminado.

### Sistema de diseño/Átomos/Label

Para dar nombre visible a un control de formulario mediante `htmlFor`

Contenido: Docs + 3 historias. Fuente: `./src/design-system/components/atoms/Label.stories.tsx`.
Historias: Campo Requerido, Playground, Predeterminado.

### Sistema de diseño/Átomos/Progress

Para comunicar el avance cuantificable o indeterminado de una operación

Contenido: Docs + 5 historias. Fuente: `./src/design-system/components/atoms/Progress.stories.tsx`.
Historias: Completado, Indeterminado, Playground, Predeterminado, Tonos.

### Sistema de diseño/Átomos/Select

Para elegir una opción entre alternativas discretas en un formulario

Contenido: Docs + 3 historias. Fuente: `./src/design-system/components/atoms/Select.stories.tsx`.
Historias: Estados, Playground, Predeterminado.

### Sistema de diseño/Átomos/Spinner

Para indicar visualmente una operación que sigue en curso

Contenido: Docs + 4 historias. Fuente: `./src/design-system/components/atoms/Spinner.stories.tsx`.
Historias: Decorativo, Playground, Predeterminado, Tamaños.

### Sistema de diseño/Átomos/Switch

Para activar o desactivar una opción binaria con efecto inmediato

Contenido: Docs + 5 historias. Fuente: `./src/design-system/components/atoms/Switch.stories.tsx`.
Historias: Activado, Controlado, Deshabilitado, Playground, Predeterminado.

### Sistema de diseño/Átomos/Table

Para presentar datos relacionados con encabezados de filas o columnas

Contenido: Docs + 3 historias. Fuente: `./src/design-system/components/atoms/Table.stories.tsx`.
Historias: Fila Seleccionada, Predeterminado, Vacía.

### Sistema de diseño/Átomos/Tabs

Para organizar paneles de contenido relacionados en secciones seleccionables

Contenido: Docs + 3 historias. Fuente: `./src/design-system/components/atoms/Tabs.stories.tsx`.
Historias: Pestaña Seleccionada, Playground, Predeterminado.

### Sistema de diseño/Átomos/Textarea

Para entradas de texto que pueden ocupar varias líneas

Contenido: Docs + 3 historias. Fuente: `./src/design-system/components/atoms/Textarea.stories.tsx`.
Historias: Estados, Playground, Predeterminado.

## Guías y calidad (8 títulos)

### Guías y calidad/Accesibilidad

Criterios y ejemplos de foco, etiquetas, contraste, lectores de pantalla y navegacion por teclado

Contenido: Docs + 1 historia. Fuente: `./src/design-system/quality/Accesibilidad.stories.tsx`.
Historias: Guia.

### Guías y calidad/Contenido y microcopy

Reglas de redaccion de la interfaz: tono, mensajes de error, textos clinicos y avisos legales

Contenido: Docs + 1 historia. Fuente: `./src/design-system/quality/Contenido.stories.tsx`.
Historias: Glosario.

### Guías y calidad/Diseño adaptable

Comportamiento responsive y puntos de ruptura aplicados a las pantallas

Contenido: Docs + 1 historia. Fuente: `./src/design-system/quality/Adaptable.stories.tsx`.
Historias: Anchos.

### Guías y calidad/Estados y casos límite

Catalogo de estados: carga, vacio, error, sin permiso y datos parciales

Contenido: Docs + 4 historias. Fuente: `./src/design-system/quality/CasosLimite.stories.tsx`.
Historias: Lista Vacia Y Lista Muy Larga, Nombre Muy Largo, Sin Imagen, Texto Largo Sin Espacios.

### Guías y calidad/Evidencias visuales

Registro de capturas de verificacion visual de las pantallas del catalogo

Contenido: Docs + 1 historia. Fuente: `./src/design-system/quality/Evidencias.stories.tsx`.
Historias: Indice.

### Guías y calidad/Evidencias visuales/Imágenes anonimizadas

Galeria de imagenes sinteticas de referencia servidas por Storybook (staticDirs), sin datos reales

Contenido: Docs + 1 historia. Fuente: `./src/design-system/quality/ImagenesAnonimizadas.stories.tsx`.
Historias: Galeria.

### Guías y calidad/Gates de calidad

Checks automaticos del repositorio: ui:check, tamanos, typecheck, lint y pruebas

Contenido: Docs + 1 historia. Fuente: `./src/design-system/quality/Gates.stories.tsx`.
Historias: Guia.

### Guías y calidad/Rendimiento

Criterios de carga y presupuesto de peso de la interfaz

Contenido: Docs + 1 historia. Fuente: `./src/design-system/quality/Rendimiento.stories.tsx`.
Historias: Presupuesto.
