import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { NoduloInferencia, ResultadoGuardado } from '../api/resultados';
import { ComparacionResultadosPage } from '../pages/medico/ComparacionResultadosPage';

function nodulo(cambios: Partial<NoduloInferencia> = {}): NoduloInferencia {
  return {
    indice: 0,
    clase: 'maligno',
    confianza: 0.8,
    probabilidad_benigno: 0.2,
    probabilidad_maligno: 0.8,
    caja: { x: null, y: null, w: null, h: null },
    region_analizada: null,
    pixeles_mascara: null,
    artefactos: {
      mascara_url: null,
      mgac_url: null,
      xml_url: null,
      superposicion_url: null,
    },
    ...cambios,
  };
}

function inferencia(cambios: Partial<ResultadoGuardado> = {}): ResultadoGuardado {
  return {
    id: 'inf-1',
    imagen_id: 'img-1',
    modelo: { id: 'modelo-swin', nombre: 'Swin', version: '1.0' },
    resultado: 'maligno',
    confianza: 0.9,
    tiempo_ms: null,
    ancho: null,
    alto: null,
    version_contrato: null,
    huella_modelos: null,
    umbrales: null,
    creado_en: '2026-11-20T10:00:00Z',
    nodulos: [],
    caso_id: 'caso-1',
    caso_codigo: 'CASO-0001',
    paciente_codigo: 'PAC-0001',
    ...cambios,
  };
}

const SWIN = { id: 'modelo-swin', nombre: 'Swin', version: '1.0' };
const RESNET = { id: 'modelo-resnet', nombre: 'ResNet', version: '2.3' };

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

function instalarFetch(resultados: () => Response) {
  fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const { pathname } = new URL(urlDe(input));
    if (pathname === '/resultados') return resultados();
    return responder({ total: 0, items: [] });
  }) as unknown as MockFetch;
  vi.stubGlobal('fetch', fetchMock);
}

afterEach(() => {
  vi.unstubAllGlobals();
});

function montar() {
  return render(
    <MemoryRouter initialEntries={['/medico/comparacion']}>
      <Routes>
        <Route path="/medico/comparacion" element={<ComparacionResultadosPage />} />
        <Route path="/medico/casos/:casoId" element={<p>Detalle del caso</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ComparacionResultadosPage', () => {
  it('marca que dos modelos coinciden sobre la misma imagen', async () => {
    const items = [
      inferencia({ id: 'inf-swin', modelo: SWIN }),
      inferencia({ id: 'inf-resnet', modelo: RESNET, confianza: 0.88 }),
    ];
    instalarFetch(() => responder({ total: 2, items }));
    montar();

    expect(await screen.findByText('Coinciden')).toBeInTheDocument();
    expect(
      screen.getByText('Todos los modelos asignan la misma clase a la imagen.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Imagen img-1' })).toBeInTheDocument();
    expect(screen.getByText('Swin')).toBeInTheDocument();
    expect(screen.getByText('ResNet')).toBeInTheDocument();
    expect(screen.getAllByText('Maligno')).toHaveLength(2);
    expect(screen.getByText('No es una recomendación clínica')).toBeInTheDocument();
    expect(llamadasA('/resultados')).toHaveLength(1);
    expect(new URL(llamadasA('/resultados')[0]!.url).searchParams.get('limite')).toBe('50');
  });

  it('marca que dos modelos difieren y muestra ambas clases', async () => {
    const items = [
      inferencia({ id: 'inf-swin', modelo: SWIN }),
      inferencia({ id: 'inf-resnet', modelo: RESNET, resultado: 'benigno', confianza: 0.81 }),
    ];
    instalarFetch(() => responder({ total: 2, items }));
    montar();

    expect(await screen.findByText('Difieren')).toBeInTheDocument();
    expect(
      screen.getByText('Los modelos asignan clases distintas a la misma imagen.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Maligno')).toBeInTheDocument();
    expect(screen.getByText('Benigno')).toBeInTheDocument();

    const tabla = screen.getByRole('table');
    expect(within(tabla).getAllByRole('row')).toHaveLength(3);
  });

  it('avisa cuando la imagen solo tiene una inferencia', async () => {
    instalarFetch(() => responder({ total: 1, items: [inferencia({ imagen_id: 'img-sola' })] }));
    montar();

    expect(await screen.findByText('Sin comparación')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Solo hay una inferencia para esta imagen; no hay otro modelo con el que comparar.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Imagen img-sola' })).toBeInTheDocument();
  });

  it('muestra confianza y probabilidades de cada modelo', async () => {
    const items = [
      inferencia({
        confianza: 0.91,
        nodulos: [nodulo({ probabilidad_benigno: 0.13, probabilidad_maligno: 0.87 })],
      }),
    ];
    instalarFetch(() => responder({ total: 1, items }));
    montar();

    const tabla = await screen.findByRole('table');
    expect(within(tabla).getByText('91.0 %')).toBeInTheDocument();
    expect(within(tabla).getByText('13.0 %')).toBeInTheDocument();
    expect(within(tabla).getByText('87.0 %')).toBeInTheDocument();
    expect(within(tabla).getByText('1')).toBeInTheDocument();
  });

  it('muestra el estado vacío cuando no hay resultados', async () => {
    instalarFetch(() => responder({ total: 0, items: [] }));
    montar();

    expect(await screen.findByText('Sin resultados para comparar')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Mostrar')).not.toBeInTheDocument();
  });

  it('muestra el error con reintento y vuelve a cargar al pulsarlo', async () => {
    let intentos = 0;
    instalarFetch(() => {
      intentos += 1;
      return intentos === 1
        ? responder({ detail: 'fallo interno' }, 500)
        : responder({ total: 1, items: [inferencia({ imagen_id: 'img-nueva' })] });
    });
    const user = userEvent.setup();
    montar();

    const boton = await screen.findByRole('button', { name: 'Reintentar' });
    expect(screen.getByText('Comprueba la conexión y vuelve a intentarlo.')).toBeInTheDocument();
    await user.click(boton);

    expect(await screen.findByText('Sin comparación')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Imagen img-nueva' })).toBeInTheDocument();
    expect(intentos).toBe(2);
    expect(screen.queryByRole('button', { name: 'Reintentar' })).not.toBeInTheDocument();
  });

  it('filtra por discrepancias en el cliente', async () => {
    const items = [
      inferencia({ id: 'inf-a', imagen_id: 'img-1', modelo: SWIN }),
      inferencia({ id: 'inf-b', imagen_id: 'img-1', modelo: RESNET, resultado: 'benigno' }),
      inferencia({ id: 'inf-c', imagen_id: 'img-2', modelo: SWIN }),
      inferencia({ id: 'inf-d', imagen_id: 'img-2', modelo: RESNET }),
    ];
    instalarFetch(() => responder({ total: 4, items }));
    const user = userEvent.setup();
    montar();

    await screen.findByText('Difieren');
    expect(screen.getByRole('heading', { name: 'Imagen img-2' })).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Mostrar'), 'difieren');

    expect(screen.getByRole('heading', { name: 'Imagen img-1' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Imagen img-2' })).not.toBeInTheDocument();
    expect(llamadasA('/resultados')).toHaveLength(1);
  });
});
