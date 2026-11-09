# Guía de Usuario — Médico

Sistema de Gestión de Datos Clínicos OPTIMUS-THY

> **Nota sobre el Chatbot:** El chatbot está en desarrollo. Se incluirá en la guía cuando esté disponible (TES-139/140).

---

## 1. Inicio de Sesión

### 1.1 Acceder al Sistema

1. Abra su navegador y acceda a la URL del sistema (proporcionada por su administrador).
2. Ingrese su correo electrónico y contraseña.
3. Haga clic en **"Iniciar Sesión"**.

### 1.2 Seleccionar Rol

Después de iniciar sesión, si tiene múltiples roles asignados, seleccione el rol **"Médico"** en la pantalla de selección de rol.

### 1.3 Cerrar Sesión

Para cerrar sesión, haga clic en su nombre/usuario en la esquina superior derecha y seleccione **"Cerrar Sesión"**.

---

## 2. Dashboard del Médico

**Ruta:** `/doctor/dashboard`

El dashboard muestra un resumen de su actividad clínica:

| Tarjeta | Descripción |
|---------|-------------|
| **Mis Pacientes** | Cantidad total de pacientes registrados |
| **Casos Activos** | Casos clínicos que están abiertos |
| **Inferencias IA** | Total de inferencias, pendientes y completadas |
| **Documentos** | Cantidad de documentos activos |

### Inferencias Recientes

Tabla con los últimos resultados de modelos de IA incluyendo:
- Paciente (código interno)
- Modelo utilizado
- Resultado de la predicción
- Confianza del modelo
- Estado (Completado, Fallido, En proceso)
- Fecha

### Acciones Rápidas

- **Nueva Inferencia:** Abre la página de inferencia IA
- **Actualizar:** Recarga los datos del dashboard

---

## 3. Gestión de Pacientes

**Ruta:** `/doctor/patients`

### 3.1 Listar Pacientes

La página muestra una tabla con los pacientes registrados con la siguiente información:
- Código interno
- Nombre completo
- Cédula de identidad (parcialmente enmascarada)
- Sexo
- Institución
- Estado (Activo/Inactivo)
- Acciones

#### Búsqueda

Utilice el campo de búsqueda para filtrar por nombre, cédula o código interno.

#### Paginación

Si hay más de 20 pacientes, use los botones **Anterior/Siguiente** para navegar.

### 3.2 Registrar Nuevo Paciente

1. Haga clic en el botón **"Nuevo Paciente"**.
2. Complete el formulario con los datos requeridos:
   - **Código Interno** (obligatorio)
   - **Número de Historia Clínica** (obligatorio)
   - **Primer Nombre** (obligatorio)
   - **Apellidos** (obligatorio)
   - **Cédula de Identidad** (opcional)
   - **Fecha de Nacimiento** (opcional)
   - **Sexo** (opcional)
   - **Teléfono** (opcional)
   - **Email** (opcional)
   - **Dirección** (opcional)
   - **Institución** (opcional, opciones predefinidas)
3. Haga clic en **"Guardar"**.

### 3.3 Ver Detalle de Paciente

Haga clic en el botón **"Ver"** de un paciente para acceder a su detalle.

**Ruta:** `/doctor/patients/:id`

El detalle del paciente incluye:

#### Información Demográfica
- Nombre completo
- Código de historia clínica
- Cédula (enmascarada)
- Edad, sexo
- Teléfono y email (enmascarados)
- Institución
- Última visita

#### Historia Clínica
- Motivo de consulta
- Antecedentes personales
- Medicación actual
- Comorbilidades

### 3.4 Tabs del Paciente

#### Perfil Tiroideo
Datos consolidados del perfil tiroideo:
- Antecedentes familiares de cáncer
- Exposición a radiación
- Hallazgos ecográficos
- Tamaño del nódulo
- Lateralidad
- **TI-RADS:** Clasificación de riesgo
- **PAAF:** Si se realizó biopsia
- **Bethesda:** Categoría citológica
- Histopatología
- Plan de seguimiento

