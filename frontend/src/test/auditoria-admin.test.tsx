import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuditoriaPage } from '../pages/admin/AuditoriaPage';
import { eventosOk } from '../mocks/auditoria';

interface FetchMock {
  mock: { calls: unknown[][] };
  mockResolvedValueOnce: (value: unknown) => unknown;
  mockResolvedValue: (value: unknown) => unknown;
}

function responderJson(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function montarApp() {
  return render(
    <MemoryRouter initialEntries={['/administrador/auditoria']}>
      <AuditoriaPage />
    </MemoryRouter>,
  );
}

async function montarConEventos() {
  montarApp();
  await screen.findByRole('table', { name: 'Eventos de auditoría' });
}

describe('auditoría admin', () => {
  let fetchMock: FetchMock;

  beforeEach(() => {
    vi.restoreAllMocks();
    fetchMock = vi.fn(() => Promise.resolve(responderJson(eventosOk))) as unknown as FetchMock;
    (globalThis as unknown as { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;
    fetchMock.mockResolvedValueOnce(
      responderJson({
        total: 1,
        items: [{ id: 'u-ana', correo: 'ana@example.test', nombre: 'Ana', activo: true }],
      }),
    );
  });

  it('muestra el evento traducido y deja el código técnico para el detalle', async () => {
    await montarConEventos();

    expect(screen.getAllByText('Sesión iniciada').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Consultó una inferencia').length).toBeGreaterThan(0);
    expect(screen.queryByText('AUTH.SESSION_START')).toBeNull();

    const fechas = screen.getAllByText(/10 jun 2026/);
    expect(fechas[0]?.closest('td')?.textContent).toContain('14:32:00');
  });

  it('abre el detalle en un panel lateral, conserva los filtros y lo cierra con Escape', async () => {
    const usuario = userEvent.setup();
    await montarConEventos();

    await usuario.selectOptions(screen.getByLabelText('Usuario'), 'u-ana');

    const [primero] = screen.getAllByRole('button', { name: /ver detalle de «sesión iniciada»/i });
    if (!primero) throw new Error('sin eventos');
    await usuario.click(primero);

    const panel = await screen.findByRole('dialog', { name: /detalle del evento/i });
    expect(panel).toHaveTextContent('AUTH.SESSION_START');
    expect(panel).toHaveTextContent('ana@example.test');
    expect(panel).toHaveTextContent('Rol');
    expect(screen.getByLabelText('Usuario')).toHaveValue('u-ana');

    await usuario.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(screen.getByLabelText('Usuario')).toHaveValue('u-ana');
  });

  it('avisa y no muestra la tabla cuando la fecha inicial es posterior a la final', async () => {
    const usuario = userEvent.setup();
    await montarConEventos();

    await usuario.type(screen.getByLabelText('Desde'), '2026-06-11');
    await usuario.type(screen.getByLabelText('Hasta'), '2026-06-10');

    expect(await screen.findByText(/la fecha inicial no puede ser posterior/i)).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('table')).toBeNull());
    expect(screen.getByLabelText('Desde')).toHaveAttribute('aria-invalid', 'true');
  });

  it('permite limpiar los filtros aplicados', async () => {
    const usuario = userEvent.setup();
    await montarConEventos();

    await usuario.selectOptions(screen.getByLabelText('Usuario'), 'u-ana');
    await usuario.click(screen.getByRole('button', { name: /limpiar filtros/i }));

    expect(screen.getByLabelText('Usuario')).toHaveValue('');
    expect(screen.queryByRole('button', { name: /limpiar filtros/i })).toBeNull();
  });
});
