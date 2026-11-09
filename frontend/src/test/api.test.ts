import { afterEach, describe, expect, it, vi } from 'vitest';
import { getHealth } from '../api/client';

function responder(cuerpo: unknown, status: number) {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(JSON.stringify(cuerpo), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  );
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('getHealth', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('consulta GET /health y devuelve el estado', async () => {
    const fetchMock = responder({ status: 'ok' }, 200);
    await expect(getHealth()).resolves.toEqual({ status: 'ok' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect((fetchMock.mock.calls[0]?.[0] as Request).url).toBe('http://localhost:8000/health');
  });

  it('falla con un mensaje genérico si la API responde error', async () => {
    responder({ detail: 'interna' }, 500);
    await expect(getHealth()).rejects.toThrow('No se pudo consultar el estado del servicio');
  });
});
