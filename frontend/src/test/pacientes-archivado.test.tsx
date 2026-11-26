import { render, screen, waitFor, within } from '@testing-library/react';
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

const pacienteActivo = {
  id: 'p1',
  codigo: 'PAC-001',
  creado_en: '2026-01-15T10:00:00Z',
  total_casos: 1,
  archivado_en: null,
};

const pacienteArchivado = {
  id: 'p2',
  codigo: 'PAC-002',
  creado_en: '2026-02-20T12:30:00Z',
  total_casos: 0,
  archivado_en: '2026-11-01T12:00:00Z',
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

function urlDe(input: unknown): string {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.href;
  if (input instanceof Request) return input.url;
  return '';
}

describe('archivado de pacientes', () => {
  let fetchMock: ReturnType<typeof vi.fn<(input: RequestInfo | URL) => Promise<Response>>>;

  beforeEach(() => {
    vi.restoreAllMocks();
    fetchMock = vi.fn(() => Promise.resolve(responderJson({ total: 0, items: [] })));
    (globalThis as { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;
  });

  it('filtra archivados, confirma cada transición y recarga el listado', async () => {
    fetchMock.mockResolvedValueOnce(responderJson(mockSessionMedico));
    fetchMock.mockResolvedValueOnce(responderJson({ total: 1, items: [pacienteActivo] }));
    fetchMock.mockResolvedValueOnce(
      responderJson({ total: 2, items: [pacienteActivo, pacienteArchivado] }),
    );
    fetchMock.mockResolvedValueOnce(
      responderJson({ ...pacienteActivo, archivado_en: '2026-11-26T12:00:00Z' }),
    );
    fetchMock.mockResolvedValueOnce(
      responderJson({
        total: 2,
        items: [{ ...pacienteActivo, archivado_en: '2026-11-26T12:00:00Z' }, pacienteArchivado],
      }),
    );
    fetchMock.mockResolvedValueOnce(responderJson({ ...pacienteActivo, archivado_en: null }));
    fetchMock.mockResolvedValueOnce(
      responderJson({
        total: 2,
        items: [pacienteActivo, pacienteArchivado],
      }),
    );

    const usuario = userEvent.setup();
    montarApp();

    await waitFor(() => expect(screen.getByText('PAC-001')).toBeInTheDocument());
    expect(screen.getByText('Activo')).toBeInTheDocument();

    await usuario.click(screen.getByRole('checkbox', { name: 'Incluir archivados' }));
    await waitFor(() => expect(screen.getByText('PAC-002')).toBeInTheDocument());
    expect(screen.getByText('Archivado')).toBeInTheDocument();

    const filtro = fetchMock.mock.calls.find((call) =>
      urlDe(call[0]).includes('incluir_archivados=true'),
    );
    expect(filtro).toBeDefined();

    await usuario.click(screen.getByRole('button', { name: 'Archivar PAC-001' }));
    let dialogo = screen.getByRole('dialog', { name: 'Archivar paciente' });
    expect(dialogo).toHaveAttribute('aria-describedby');
    expect(within(dialogo).getByText(/se conservarán.*casos nuevos/i)).toBeInTheDocument();
    await usuario.click(within(dialogo).getByRole('button', { name: 'Archivar paciente' }));

    await waitFor(() => expect(screen.getAllByText('Archivado')).toHaveLength(2));
    expect(
      fetchMock.mock.calls.some(
        (call) =>
          call[0] instanceof Request &&
          call[0].method === 'POST' &&
          urlDe(call[0]).endsWith('/pacientes/p1/archivar'),
      ),
    ).toBe(true);

    await usuario.click(screen.getByRole('button', { name: 'Desarchivar PAC-001' }));
    dialogo = screen.getByRole('dialog', { name: 'Desarchivar paciente' });
    expect(dialogo).toHaveAttribute('aria-describedby');
    await usuario.click(within(dialogo).getByRole('button', { name: 'Desarchivar paciente' }));

    await waitFor(() => expect(screen.getAllByText('Activo')).toHaveLength(1));
    expect(
      fetchMock.mock.calls.some(
        (call) =>
          call[0] instanceof Request &&
          call[0].method === 'POST' &&
          urlDe(call[0]).endsWith('/pacientes/p1/desarchivar'),
      ),
    ).toBe(true);
  });

  it('atrapa el foco y cierra la confirmación con Escape', async () => {
    fetchMock.mockResolvedValueOnce(responderJson(mockSessionMedico));
    fetchMock.mockResolvedValueOnce(responderJson({ total: 1, items: [pacienteActivo] }));

    const usuario = userEvent.setup();
    montarApp();

    await waitFor(() => expect(screen.getByText('PAC-001')).toBeInTheDocument());
    const disparador = screen.getByRole('button', { name: 'Archivar PAC-001' });
    await usuario.click(disparador);

    const dialogo = screen.getByRole('dialog', { name: 'Archivar paciente' });
    expect(dialogo).toHaveAttribute('aria-describedby');
    for (let i = 0; i < 5; i += 1) {
      await usuario.tab();
      expect(dialogo).toContainElement(document.activeElement as HTMLElement);
    }

    await usuario.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: 'Archivar paciente' })).not.toBeInTheDocument();
    expect(disparador).toHaveFocus();
  });
});