Para actualizar el perfil tiroideo, haga clic en **"Actualizar Perfil"** (requiere tener un caso clínico activo).

#### Consentimientos
Lista de consentimientos informados del paciente con su estado (Otorgado/Revocado):
- Atención clínica
- Uso de IA diagnóstica
- Extracción OCR de fichas
- Almacenamiento de imágenes
- Investigación médica
- Exportación anonimizada

Haga clic en **"Otorgar"** o **"Revocar"** para modificar cada consentimiento.

#### Laboratorios
Historial de resultados de laboratorio:
- Fecha
- TSH (con indicador si está alto)
- T3
- T4
- Laboratorio

**Nota:** Los valores de referencia son:
- TSH: 0.4-4.5 mUI/L
- T3: 0.8-2.0 ng/mL
- T4: 4.5-12.0 ug/dL

#### Imágenes
Galería de imágenes médicas del paciente (ecografías, etc.). Haga clic en **"Ver"** para ampliar la imagen o **"Subir Imagen"** para agregar nuevas.

#### Fichas Clínicas
Lista de fichas clínicas digitalizadas con OCR:
- ID de ficha
- Fecha
- Tipo (Consulta General, Ecografía, Laboratorio, PAAF/Biopsia)
- Páginas
- Estado (Completa, En Revisión)

Haga clic en una ficha para ver los campos extraídos por OCR con sus niveles de confianza.

#### Inferencias IA
Lista de inferencias realizadas para este paciente:
- Modelo utilizado
- Resultado
- Confianza
- Fecha y tipo de estudio

Haga clic en **"Nueva Inferencia"** para iniciar una nueva.

#### Historial
Cronología de todas las interacciones con el paciente:
- Inferencias IA
- Laboratorios
- Imágenes
- Procedimientos
- Consultas

---

## 4. Imágenes Médicas

**Ruta:** `/doctor/images`

### 4.1 Galería de Imágenes

Vista de todas las imágenes médicas con filtros por:
- Paciente
- Tipo de imagen
- Hallazgo

### 4.2 Subir Imagen

1. Haga clic en **"Subir Imagen"**.
2. Seleccione el tipo de imagen:
   - Ecografía
   - Ecografía Doppler
   - Tomografía
   - PAAF Histología
   - Histopatología
3. Ingrese el subtipo.
4. Seleccione el archivo de imagen (PNG, JPG, DICOM, TIFF — Máx 50MB).
5. Haga clic en **"Seleccionar y Subir"**.

### 4.3 Ver Imagen

Haga clic en una imagen para verla en pantalla completa con:
- Información del paciente
- Metadatos (resolución, formato, tamaño)
- Hallazgo
- Clasificación TI-RADS

### 4.4 Recorte ROI (Región de Interés)

Para preparar una imagen para inferencia IA:

1. Haga clic en el botón **"ROI"** de una imagen.
2. Se abre el recortador de nódulo.
3. Seleccione la región del nódulo (mínimo 32x32 píxeles).
4. Guarde el recorte.

**Importante:** La inferencia IA requiere un recorte de ROI válido.

---

## 5. Inferencia de Inteligencia Artificial

**Ruta:** `/doctor/inference`

### 5.1 Configurar Nueva Inferencia

1. **Seleccione el paciente** de la lista.
2. **Seleccione el modelo de clasificación:**
   - DINOv3 ViT-L/16 (dinov3-thyroid-v1.0)
   - DINOv3 ViT-L/14 (Baseline Sapienza)
3. **Seleccione o cree un Recorte ROI (obligatorio):**
   - Haga clic en **"Seleccionar o Crear Recorte"**.
   - Use el recortador para definir la región del nódulo.
   - El recorte debe ser mínimo 32x32 píxeles.

### 5.2 Iniciar Inferencia

Haga clic en **"Iniciar Inferencia DINOv3"** cuando:
- Haya seleccionado un paciente
- Tenga un ROI válido seleccionado

