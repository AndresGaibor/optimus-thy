import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { AppShell } from '../layout/AppShell';
import { LoginPage } from '../pages/LoginPage';
import { PlaceholderPage } from '../pages/PlaceholderPage';
import { RootRedirect, RoleRoute } from '../session/RoleRoute';
import { SessionProvider } from '../session/SessionContext';

const mockSessionMedico = {
  usuario: { id: '1', correo: 'm@t.com', nombre: 'Médico Test' },
  roles: ['doctor'],
  rol_activo: 'doctor',
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
          </Route>
        </Routes>
      </SessionProvider>
    </MemoryRouter>,
  );
}

describe('auth', () => {
  let fetchMock: {
    mockResolvedValueOnce: (value: unknown) => unknown;
    mock: { calls: unknown[][] };
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    const fn = vi.fn();
    global.fetch = fn as unknown as typeof fetch;
    fetchMock = fn as unknown as {
      mockResolvedValueOnce: (value: unknown) => unknown;
      mock: { calls: unknown[][] };
    };
  });

  it('login correcto navega al inicio del rol', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce({ ok: false, status: 401 });
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockSessionMedico,
    });
    montarApp('/login');
    await user.type(screen.getByLabelText(/correo/i), 'm@t.com');
    await user.type(screen.getByLabelText(/contraseña/i), 'pass');
    await user.click(screen.getByRole('button', { name: /entrar/i }));
    expect(await screen.findByRole('heading', { name: 'Pacientes' })).toBeInTheDocument();
  });

  it('401 muestra el mensaje en español', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce({ ok: false, status: 401 });
    fetchMock.mockResolvedValueOnce({ ok: false, status: 401 });
    montarApp('/login');
    await user.type(screen.getByLabelText(/correo/i), 'm@t.com');
    await user.type(screen.getByLabelText(/contraseña/i), 'bad');
    await user.click(screen.getByRole('button', { name: /entrar/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No pudimos iniciar sesión. Revisa tu correo y contraseña.',
    );
  });

  it('me al montar autentica', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockSessionMedico,
    });
    montarApp('/medico');
    expect(await screen.findByRole('heading', { name: 'Pacientes' })).toBeInTheDocument();
  });

  it('logout llama a la API y vuelve a /login', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockSessionMedico,
    });
    fetchMock.mockResolvedValueOnce({ ok: true, status: 204 });
    montarApp('/medico');
    const cerrar = await screen.findByRole('button', { name: /cerrar sesión/i });
    await user.click(cerrar);
    const calls = fetchMock.mock.calls;
    expect(calls[1]?.[0]).toBe('/api/auth/logout');
    expect(calls[1]?.[1]).toEqual(
      expect.objectContaining({ method: 'POST', credentials: 'include' }),
    );
    expect(await screen.findByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument();
  });

  it('ruta de otro rol muestra denegado', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockSessionMedico,
    });
    montarApp('/administrador');
    expect(await screen.findByRole('heading', { name: 'Acceso denegado' })).toBeInTheDocument();
  });
});
