import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi, type Mock, type MockInstance } from 'vitest';
import { AuditoriaPage } from '../pages/admin/AuditoriaPage';
import { eventosOk } from '../mocks/auditoria';

function responderJson(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function responderCsv(): Response {
  return new Response('id,ocurrido_en,accion\n1,2026-06-10T14:32:00Z,AUTH.SESSION_START', {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="bitacora-20260610-143200.csv"',
    },
  });
}

function urlDe(entrada: unknown): string {
  if (typeof entrada === 'string') return entrada;
  return entrada instanceof Request ? entrada.url : '';
}

describe('exportación de la bitácora', () => {
  let fetchMock: Mock;
  let crearUrl: Mock;
  let clicEnlace: MockInstance;
  let fallaExportacion = false;

  beforeEach(() => {
    vi.restoreAllMocks();
    fallaExportacion = false;
    crearUrl = vi.fn(() => 'blob:bitacora');
    Object.defineProperty(URL, 'createObjectURL', { value: crearUrl, configurable: true });
    Object.defineProperty(URL, 'revokeObjectURL', { value: vi.fn(), configurable: true });
    clicEnlace = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    fetchMock = vi.fn((entrada: unknown) => {
      const url = urlDe(entrada);
      if (url.includes('/auditoria/exportar')) {
        return Promise.resolve(
          fallaExportacion ? new Response('', { status: 500 }) : responderCsv(),
        );
      }
      if (url.includes('/usuarios')) {
        return Promise.resolve(
          responderJson({
            total: 1,
            items: [{ id: 'u-ana', correo: 'ana@example.test', nombre: 'Ana', activo: true }],
          }),
        );
      }
      return Promise.resolve(responderJson(eventosOk));
    });
    (globalThis as unknown as { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;
  });

  async function montarConTabla() {
    render(
      <MemoryRouter initialEntries={['/administrador/auditoria']}>
        <AuditoriaPage />
      </MemoryRouter>,
    );
    await screen.findByRole('table', { name: 'Eventos de auditoría' });
  }

  it('pide la exportación con los filtros aplicados y descarga el CSV', async () => {
    const usuario = userEvent.setup();
    await montarConTabla();

    await usuario.selectOptions(screen.getByLabelText('Usuario'), 'u-ana');
    await usuario.selectOptions(screen.getByLabelText('Evento'), 'SESSION_START');
    await usuario.type(screen.getByLabelText('Desde'), '2026-06-01');
    await usuario.click(screen.getByRole('button', { name: 'Exportar CSV' }));

    await waitFor(() => {
      const llamada = fetchMock.mock.calls.find(([entrada]) =>
        urlDe(entrada).includes('/auditoria/exportar'),
      );
      expect(llamada).toBeDefined();
      const url = urlDe(llamada?.[0]);
      expect(url).toContain('usuario=u-ana');
      expect(url).toContain('accion=SESSION_START');
      expect(url).toContain('desde=2026-06-01');
    });
    expect(crearUrl).toHaveBeenCalledWith(expect.any(Blob));
    expect(clicEnlace).toHaveBeenCalled();
  });

  it('muestra un error si la exportación falla', async () => {
    const usuario = userEvent.setup();
    fallaExportacion = true;
    await montarConTabla();

    await usuario.click(screen.getByRole('button', { name: 'Exportar CSV' }));

    expect(await screen.findByText(/no se pudo exportar la bitácora/i)).toBeInTheDocument();
    expect(crearUrl).not.toHaveBeenCalled();
    expect(clicEnlace).not.toHaveBeenCalled();
  });
});
