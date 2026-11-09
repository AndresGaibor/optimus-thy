# Guía de Usuario — Investigador

Sistema de Gestión de Datos Clínicos OPTIMUS-THY

> **Nota sobre el Chatbot:** El chatbot está en desarrollo. Se incluirá en la guía cuando esté disponible (TES-139/140).

---

## 1. Inicio de Sesión

### 1.1 Acceder al Sistema

1. Abra su navegador y acceda a la URL del sistema (proporcionada por su administrador).
2. Ingrese su correo electrónico y contraseña.
3. Haga clic en **"Iniciar Sesión"**.

### 1.2 Seleccionar Rol

Después de iniciar sesión, si tiene múltiples roles asignados, seleccione el rol **"Investigador"** en la pantalla de selección de rol.

### 1.3 Modo Investigador — Datos Desidentificados

**Importante:** En el rol investigador, todos los datos están desidentificados. Esto significa:
- No tiene acceso a nombres reales de pacientes
- No tiene acceso a cédulas de identidad
- No tiene acceso a teléfonos ni direcciones
- Los identificadores de paciente son códigos anónimos (ej: P-****-001)

### 1.4 Cerrar Sesión

Para cerrar sesión, haga clic en su nombre/usuario en la esquina superior derecha y seleccione **"Cerrar Sesión"**.

---

## 2. Dashboard del Investigador

**Ruta:** `/researcher/dashboard`

El dashboard muestra un resumen general de los datos disponibles para investigación:

### 2.1 Métricas Principales

| Tarjeta | Descripción |
|---------|-------------|
| **Pacientes (Anon.)** | Total de pacientes desidentificados |
| **Inferencias Totales** | Cantidad de inferencias procesadas por IA |
| **Precisión Global** | Promedio de precisión de todos los modelos |
| **Errores Detectados** | Total de errores, incluyendo falsos negativos críticos |

### 2.2 Banner de Privacidad

Todos los datos que ve están desidentificados. El sistema le recuerda constantemente que no tiene acceso a información personal identificable.

### 2.3 Métricas de Modelos IA

Tabla comparativa del rendimiento de modelos activos:

| Modelo | Accuracy | Precision | Recall | F1-Score | Casos |
|--------|----------|-----------|--------|----------|-------|
| ThyroidNet v2.1 | 94.2% | 93.8% | 94.5% | 94.1% | 245 |
| ThyroDetect v1.5 | 91.7% | 90.2% | 93.1% | 91.6% | 189 |
| NóduloClassifier v3.0 | 89.3% | 88.5% | 90.1% | 89.3% | 156 |

### 2.4 Análisis de Errores

Clasificación de errores del modelo por tipo y severidad:

| Tipo de Error | Cantidad | Porcentaje | Severidad |
|---------------|----------|------------|-----------|
| Falso Positivo | 12 | 4.2% | Media |
| Falso Negativo | 8 | 2.8% | Alta |
| Error de Clasificación | 5 | 1.7% | Baja |

### 2.5 Exportar Dataset

Haga clic en **"Exportar Dataset"** para descargar los datos agregados.

---

## 3. Métricas de Modelos IA

**Ruta:** `/researcher/metrics`

### 3.1 Resumen de Rendimiento

Tres tarjetas con métricas clave:
- **Accuracy promedio:** Precisión global del sistema
- **Casos evaluados:** Cantidad total de casos analizados
- **AUC promedio:** Área bajo la curva ROC promediada

### 3.2 Filtros

Use los filtros para delimitar el análisis:
- **Rango de fechas:** Desde/hasta
- Haga clic en **"Aplicar"** para actualizar los datos
- Use **"Limpiar"** para restablecer los filtros

### 3.3 Tendencia de Accuracy por Modelo

Gráfico de barras que muestra la evolución del rendimiento a través de versiones (v1.0 → v2.x).

### 3.4 Matriz de Confusión

Visualización de los resultados agregados:

|  | Real: Maligno | Real: Benigno |
|--|---------------|---------------|
| **Pred: Maligno** | VP (Verdaderos Positivos) | FP (Falsos Positivos) |
| **Pred: Benigno** | FN (Falsos Negativos) | VN (Verdaderos Negativos) |

