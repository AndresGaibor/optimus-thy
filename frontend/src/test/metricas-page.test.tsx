import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MetricasModelo } from '../api/metricas';
import { MetricasPage } from '../pages/investigador/MetricasPage';

const MODELO_ID = '7f3a1c92-aaaa-bbbb-cccc-000000000001';
const FILA: MetricasModelo = {
  modelo: {
    id: MODELO_ID,
    nombre: 'Swin',
    version: '1.2.0',
    hash_pesos: 'b'.repeat(64),
  },
  total: 4,
  acepta: 1,
  corrige: 1,
  descarta: 1,
  pendiente: 1,
  acuerdo: 0.25,
  por_resultado: [
    { resultado: 'benigno', total: 2, acepta: 1, corrige: 0, descarta: 0, pendiente: 1 },
    { resultado: 'maligno', total: 1, acepta: 0, corrige: 1, descarta: 0, pendiente: 0 },
    { resultado: 'sin_nodulo', total: 1, acepta: 0, corrige: 0, descarta: 1, pendiente: 0 },
  ],
};

let fetchMock: ReturnType<typeof vi.fn<typeof fetch>>;

function responder(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function ultimaUrl(): URL {
  const llamada = fetchMock.mock.calls.at(-1);
  if (!llamada) throw new Error('No se hizo ninguna petición');
  const [recurso] = llamada;
  return new URL(recurso instanceof Request ? recurso.url : String(recurso));
}

beforeEach(() => {
  fetchMock = vi.fn<typeof fetch>().mockResolvedValue(responder([FILA]));
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('métricas de acuerdo del investigador', () => {
  it('muestra el esqueleto mientras carga y el acuerdo con el desglose por clase', async () => {
    let resolver: ((respuesta: Response) => void) | undefined;
    fetchMock.mockReturnValueOnce(
      new Promise<Response>((resolve) => {
        resolver = resolve;
      }),
    );
    render(<MetricasPage />);

    expect(screen.getByRole('status', { name: 'Cargando métricas' })).toBeInTheDocument();
    resolver?.(responder([FILA]));

    const tabla = await screen.findByRole('table');
    expect(within(tabla).getByText('Total del modelo')).toBeInTheDocument();
    expect(within(tabla).getByText('Sin nódulo')).toBeInTheDocument();
    expect(tabla).toHaveTextContent(/25\s?%/);
  });

  it('muestra el estado vacío sin modelos', async () => {
    fetchMock.mockResolvedValueOnce(responder([]));
    render(<MetricasPage />);

    expect(await screen.findByRole('heading', { name: 'Sin métricas disponibles' })).toBeInTheDocument();
  });

  it('expone un error genérico y vuelve a consultar al reintentar', async () => {
    const usuario = userEvent.setup();
    fetchMock
      .mockRejectedValueOnce(new Error('detalle interno'))
      .mockResolvedValueOnce(responder([FILA]));
    render(<MetricasPage />);

    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudieron cargar las métricas');
    expect(screen.queryByText('detalle interno')).not.toBeInTheDocument();
    await usuario.click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(await screen.findByRole('heading', { name: 'Swin' })).toBeInTheDocument();
  });

  it('envía filtros de fecha y modelo al servidor', async () => {
    const usuario = userEvent.setup();
    render(<MetricasPage />);
    await screen.findByRole('table');

    fireEvent.change(screen.getByLabelText('Desde'), { target: { value: '2026-01-01' } });
    fireEvent.change(screen.getByLabelText('Hasta'), { target: { value: '2026-01-31' } });
    await usuario.selectOptions(screen.getByLabelText('Modelo'), MODELO_ID);

    await waitFor(() => {
      expect(ultimaUrl().searchParams.get('desde')).toBe('2026-01-01');
      expect(ultimaUrl().searchParams.get('hasta')).toBe('2026-01-31');
      expect(ultimaUrl().searchParams.get('modelo')).toBe(MODELO_ID);
    });
  });
});
