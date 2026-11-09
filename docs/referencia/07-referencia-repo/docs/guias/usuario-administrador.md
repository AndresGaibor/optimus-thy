# Guía de Usuario — Administrador

Sistema de Gestión de Datos Clínicos OPTIMUS-THY

> **Nota sobre el Chatbot:** El chatbot está en desarrollo. Se incluirá en la guía cuando esté disponible (TES-139/140).

---

## 1. Inicio de Sesión

### 1.1 Acceder al Sistema

1. Abra su navegador y acceda a la URL del sistema (proporcionada por su administrador).
2. Ingrese su correo electrónico y contraseña de administrador.
3. Haga clic en **"Iniciar Sesión"**.

### 1.2 Seleccionar Rol

Después de iniciar sesión, si tiene múltiples roles asignados, seleccione el rol **"Administrador"** en la pantalla de selección de rol.

### 1.3 Cerrar Sesión

Para cerrar sesión, haga clic en su nombre/usuario en la esquina superior derecha y seleccione **"Cerrar Sesión"**.

---

## 2. Dashboard del Administrador

**Ruta:** `/admin/dashboard`

El dashboard muestra un resumen del estado del sistema:

### 2.1 Métricas Principales

| Tarjeta | Descripción |
|---------|-------------|
| **Usuarios Activos** | Cantidad de usuarios con estado activo |
| **Accesos Hoy** | Eventos de auditoría del día actual |
| **Total Accesos** | Total de eventos en el registro de auditoría |
| **Instituciones** | Cantidad de instituciones registradas |

### 2.2 Auditoría de Actividad

Panel que muestra los últimos eventos de auditoría del sistema con:
- Icono de color según el módulo
- Nombre del usuario y su rol
- Acción realizada
- Detalles adicionales
- Fecha y hora
- Dirección IP

### 2.3 Usuarios por Rol

Gráfico de barras que muestra la distribución de usuarios por rol:
- Médico
- Investigador
- Administrador

### 2.4 Resumen del Sistema

Panel con estadísticas generales:
- Usuarios Totales
- Usuarios Activos
- Instituciones
- Eventos de Auditoría
- Roles Configurados

### 2.5 Solicitudes de Datasets

Panel que muestra las solicitudes de datasets realizadas por investigadores:

#### Pendientes
- Dataset solicitado
- Nombre del solicitante
- Fecha de solicitud
- Motivo declarado

**Acciones:**
- **Aprobar:** Permite la descarga del dataset
- **Rechazar:** Deniega la solicitud (requiere especificar motivo)

#### Resueltas
- Estado (Aprobado/Rechazado)
- Revisado por
- Fecha de resolución
- Observación (si fue rechazado)

---

## 3. Gestión de Usuarios

**Ruta:** `/admin/users`

### 3.1 Lista de Usuarios

Tabla con todos los usuarios del sistema:

| Campo | Descripción |
|-------|-------------|
| **Usuario** | Nombre completo |
| **Email** | Correo electrónico |
| **Rol** | Rol asignado (Médico/Investigador/Administrador) |
| **Institución** | Institución a la que pertenece |
| **Estado** | Activo o Inactivo |
| **Acciones** | Editar estado |

### 3.2 Buscar Usuarios

Utilice el campo de búsqueda para filtrar por nombre, email o rol.

### 3.3 Crear Nuevo Usuario

1. Haga clic en **"Nuevo Usuario"**.
2. Complete el formulario:
   - **Nombre completo** (ej: Dra. Carmen Vela)
   - **Correo electrónico** (ej: carmen.vela@hospital.gob.ec)
   - **Rol principal:** Seleccione Médico, Investigador o Administrador
   - **Institución:** Hospital Central (u otra)
3. Haga clic en **"Crear Usuario"**.

### 3.4 Activar/Desactivar Usuario

Para cambiar el estado de un usuario:
1. Haga clic en el botón de **"Editar"** en la fila del usuario.
2. El sistema togglea el estado entre Activo/Inactivo.

**Nota:** Los usuarios desactivados no pueden iniciar sesión.

---

## 4. Gestión de Proyectos

**Ruta:** `/admin/projects`

### 4.1 Lista de Proyectos

Tabla con los proyectos del laboratorio:

| Campo | Descripción |
|-------|-------------|
| **Proyecto** | Nombre del proyecto |
| **Estado** | Estado actual (Activo, En progreso, Pausado, Cerrado, En prueba) |
| **Miembros** | Cantidad de miembros |
| **Pub.** | Número de publicaciones |
| **Presupuesto** | Presupuesto asignado |
| **Período** | Fechas de inicio y fin |
| **Acciones** | Ver, Editar, Eliminar |

