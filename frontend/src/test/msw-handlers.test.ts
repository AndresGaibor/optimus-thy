import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { setupServer } from 'msw/node';
import { crearHandlers, identidadOk, matrizRolesOk, pacientesOk } from '../mocks/handlers';

const server = setupServer(...crearHandlers('ok'));

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('handlers MSW (contrato API simulado)', () => {
  it('GET /api/auth/me responde 200 con identidad', async () => {
    const res = await fetch('http://localhost/api/auth/me');
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual(identidadOk);
  });

  it('GET /api/pacientes responde 200 con lista paginada', async () => {
    const res = await fetch('http://localhost/api/pacientes');
    expect(res.status).toBe(200);
    const data = (await res.json()) as { total: number; items: unknown[] };
    expect(data.total).toBe(pacientesOk.total);
    expect(data.items).toHaveLength(pacientesOk.items.length);
  });

  it('GET /api/pacientes responde 200 vacío en escenario vacio', async () => {
    server.use(...crearHandlers('vacio'));
    const res = await fetch('http://localhost/api/pacientes');
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ total: 0, items: [] });
  });

  it('GET /api/roles responde 403 en escenario sinPermiso', async () => {
    server.use(...crearHandlers('sinPermiso'));
    const res = await fetch('http://localhost/api/roles');
    expect(res.status).toBe(403);
    const data = (await res.json()) as { error: { code: string; message: string } };
    expect(data.error.code).toBe('forbidden');
  });

  it('GET /api/auth/me responde 500 en escenario error', async () => {
    server.use(...crearHandlers('error'));
    const res = await fetch('http://localhost/api/auth/me');
    expect(res.status).toBe(500);
    const data = (await res.json()) as { error: { code: string } };
    expect(data.error.code).toBe('internal_error');
  });

  it('GET /api/roles responde 200 con matriz en escenario ok', async () => {
    server.use(...crearHandlers('ok'));
    const res = await fetch('http://localhost/api/roles');
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual(matrizRolesOk);
  });
  it('GET /api/auth/me responde 401 no autenticado', async () => {
    server.use(...crearHandlers('noAutenticado'));
    const res = await fetch('http://localhost/api/auth/me');
    expect(res.status).toBe(401);
    const data = (await res.json()) as { error: { code: string } };
    expect(data.error.code).toBe('unauthenticated');
  });

  it('GET /api/auth/me responde 401 con sesión expirada', async () => {
    server.use(...crearHandlers('sesionExpirada'));
    const res = await fetch('http://localhost/api/auth/me');
    expect(res.status).toBe(401);
    const data = (await res.json()) as { error: { code: string } };
    expect(data.error.code).toBe('session_expired');
  });

  it('GET /api/pacientes devuelve la página parcial con total real', async () => {
    server.use(...crearHandlers('parcial'));
    const res = await fetch('http://localhost/api/pacientes');
    expect(res.status).toBe(200);
    const data = (await res.json()) as { total: number; items: unknown[] };
    expect(data.total).toBe(45);
    expect(data.items).toHaveLength(3);
  });

  it('POST /api/pacientes responde 422 en escenario validacion', async () => {
    server.use(...crearHandlers('validacion'));
    const res = await fetch('http://localhost/api/pacientes', { method: 'POST' });
    expect(res.status).toBe(422);
  });

  it('GET /api/pacientes demora y luego responde en escenario lento', async () => {
    server.use(...crearHandlers('lento'));
    const inicio = performance.now();
    const res = await fetch('http://localhost/api/pacientes');
    const transcurrido = performance.now() - inicio;
    expect(res.status).toBe(200);
    expect(transcurrido).toBeGreaterThanOrEqual(1400);
  });
});
