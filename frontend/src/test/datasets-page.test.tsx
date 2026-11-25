import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CasoAnonimizado, Dataset, DatasetResumen } from '../api/datasets';
import { DatasetsPage } from '../pages/investigador/DatasetsPage';

const HUELLA_A = 'a1b2c3d4e5f60718293a4b5c6d7e8f901234567890abcdef1234567890abcdef';
const HUELLA_B = 'f0e1d2c3b4a5968778695a4b3c2d1e0f1234567890abcdef1234567890abcdef';

const RESUMEN_A: DatasetResumen = {
  id: 'ds-1',
  nombre: 'Cohorte tiroides 2026',
  descripcion: 'Casos con consentimiento de investigación.',
  total_casos: 12,
  k: 5,
  k_efectivo: 5,
  huella: HUELLA_A,
  criterios: { edad_min: 18 },
  creado_en: '2026-06-10T14:32:00Z',
};

const RESUMEN_B: DatasetResumen = {
  ...RESUMEN_A,
  id: 'ds-2',
  nombre: 'Seguimiento pediátrico',
  descripcion: 'Controles posteriores al tratamiento.',
  total_casos: 8,
  k: 6,
  huella: HUELLA_B,
  creado_en: '2026-05-02T09:00:00Z',
};

const FILA: CasoAnonimizado = {
  sujeto: 'S-001',
  edad_rango: '45-54',
  mes_caso: '2026-05',
  mes_tsh: '2026-05',
  tsh: 2.4,
  tsh_unidad: 'µUI/mL',
  mes_t3: '2026-05',
  t3: 1.2,
  t3_unidad: 'ng/mL',
  mes_t4: '2026-05',
  t4: 8.1,
  t4_unidad: 'µg/dL',
  tamano_nodulo_mm: 14,
  lateralidad: 'derecho',
  tirads: 'TR4',
  bethesda: 'V',
  cie10: 'E04.1',
  tipo_diagnostico: 'benigno',
  tipo_consulta: 'primera',
};

const DETALLE_A: Dataset = { ...RESUMEN_A, items: [FILA] };

interface FetchMock {
  mock: { calls: Array<[Request, RequestInit | undefined]> };
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
    Promise.resolve(responder({ total: 2, items: [RESUMEN_A, RESUMEN_B] })),
  ) as unknown as FetchMock;
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function ultimaUrl(): string {
  const llamada = fetchMock.mock.calls.at(-1);
  if (!llamada) throw new Error('sin peticiones');
  return llamada[0].url;
}

function tarjetaDe(nombre: string): HTMLElement {
  const titulo = screen.getByRole('heading', { name: nombre });
  const tarjeta = titulo.closest('li');
  if (!tarjeta) throw new Error(`sin tarjeta para ${nombre}`);
  return tarjeta;
}

describe('consulta de datasets anonimizados', () => {
  it('lista los conjuntos con casos, k, huella abreviada y fecha', async () => {
    render(<DatasetsPage />);

    expect(
      await screen.findByRole('heading', { name: 'Cohorte tiroides 2026' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Seguimiento pediátrico' })).toBeInTheDocument();
    expect(screen.getByText('Casos con consentimiento de investigación.')).toBeInTheDocument();
    expect(ultimaUrl()).toBe('http://localhost:8000/investigacion/datasets');

    const tarjeta = tarjetaDe('Cohorte tiroides 2026');
    expect(within(tarjeta).getByText('12')).toBeInTheDocument();
    expect(within(tarjeta).getByText('k efectivo')).toBeInTheDocument();
    expect(within(tarjeta).getAllByText('5')).toHaveLength(2);
    expect(within(tarjeta).getByText(/jun 2026/)).toBeInTheDocument();
    expect(screen.getByText('2 conjuntos · más reciente primero')).toBeInTheDocument();
  });

  it('abre el detalle con las filas anonimizadas al elegir un conjunto', async () => {
    const usuario = userEvent.setup();
    render(<DatasetsPage />);
    await screen.findByRole('heading', { name: 'Cohorte tiroides 2026' });

    fetchMock.mockResolvedValueOnce(responder(DETALLE_A));
    await usuario.click(screen.getByRole('button', { name: 'Abrir Cohorte tiroides 2026' }));

    const tabla = await screen.findByRole('table', { name: 'Filas anonimizadas del dataset' });
    expect(within(tabla).getByText('S-001')).toBeInTheDocument();
    expect(within(tabla).getByText('45-54')).toBeInTheDocument();
    expect(within(tabla).getByText('2.4 µUI/mL')).toBeInTheDocument();
    expect(within(tabla).getByText('TR4')).toBeInTheDocument();
    expect(within(tabla).getByText('E04.1')).toBeInTheDocument();
    expect(within(tabla).queryByText('Documento')).toBeNull();
    expect(within(tabla).queryByText('Paciente')).toBeNull();
    expect(screen.getByText('Seleccionado')).toBeInTheDocument();
    expect(ultimaUrl()).toBe('http://localhost:8000/investigacion/datasets/ds-1');
  });

  it('muestra el estado vacío cuando no hay datasets', async () => {
    fetchMock.mockResolvedValueOnce(responder({ total: 0, items: [] }));

    render(<DatasetsPage />);

    expect(await screen.findByText('Sin datasets')).toBeInTheDocument();
    expect(screen.queryByRole('table')).toBeNull();
  });

  it('muestra el error de la lista y recupera los datos al reintentar', async () => {
    fetchMock.mockResolvedValueOnce(responder({ error: { code: 'internal_error' } }, 500));
    const usuario = userEvent.setup();

    render(<DatasetsPage />);

    expect(
      await screen.findByText('No se pudieron cargar los datasets. Reintenta la operación.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Cohorte tiroides 2026' })).toBeNull();

    await usuario.click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(
      await screen.findByRole('heading', { name: 'Cohorte tiroides 2026' }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/reintenta la operación/i)).toBeNull();
  });

  it('muestra la huella abreviada y conserva la completa en el título', async () => {
    render(<DatasetsPage />);

    const huella = await screen.findByTitle(HUELLA_A);

    expect(huella).toHaveTextContent('a1b2c3d4e5f60718…');
    expect(huella).not.toHaveTextContent(HUELLA_A);
  });

  it('muestra el error del detalle y reintenta la consulta', async () => {
    const usuario = userEvent.setup();
    render(<DatasetsPage />);
    await screen.findByRole('heading', { name: 'Cohorte tiroides 2026' });

    fetchMock.mockResolvedValueOnce(responder({ error: { code: 'internal_error' } }, 500));
    await usuario.click(screen.getByRole('button', { name: 'Abrir Cohorte tiroides 2026' }));

    expect(
      await screen.findByText('No se pudo abrir el dataset. Reintenta la operación.'),
    ).toBeInTheDocument();

    fetchMock.mockResolvedValueOnce(responder(DETALLE_A));
    await usuario.click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(
      await screen.findByRole('table', { name: 'Filas anonimizadas del dataset' }),
    ).toBeInTheDocument();
    expect(ultimaUrl()).toBe('http://localhost:8000/investigacion/datasets/ds-1');
  });
});
