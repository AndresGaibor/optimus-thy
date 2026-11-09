# TES-135: UX Accessibility Audit Report

**Date:** September 23, 2026
**Auditor:** Fixer Agent
**Commit SHA:** a2a31de303358836ae91d81bc4f795dce9a933e1
**Frontend:** React + Bun + Vite (port 3000)
**Backend:** FastAPI (port 8000)

---

## 1. Inventory: Complete Page List by Role

### Public Pages
| Page | File | Notes |
|------|------|-------|
| Landing | `landing.tsx` | Public landing page |
| Login | `login.tsx` | Authentication |
| Role Select | `role-select.tsx` | Role selection after login |
| Public Projects | `public-projects.tsx` | Public project listing |
| Not Found | `not-found/ui/not-found-page.tsx` | 404 page |

### Doctor Pages
| Page | File | Status |
|------|------|--------|
| Doctor Dashboard | `doctor-dashboard/ui/doctor-dashboard-page.tsx` | ✅ Full UX states |
| Doctor Patients | `doctor-patients/ui/doctor-patients-page.tsx` | ✅ Full UX states |
| Doctor Patient Detail | `doctor-patient-detail/ui/patient-detail-page.tsx` | ✅ Full UX states |
| Doctor Images | `doctor-images/ui/doctor-images-page.tsx` | ✅ Full UX states |
| Doctor Inference | `doctor-inference/ui/doctor-inference-page.tsx` | ✅ Full UX states |
| Doctor Results | `doctor-results/ui/doctor-results-page.tsx` | ✅ Full UX states |
| Doctor Records | `doctor-records/ui/doctor-records-page.tsx` | ✅ Full UX states |

### Researcher Pages
| Page | File | Status |
|------|------|--------|
| Researcher Dashboard | `researcher-dashboard/ui/researcher-dashboard-page.tsx` | ✅ Full UX states |
| Researcher Datasets | `researcher-datasets/ui/researcher-datasets-page.tsx` | ✅ Full UX states |
| Researcher Cohorts | `researcher-cohorts/ui/researcher-cohorts-page.tsx` | ⚠️ Missing action |
| Researcher Metrics | `researcher-metrics/ui/researcher-metrics-page.tsx` | ✅ Full UX states |
| Researcher Error Analysis | `researcher-error-analysis/ui/researcher-error-analysis-page.tsx` | ✅ Full UX states |
| Researcher Audit | `researcher-audit/ui/researcher-audit-page.tsx` | ⚠️ Button no-op |

### Admin Pages
| Page | File | Status |
|------|------|--------|
| Admin Dashboard | `admin-dashboard/ui/admin-dashboard-page.tsx` | ✅ Full UX states |
| Admin Users | `admin-users/ui/admin-users-page.tsx` | ✅ Full UX states |
| Admin Projects | `admin-projects/ui/admin-projects-page.tsx` | ✅ Full UX states |
| Admin Roles | `admin-roles/ui/admin-roles-page.tsx` | ✅ Full UX states |
| Admin Audit | `admin-audit/ui/admin-audit-page.tsx` | ✅ Full UX states |
| Admin Settings | `admin-settings/ui/admin-settings-page.tsx` | ✅ Full UX states |

---

## 2. Critical Findings (Blocking Issues)

### Finding CR-001: Researcher Cohorts - Buttons Do Nothing
**Severity:** HIGH
**Page:** `researcher-cohorts/ui/researcher-cohorts-page.tsx`
**Lines:** 117-125

**Issue:**
The "Explorar" and "Descargar" buttons have no `onClick` handlers or functionality.

```tsx
// Lines 117-125 - Both buttons do nothing
<Button variant="outline" size="sm" className="flex-1">
  <Eye className="h-4 w-4 mr-1" />
  Explorar
</Button>
<Button variant="outline" size="sm">
  <Download className="h-4 w-4" />
</Button>
```

**Verification:**
```bash
grep -n "onClick" frontend/src/pages/researcher-cohorts/ui/researcher-cohorts-page.tsx
# No matches found
```

