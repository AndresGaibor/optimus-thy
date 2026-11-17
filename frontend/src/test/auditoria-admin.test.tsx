import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuditoriaPage } from '../pages/admin/AuditoriaPage';
import { eventosOk, eventosVacios } from '../mocks/auditoria';

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

describe('auditoría admin', () => {
  let fetchMock: FetchMock;

  beforeEach(() => {
    vi.restoreAllMocks();
    fetchMock = vi.fn(() => Promise.resolve(responderJson(eventosOk))) as unknown as FetchMock;
    (globalThis as unknown as { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;
  });

  it('traduce el evento, conserva el código y muestra la hora en una línea', async () => {
    fetchMock.mockResolvedValueOnce(
      responderJson({
        total: 2,
        items: [
          { id: 'u-ana', correo: 'ana@example.test' },
          { id: 'u-luis', correo: 'luis@example.test' },
        ],
      }),
    );
    fetchMock.mockResolvedValueOnce(responderJson(eventosOk));

    montarApp();

    expect(await screen.findByText('Sesión iniciada')).toBeInTheDocument();
    expect(screen.getAllByText('AUTH.SESSION_START').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Consultó una inferencia').length).toBeGreaterThan(0);

    const fechas = await screen.findAllByText(/10 jun 2026/);
    expect(fechas[0]?.closest('td')?.textContent).toContain('14:32:00');
  });

  it('abre el detalle técnico de un evento y lo vuelve a cerrar', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce(responderJson({ total: 0, items: [] }));
    fetchMock.mockResolvedValueOnce(responderJson(eventosOk));

    montarApp();

    const [primero] = await screen.findAllByRole('button', { name: /ver detalle/i });
    if (!primero) throw new Error('sin detalle');
    await user.click(primero);

    expect(await screen.findByText('role_code')).toBeInTheDocument();
    expect(screen.getByText('admin')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /ocultar/i }));
    expect(screen.queryByText('role_code')).not.toBeInTheDocument();
  });

  it('avisa cuando la fecha inicial es posterior a la final y no consulta', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce(responderJson({ total: 0, items: [] }));

    montarApp();

    await user.type(await screen.findByLabelText('Desde'), '2026-06-11');
    await user.type(await screen.findByLabelText('Hasta'), '2026-06-10');

    expect(
      await screen.findByText('La fecha inicial no puede ser posterior a la final.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('permite limpiar los filtros aplicados', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce(
      responderJson({ total: 1, items: [{ id: 'u-ana', correo: 'ana@example.test' }] }),
    );
    fetchMock.mockResolvedValue(responderJson(eventosVacios));

    montarApp();

    const usuario = await screen.findByLabelText('Usuario');
    await screen.findByRole('option', { name: 'ana@example.test' });
    await user.selectOptions(usuario, 'u-ana');

    const limpiar = await screen.findByRole('button', { name: /limpiar filtros/i });
    await user.click(limpiar);

    expect(screen.queryByRole('button', { name: /limpiar filtros/i })).toBeNull();
  });
});
