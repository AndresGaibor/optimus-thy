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
      id: 'r-doctor',
      nombre: 'doctor',
      descripcion: 'Médico',
      permisos: ['paciente.leer'],
      asignables: ['paciente.leer', 'ficha.leer'],
    },
    {
      id: 'r-researcher',
      nombre: 'researcher',
      descripcion: 'Investigador',
      permisos: ['investigacion.leer'],
      asignables: ['inferencia.leer', 'investigacion.exportar', 'investigacion.leer'],
    },
  ],
  permisos: [
    { codigo: 'paciente.leer', descripcion: 'Consultar pacientes' },
    { codigo: 'ficha.leer', descripcion: 'Consultar la ficha' },
    { codigo: 'usuario.gestionar', descripcion: 'Gestionar usuarios' },
    { codigo: 'investigacion.leer', descripcion: 'Consultar cohortes' },
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

  it('muestra la matriz con descripción, código y estado por rol', async () => {
    fetchMock.mockResolvedValueOnce(responderJson(mockSessionAdmin));
    fetchMock.mockResolvedValueOnce(responderJson(matriz));

    montarApp();

    expect(await screen.findByRole('heading', { name: /roles y permisos/i })).toBeInTheDocument();
    const region = await screen.findByRole('region', { name: /matriz de permisos por rol/i });
    const tabla = within(region).getByRole('table');
    expect(within(tabla).getByText('Médico')).toBeInTheDocument();
    expect(within(tabla).getByText('Investigador')).toBeInTheDocument();
    expect(within(tabla).queryByText('Administrador')).not.toBeInTheDocument();
    expect(within(tabla).getByText('Consultar pacientes')).toBeInTheDocument();
    expect(within(tabla).getByText('paciente.leer')).toBeInTheDocument();
    expect(within(tabla).getByText('Pacientes')).toBeInTheDocument();

    const concedido = within(tabla).getByRole('checkbox', {
      name: /permiso «consultar pacientes» para médico/i,
    });
    expect(concedido).toBeChecked();
    const denegado = within(tabla).getByRole('checkbox', {
      name: /permiso «consultar la ficha» para médico/i,
    });
    expect(denegado).not.toBeChecked();
  });

  it('no ofrece controles para permisos fuera del ámbito del rol', async () => {
    fetchMock.mockResolvedValueOnce(responderJson(mockSessionAdmin));
    fetchMock.mockResolvedValueOnce(responderJson(matriz));

    montarApp();

    const region = await screen.findByRole('region', { name: /matriz de permisos por rol/i });
    const tabla = within(region).getByRole('table');
    expect(
      within(tabla).queryByRole('checkbox', { name: /permiso «gestionar usuarios» para médico/i }),
    ).not.toBeInTheDocument();
    expect(within(tabla).getAllByText('No aplica').length).toBeGreaterThan(0);
  });

  it('cuenta los cambios pendientes y los descarta', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce(responderJson(mockSessionAdmin));
    fetchMock.mockResolvedValueOnce(responderJson(matriz));

    montarApp();

    const casilla = await screen.findByRole('checkbox', {
      name: /permiso «consultar la ficha» para médico/i,
    });
    await user.click(casilla);

    expect(await screen.findByText(/1 cambio sin guardar/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /descartar/i }));

    expect(screen.queryByText(/cambios sin guardar/i)).not.toBeInTheDocument();
    expect(
      screen.getByRole('checkbox', { name: /permiso «consultar la ficha» para médico/i }),
    ).not.toBeChecked();
  });

  it('guarda los roles editados en una sola llamada con el estado esperado', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce(responderJson(mockSessionAdmin));
    fetchMock.mockResolvedValueOnce(responderJson(matriz));
    fetchMock.mockResolvedValueOnce(responderJson(matriz));

    montarApp();

    const casilla = await screen.findByRole('checkbox', {
      name: /permiso «consultar la ficha» para médico/i,
    });
    await user.click(casilla);
    await user.click(screen.getByRole('button', { name: /guardar cambios/i }));

    await waitFor(() => {
      expect(llamadaA(fetchMock, '/roles/permisos', 'PUT')).toBeDefined();
    });
    const llamada = llamadaA(fetchMock, '/roles/permisos', 'PUT');
    expect(await extraerCuerpo(llamada as unknown[])).toEqual({
      estado: { 'r-doctor': ['paciente.leer', 'ficha.leer'] },
      esperado: { 'r-doctor': ['paciente.leer'] },
    });
    expect(await screen.findByText(/cambios guardados/i)).toBeInTheDocument();
  });

  it('un conflicto conserva lo editado y ofrece recargar', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce(responderJson(mockSessionAdmin));
    fetchMock.mockResolvedValueOnce(responderJson(matriz));
    fetchMock.mockResolvedValueOnce(
      responderJson({ error: { code: 'conflict', message: 'cambió' } }, 409),
    );

    montarApp();

    const casilla = await screen.findByRole('checkbox', {
      name: /permiso «consultar la ficha» para médico/i,
    });
    await user.click(casilla);
    await user.click(screen.getByRole('button', { name: /guardar cambios/i }));

    expect(await screen.findByText(/la matriz cambió mientras editabas/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /recargar matriz/i })).toBeInTheDocument();
    expect(
      screen.getByRole('checkbox', { name: /permiso «consultar la ficha» para médico/i }),
    ).toBeChecked();
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
