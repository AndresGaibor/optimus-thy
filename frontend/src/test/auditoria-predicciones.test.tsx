import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrediccionAuditada } from '../api/predicciones';
import { AuditoriaPrediccionesPage } from '../pages/investigador/AuditoriaPrediccionesPage';

const CONFIRMADA: PrediccionAuditada = {
  id: 'inferencia-1',
  creado_en: '2026-06-10T14:32:00Z',
  caso_id: 'caso-1',
  caso_codigo: 'CASO-0001',
  paciente_codigo: 'PAC-0001',
  imagen: {
    id: 'imagen-1',
    hash_sha256: 'a1b2c3d4e5f60718293a4b5c6d7e8f901234567890abcdef1234567890abcdef',
  },
  modelo: { id: 'modelo-1', nombre: 'Swin', version: '1.2.0', hash_pesos: 'b'.repeat(64) },
  resultado: 'maligno',
  confianza: 0.87,
  lanzado_por: { id: '7f3a1c92-aaaa-bbbb-cccc-000000000001', rol: 'researcher' },
  referencia_clinica: { decision: 'acepta', creado_en: '2026-06-11T09:15:00Z' },
  diferencia: 'coincide',
};

const PENDIENTE: PrediccionAuditada = {
  ...CONFIRMADA,
  id: 'inferencia-2',
  creado_en: '2026-06-09T08:00:00Z',
  caso_codigo: 'CASO-0002',
  paciente_codigo: 'PAC-0002',
  imagen: {
    id: 'imagen-2',
    hash_sha256: 'f0e1d2c3b4a5968778695a4b3c2d1e0f1234567890abcdef1234567890abcdef',
  },
  modelo: { id: 'modelo-2', nombre: 'Nodo', version: '0.9.0', hash_pesos: 'c'.repeat(64) },
  resultado: 'sin_nodulo',
  confianza: null,
  lanzado_por: null,
  referencia_clinica: null,
  diferencia: 'pendiente',
};

interface FetchMock {
  mock: { calls: Array<[string, RequestInit]> };
  mockResolvedValueOnce: (valor: Response) => unknown;
}

function responder(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

let fetchMock: FetchMock;

beforeEach(() => {
  fetchMock = vi.fn(() =>
    Promise.resolve(responder({ total: 2, items: [CONFIRMADA, PENDIENTE] })),
  ) as unknown as FetchMock;
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function montar() {
  render(<AuditoriaPrediccionesPage />);
}

async function montarConTabla() {
  montar();
  return screen.findByRole('table', { name: 'Predicciones auditadas' });
}

function ultimaUrl(): string {
  const llamada = fetchMock.mock.calls.at(-1);
  if (!llamada) throw new Error('sin peticiones');
  return String(llamada[0]);
}

describe('auditoría de predicciones', () => {
  it('muestra caso, modelo, huella, quién lanzó, referencia y diferencia', async () => {
    const tabla = await montarConTabla();

    expect(within(tabla).getByText('CASO-0001')).toBeInTheDocument();
    expect(within(tabla).getByText('PAC-0001')).toBeInTheDocument();
    expect(within(tabla).getByText('Swin')).toBeInTheDocument();
    expect(within(tabla).getByText('v1.2.0')).toBeInTheDocument();
    expect(within(tabla).getByText('researcher · 7f3a1c92')).toBeInTheDocument();
    expect(within(tabla).getByTitle(CONFIRMADA.imagen.hash_sha256)).toHaveTextContent(
      'a1b2c3d4e5f60718',
    );
    expect(within(tabla).getByText('Acepta el resultado')).toBeInTheDocument();
    expect(within(tabla).getByText('Coincide')).toBeInTheDocument();
    expect(within(tabla).getByText('Pendiente')).toBeInTheDocument();
    expect(within(tabla).getByText('Sin referencia')).toBeInTheDocument();
    expect(within(tabla).getByText('Normal (sin nódulo)')).toBeInTheDocument();
  });

  it('envía los filtros al servidor y vuelve a la primera página', async () => {
    const usuario = userEvent.setup();
    await montarConTabla();
    const primera = ultimaUrl();
    expect(primera).toContain('/investigacion/predicciones');
    expect(primera).toContain('limite=25');
    expect(primera).toContain('desplazamiento=0');

    fireEvent.change(screen.getByLabelText('Desde'), { target: { value: '2026-06-01' } });
    fireEvent.change(screen.getByLabelText('Hasta'), { target: { value: '2026-06-30' } });
    await usuario.selectOptions(screen.getByLabelText('Resultado'), 'maligno');
    await usuario.selectOptions(screen.getByLabelText('Diferencia'), 'pendiente');

    await waitFor(() => expect(ultimaUrl()).toContain('desde=2026-06-01'));
    const url = ultimaUrl();
    expect(url).toContain('hasta=2026-06-30');
    expect(url).toContain('resultado=maligno');
    expect(url).toContain('decision=pendiente');
  });

  it('muestra el estado vacío cuando no hay predicciones', async () => {
    fetchMock.mockResolvedValueOnce(responder({ total: 0, items: [] }));

    montar();

    expect(await screen.findByText('Sin predicciones')).toBeInTheDocument();
    expect(screen.queryByRole('table')).toBeNull();
  });

  it('muestra el error con reintento y recupera la lista', async () => {
    fetchMock.mockResolvedValueOnce(responder({ error: { code: 'internal_error' } }, 500));
    const usuario = userEvent.setup();

    montar();

    expect(
      await screen.findByText('No se pudieron cargar las predicciones. Reintenta la operación.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('table')).toBeNull();

    await usuario.click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(
      await screen.findByRole('table', { name: 'Predicciones auditadas' }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/reintenta la operación/i)).toBeNull();
  });

  it('avisa del rango inválido sin consultar al servidor', async () => {
    await montarConTabla();

    fireEvent.change(screen.getByLabelText('Desde'), { target: { value: '2026-06-30' } });
    await waitFor(() => expect(ultimaUrl()).toContain('desde=2026-06-30'));
    const llamadas = fetchMock.mock.calls.length;

    fireEvent.change(screen.getByLabelText('Hasta'), { target: { value: '2026-06-01' } });

    expect(await screen.findByText(/la fecha inicial no puede ser posterior/i)).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('table')).toBeNull());
    expect(screen.getByLabelText('Desde')).toHaveAttribute('aria-invalid', 'true');
    expect(fetchMock.mock.calls.length).toBe(llamadas);
  });
});
