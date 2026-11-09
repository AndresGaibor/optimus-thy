# Inventario de Rutas, Páginas Legacy y Módulos — OPTIMUS-THY

**Issue de Referencia:** [TES-157](https://linear.app/andres-gaibor/issue/TES-157)  
**Proyecto:** OPY — referencia funcional  
**Fecha:** 2026-09-22  
**Estado:** Aprobado para ejecución  

---

## 1. Contexto y Justificación

El repositorio contenía dos generaciones de frontend:
1. Una generación inicial (monolítica y exploratoria) con páginas planas no modularizadas, estado basado en memoria/simulación y selectores de rol libres.
2. Una generación modular orientada a Feature/Page-based Architecture con RBAC estricto, clientes OpenAPI tipados, persistencia backend y separación por roles operativos (`doctor`, `researcher`, `admin`).

Este documento establece la matriz formal de decisión para prevenir duplicaciones de implementación, garantizar consistencia con las fuentes canónicas (Google Sheet de requisitos y repositorio principal) y definir la ruta de migración o eliminación de cada componente.

---

## 2. Matriz Canónica de Rutas Activas

| Ruta | Página / Componente | Propósito Operativo | Fuente Canónica | Issue Linear | Decisión |
|---|---|---|---|---|---|
| `/` | `LandingPage` (`pages/landing.tsx`) | Portal público institucional del proyecto OPTIMUS-THY y proyectos de investigación | Requisitos Generales / CMS | [TES-154](https://linear.app/andres-gaibor/issue/TES-154) | **Conservar** |
| `/projects` | `PublicProjectsPage` (`pages/public-projects.tsx`) | Listado público de proyectos CMS y publicaciones sin acceso a datos clínicos | Requisitos CMS | [TES-154](https://linear.app/andres-gaibor/issue/TES-154) | **Conservar** |
| `/projects/:id` | `ProjectDetailPage` (`pages/project-detail`) | Ficha detallada de proyecto público de investigación | Requisitos CMS | [TES-154](https://linear.app/andres-gaibor/issue/TES-154) | **Conservar** |
| `/login` | `LoginPage` (`pages/login.tsx`) | Autenticación real por credenciales, sesión HTTP y redirección según rol | Módulo Autenticación | [TES-148](https://linear.app/andres-gaibor/issue/TES-148) | **Conservar** |
| `/role-select` | `RoleSelectPage` (`pages/role-select.tsx`) | Selector libre de roles en entorno de simulación pre-RBAC | Artefacto prototipo | [TES-100](https://linear.app/andres-gaibor/issue/TES-100), [TES-102](https://linear.app/andres-gaibor/issue/TES-102) | **Eliminar / Redirigir**: Debe desaparecer en producción; el rol proviene exclusivamente de la sesión backend |
| `/doctor/dashboard` | `DoctorDashboardPage` (`pages/doctor-dashboard`) | Resumen clínico del médico: pacientes recientes, estado de inferencias y alertas | Dominio Clínico | [TES-141](https://linear.app/andres-gaibor/issue/TES-141) | **Conservar** |
| `/doctor/patients` | `DoctorPatientsPage` (`pages/doctor-patients`) | Listado, búsqueda y registro de pacientes asignados | Dominio Pacientes | [TES-104](https://linear.app/andres-gaibor/issue/TES-104) | **Conservar** |
| `/doctor/patients/:id` | `DoctorPatientDetailPage` (`pages/doctor-patient-detail`) | Ficha médica integral del paciente, antecedentes y consentimientos | Dominio Pacientes | [TES-108](https://linear.app/andres-gaibor/issue/TES-108) | **Conservar** |
| `/doctor/records` | `DoctorRecordsPage` (`pages/doctor-records`) | Fichas clínicas escaneadas, extracción OCR y revisión humana de datos | Dominio OCR | [TES-113](https://linear.app/andres-gaibor/issue/TES-113) | **Conservar** |
| `/doctor/images` | `DoctorImagesPage` (`pages/doctor-images`) | Gestión y visualización de ecografías tiroideas y selección de ROI | Dominio Imágenes | [TES-120](https://linear.app/andres-gaibor/issue/TES-120) | **Conservar** |
| `/doctor/inference` | `DoctorInferencePage` (`pages/doctor-inference`) | Lanzamiento de modelos IA DINOv3 / ThyroidNet sobre ROI seleccionado | Pipeline IA | [TES-120](https://linear.app/andres-gaibor/issue/TES-120) | **Conservar** |
| `/doctor/results` | `DoctorResultsPage` (`pages/doctor-results`) | Visualización de predicción Bethesda, mapa de calor y reporte clínico | Pipeline IA | [TES-120](https://linear.app/andres-gaibor/issue/TES-120) | **Conservar** |
| `/researcher/dashboard` | `ResearcherDashboardPage` (`pages/researcher-dashboard`) | Panel de control de investigación y estado de modelos | Dominio Investigación | [TES-126](https://linear.app/andres-gaibor/issue/TES-126) | **Conservar** |
| `/researcher/metrics` | `ResearcherMetricsPage` (`pages/researcher-metrics`) | Métricas globales (Accuracy, ROC-AUC, F1-Score, Sensibilidad/Especificidad) | Dominio Investigación | [TES-126](https://linear.app/andres-gaibor/issue/TES-126) | **Conservar** |
| `/researcher/audit` | `ResearcherAuditPage` (`pages/researcher-audit`) | Auditoría de inferencias vs verdad histopatológica (Ground Truth) | Dominio Auditoría IA | [TES-126](https://linear.app/andres-gaibor/issue/TES-126) | **Conservar** |
| `/researcher/datasets` | `ResearcherDatasetsPage` (`pages/researcher-datasets`) | Datasets clínicos desidentificados y solicitudes de exportación | Dominio Investigación | [TES-124](https://linear.app/andres-gaibor/issue/TES-124) | **Conservar** |
| `/researcher/error-analysis` | `ResearcherErrorAnalysisPage` (`pages/researcher-error-analysis`) | Análisis de falsos positivos y falsos negativos de modelos IA | Dominio Investigación | [TES-126](https://linear.app/andres-gaibor/issue/TES-126) | **Conservar** |
| `/researcher/cohorts` | `ResearcherCohortsPage` (`pages/researcher-cohorts`) | Definición y análisis de cohortes demográficas y ecográficas | Dominio Investigación | [TES-124](https://linear.app/andres-gaibor/issue/TES-124) | **Conservar** |
| `/admin/dashboard` | `AdminDashboardPage` (`pages/admin-dashboard`) | Dashboard global del sistema: salud del servidor, volumen y actividad | Dominio Admin | [TES-142](https://linear.app/andres-gaibor/issue/TES-142) | **Conservar** |
| `/admin/users` | `AdminUsersPage` (`pages/admin-users`) | Gestión de usuarios médicos/investigadores, instituciones y estados | Dominio Admin | [TES-150](https://linear.app/andres-gaibor/issue/TES-150) | **Conservar** |
| `/admin/roles` | `AdminRolesPage` (`pages/admin-roles`) | Matriz RBAC de permisos reales alineados al backend | Dominio Seguridad | [TES-122](https://linear.app/andres-gaibor/issue/TES-122) | **Conservar / Alinear** |
| `/admin/projects` | `AdminProjectsPage` (`pages/admin-projects`) | CRUD de proyectos del CMS público con persistencia backend | Dominio CMS | [TES-154](https://linear.app/andres-gaibor/issue/TES-154) | **Conservar** |
| `/admin/audit` | `AdminAuditPage` (`pages/admin-audit`) | Registro de eventos de auditoría inmutable (append-only) | Dominio Auditoría | [TES-152](https://linear.app/andres-gaibor/issue/TES-152) | **Conservar** |
| `/admin/settings` | `AdminSettingsPage` (`pages/admin-settings`) | Ajustes de runtime no sensibles con aislamiento de secretos | Dominio Configuración | [TES-156](https://linear.app/andres-gaibor/issue/TES-156) | **Conservar** |

---

## 3. Inventario de Páginas Legacy y Huérfanas

| Archivo / Carpeta | Diagnóstico | Reemplazo Canónico | Decisión Final | Justificación Técnica |
|---|---|---|---|---|
| `frontend/src/pages/ai-models.tsx` | Catálogo plano de modelos no integrado a permisos ni flujo clínico | `doctor-inference`, `researcher-metrics` | **Eliminar** | Redundante. Los modelos se gestionan en las pantallas operativas por rol con RBAC estricto. |
| `frontend/src/pages/dashboard.tsx` | Dashboard general pre-RBAC con tabs manuales para médico, admin e investigador | `doctor-dashboard`, `researcher-dashboard`, `admin-dashboard` | **Eliminar** | Violación de segregación de funciones. Cada rol tiene su propia vista protegida. |
| `frontend/src/pages/home/` | Carpeta con `home-page.tsx` no referenciada por el router | `landing.tsx` | **Eliminar** | Código huérfano de iteración anterior. El router sirve `landing.tsx` en `/`. |
| `frontend/src/pages/patient-detail/` | Ficha básica de paciente sin layout médico ni pestañas de encuentros | `doctor-patient-detail/` | **Eliminar** | Duplicado no tipado ni conectado al flujo de consultas clínicas. |
| `frontend/src/pages/patients/` | Tabla no enrutada de pacientes | `doctor-patients/` | **Eliminar** | Reemplazada por la versión enrutada bajo `/doctor/patients`. |
| `frontend/src/pages/projects.tsx` | Vista estática inicial de proyectos | `public-projects.tsx` | **Eliminar** | `public-projects.tsx` ya está conectada al backend `/api/v1/cms/projects`. |
| `frontend/src/pages/settings.tsx` | Pantalla de configuración monolítica sin backend ni control de secretos | `admin-settings/` | **Eliminar** | Reemplazada completamente en TES-156 con validación backend, dirty state y auditoría. |
| `frontend/src/pages/studies.tsx` | Explorador general de estudios de imagen desconectado del paciente | `doctor-images/` | **Migrar componentes / Eliminar página** | Los controles de overlay/recorte se migraron a `doctor-images` y `doctor-inference`. La página huérfana debe eliminarse. |
| `frontend/src/pages/users.tsx` | Vista simple no enrutada de usuarios | `admin-users/` | **Eliminar** | Duplicado obsoleto de `admin-users/ui/admin-users-page.tsx`. |

---

## 4. Componentes Compartidos: Estado de Uso

- **`frontend/src/components/ui/`**: 
  - `button.tsx`, `card.tsx`, `input.tsx`, `badge.tsx`, `label.tsx`, `modal.tsx`, `notification.tsx` -> **En uso activo**. Conservar como base de UI.
- **`frontend/src/components/ai-overlay-viewer.tsx`** y **`ai-report-viewer.tsx`**:
  - **En uso activo** en `doctor-results` y `doctor-images`. Conservar.
- **`frontend/src/widgets/`**:
  - `role-layout.tsx`, `sidebar-layout.tsx`, `app-shell/` -> **En uso activo**. Provee navegación consistente por rol.

---

## 5. Runtime, Herramientas y Simulaciones Fuera de Pages

1. **`frontend/src/index.ts` y `frontend/build.ts`**:
   - Pertenecen al runtime de producción de Bun para servir la SPA y realizar el bundle con Tailwind CSS v4.
   - **Decisión:** **Conservar**. Están completamente integrados en el pipeline `bun run build` y verificados en `make check`.

2. **`ia-tiroides/src/gui/app.py` y `ia-tiroides/docs/GUI.md`**:
   - Clasificación: **Herramienta offline de investigación / demo local**.
   - No confundir con la aplicación web productiva. El pipeline web productivo utiliza los endpoints de FastAPI y workers asíncronos (`ModelRunner`), no la GUI Tkinter/Desktop.
   - **Decisión:** **Mantener aislada** bajo `ia-tiroides/` como tooling de laboratorio sin acoplarla al runtime web.

3. **`providers/simulation-context.tsx` y mocks en memoria**:
   - Actualmente usados en componentes no conectados todavía a backend (doctor-inference, doctor-records).
   - **Decisión:** **Retirar progresivamente** según el avance de los issues de integración real ([TES-102](https://linear.app/andres-gaibor/issue/TES-102), [TES-104](https://linear.app/andres-gaibor/issue/TES-104), [TES-120](https://linear.app/andres-gaibor/issue/TES-120)). No crear nuevas dependencias en este context.

---

## 6. Plan de Acción Inmediato

1. Eliminar páginas huérfanas en desuso (`ai-models.tsx`, `dashboard.tsx`, `home/`, `patient-detail/`, `patients/`, `projects.tsx`, `settings.tsx`, `studies.tsx`, `users.tsx`) en el paso correspondiente a limpieza de refactorización para evitar ruido y falsos positivos en el análisis estático.
2. Asegurar que las rutas del router coincidan al 100% con los bloques funcionales de Linear.
3. Avanzar con el desbloqueo de infraestructura en [TES-96](https://linear.app/andres-gaibor/issue/TES-96) (PostgreSQL + S3 compatible local).