**Impact:** Users expect these buttons to navigate to cohort details or download data. Currently they are dead UI elements.

---

### Finding CR-002: Researcher Audit - Export Button Does Nothing
**Severity:** HIGH
**Page:** `researcher-audit/ui/researcher-audit-page.tsx`
**Lines:** 158-161

**Issue:**
The "Exportar Reporte" button has an empty `onClick` handler.

```tsx
// Line 158 - onClick is empty function
<Button variant="outline" onClick={() => {}}>
  <Download className="h-4 w-4 mr-2" />
  Exportar Reporte
</Button>
```

**Verification:**
```bash
grep -n "onClick={() => {}}" frontend/src/pages/researcher-audit/ui/researcher-audit-page.tsx
# Line 158: <Button variant="outline" onClick={() => {}}>
```

**Impact:** Researchers cannot export audit reports to PDF/CSV as the UI suggests.

---

### Finding CR-003: Researcher Metrics - Export Button Simulates Only
**Severity:** MEDIUM
**Page:** `researcher-metrics/ui/researcher-metrics-page.tsx`
**Lines:** 76-81

**Issue:**
The export functionality only shows a spinner for 2 seconds but doesn't actually export anything.

```tsx
// Lines 76-81 - Fake export
const handleExport = () => {
  setExporting(true);
  setTimeout(() => {
    setExporting(false);
  }, 2000);
};
```

**Verification:**
```bash
grep -A5 "handleExport" frontend/src/pages/researcher-metrics/ui/researcher-metrics-page.tsx
```

**Impact:** Users see feedback but no actual export occurs.

---

### Finding CR-004: Doctor Images - Download Button Has No Handler
**Severity:** MEDIUM
**Page:** `doctor-images/ui/doctor-images-page.tsx`
**Lines:** 530-532

**Issue:**
The Download button in the image card has no `onClick` handler.

```tsx
// Line 530-532 - No onClick
<Button variant="outline" size="sm">
  <Download className="h-3.5 w-3.5" />
</Button>
```

**Verification:**
```bash
grep -A2 "Download.*h-3.5" frontend/src/pages/doctor-images/ui/doctor-images-page.tsx
```

**Impact:** Users cannot download medical images despite the button presence.

---

## 3. Accessibility Findings

### Finding A-001: Missing aria-label on Icon-only Buttons
**Severity:** MEDIUM
**Page:** Multiple pages

**Issue:**
Several icon-only buttons lack `aria-label` for screen readers.

**Examples:**
- `doctor-images-page.tsx` line 530: Download button
- `researcher-cohorts-page.tsx` line 122-124: Download button
- `researcher-audit-page.tsx` line 158: Export button

**Verification:**
```bash
grep -n "aria-label" frontend/src/pages/researcher-cohorts/ui/researcher-cohorts-page.tsx
# No matches found
```

**Impact:** Screen reader users won't know what icon-only buttons do.

---

### Finding A-002: Select Elements Without Associated Labels
**Severity:** MEDIUM
**Pages:** Multiple

**Issue:**
Many `<select>` elements use `<Label>` components but don't use `htmlFor`/`id` association properly, or lack `aria-label`.

**Examples in `doctor-inference-page.tsx`:**
```tsx
// Lines 202-213 - Select without aria-label
<select
  className="w-full border rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:border-gray-700 mt-1"
  value={selectedPatient}
  onChange={(e) => setSelectedPatient(e.target.value)}
>
```

**Verification:**
```bash
grep -n "<select" frontend/src/pages/doctor-inference/ui/doctor-inference-page.tsx | head -5
# None have aria-label
```

**Impact:** Forms may not be properly accessible to screen readers.

---

### Finding A-003: Focus Indicators Present But Inconsistent
**Severity:** LOW
**Pages:** All pages using shadcn/ui components

**Issue:**
The base components (`button.tsx`, `input.tsx`) have proper `focus-visible:ring` styles, but custom components (Toggle in admin-settings) may not have visible focus states.

**Verification:**
```bash
grep -n "focus-visible" frontend/src/components/ui/button.tsx
# Line 7: focus-visible:ring-2 focus-visible:ring-ring
```

