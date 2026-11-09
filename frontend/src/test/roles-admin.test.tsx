import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { AppShell } from '../layout/AppShell';
import { RolesPage } from '../pages/admin/RolesPage';
import { RoleRoute } from '../session/RoleRoute';
import { SessionProvider } from '../session/SessionContext';

const mockSessionAdmin = {
  usuario: { id: '1', correo: 'admin@t.com', nombre: 'Admin' },
  roles: ['admin'],
  rol_activo: 'admin',
};

const matriz = {
  roles: [
    {
      id: 'r-admin',
      nombre: 'admin',
      descripcion: 'Administrador',
      permisos: ['rol.gestionar', 'usuario.gestionar'],
    },
    {
      id: 'r-doctor',
      nombre: 'doctor',
      descripcion: 'Médico',
      permisos: ['paciente.leer'],
    },
  ],
  permisos: [
    { codigo: 'paciente.leer', descripcion: 'Consultar pacientes' },
    { codigo: 'rol.gestionar', descripcion: 'Editar la matriz de roles' },
  ],
};

function montarApp() {
  return render(
    <MemoryRouter initialEntries={['/administrador/roles']}>
      <SessionProvider>
        <Routes>
          <Route
            path="/administrador"
            element={
              <RoleRoute role="administrador">
                <AppShell />
              </RoleRoute>
            }
          >
            <Route path="roles" element={<RolesPage />} />
          </Route>
        </Routes>
      </SessionProvider>
    </MemoryRouter>,
  );
}

interface FetchMock {
  mock: { calls: unknown[][] };
  mockResolvedValueOnce: (value: unknown) => unknown;
}

function responderJson(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function extraerCuerpo(call: unknown[]): Promise<unknown> {
  const first = call[0];
  if (first instanceof Request) {
    try {
      const text = await first.clone().text();
      if (!text) return undefined;
      return JSON.parse(text);
    } catch {
      return undefined;
    }
  }
  const opts = call[1] as RequestInit | undefined;
  if (!opts?.body || typeof opts.body !== 'string') {
    return opts?.body;
  }
  return JSON.parse(opts.body);
}

function llamadaA(fetchMock: FetchMock, fragmento: string, metodo: string): unknown[] | undefined {
  return fetchMock.mock.calls.find((call) => {
    const req = call[0];
    const url = req instanceof Request ? req.url : req;
    const verbo =
      req instanceof Request ? req.method : (call[1] as RequestInit | undefined)?.method;
    return typeof url === 'string' && url.includes(fragmento) && verbo === metodo;
  });
}

describe('roles y permisos admin', () => {
  let fetchMock: FetchMock;

  beforeEach(() => {
    vi.restoreAllMocks();
    fetchMock = vi.fn(() => Promise.resolve(responderJson(matriz))) as unknown as FetchMock;
    (globalThis as unknown as { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;
  });

  it('muestra la matriz con roles, permisos y su estado', async () => {
    fetchMock.mockResolvedValueOnce(responderJson(mockSessionAdmin));
    fetchMock.mockResolvedValueOnce(responderJson(matriz));

    montarApp();

    expect(await screen.findByRole('heading', { name: /roles y permisos/i })).toBeInTheDocument();
    const region = await screen.findByRole('region', { name: /matriz de permisos por rol/i });
    const tabla = within(region).getByRole('table');
    expect(within(tabla).getByText('Administrador')).toBeInTheDocument();
    expect(within(tabla).getByText('Médico')).toBeInTheDocument();
    expect(within(tabla).getByText('paciente.leer')).toBeInTheDocument();

    const concedido = within(tabla).getByRole('switch', {
      name: /permiso paciente\.leer para médico/i,
    });
    expect(concedido).toHaveAttribute('aria-checked', 'true');
    const denegado = within(tabla).getByRole('switch', {
      name: /permiso paciente\.leer para administrador/i,
    });
    expect(denegado).toHaveAttribute('aria-checked', 'false');
  });

  it('no permite retirar la gestión de roles al administrador', async () => {
    fetchMock.mockResolvedValueOnce(responderJson(mockSessionAdmin));
    fetchMock.mockResolvedValueOnce(responderJson(matriz));

    montarApp();

    const bloqueado = await screen.findByRole('switch', {
      name: /permiso rol\.gestionar para administrador/i,
    });
    expect(bloqueado).toBeDisabled();
  });

  it('guardar envía PUT con los permisos del rol modificado', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce(responderJson(mockSessionAdmin));
    fetchMock.mockResolvedValueOnce(responderJson(matriz));
    fetchMock.mockResolvedValueOnce(
      responderJson({ ...matriz.roles[1], permisos: ['paciente.leer', 'rol.gestionar'] }),
    );
    fetchMock.mockResolvedValueOnce(responderJson(matriz));

    montarApp();

    const casilla = await screen.findByRole('switch', {
      name: /permiso rol\.gestionar para médico/i,
    });
    await user.click(casilla);
    await user.click(screen.getByRole('button', { name: /guardar cambios/i }));

    await waitFor(() => {
      expect(llamadaA(fetchMock, '/roles/r-doctor/permisos', 'PUT')).toBeDefined();
    });
    const llamada = llamadaA(fetchMock, '/roles/r-doctor/permisos', 'PUT');
    expect(await extraerCuerpo(llamada as unknown[])).toEqual({
      permisos: ['paciente.leer', 'rol.gestionar'],
    });
  });

  it('un error de carga ofrece reintentar', async () => {
    fetchMock.mockResolvedValueOnce(responderJson(mockSessionAdmin));
    fetchMock.mockResolvedValueOnce(responderJson({}, 500));

    montarApp();

    expect(await screen.findByText(/no se pudo cargar la matriz de permisos/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument();
  });

  it('un 403 explica que el rol no permite ver la matriz', async () => {
    fetchMock.mockResolvedValueOnce(responderJson(mockSessionAdmin));
    fetchMock.mockResolvedValueOnce(responderJson({}, 403));

    montarApp();

    expect(
      await screen.findByText(/tu rol no permite ver la matriz de permisos/i),
    ).toBeInTheDocument();
  });
});
