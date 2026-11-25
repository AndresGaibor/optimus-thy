import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HistorialInferenciasPage } from '../pages/medico/HistorialInferenciasPage';

const RESULTADO_MALIGNO = {
  id: 'inf-1',
  imagen_id: 'img-0001-aaaa',
  resultado: 'maligno',
  confianza: 0.91,
  creado_en: '2026-11-20T14:30:00Z',
  modelo: { id: 'modelo-1', nombre: 'Swin', version: '1.0' },
  caso_id: 'caso-1',
  caso_codigo: 'CASO-0001',
  paciente_codigo: 'PAC-0001',
};

const RESULTADO_BENIGNO = {
  id: 'inf-2',
  imagen_id: 'img-0002-bbbb',
  resultado: 'benigno',
  confianza: 0.84,
  creado_en: '2026-11-19T09:15:00Z',
  modelo: { id: 'modelo-2', nombre: 'ResNet', version: '2.3' },
  caso_id: 'caso-2',
  caso_codigo: 'CASO-0002',
  paciente_codigo: 'PAC-0002',
};

const LISTA = { total: 2, items: [RESULTADO_MALIGNO, RESULTADO_BENIGNO] };

const INFERENCIAS_CASO = {
  total: 2,
  items: [
    {
      id: 'inf-9',
      imagen_id: 'img-9999-cccc',
      resultado: 'maligno',
      confianza: 0.93,
      creado_en: '2026-11-21T11:00:00Z',
      modelo: { id: 'modelo-3', nombre: 'Swin', version: '3.1' },
    },
  ],
};

interface MockFetch {
  mock: { calls: Array<[RequestInfo | URL]> };
}

let fetchMock: MockFetch;

function responder(cuerpo: unknown, status = 200): Response {
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

function llamadasA(ruta: string): Request[] {
  return fetchMock.mock.calls
    .map(([input]) => input)
    .filter((input): input is Request => input instanceof Request)
    .filter((request) => new URL(request.url).pathname === ruta);
}

function primeraLlamada(ruta: string): Request {
  const [request] = llamadasA(ruta);
  if (!request) throw new Error(`No hubo llamadas a ${ruta}`);
  return request;
}

function instalarFetch(resultados: () => Response) {
  fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const { pathname } = new URL(urlDe(input));
    if (pathname === '/pacientes') return responder({ total: 0, items: [] });
    if (pathname === '/resultados') return resultados();
    if (pathname === '/casos/caso-9/inferencias') return responder(INFERENCIAS_CASO);
    return responder({ total: 0, items: [] });
  }) as unknown as MockFetch;
  vi.stubGlobal('fetch', fetchMock);
}

beforeEach(() => {
  instalarFetch(() => responder(LISTA));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function montar(ruta = '/medico/historial') {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <Routes>
        <Route path="/medico/historial" element={<HistorialInferenciasPage />} />
        <Route path="/medico/casos/:casoId/historial" element={<HistorialInferenciasPage />} />
        <Route path="/medico/casos/:casoId" element={<p>Detalle del caso</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('HistorialInferenciasPage', () => {
  it('lista las inferencias con fecha, imagen, resultado y versión del modelo', async () => {
    montar();

    const tabla = await screen.findByRole('table');
    expect(within(tabla).getByText('Maligno')).toBeInTheDocument();
    expect(within(tabla).getByText('Benigno')).toBeInTheDocument();
    expect(screen.getByText(/Imagen img-0001/)).toBeInTheDocument();
    expect(screen.getByText('Swin')).toBeInTheDocument();
    expect(screen.getByText('v1.0')).toBeInTheDocument();
    expect(screen.getByText('PAC-0001')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'CASO-0001' })).toHaveAttribute(
      'href',
      '/medico/casos/caso-1',
    );

    const filas = within(tabla).getAllByRole('row');
    expect(filas).toHaveLength(3);
    expect(llamadasA('/resultados')).toHaveLength(1);
    const consulta = new URL(primeraLlamada('/resultados')!.url);
    expect(consulta.searchParams.get('limite')).toBe('20');
    expect(consulta.searchParams.get('desplazamiento')).toBe('0');
  });

  it('muestra el estado vacío cuando no hay inferencias', async () => {
    instalarFetch(() => responder({ total: 0, items: [] }));
    montar();

    expect(await screen.findByText('Sin inferencias')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Paginación' })).not.toBeInTheDocument();
  });

  it('muestra el error con reintento y vuelve a cargar al pulsarlo', async () => {
    let intentos = 0;
    instalarFetch(() => {
      intentos += 1;
      return intentos === 1 ? responder({ detail: 'fallo interno' }, 500) : responder(LISTA);
    });
    const user = userEvent.setup();
    montar();

    expect(await screen.findByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
    expect(screen.getByText('Comprueba la conexión y vuelve a intentarlo.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Reintentar' }));

    const tabla = await screen.findByRole('table');
    expect(within(tabla).getByText('Benigno')).toBeInTheDocument();
    expect(intentos).toBe(2);
    expect(screen.queryByRole('button', { name: 'Reintentar' })).not.toBeInTheDocument();
  });

  it('navega al caso desde la fila del historial', async () => {
    const user = userEvent.setup();
    montar();

    await user.click(await screen.findByRole('link', { name: 'CASO-0001' }));

    expect(await screen.findByText('Detalle del caso')).toBeInTheDocument();
  });

  it('filtra por clase contra el parámetro real de la API', async () => {
    const user = userEvent.setup();
    montar();
    await screen.findByRole('table');

    await user.selectOptions(screen.getByLabelText('Clase'), 'maligno');

    await waitFor(() => expect(llamadasA('/resultados')).toHaveLength(2));
    const segunda = new URL(llamadasA('/resultados')[1]?.url ?? '');
    expect(segunda.searchParams.get('clase')).toBe('maligno');
    expect(segunda.searchParams.get('desplazamiento')).toBe('0');
  });

  it('pagina contra el desplazamiento del servidor', async () => {
    const user = userEvent.setup();
    instalarFetch(() => responder({ total: 45, items: [RESULTADO_MALIGNO] }));
    montar();
    await screen.findByRole('table');

    await user.click(screen.getByRole('button', { name: 'Siguiente' }));

    await waitFor(() => expect(llamadasA('/resultados')).toHaveLength(2));
    const segunda = new URL(llamadasA('/resultados')[1]?.url ?? '');
    expect(segunda.searchParams.get('desplazamiento')).toBe('20');
  });

  it('muestra el historial de un caso con la navegación de vuelta', async () => {
    montar('/medico/casos/caso-9/historial');

    expect(
      await screen.findByRole('heading', { name: 'Historial de inferencias' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Imagen img-9999/)).toBeInTheDocument();
    expect(screen.getByText('v3.1')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Volver al caso' })).toHaveAttribute(
      'href',
      '/medico/casos/caso-9',
    );
    expect(llamadasA('/casos/caso-9/inferencias')).toHaveLength(1);
    expect(llamadasA('/resultados')).toHaveLength(0);
  });
});
