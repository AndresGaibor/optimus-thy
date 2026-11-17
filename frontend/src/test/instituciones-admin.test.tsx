import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { AppShell } from '../layout/AppShell';
import { InstitucionesPage } from '../pages/admin/InstitucionesPage';
import { RoleRoute } from '../session/RoleRoute';
import { SessionProvider } from '../session/SessionContext';

const mockSessionAdmin = {
  usuario: { id: '1', correo: 'admin@t.com', nombre: 'Admin' },
  roles: ['admin'],
  rol_activo: 'admin',
};

interface InstitucionMock {
  id: string;
  nombre: string;
  codigo: string;
  activa: boolean;
  usuarios_activos: number;
}

const hospitalCentral: InstitucionMock = {
  id: 'i1',
  nombre: 'Hospital Central',
  codigo: 'HOSP-CEN',
  activa: true,
  usuarios_activos: 4,
};

const clinicaSur: InstitucionMock = {
  id: 'i2',
  nombre: 'Clínica Sur',
  codigo: 'CLIN-SUR',
  activa: false,
  usuarios_activos: 0,
};

function montarApp() {
  return render(
    <MemoryRouter initialEntries={['/administrador/instituciones']}>
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
            <Route path="instituciones" element={<InstitucionesPage />} />
          </Route>
        </Routes>
      </SessionProvider>
    </MemoryRouter>,
  );
}

interface FetchMock {
  mock: { calls: unknown[][] };
}

interface RespuestaProgramada {
  status: number;
  body: unknown;
}