**Resumen:**
- **VP:** Casos malignos correctamente identificados
- **FP:** Casos benignos incorrectamente clasificados como malignos
- **FN:** Casos malignos incorrectamente clasificados como benignos (críticos)
- **VN:** Casos benignos correctamente identificados

### 3.5 Comparación de Modelos

Tabla detallada con métricas por modelo:
- Accuracy (con código de colores: verde ≥94%, azul ≥90%, amarillo <90%)
- Precision
- Recall
- F1-Score
- Cantidad de casos evaluados

### 3.6 Exportar Métricas

Haga clic en **"Exportar Métricas"** para descargar los datos.

---

## 4. Cohortes

**Ruta:** `/researcher/cohorts`

### 4.1 ¿Qué es una Cohorte?

Una cohorte es un grupo de pacientes con características similares que se utiliza para estudios de investigación. Los datos de las cohortes están completamente desidentificados.

### 4.2 Banner de Privacidad

Las cohortes están desidentificadas. Solo puede solicitar reidentificación con autorización de un médico.

### 4.3 Explorar Cohortes

Cada tarjeta de cohorte muestra:

| Campo | Descripción |
|-------|-------------|
| **Nombre** | Identificador de la cohorte |
| **Descripción** | Resumen del propósito de la cohorte |
| **Pacientes** | Cantidad de pacientes en la cohorte |
| **Inferencias** | Cantidad de inferencias asociadas |
| **TI-RADS** | Distribución de clasificaciones TI-RADS |
| **Bethesda** | Distribución de categorías citológicas |

### 4.4 Acciones

- **Explorar:** Ver el contenido detallado de la cohorte
- **Descargar:** Descargar datos de la cohorte (requiere permisos)

---

## 5. Datasets Desidentificados

**Ruta:** `/researcher/datasets`

### 5.1 Solicitar Acceso a Dataset

1. Identifique el dataset que necesita en la lista de **"Datasets Disponibles"**.
2. Cada dataset muestra:
   - Nombre
   - Cantidad de pacientes
   - Formato (CSV, JSON, etc.)
   - Tamaño

3. Para solicitar acceso:
   - Haga clic en **"Solicitar"**.
   - Complete el formulario indicando el **motivo de la solicitud**.
   - Haga clic en **"Enviar Solicitud"**.

4. Un administrador revisará su solicitud.

### 5.2 Vista Previa

Haga clic en **"Vista previa"** para ver una muestra de los datos (5 registros desidentificados).

Ejemplo de datos en vista previa:

| ID Anon. | TSH | TI-RADS | Bethesda | Edad |
|----------|-----|---------|----------|------|
| P-****-001 | 4.2 | 4B | IV | 45 |
| P-****-015 | 2.8 | 4A | — | 52 |
| P-****-023 | 3.1 | 3 | III | 38 |

### 5.3 Descargar Dataset (Una vez aprobado)

Cuando su solicitud sea aprobada:

1. Haga clic en **"Descargar"**.
2. Aparecerá una ventana con progreso de descarga.
3. Los archivos se descargan en partes:
   - `nombre_dataset_datos.csv`
   - `nombre_dataset_metadata.json`
4. **Importante:** El enlace de descarga expira en 24 horas por seguridad.

### 5.4 Re-descargar

Si el enlace expiró:
1. Haga clic en **"Re-descargar"** dentro de la ventana de descarga.
2. Se generará un nuevo enlace.

---

## 6. Auditoría de Modelos IA

**Ruta:** `/researcher/audit`

### 6.1 Propósito

Esta página permite comparar las predicciones de los modelos IA contra la verdad clínica (diagnóstico histopatológico confirmado).

### 6.2 Banner de Auditoría

Todos los datos están desidentificados. La comparación se hace usando predicción del modelo vs diagnóstico histopatológico.

### 6.3 Resumen de Auditoría

| Métrica | Descripción |
|---------|-------------|
| **Correctos** | Predicciones que coinciden con la verdad clínica |
| **Errores** | Total de discrepancias entre predicción y realidad |
| **Falsos Negativos (críticos)** | Casos malignos no detectados por el modelo |
| **Casos auditados** | Total de casos con comparación disponible |

### 6.4 Filtros de Auditoría

