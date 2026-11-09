import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppShell } from '../layout/AppShell';
import { PacientesPage } from '../pages/medico/PacientesPage';
import { RoleRoute } from '../session/RoleRoute';
import { SessionProvider } from '../session/SessionContext';

const mockSessionMedico = {
  usuario: { id: '1', correo: 'medico@t.com', nombre: 'Médico' },
  roles: ['doctor'],
  rol_activo: 'doctor',
};

function montarApp() {
  return render(
    <MemoryRouter initialEntries={['/medico/pacientes']}>
      <SessionProvider>
        <Routes>
          <Route
            path="/medico"
            element={
              <RoleRoute role="medico">
                <AppShell />
              </RoleRoute>
            }
          >
            <Route path="pacientes" element={<PacientesPage />} />
          </Route>
        </Routes>
      </SessionProvider>
    </MemoryRouter>,
  );
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
      return await first.clone().json();
    } catch {
      return undefined;
    }
  }
  const opts = call[1] as RequestInit | undefined;
  if (!opts?.body) {
    return undefined;
  }
  if (typeof opts.body === 'string') {
    try {
      return JSON.parse(opts.body);
    } catch {
      return opts.body;
    }
  }
  return opts.body;
}

function urlDe(input: unknown): string {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.href;
  if (input instanceof Request) return input.url;
  return '';
}

