import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CasoPage } from '../pages/medico/CasoPage';

const permisosSesion = vi.hoisted(() => ({ permisos: ['paciente.leer'] as string[] }));

vi.mock('../session/SessionContext', () => ({
  useSession: () => ({ permisos: permisosSesion.permisos }),
  usePermisosSesion: () => permisosSesion.permisos,
}));

function respuestaJson(cuerpo: unknown): Response {
  return new Response(JSON.stringify(cuerpo), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

function urlDe(input: RequestInfo | URL): string {
  return input instanceof Request ? input.url : String(input);
}

function montarCaso() {
  return render(
    <MemoryRouter initialEntries={['/casos/caso-1']}>
      <Routes>
        <Route path="/casos/:casoId" element={<CasoPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('exportación de datos del paciente', () => {
  beforeEach(() => {
    permisosSesion.permisos = ['paciente.leer'];
    class URLConBlob extends URL {}
    Object.assign(URLConBlob, {
      createObjectURL: vi.fn(() => 'blob:exportado'),
      revokeObjectURL: vi.fn(),
    });
    vi.stubGlobal('URL', URLConBlob);
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = urlDe(input);
      if (url.includes('/pacientes/paciente-1/exportacion')) {
        return new Response('{"paciente":{}}', {
          status: 200,
          headers: { 'Content-Disposition': 'attachment; filename="datos-PAC-0001.csv"' },
        });
      }
      if (url.endsWith('/casos/caso-1')) {
        return respuestaJson({
          id: 'caso-1',
          codigo: 'CASO-0001',
          paciente_id: 'paciente-1',
          paciente_codigo: 'PAC-0001',
          creado_en: '2026-05-01T09:00:00Z',
          tiene_ficha: true,
          documentos: 0,
          imagenes: 0,
          consentimientos: 0,
        });
      }
      return respuestaJson({ total: 0, items: [] });
    }) as typeof fetch;
  });

  it('descarga el blob en el formato elegido', async () => {
    const user = userEvent.setup();
    montarCaso();

    await user.selectOptions(await screen.findByLabelText('Formato de exportación'), 'csv');
    await user.click(screen.getByRole('button', { name: 'Exportar datos' }));

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/pacientes/paciente-1/exportacion?formato=csv'),
        expect.objectContaining({ credentials: 'include' }),
      );
    });
    expect(URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:exportado');
  });

  it('muestra un error comprensible si falla la exportación', async () => {
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      if (urlDe(input).includes('/pacientes/paciente-1/exportacion')) {
        return new Response('{}', { status: 500 });
      }
      if (urlDe(input).endsWith('/casos/caso-1')) {
        return respuestaJson({
          id: 'caso-1',
          codigo: 'CASO-0001',
          paciente_id: 'paciente-1',
          paciente_codigo: 'PAC-0001',
          creado_en: '2026-05-01T09:00:00Z',
          tiene_ficha: true,
          documentos: 0,
          imagenes: 0,
          consentimientos: 0,
        });
      }
      return respuestaJson({ total: 0, items: [] });
    }) as typeof fetch;
    const user = userEvent.setup();
    montarCaso();

    await user.click(await screen.findByRole('button', { name: 'Exportar datos' }));

    expect(
      await screen.findByText('No se pudieron exportar los datos del paciente.'),
    ).toBeInTheDocument();
  });
  it('deshabilita la exportación cuando falta el permiso', async () => {
    permisosSesion.permisos = [];
    montarCaso();

    const boton = await screen.findByRole('button', { name: 'Exportar datos' });
    expect(boton).toBeDisabled();
  });
});
