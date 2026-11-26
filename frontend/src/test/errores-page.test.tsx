import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Errores } from '../api/errores';
import { ErroresPage } from '../pages/investigador/ErroresPage';

const DATOS: Errores = {
  total: 2,
  falsos_positivos: 1,
  falsos_negativos: 1,
  items: [
    {
      id: '11111111-1111-1111-1111-111111111111',
      tipo: 'falso_positivo',
      creado_en: '2025-06-01T12:00:00Z',
      caso_id: '22222222-2222-2222-2222-222222222222',
      caso_codigo: 'CASO-0001',
      paciente_codigo: 'PAC-0001',
      modelo: {
        id: '33333333-3333-3333-3333-333333333333',
        nombre: 'Swin',
        version: '1.2.0',
        hash_pesos: 'b'.repeat(64),
      },
      imagen: { id: '44444444-4444-4444-4444-444444444444', hash_sha256: 'a'.repeat(64) },
      resultado: 'maligno',
      resultado_corregido: 'benigno',
      confianza: 0.91,
    },
    {
      id: '55555555-5555-5555-5555-555555555555',
      tipo: 'falso_negativo',
      creado_en: '2025-06-02T12:00:00Z',
      caso_id: '22222222-2222-2222-2222-222222222222',
      caso_codigo: 'CASO-0002',
      paciente_codigo: 'PAC-0002',
      modelo: {
        id: '33333333-3333-3333-3333-333333333333',
        nombre: 'Swin',
        version: '1.2.0',
        hash_pesos: 'b'.repeat(64),
      },
      imagen: { id: '66666666-6666-6666-6666-666666666666', hash_sha256: 'c'.repeat(64) },
      resultado: 'benigno',
      resultado_corregido: 'maligno',
      confianza: null,
    },
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
  return new URL(recurso instanceof Request ? recurso.url : String(recurso), 'http://local');
}

beforeEach(() => {
  fetchMock = vi.fn<typeof fetch>().mockResolvedValue(responder(DATOS));
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('análisis de errores del investigador', () => {
  it('muestra los contadores y distingue falsos positivos de negativos', async () => {
    render(<ErroresPage />);

    expect(screen.getByRole('status')).toHaveTextContent('Cargando errores');

    const tabla = await screen.findByRole('table', { name: /corregidas por el médico/i });
    expect(tabla).toBeVisible();
    expect(screen.getByText('1 falsos positivos · 1 falsos negativos')).toBeInTheDocument();
    const filas = screen.getAllByRole('row').slice(1);
    expect(filas).toHaveLength(2);
    expect(filas[0]).toHaveTextContent('Falso positivo');
    expect(filas[0]).toHaveTextContent('maligno');
    expect(filas[0]).toHaveTextContent('benigno');
    expect(filas[1]).toHaveTextContent('Falso negativo');
    expect(filas[1]).toHaveTextContent('—');
  });

  it('pide solo los falsos negativos al cambiar el filtro', async () => {
    const usuario = userEvent.setup();
    render(<ErroresPage />);
    await screen.findByRole('table', { name: /corregidas por el médico/i });

    await usuario.selectOptions(screen.getByLabelText('Tipo de error'), 'falso_negativo');

    await waitFor(() => {
      expect(ultimaUrl().searchParams.get('tipo')).toBe('falso_negativo');
    });
  });

  it('muestra el estado vacío cuando no hay correcciones', async () => {
    fetchMock.mockResolvedValue(
      responder({ total: 0, falsos_positivos: 0, falsos_negativos: 0, items: [] }),
    );

    render(<ErroresPage />);

    expect(await screen.findByText('Sin errores registrados')).toBeInTheDocument();
  });

  it('expone un error genérico y reintenta', async () => {
    const usuario = userEvent.setup();
    fetchMock.mockResolvedValueOnce(responder({ error: { code: 'boom' } }, 500));

    render(<ErroresPage />);

    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudieron cargar los errores');
    await usuario.click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(await screen.findByRole('table', { name: /corregidas por el médico/i })).toBeVisible();
  });
});