**Good:** Base components have focus indicators.
**Note:** Custom toggle component in admin-settings uses `role="switch"` but may need explicit focus style.

---

### Finding A-004: No Skip Navigation Link
**Severity:** MEDIUM
**Pages:** All authenticated pages

**Issue:**
There is no "Skip to main content" link for keyboard users to bypass navigation.

**Impact:** Keyboard-only users must tab through all navigation items on every page.

---

## 4. UX State Findings

### Finding UX-001: Inconsistent Loading States
**Severity:** LOW
**Pages:** All pages

**Analysis:**
| Page | Loading State | Quality |
|------|---------------|---------|
| doctor-dashboard | Spinner + text | ✅ Good |
| researcher-dashboard | Simple text | ⚠️ Basic |
| admin-dashboard | Skeleton components | ✅ Excellent |
| researcher-metrics | Simple text | ⚠️ Basic |

**Best Practice:** admin-dashboard uses skeleton loading states (MetricCardSkeleton) which provide better perceived performance.

---

### Finding UX-002: Empty States Present and Meaningful
**Severity:** POSITIVE
**Pages:** Most pages

**Analysis:**
All major pages have meaningful empty states with helpful messages and CTAs.

**Examples:**
- `doctor-patients`: "No hay pacientes registrados todavía" + CTA button
- `doctor-inference`: "No hay resultados aún" + guidance text
- `researcher-datasets`: Clear message when no datasets available

**Verification:**
```bash
grep -n "No hay\|No se encontraron\|No hay resultados" frontend/src/pages/*/ui/*.tsx | head -10
```

---

### Finding UX-003: Error States Present with Retry
**Severity:** POSITIVE
**Pages:** All data-fetching pages

**Analysis:**
All pages with API calls have error states with retry buttons.

**Example from researcher-dashboard (lines 81-94):**
```tsx
if (error || !data) {
  return (
    <RoleLayout role="researcher">
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500">
          Error: {error || "No se pudieron cargar los datos"}
        </p>
        <Button onClick={fetchDashboard} className="ml-4">
          Reintentar
        </Button>
      </div>
    </RoleLayout>
  );
}
```

---

### Finding UX-004: Disabled Buttons Have Visual Feedback
**Severity:** POSITIVE
**Pages:** Most pages

**Analysis:**
Buttons properly use `disabled={condition}` and show reduced opacity.

**Verification:**
```bash
grep -n "disabled=" frontend/src/pages/doctor-inference/ui/doctor-inference-page.tsx | head -5
# Line 318-322: disabled={
#   !selectedPatient ||
#   !selectedRoi ||
#   createInferenceMutation.isPending
# }
```

**Good:** The Button component handles `disabled` state with proper styling via shadcn/ui.

---

## 5. Visual Consistency Findings

### Finding VC-001: RoleLayout Inconsistency
**Severity:** LOW
**Pages:** All role-based pages

**Issue:**
All authenticated pages use `RoleLayout` widget which is good for consistency. However, header/page title formats vary slightly.

**Examples:**
- Doctor pages: "Dashboard — Médico"
- Researcher pages: "Dashboard — Investigador"
- Admin pages: "Dashboard — Administrador"

**Good:** Consistent use of RoleLayout provides uniform navigation and layout.

---

### Finding VC-002: Color Palette Consistency
**Severity:** POSITIVE
**Pages:** All pages

**Analysis:**
The application uses a consistent color palette through Tailwind CSS:
- Primary: Indigo/Purple for medical/AI features
- Success: Green for completed states
- Warning: Yellow/Orange for pending states
- Error: Red for errors and critical items

**Examples:**
```tsx
// Consistent badge colors across pages
<Badge className="bg-green-100 text-green-700">Desidentificado</Badge>
<Badge className="bg-yellow-100 text-yellow-700">Pendiente</Badge>
```

---

### Finding VC-003: Card Component Usage
**Severity:** POSITIVE
**Pages:** All pages

**Analysis:**
Consistent use of `Card`, `CardHeader`, `CardContent`, `CardTitle`, `CardDescription` components throughout.