describe('pacientes médico', () => {
  let fetchMock: ReturnType<typeof vi.fn<(input: RequestInfo | URL) => Promise<Response>>>;

  beforeEach(() => {
    vi.restoreAllMocks();
    fetchMock = vi.fn((input: RequestInfo | URL) => {
      void input;
      return Promise.resolve(responderJson({ total: 0, items: [] }));
    });
    (globalThis as { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;
  });

  it('pinta filas del listado con código y casos visibles', async () => {
    fetchMock.mockResolvedValueOnce(responderJson(mockSessionMedico));
    fetchMock.mockResolvedValueOnce(
      responderJson({
        total: 2,
        items: [
          { id: 'p1', codigo: 'PAC-001', creado_en: '2026-01-15T10:00:00Z', total_casos: 3 },
          { id: 'p2', codigo: 'PAC-002', creado_en: '2026-02-20T12:30:00Z', total_casos: 0 },
        ],
      }),
    );

    montarApp();

    await waitFor(() => {
      expect(screen.getByText('PAC-001')).toBeInTheDocument();
      expect(screen.getByText('PAC-002')).toBeInTheDocument();
    });
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('muestra estado vacío cuando no hay pacientes', async () => {
    fetchMock.mockResolvedValueOnce(responderJson(mockSessionMedico));
    fetchMock.mockResolvedValueOnce(
      responderJson({
        total: 0,
        items: [],
      }),
    );

    montarApp();

    await waitFor(() => {
      expect(screen.getByText('Todavía no hay pacientes')).toBeInTheDocument();
    });
  });

  it('un 403 muestra un mensaje genérico sin detalles', async () => {
    fetchMock.mockResolvedValueOnce(responderJson(mockSessionMedico));
    fetchMock.mockResolvedValueOnce(responderJson({ detail: 'forbidden' }, 403));

    montarApp();

    await waitFor(() => {
      expect(screen.getByText('No se pudo cargar la lista')).toBeInTheDocument();
    });
    expect(screen.queryByText(/403/)).not.toBeInTheDocument();
    expect(screen.queryByText(/forbidden/i)).not.toBeInTheDocument();
  });

  it('un documento inválido muestra error de campo y no llama a POST', async () => {
    fetchMock.mockResolvedValueOnce(responderJson(mockSessionMedico));
    fetchMock.mockResolvedValueOnce(
      responderJson({
        total: 0,
        items: [],
      }),
    );

    const usuario = userEvent.setup();
    montarApp();

    await waitFor(() => {
      expect(screen.getByText('Todavía no hay pacientes')).toBeInTheDocument();
    });

    await usuario.click(screen.getByRole('button', { name: 'Nuevo paciente' }));

    await usuario.type(screen.getByLabelText(/^Nombres/i), 'Ana');
    await usuario.type(screen.getByLabelText(/^Apellidos/i), 'García');
    await usuario.type(screen.getByLabelText(/^Documento/i), '12');
    await usuario.type(screen.getByLabelText(/^Fecha de nacimiento/i), '1990-05-10');

    await usuario.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() => {
      expect(
        screen.getByText(
          'El documento debe tener entre 5 y 20 caracteres alfanuméricos o guiones.',
        ),
      ).toBeInTheDocument();
    });

    const llamadasNoAuth = fetchMock.mock.calls.filter(
      (call) => !urlDe(call[0]).includes('/auth/me'),
    );
    expect(llamadasNoAuth).toHaveLength(1);
    const firstCall = llamadasNoAuth[0];
    expect(firstCall).toBeDefined();
    const firstArg = firstCall?.[0];
    expect(firstArg).toBeDefined();
    if (firstArg instanceof Request) {
      expect(firstArg.method.toUpperCase()).toBe('GET');
      expect(urlDe(firstArg)).toContain('/pacientes');
    }
  });

  it('un alta válida envía POST /api/pacientes con el cuerpo esperado y recarga la lista', async () => {
    fetchMock.mockResolvedValueOnce(responderJson(mockSessionMedico));
    fetchMock.mockResolvedValueOnce(
      responderJson({
        total: 0,
        items: [],
      }),
    );
    fetchMock.mockResolvedValueOnce(
      responderJson(
        {
          id: 'p-nuevo',
          codigo: 'PAC-NEW',
          creado_en: '2026-11-05T10:00:00Z',
          total_casos: 0,
        },
        201,
      ),
    );
    fetchMock.mockResolvedValueOnce(
      responderJson({
        total: 1,
        items: [
          {
            id: 'p-nuevo',
            codigo: 'PAC-NEW',
            creado_en: '2026-11-05T10:00:00Z',
            total_casos: 0,
          },
        ],
      }),
    );

    const usuario = userEvent.setup();
    montarApp();

    await waitFor(() => {
      expect(screen.getByText('Todavía no hay pacientes')).toBeInTheDocument();
    });

    await usuario.click(screen.getByRole('button', { name: 'Nuevo paciente' }));

    await usuario.type(screen.getByLabelText(/^Nombres/i), 'Ana María');
    await usuario.type(screen.getByLabelText(/^Apellidos/i), 'García López');
    await usuario.type(screen.getByLabelText(/^Documento/i), 'ABC-12345');
    await usuario.type(screen.getByLabelText(/^Fecha de nacimiento/i), '1990-05-10');

    await usuario.click(screen.getByRole('button', { name: 'Guardar' }));

    const llamadasNoAuth = () =>
      fetchMock.mock.calls.filter((call) => !urlDe(call[0]).includes('/auth/me'));
    await waitFor(() => {
      expect(llamadasNoAuth().length).toBeGreaterThanOrEqual(2);
    });

    const postCall = llamadasNoAuth()[1];
    expect(postCall).toBeDefined();
    const cuerpo = await extraerCuerpo(postCall as unknown[]);
    expect(cuerpo).toEqual({
      nombres: 'Ana María',
      apellidos: 'García López',
      documento: 'ABC-12345',
      fecha_nacimiento: '1990-05-10',
    });

    const firstArg = postCall?.[0];
    expect(firstArg).toBeDefined();
    if (firstArg instanceof Request) {
      expect(firstArg.method.toUpperCase()).toBe('POST');
      expect(urlDe(firstArg)).toContain('/pacientes');
    }
  });

  it('muestra error con botón Reintentar y vuelve a cargar al pulsarlo', async () => {
    fetchMock.mockResolvedValueOnce(responderJson(mockSessionMedico));
    fetchMock.mockResolvedValueOnce(responderJson({ detail: 'error' }, 500));
    fetchMock.mockResolvedValueOnce(responderJson({ total: 0, items: [] }));

    const usuario = userEvent.setup();
    montarApp();

    await waitFor(() => {
      expect(screen.getByText('No se pudo cargar la lista')).toBeInTheDocument();
    });

    const reintentar = screen.getByRole('button', { name: 'Reintentar' });
    expect(reintentar).toBeInTheDocument();
    await usuario.click(reintentar);

    await waitFor(() => {
      expect(screen.getByText('Todavía no hay pacientes')).toBeInTheDocument();
    });

    const llamadasNoAuth = fetchMock.mock.calls.filter(
      (call) => !urlDe(call[0]).includes('/auth/me'),
    );
    expect(llamadasNoAuth.length).toBeGreaterThanOrEqual(2);
  });

  it('muestra vacío con acción Registrar el primero', async () => {
    fetchMock.mockResolvedValueOnce(responderJson(mockSessionMedico));
    fetchMock.mockResolvedValueOnce(responderJson({ total: 0, items: [] }));

    const usuario = userEvent.setup();
    montarApp();

    await waitFor(() => {
      expect(screen.getByText('Todavía no hay pacientes')).toBeInTheDocument();
    });

    const registrar = screen.getByRole('button', { name: 'Registrar el primero' });
    expect(registrar).toBeInTheDocument();
    await usuario.click(registrar);

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: 'Nuevo paciente' })).toBeInTheDocument();
    });
  });
});