- **Búsqueda por modelo:** Filtre por nombre del modelo
- **Modelo específico:** Seleccione un modelo particular

### 6.5 Rendimiento por Modelo

Tabla de resumen de auditoría por modelo (ground truth: histopathología/biopsia):

| Modelo | Casos | Accuracy | Precision | Recall | F1 |
|--------|-------|----------|-----------|--------|-----|
| ThyroidNet v2.1 | 245 | 94.2% | 93.8% | 94.5% | 94.1% |
| ThyroDetect v1.5 | 189 | 91.7% | 90.2% | 93.1% | 91.6% |

### 6.6 Análisis de Errores

Clasificación de errores según severidad:

| Tipo de Error | Cantidad | Porcentaje | Severidad |
|---------------|----------|------------|-----------|
| Falso Positivo | 12 | 4.2% | Media |
| Falso Negativo | 8 | 2.8% | Alta |
| Error de Clasificación | 5 | 1.7% | Baja |

### 6.7 Eventos de Auditoría del Sistema

Registro de acciones realizadas en el sistema:

| Fecha | Usuario | Acción | Módulo | Detalles |
|-------|---------|--------|--------|----------|
| 2026-04-13 14:30 | Dr. García | INFERENCIA | IA/Jobs | ThyroidNet v2.1 |
| 2026-04-13 10:15 | Dra. López | LOGIN | Auth | Sesión iniciada |

### 6.8 Exportar Reporte

Haga clic en **"Exportar Reporte"** para descargar los datos de auditoría.

---

## 7. Estados de Error y Qué Hacer

### Error al Cargar Datos

**Síntoma:** Mensaje "Error al cargar datos"

**Solución:**
1. Verifique su conexión a internet.
2. Haga clic en **"Reintentar"**.
3. Contacte al administrador si el problema persiste.

### Solicitud de Dataset Rechazada

**Síntoma:** Su solicitud fue rechazada

**Solución:**
1. Contacte al administrador para conocer el motivo.
2. Proporcione información adicional si es necesario.
3. Puede volver a solicitar con un motivo diferente.

### Enlace de Descarga Expirado

**Síntoma:** El enlace de descarga muestra "Expirado"

**Solución:**
1. Haga clic en **"Re-descargar"** para generar un nuevo enlace.
2. Complete la descarga dentro de las 24 horas siguientes.

### Sin Permisos para Ver Cohortes

**Síntoma:** No puede explorar ciertas cohortes

**Solución:**
1. Verifique si necesita autorización adicional.
2. Contacte al administrador para solicitar permisos.

---

## 8. Datos Ficticios en Ejemplos

Todos los ejemplos utilizados en esta guía usan datos ficticios:
- Nombres de pacientes ficticios
- Resultados de laboratorio ficticios
- Métricas de modelos ficticias
- Cohortes ficticias

Ningún dato real de pacientes fue utilizado en la documentación.

---

## 9. Glosario

| Término | Definición |
|---------|------------|
| **Desidentificado** | Datos donde se ha removido información personal identifiable |
| **Cohorte** | Grupo de pacientes con características similares para investigación |
| **Ground Truth** | Verdad clínica confirmada (generalmente por histopatología) |
| **VP (Verdadero Positivo)** | Caso maligno correctamente predicho como maligno |
| **VN (Verdadero Negativo)** | Caso benigno correctamente predicho como benigno |
| **FP (Falso Positivo)** | Caso benigno incorrectamente predicho como maligno |
| **FN (Falso Negativo)** | Caso maligno incorrectamente predicho como benigno |
| **Accuracy** | Proporción de predicciones correctas |
| **Precision** | Proporción de positivos predichos que son realmente positivos |
| **Recall** | Proporción de casos positivos correctamente detectados |
| **F1-Score** | Media armónica de Precision y Recall |
| **AUC** | Área bajo la curva ROC |
| **TI-RADS** | Sistema de reporte Thyroid Imaging Reporting and Data System |
| **Bethesda** | Sistema de clasificación citológica de nódulos tiroideos |
| **Grad-CAM** | Técnica de visualización de regiones de atención del modelo |
| **OCR** | Reconocimiento óptico de caracteres |

---

*Última actualización: Septiembre 2026*
*Versión del sistema: OPTIMUS-THY v2.1*
