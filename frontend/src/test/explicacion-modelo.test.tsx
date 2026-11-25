import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ResultadoGuardado } from '../api/resultados';
import { ExplicacionModeloPage } from '../pages/medico/ExplicacionModeloPage';

const HUELLA = 'a'.repeat(64);

function resultado(parciales: Partial<ResultadoGuardado> = {}): ResultadoGuardado {
  return {
    id: 'inferencia-1',
    imagen_id: 'imagen-1',
    modelo: { id: 'modelo-1', nombre: 'Swin Transformer', version: '2.1.0' },
    resultado: 'benigno',
    confianza: 0.87,
    tiempo_ms: 950,
    ancho: 800,
    alto: 600,
    version_contrato: '1.1',
    huella_modelos: HUELLA,
    umbrales: null,
    creado_en: '2026-06-10T14:32:00Z',
    nodulos: [],
    caso_id: 'caso-1',
    caso_codigo: 'CASO-0001',
    paciente_codigo: 'PAC-0001',
    ...parciales,
  };
}

function responder(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function lista(items: ResultadoGuardado[]) {
  return { total: items.length, items };
}

interface FetchInstalado {
  mock: { calls: Array<Array<RequestInfo | URL>> };
}

/** Instala `fetch` con una cola de respuestas; la última se repite. */
function instalarFetch(respuestas: Array<() => Response>): FetchInstalado {
  const fetchMock = vi.fn(() => {
    const siguiente = respuestas.length > 1 ? respuestas.shift() : respuestas[0];
    return Promise.resolve(siguiente?.() ?? responder({}, 500));
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

function urlsConsultadas(fetchMock: FetchInstalado): string[] {
  return fetchMock.mock.calls.map(([entrada]) =>
    typeof entrada === 'string' ? entrada : ((entrada as Request | undefined)?.url ?? ''),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Explicación del modelo', () => {
  it('muestra el flujo y los límites aunque no haya modelo que consultar', async () => {
    instalarFetch([() => responder(lista([]))]);
    render(<ExplicacionModeloPage />);

    await screen.findByText('Sin modelo en uso');

    expect(
      screen.getByText('La predicción apoya tu criterio; no es un diagnóstico'),
    ).toBeInTheDocument();
    expect(screen.getByText('Cómo se obtiene la predicción')).toBeInTheDocument();
    expect(screen.getByText('No es un diagnóstico')).toBeInTheDocument();
    expect(screen.getByText('No sustituye al especialista')).toBeInTheDocument();
    expect(screen.getByText('Solo ecografías tiroideas')).toBeInTheDocument();
    expect(screen.getByText('Depende de la calidad de la imagen')).toBeInTheDocument();
    expect(screen.getByText('La confianza no es riesgo')).toBeInTheDocument();
    expect(screen.getByText('No aprende de tus casos')).toBeInTheDocument();
    expect(screen.getByText('Cómo se registra tu decisión')).toBeInTheDocument();
    expect(screen.getByText('Qué queda auditado')).toBeInTheDocument();
  });

  it('muestra la versión y la huella de pesos del modelo de la última inferencia', async () => {
    const fetchMock = instalarFetch([() => responder(lista([resultado()]))]);
    render(<ExplicacionModeloPage />);

    expect(await screen.findByText('Swin Transformer')).toBeInTheDocument();
    expect(screen.getByText('2.1.0')).toBeInTheDocument();
    expect(screen.getByText(HUELLA)).toBeInTheDocument();
    expect(urlsConsultadas(fetchMock)[0]).toContain('/resultados?limite=1');
  });

  it('mantiene la explicación visible si falla la API y permite reintentar', async () => {
    const fetchMock = instalarFetch([
      () => responder({ error: { code: 'interna', message: 'Fallo' } }, 500),
      () => responder(lista([resultado()])),
    ]);
    const usuario = userEvent.setup();
    render(<ExplicacionModeloPage />);

    expect(await screen.findByText('No se pudo consultar el modelo')).toBeInTheDocument();
    expect(screen.getByText('Cómo se obtiene la predicción')).toBeInTheDocument();
    expect(screen.getByText('No es un diagnóstico')).toBeInTheDocument();
    expect(screen.queryByText('2.1.0')).not.toBeInTheDocument();

    await usuario.click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(await screen.findByText('2.1.0')).toBeInTheDocument();
    expect(screen.queryByText('No se pudo consultar el modelo')).not.toBeInTheDocument();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  });

  it('informa de la ausencia de un modelo en uso sin inventar una versión', async () => {
    instalarFetch([() => responder(lista([]))]);
    render(<ExplicacionModeloPage />);

    expect(await screen.findByText('Sin modelo en uso')).toBeInTheDocument();
    expect(screen.queryByText('Versión')).not.toBeInTheDocument();
    expect(screen.queryByText('Huella de los pesos (SHA-256)')).not.toBeInTheDocument();
  });
});
