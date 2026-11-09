import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { AppShell } from '../layout/AppShell';
import { LoginPage } from '../pages/LoginPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { PlaceholderPage } from '../pages/PlaceholderPage';
import { RootRedirect, RoleRoute } from '../session/RoleRoute';
import { SessionProvider } from '../session/SessionContext';

const mockSessionMedico = {
  usuario: { id: '1', correo: 'm@t.com', nombre: 'Médico Test' },
  roles: ['doctor'],
  rol_activo: 'doctor',
};

const mockSessionAdmin = {
  usuario: { id: '2', correo: 'a@t.com', nombre: 'Admin Test' },
  roles: ['admin'],
  rol_activo: 'admin',
};

const mockSessionInvestigador = {
  usuario: { id: '3', correo: 'i@t.com', nombre: 'Inv Test' },
  roles: ['researcher'],
  rol_activo: 'researcher',
};

function montarApp(rutaInicial: string) {
  return render(
    <MemoryRouter initialEntries={[rutaInicial]}>
      <SessionProvider>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/medico"
            element={
              <RoleRoute role="medico">
                <AppShell />
              </RoleRoute>
            }
          >
            <Route index element={<PlaceholderPage titulo="Pacientes" />} />
            <Route path="pacientes" element={<PlaceholderPage titulo="Pacientes" />} />
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
            <Route index element={<PlaceholderPage titulo="Usuarios" />} />
            <Route path="usuarios" element={<PlaceholderPage titulo="Usuarios" />} />
            <Route path="auditoria" element={<PlaceholderPage titulo="Auditoría" />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </SessionProvider>
    </MemoryRouter>,
  );
}

describe('guard de rol', () => {
  let fetchMock: {
    mockResolvedValueOnce: (value: unknown) => unknown;
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    const fn = vi.fn();
    global.fetch = fn as unknown as typeof fetch;
    fetchMock = fn as unknown as {
      mockResolvedValueOnce: (value: unknown) => unknown;
    };
  });

  it('sin sesión redirige a /login', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 401,
    });
    montarApp('/medico/inferencia');
    expect(await screen.findByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument();
  });

  it('la raíz redirige al home del rol en sesión', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockSessionMedico,
    });
    montarApp('/');
    expect(await screen.findByRole('heading', { name: 'Pacientes' })).toBeInTheDocument();
  });

  it('un rol distinto redirige a / y de ahí a su propio home', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockSessionMedico,
    });
    montarApp('/investigador/cohortes');
    expect(await screen.findByRole('heading', { name: 'Acceso denegado' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Volver a tu inicio' })).toHaveAttribute(
      'href',
      '/medico',
    );
  });

  it('el login con rol lleva a su home', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce({ ok: false, status: 401 });
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockSessionAdmin,
    });
    montarApp('/login');
    await user.type(screen.getByLabelText(/correo/i), 'admin@test.com');
    await user.type(screen.getByLabelText(/contraseña/i), 'pass');
    await user.click(screen.getByRole('button', { name: /entrar/i }));
    expect(await screen.findByRole('heading', { name: 'Usuarios' })).toBeInTheDocument();
  });
});

describe('navegación por rol', () => {
  let fetchMock: {
    mockResolvedValueOnce: (value: unknown) => unknown;
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    const fn = vi.fn();
    global.fetch = fn as unknown as typeof fetch;
    fetchMock = fn as unknown as {
      mockResolvedValueOnce: (value: unknown) => unknown;
    };
  });

  it('el médico ve Pacientes e Inferencia', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockSessionMedico,
    });
    montarApp('/');
    const nav = await screen.findByRole('navigation', { name: 'Navegación principal' });
    expect(nav).toHaveTextContent('Pacientes');
    expect(nav).toHaveTextContent('Inferencia');
    expect(nav).not.toHaveTextContent('Auditoría');
    await user.click(screen.getByRole('link', { name: 'Inferencia' }));
    expect(await screen.findByRole('heading', { name: 'Inferencia' })).toBeInTheDocument();
  });

  it('el investigador ve Cohortes y Exportaciones', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockSessionInvestigador,
    });
    montarApp('/');
    const nav = await screen.findByRole('navigation', { name: 'Navegación principal' });
    expect(nav).toHaveTextContent('Cohortes');
    expect(nav).toHaveTextContent('Exportaciones');
    expect(nav).not.toHaveTextContent('Usuarios');
  });

  it('el administrador ve Usuarios y Auditoría', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockSessionAdmin,
    });
    montarApp('/');
    const nav = await screen.findByRole('navigation', { name: 'Navegación principal' });
    expect(nav).toHaveTextContent('Usuarios');
    expect(nav).toHaveTextContent('Auditoría');
    expect(nav).not.toHaveTextContent('Inferencia');
  });

  it('la ruta desconocida muestra 404', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 401,
    });
    montarApp('/no-existe');
    expect(
      await screen.findByRole('heading', { name: 'Página no encontrada' }),
    ).toBeInTheDocument();
  });

  it('un admin con rol médico asignado puede cambiar a médico', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ ...mockSessionAdmin, roles: ['admin', 'doctor'] }),
    });
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ ...mockSessionAdmin, roles: ['admin', 'doctor'], rol_activo: 'doctor' }),
    });
    montarApp('/administrador/usuarios');
    await user.click(await screen.findByRole('button', { name: 'Médico' }));
    expect(await screen.findByRole('heading', { name: 'Pacientes' })).toBeInTheDocument();
  });
});