### 5.3 Estados de la Inferencia

| Estado | Descripción |
|--------|-------------|
| **Pendiente** | La inferencia está en cola |
| **En Proceso** | El modelo está analizando la imagen |
| **Completado** | La inferencia terminó exitosamente |
| **Fallido** | Ocurrió un error durante el procesamiento |

### 5.4 Ver Resultados

Una vez completada la inferencia, puede ver:

#### Informe
Haga clic en **"Informe"** para ver el reporte completo de la clasificación.

#### Mapa de Calor Grad-CAM
Haga clic en **"Grad-CAM"** para ver el mapa de calor que muestra qué regiones de la imagen influyeron en la predicción.

### 5.5 Notas Importantes

- El modelo **DINOv3 clasifica exclusivamente nódulos previamente recortados** (ROI).
- El especialista debe seleccionar o confirmar la región de interés antes de procesar.
- No se puede procesar una imagen completa sin definir el ROI.

---

## 6. Casos Clínicos

Los casos clínicos se crean automáticamente cuando se registra un paciente. Cada caso incluye:
- Perfil tiroideo
- Consentimientos
- Encuentros/visitas

Para agregar nuevos encuentros o actualizar el perfil, acceda a la sección correspondiente desde el detalle del paciente.

---

## 7. Estados de Error y Qué Hacer

### Error al Cargar Pacientes

**Síntoma:** Mensaje "Error al cargar pacientes"

**Solución:**
1. Verifique su conexión a internet.
2. Haga clic en **"Reintentar"**.
3. Si el problema persiste, contacte al administrador.

### Error al Registrar Paciente

**Síntoma:** Mensaje "Error al registrar paciente"

**Solución:**
1. Verifique que todos los campos obligatorios estén completos.
2. Verifique que el código interno no esté duplicado.
3. Contacte al administrador si el problema persiste.

### Inferencia Fallida

**Síntoma:** Estado de inferencia aparece como "Fallido"

**Solución:**
1. Verifique que la imagen sea válida.
2. Confirme que el ROI esté correctamente definido.
3. Intente nuevamente con una nueva imagen.
4. Contacte al administrador si el problema persiste.

### Error de Carga de Imágenes

**Síntoma:** No se pueden subir imágenes

**Solución:**
1. Verifique que el archivo no supere los 50MB.
2. Confirme que el formato sea válido (PNG, JPG, DICOM, TIFF).
3. Verifique su conexión a internet.

### Pérdida de Sesión

**Síntoma:** El sistema pide重新 iniciar sesión

**Solución:**
1. Inicie sesión nuevamente con sus credenciales.
2. Si el problema es frecuente, contacte al administrador.

---

## 8. Datos Ficticios en Ejemplos

Todos los ejemplos utilizados en esta guía usan datos ficticios:
- Nombres de pacientes ficticios
- Cédulas ficticias
- Resultados de laboratorio ficticios
- Direcciones y teléfonos ficticios

Ningún dato real de pacientes fue utilizado en la documentación.

---

## 9. Glosario

| Término | Definición |
|---------|------------|
| **ROI** | Región de Interés (Region of Interest) - Área del nódulo seleccionada para análisis |
| **TI-RADS** | Sistema de reporte Thyroid Imaging Reporting and Data System |
| **PAAF** | Punción Aspiración con Aguja Fina - Biopsia de tiroides |
| **Bethesda** | Sistema de clasificación citológica de nódulos tiroideos |
| **DINOv3** | Modelo de deep learning para clasificación de nódulos |
| **Grad-CAM** | Técnica de visualización que muestra regiones de atención del modelo |
| **OCR** | Reconocimiento óptico de caracteres para digitalizar fichas |
| **TSH** | Hormona estimulante de la tiroides |
| **T3/T4** | Hormonas tiroideas |

---

*Última actualización: Septiembre 2026*
*Versión del sistema: OPTIMUS-THY v2.1*