### 4.2 Estados de Proyecto

| Estado | Color | Descripción |
|--------|-------|-------------|
| Activo | Verde | Proyecto en ejecución normal |
| En progreso | Azul | Proyecto en desarrollo |
| En prueba | Púrpura | Proyecto en fase de pruebas |
| Pausado | Amarillo | Proyecto temporalmente detenido |
| Cerrado | Gris | Proyecto finalizado |

### 4.3 Crear Nuevo Proyecto

1. Haga clic en **"Nuevo Proyecto"**.
2. Complete el formulario:
   - **Nombre del proyecto**
   - **Descripción**
   - **Estado:** Seleccione el estado inicial
   - **Presupuesto:** Ejemplo: $10,000
   - **Fecha inicio**
   - **Fecha fin**
   - **Miembros:** Cantidad inicial
   - **Publicaciones:** Cantidad inicial
3. Haga clic en **"Crear Proyecto"**.

### 4.4 Ver Detalle de Proyecto

Haga clic en el botón **"Ver"** de un proyecto para ver:
- ID del proyecto
- Nombre completo
- Descripción
- Estado
- Presupuesto
- Miembros
- Publicaciones
- Fechas de inicio y fin

### 4.5 Editar Proyecto

1. Haga clic en el botón **"Editar"**.
2. Modifique los campos deseados.
3. Haga clic en **"Guardar Cambios"**.

### 4.6 Cambiar Estado Rápido

Puede cambiar el estado de un proyecto directamente desde la tabla usando el selector desplegable en la columna "Estado".

### 4.7 Eliminar Proyecto

1. Haga clic en el botón **"Eliminar"**.
2. Confirme la eliminación.

**Precaución:** La eliminación es permanente.

---

## 5. Configuración del Sistema

**Ruta:** `/admin/settings`

### 5.1 General y Localización

| Campo | Descripción |
|-------|-------------|
| **Nombre del sistema** | Nombre visible de la aplicación |
| **Idioma predeterminado** | Español (ES) o English (EN) |

### 5.2 Operación e Inferencia

| Configuración | Descripción |
|---------------|-------------|
| **Triage automático de IA** | Encola inferencia preliminar automáticamente al subir imágenes |
| **Modo Mantenimiento** | Bloquea el acceso clínico para mantenimiento (solo administradores pueden operar) |

**Advertencia sobre Modo Mantenimiento:**
- Al activar, solo los administradores tendrán acceso
- Los médicos e investigadores no podrán usar el sistema
- Use solo para mantenimiento planificado

### 5.3 Almacenamiento y Archivos

| Campo | Descripción |
|-------|-------------|
| **Límite máximo de subida** | Tamaño máximo por archivo (1-500 MB) |

**Nota:** El proveedor de almacenamiento es de solo lectura (configurado por variables de entorno).

### 5.4 Notificaciones del Sistema

| Configuración | Descripción |
|---------------|-------------|
| **Notificaciones del sistema** | Emisión de eventos y alertas a usuarios activos |

### 5.5 Parámetros de Seguridad

Información de solo lectura sobre la configuración de seguridad:

| Parámetro | Valor |
|-----------|-------|
| Cifrado de datos en reposo | AES-256 Activo |
| Duración de sesión JWT | 1440 min (24h) |
| Aislamiento de secretos | Secret Manager / .env |

### 5.6 Guardar Cambios

1. Realice los cambios deseados.
2. El botón **"Guardar Configuración"** se habilita cuando hay cambios pendientes.
3. Haga clic en **"Guardar Configuración"**.

---

## 6. Auditoría Completa

**Ruta:** `/admin/audit`

### 6.1 Registro de Auditoría

Panel con todos los eventos del sistema en orden cronológico inverso (más recientes primero).

### 6.2 Búsqueda

Use el campo de búsqueda para encontrar eventos por:
- Nombre de usuario
- Acción
- Detalles
- Dirección IP

### 6.3 Filtros

| Filtro | Descripción |
|--------|-------------|
| **Usuario** | Filtrar por usuario específico |
| **Módulo** | Autenticación, Pacientes, IA/Jobs, Admin, Auditoría |
| **Fecha** | Filtrar por fecha específica |

### 6.4 Módulos de Auditoría

| Módulo | Color | Descripción |
|--------|-------|-------------|
| Auth | Azul | Eventos de autenticación |
| Patients | Verde | Operaciones con pacientes |
| Jobs | Púrpura | Inferencias y jobs de IA |
| Admin | Naranja | Acciones administrativas |
| Audit | Rojo | Eventos de auditoría del sistema |