function responderJson(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function cuerpoDe(call: unknown[]): Promise<unknown> {
  const first = call[0];
  if (first instanceof Request) {
    try {
      const texto = await first.clone().text();
      return texto ? (JSON.parse(texto) as Record<string, unknown>) : undefined;
    } catch {
      return undefined;
    }
  }
  const opts = call[1] as RequestInit | undefined;
  if (!opts?.body) return undefined;
  if (typeof opts.body === 'string') {
    try {
      return JSON.parse(opts.body) as Record<string, unknown>;
    } catch {
      return undefined;
    }
  }
  return opts.body;
}

function metodoDe(call: unknown[]): string {
  const first = call[0];
  if (first instanceof Request) return first.method;
  return String((call[1] as RequestInit | undefined)?.method ?? 'GET');
}

function urlDe(call: unknown[]): string {
  const first = call[0];
  if (first instanceof Request) return first.url;
  return String(first);
}

describe('instituciones admin', () => {
  let fetchMock: FetchMock;
  let listado: InstitucionMock[];
  let respuestaPost: RespuestaProgramada;
  let respuestaPatch: RespuestaProgramada;

  beforeEach(() => {
    vi.restoreAllMocks();
    listado = [hospitalCentral, clinicaSur];
    respuestaPost = {
      status: 201,
      body: {
        id: 'i3',
        nombre: 'Nueva Clínica',
        codigo: 'NUEVA-CLIN',
        activa: true,
        usuarios_activos: 0,
      },
    };
    respuestaPatch = { status: 200, body: { ...hospitalCentral } };

    fetchMock = vi.fn(async (input: unknown) => {
      const url = input instanceof Request ? input.url : String(input);
      if (url.includes('/auth/me')) {
        return responderJson(mockSessionAdmin);
      }
      if (url.includes('/instituciones')) {
        const metodo = input instanceof Request ? input.method : 'GET';
        if (metodo === 'POST') return responderJson(respuestaPost.body, respuestaPost.status);
        if (metodo === 'PATCH') return responderJson(respuestaPatch.body, respuestaPatch.status);
        return responderJson(listado);
      }
      return responderJson({});
    }) as unknown as FetchMock;

    (globalThis as unknown as { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;
  });

  it('pinta filas del listado', async () => {
    montarApp();

    expect(await screen.findByText('Hospital Central')).toBeInTheDocument();
    const tabla = screen.getByRole('table');
    expect(within(tabla).getByText('HOSP-CEN')).toBeInTheDocument();
    expect(within(tabla).getByText('4')).toBeInTheDocument();
    expect(within(tabla).getByText('Activo')).toBeInTheDocument();
    expect(within(tabla).getByText('Inactivo')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Instituciones' })).toHaveAttribute(
      'href',
      '/administrador/instituciones',
    );
  });

  it('el alta envía POST /instituciones con el cuerpo correcto', async () => {
    const user = userEvent.setup();
    montarApp();

    await user.click(await screen.findByRole('button', { name: 'Nueva institución' }));
    const dialogo = await screen.findByRole('dialog');
    await user.type(within(dialogo).getByLabelText(/nombre/i), 'Nueva Clínica');
    await user.type(within(dialogo).getByLabelText(/código/i), 'NUEVA-CLIN');
    await user.click(within(dialogo).getByRole('button', { name: /^crear$/i }));

    await waitFor(async () => {
      const llamada = fetchMock.mock.calls.find(
        (call) => metodoDe(call) === 'POST' && urlDe(call).includes('/instituciones'),
      );
      expect(llamada).toBeDefined();
      if (llamada) {
        expect(await cuerpoDe(llamada)).toEqual({ nombre: 'Nueva Clínica', codigo: 'NUEVA-CLIN' });
      }
    });
  });

  it('un 409 muestra el mensaje de código duplicado', async () => {
    const user = userEvent.setup();
    respuestaPost = {
      status: 409,
      body: { error: { code: 'conflict', message: 'Ya existe una institución con ese código' } },
    };
    montarApp();

    await user.click(await screen.findByRole('button', { name: 'Nueva institución' }));
    const dialogo = await screen.findByRole('dialog');
    await user.type(within(dialogo).getByLabelText(/nombre/i), 'Nueva Clínica');
    await user.type(within(dialogo).getByLabelText(/código/i), 'HOSP-CEN');
    await user.click(within(dialogo).getByRole('button', { name: /^crear$/i }));

    expect(await screen.findByText('Ya existe una institución con ese código')).toBeInTheDocument();
  });

  it('una desactivación bloqueada por 409 muestra el mensaje y conserva el listado', async () => {
    const user = userEvent.setup();
    respuestaPatch = {
      status: 409,
      body: {
        error: {
          code: 'conflict',
          message: 'La institución tiene usuarios activos; reasígnalos antes de desactivarla',
        },
      },
    };
    montarApp();

    await user.click(
      await screen.findByRole('button', { name: /desactivar institución hosp-cen/i }),
    );
    const confirmacion = await screen.findByRole('dialog');
    await user.click(within(confirmacion).getByRole('button', { name: /^desactivar$/i }));

    expect(
      await screen.findByText(
        'La institución tiene usuarios activos; reasígnalos antes de desactivarla',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(within(screen.getByRole('table')).getByText('Hospital Central')).toBeInTheDocument();
  });

  it('activar envía PATCH con {activa:true} sin diálogo', async () => {
    const user = userEvent.setup();
    montarApp();

    await user.click(await screen.findByRole('button', { name: /activar institución clin-sur/i }));

    await waitFor(async () => {
      const llamada = fetchMock.mock.calls.find(
        (call) => metodoDe(call) === 'PATCH' && urlDe(call).includes('/instituciones'),
      );
      expect(llamada).toBeDefined();
      if (llamada) {
        expect(await cuerpoDe(llamada)).toEqual({ activa: true });
      }
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('muestra cero sin usuarios activos y el total bajo la tabla', async () => {
    montarApp();

    const fila = (await screen.findByText('Clínica Sur')).closest('tr');
    if (!fila) throw new Error('fila de Clínica Sur no encontrada');
    expect(within(fila).getByText('0')).toBeInTheDocument();
    expect(await screen.findByText('Mostrando 2 de 2 instituciones')).toBeInTheDocument();
  });

  it('el estado vacío aparece sin filas', async () => {
    listado = [];
    montarApp();

    expect(await screen.findByText(/sin instituciones/i)).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});