---

## 6. Recommendations (Priority Order)

### Priority 1: Fix Dead Buttons (CR-001, CR-002, CR-004)
1. **researcher-cohorts-page.tsx**: Add `onClick` handlers for "Explorar" and "Descargar"
2. **researcher-audit-page.tsx**: Implement export functionality or remove button
3. **doctor-images-page.tsx**: Add download handler for image cards

### Priority 2: Add aria-labels (A-001)
Add `aria-label` to all icon-only buttons:
```tsx
<Button variant="outline" size="sm" aria-label="Descargar imagen">
  <Download className="h-3.5 w-3.5" />
</Button>
```

### Priority 3: Add Skip Navigation (A-004)
Add a "Skip to main content" link at the top of RoleLayout or main layout component.

### Priority 4: Improve Select Accessibility (A-002)
Associate labels with selects using `id` and `htmlFor`:
```tsx
<Label htmlFor="patient-select">Paciente</Label>
<select id="patient-select" ...>
```

### Priority 5: Implement Real Export Functionality (CR-003)
Either implement actual export to CSV/PDF or remove the misleading button.

---

## 7. Files Analyzed

### Pages Analyzed (26 files)
```
frontend/src/pages/landing.tsx
frontend/src/pages/login.tsx
frontend/src/pages/role-select.tsx
frontend/src/pages/public-projects.tsx
frontend/src/pages/not-found/ui/not-found-page.tsx
frontend/src/pages/doctor-dashboard/ui/doctor-dashboard-page.tsx
frontend/src/pages/doctor-patients/ui/doctor-patients-page.tsx
frontend/src/pages/doctor-patient-detail/ui/patient-detail-page.tsx
frontend/src/pages/doctor-images/ui/doctor-images-page.tsx
frontend/src/pages/doctor-inference/ui/doctor-inference-page.tsx
frontend/src/pages/doctor-results/ui/doctor-results-page.tsx
frontend/src/pages/doctor-records/ui/doctor-records-page.tsx
frontend/src/pages/researcher-dashboard/ui/researcher-dashboard-page.tsx
frontend/src/pages/researcher-datasets/ui/researcher-datasets-page.tsx
frontend/src/pages/researcher-cohorts/ui/researcher-cohorts-page.tsx
frontend/src/pages/researcher-metrics/ui/researcher-metrics-page.tsx
frontend/src/pages/researcher-error-analysis/ui/researcher-error-analysis-page.tsx
frontend/src/pages/researcher-audit/ui/researcher-audit-page.tsx
frontend/src/pages/admin-dashboard/ui/admin-dashboard-page.tsx
frontend/src/pages/admin-users/ui/admin-users-page.tsx
frontend/src/pages/admin-projects/ui/admin-projects-page.tsx
frontend/src/pages/admin-roles/ui/admin-roles-page.tsx
frontend/src/pages/admin-audit/ui/admin-audit-page.tsx
frontend/src/pages/admin-settings/ui/admin-settings-page.tsx
```

### Components Verified
- `frontend/src/components/ui/button.tsx` - Has focus-visible styles
- `frontend/src/components/ui/input.tsx` - Has focus-visible styles
- `frontend/src/components/ui/badge.tsx` - Has focus styles
- `frontend/src/shared/ui/button.tsx` - Alternative button
- `frontend/src/shared/ui/input.tsx` - Alternative input

---

## 8. Summary

| Category | Status | Count |
|----------|--------|-------|
| Critical Issues | ⚠️ 4 | CR-001, CR-002, CR-003, CR-004 |
| Accessibility Issues | ⚠️ 4 | A-001, A-002, A-003, A-004 |
| UX State Coverage | ✅ Good | All pages have loading/error/empty states |
| Visual Consistency | ✅ Good | Consistent component usage |
| Dead Buttons | 4 | researcher-cohorts (2), researcher-audit (1), doctor-images (1) |

**Overall Assessment:** The application has solid UX foundations with proper loading, error, and empty states across all pages. Main issues are dead UI elements (buttons without handlers) and accessibility improvements needed for screen readers and keyboard navigation.
