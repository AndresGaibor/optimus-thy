import { Route, Routes } from 'react-router-dom';
import { AppShell } from './layout/AppShell';
import { LoginPage } from './pages/LoginPage';
import { RecuperacionPage } from './pages/RecuperacionPage';
import { PlaceholderPage } from './pages/PlaceholderPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { RolesPage } from './pages/admin/RolesPage';
import { AuditoriaPage } from './pages/admin/AuditoriaPage';
import { UsuariosPage } from './pages/admin/UsuariosPage';
import { InstitucionesPage } from './pages/admin/InstitucionesPage';
import { ModelosPage } from './pages/admin/ModelosPage';
import { CorreoPage } from './pages/admin/CorreoPage';
import { PacientesPage } from './pages/medico/PacientesPage';
import { ResultadosPage } from './pages/medico/ResultadosPage';
import { CasoPage } from './pages/medico/CasoPage';
import { HistorialInferenciasPage } from './pages/medico/HistorialInferenciasPage';
import { ComparacionResultadosPage } from './pages/medico/ComparacionResultadosPage';
import { AuditoriaPrediccionesPage } from './pages/investigador/AuditoriaPrediccionesPage';
import { DatasetsPage } from './pages/investigador/DatasetsPage';
import { MetricasPage } from './pages/investigador/MetricasPage';
import { CohortesPage } from './pages/investigador/CohortesPage';
import { ErroresPage } from './pages/investigador/ErroresPage';
import { SolicitudesDerechosPage } from './pages/admin/SolicitudesDerechosPage';
import { InferenciaPacientePage } from './pages/medico/InferenciaPacientePage';
import { TableroPage } from './pages/admin/TableroPage';
import { ExplicacionModeloPage } from './pages/medico/ExplicacionModeloPage';
import { PerfilPage } from './pages/PerfilPage';
import { RootRedirect, RoleRoute, SesionRoute } from './session/RoleRoute';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/login/recuperar" element={<RecuperacionPage />} />
      <Route path="/restablecer/:token" element={<RecuperacionPage />} />

      <Route
        path="/medico"
        element={
          <RoleRoute role="medico">
            <AppShell />
          </RoleRoute>
        }
      >
        <Route index element={<PacientesPage />} />
        <Route path="pacientes" element={<PacientesPage />} />
        <Route path="resultados" element={<ResultadosPage />} />
        <Route path="casos/:casoId" element={<CasoPage />} />
        <Route path="historial" element={<HistorialInferenciasPage />} />
        <Route path="comparacion" element={<ComparacionResultadosPage />} />
        <Route path="modelo" element={<ExplicacionModeloPage />} />
        <Route path="casos/:casoId/historial" element={<HistorialInferenciasPage />} />
        <Route path="pacientes/:id/inferencia" element={<InferenciaPacientePage />} />
        <Route path="inferencia" element={<InferenciaPacientePage />} />
      </Route>

      <Route
        path="/investigador"
        element={
          <RoleRoute role="investigador">
            <AppShell />
          </RoleRoute>
        }
      >
        <Route index element={<CohortesPage />} />
        <Route path="predicciones" element={<AuditoriaPrediccionesPage />} />
        <Route path="datasets" element={<DatasetsPage />} />
        <Route path="metricas" element={<MetricasPage />} />
        <Route path="errores" element={<ErroresPage />} />
        <Route path="cohortes" element={<CohortesPage />} />
        <Route path="exportaciones" element={<PlaceholderPage titulo="Exportaciones" />} />
      </Route>

      <Route
        path="/administrador"
        element={
          <RoleRoute role="administrador">
            <AppShell />
          </RoleRoute>
        }
      >
        <Route index element={<UsuariosPage />} />
        <Route path="tablero" element={<TableroPage />} />
        <Route path="usuarios" element={<UsuariosPage />} />
        <Route path="instituciones" element={<InstitucionesPage />} />
        <Route path="roles" element={<RolesPage />} />
        <Route path="modelos" element={<ModelosPage />} />
        <Route path="correo" element={<CorreoPage />} />
        <Route path="auditoria" element={<AuditoriaPage />} />
        <Route path="derechos" element={<SolicitudesDerechosPage />} />
      </Route>
      <Route
        path="/perfil"
        element={
          <SesionRoute>
            <AppShell />
          </SesionRoute>
        }
      >
        <Route index element={<PerfilPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