### 6.5 Exportar Registro

Haga clic en **"Exportar Registro"** para descargar todos los eventos filtrados.

---

## 7. Gestión de Roles

**Ruta:** `/admin/roles` (accesible desde el menú lateral)

### 7.1 Lista de Roles

Tabla con los roles configurados en el sistema:

| Campo | Descripción |
|-------|-------------|
| **Nombre** | Identificador interno del rol |
| **Nombre para mostrar** | Nombre visible en la interfaz |
| **Descripción** | Propósito del rol |
| **Estado** | Activo o Inactivo |
| **Permisos** | Cantidad de permisos asignados |

### 7.2 Roles del Sistema

| Rol | Descripción |
|-----|-------------|
| **Médico** | Acceso a gestión de pacientes, fichas, imágenes e inferencias |
| **Investigador** | Acceso a métricas, cohorts, datasets y auditoría (datos desidentificados) |
| **Administrador** | Acceso completo a todas las funciones del sistema |

---

## 8. Ver Como (Masquerade)

**Nota:** La funcionalidad de "Ver Como" (masquerade) permite a los administradores visualizar el sistema como si fueran otro usuario (médico o investigador) sin necesidad de cerrar sesión.

Para usar esta función:
1. Acceda a la sección de administración de usuarios.
2. Seleccione el usuario sobre el cual desea actuar.
3. Use la opción de "Ver Como" si está disponible.

**Advertencia:** Las acciones realizadas mientras está en modo masquerade quedan registradas bajo su usuario administrador original.

---

## 9. Estados de Error y Qué Hacer

### Error al Cargar Usuarios

**Síntoma:** Mensaje "No se pudieron cargar los usuarios"

**Solución:**
1. Verifique la conexión a la base de datos.
2. Revise los logs del servidor.
3. Contacte al equipo de desarrollo.

### Error al Crear Usuario

**Síntoma:** Mensaje "Error al crear el usuario en el backend"

**Solución:**
1. Verifique que el email no esté duplicado.
2. Confirme que el rol seleccionado sea válido.
3. Revise los logs del servidor.

### Error al Guardar Configuración

**Síntoma:** Mensaje de error al guardar

**Solución:**
1. Verifique los permisos de escritura en la base de datos.
2. Revise los logs del servidor.
3. Intente nuevamente.

### No Se Ven Eventos de Auditoría

**Síntoma:** Tabla de auditoría vacía

**Solución:**
1. Verifique la conexión a la base de datos de auditoría.
2. Confirme que el servicio de auditoría está corriendo.
3. Revise los logs del sistema.

### Solicitudes de Dataset No Aparecen

**Síntoma:** No hay solicitudes pendientes en el dashboard

**Solución:**
1. Verifique que los investigadores estén enviando solicitudes.
2. Confirme que el sistema de notificaciones esté funcionando.
3. Revise los logs.

---

## 10. Datos Ficticios en Ejemplos

Todos los ejemplos utilizados en esta guía usan datos ficticios:
- Nombres de usuarios ficticios
- Emails ficticios
- Proyectos ficticios
- Instituciones ficticias
- Contraseñas ficticias

Ningún dato real fue utilizado en la documentación.

---

## 11. Glosario

| Término | Definición |
|---------|------------|
| **Masquerade** | Función que permite ver el sistema como otro usuario |
| **JWT** | JSON Web Token - Método de autenticación por tokens |
| **AES-256** | Estándar de cifrado avanzado con clave de 256 bits |
| **PII** | Información Personal Identificable (Personally Identifiable Information) |
| **CMS** | Content Management System - Sistema de gestión de contenidos |
| **ROI** | Región de Interés (Region of Interest) |
| **OCR** | Reconocimiento óptico de caracteres |
| **Audit Log** | Registro de auditoría - Log inalterable de eventos |

---

## 12.Mejores Prácticas de Administración

### Seguridad
- No comparta sus credenciales de administrador
- Use el Modo Mantenimiento solo cuando sea necesario
- Revise periódicamente los registros de auditoría
- Mantenga los permisos de usuarios actualizados

### Gestión de Usuarios
- Asigne el rol mínimo necesario a cada usuario
- Revise y desactive cuentas que no se usen
- Mantenga actualizada la información de institución

### Monitoreo
- Revise el dashboard diariamente
- Atienda las solicitudes de datasets promptly
- Monitoree los errores y eventos sospechosos

---

*Última actualización: Septiembre 2026*
*Versión del sistema: OPTIMUS-THY v2.1*
