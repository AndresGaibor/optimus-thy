import { Route, Routes } from 'react-router-dom';
import { AppShell } from './layout/AppShell';
import { LoginPage } from './pages/LoginPage';
import { PasswordRecoveryPage } from './pages/PasswordRecoveryPage';
import { PlaceholderPage } from './pages/PlaceholderPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { RolesPage } from './pages/admin/RolesPage';
import { UsuariosPage } from './pages/admin/UsuariosPage';
import { PacientesPage } from './pages/medico/PacientesPage';
import { RootRedirect, RoleRoute } from './session/RoleRoute';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/login/recuperar" element={<PasswordRecoveryPage />} />

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
        <Route path="inferencia" element={<PlaceholderPage titulo="Inferencia" />} />
      </Route>

      <Route
        path="/investigador"
        element={
          <RoleRoute role="investigador">
            <AppShell />
          </RoleRoute>
        }
      >
        <Route index element={<PlaceholderPage titulo="Cohortes" />} />
        <Route path="cohortes" element={<PlaceholderPage titulo="Cohortes" />} />
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
        <Route path="usuarios" element={<UsuariosPage />} />
        <Route path="roles" element={<RolesPage />} />
        <Route path="auditoria" element={<PlaceholderPage titulo="Auditoría" />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
