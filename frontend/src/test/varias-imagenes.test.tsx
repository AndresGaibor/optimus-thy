import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CasoPage } from '../pages/medico/CasoPage';

const CASO = {
  id: 'caso-demo',
  codigo: 'CASO-0001',
  paciente_id: 'pac-demo',
  paciente_codigo: 'PAC-0001',
  creado_en: '2026-05-01T09:00:00Z',
  tiene_ficha: true,
  documentos: 0,
  imagenes: 3,
  consentimientos: 1,
};

const CONSENTIMIENTO = {
  id: 'consentimiento-demo',
  caso_id: 'caso-demo',
  base_legal: 'atencion_de_salud',
  version_texto: 'v1',
  otorgado_en: '2026-05-01T09:00:00Z',
  revocado_en: null,
  vigente: true,
};

interface ImagenListada {
  id: string;
  caso_id: string;
  sha256: string;
  formato: string;
  ancho: number;
  alto: number;
  tamano_bytes: number;
  sin_metadatos_exif_dicom: boolean;
  creado_en: string;
  url: string;
  url_expira_en: number;
}

function imagen(id: string, ancho: number, creadoEn: string): ImagenListada {
  return {
    id,
    caso_id: 'caso-demo',
    sha256: 'a'.repeat(64),
    formato: 'png',
    ancho,
    alto: ancho,
    tamano_bytes: 2048,
    sin_metadatos_exif_dicom: true,
    creado_en: creadoEn,
    url: `https://storage.local/${id}.png`,
    url_expira_en: 600,
  };
}

function responderJson(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function montarApp() {
  return render(
    <MemoryRouter initialEntries={['/casos/caso-demo']}>
      <Routes>
        <Route path="/casos/:casoId" element={<CasoPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

function archivoDePrueba(nombre: string): File {
  return new File(['contenido sintético'], nombre, { type: 'image/png' });
}

describe('varias imágenes por caso', () => {
  let imagenes: ImagenListada[];
  let subidas: number;
  let fallarProximaSubida: boolean;

  beforeEach(() => {
    vi.restoreAllMocks();
    subidas = 0;
    fallarProximaSubida = false;
    imagenes = [
      imagen('imagen-3', 300, '2026-05-03T10:00:00Z'),
      imagen('imagen-2', 200, '2026-05-02T10:00:00Z'),
      imagen('imagen-1', 100, '2026-05-01T10:00:00Z'),
    ];

    const fetchMock = vi.fn(async (input: unknown) => {
      const url = input instanceof Request ? input.url : String(input);
      const metodo = input instanceof Request ? input.method : 'GET';
      if (url.includes('/casos/caso-demo/imagenes')) {
        if (metodo === 'POST') {
          subidas += 1;
          if (fallarProximaSubida) {
            fallarProximaSubida = false;
            return responderJson({ error: { code: 'storage_error' } }, 502);
          }
          const nueva = imagen(`imagen-${10 + subidas}`, 400 + subidas, '2026-05-04T10:00:00Z');
          imagenes = [nueva, ...imagenes];
          return responderJson(nueva, 201);
        }
        return responderJson({ total: imagenes.length, items: imagenes });
      }
      if (url.includes('/casos/caso-demo/inferencias')) {
        return responderJson({ total: 0, items: [] });
      }
      if (url.includes('/casos/caso-demo/ficha/historial')) {
        return responderJson({ total: 0, items: [] });
      }
      if (url.includes('/casos/caso-demo/ficha')) {
        return responderJson({
          caso_id: 'caso-demo',
          registrada: true,
          cerrada_en: null,
          cerrada_por_id: null,
          cerrada_por_nombre: null,
        });
      }
      if (url.includes('/casos/caso-demo/consentimientos')) {
        return responderJson({ total: 1, items: [CONSENTIMIENTO] });
      }
      if (url.endsWith('/casos/caso-demo')) {
        return responderJson(CASO);
      }
      return responderJson({});
    });

    globalThis.fetch = fetchMock as unknown as typeof fetch;
  });

  it('lista las tres imágenes con la más reciente primero', async () => {
    montarApp();

    expect(await screen.findByRole('heading', { name: 'Caso CASO-0001' })).toBeInTheDocument();
    await screen.findAllByRole('img', { name: /Ecografía de/ });
    const titulos = screen
      .getAllByRole('heading', { name: /^PNG \d+×\d+$/ })
      .map((titulo) => titulo.textContent);

    expect(titulos).toEqual(['PNG 300×300', 'PNG 200×200', 'PNG 100×100']);
  });

  it('sube dos archivos y refresca la galería', async () => {
    const user = userEvent.setup();
    montarApp();

    await screen.findByRole('heading', { name: 'Caso CASO-0001' });
    await user.click(screen.getByRole('button', { name: 'Subir ecografía' }));
    const dialogo = await screen.findByRole('dialog');
    await user.upload(within(dialogo).getByLabelText(/Selecciona una o varias ecografías/), [
      archivoDePrueba('primera.png'),
      archivoDePrueba('segunda.png'),
    ]);

    expect(within(dialogo).getByText('Archivo seleccionado: primera.png')).toBeInTheDocument();
    expect(within(dialogo).getByText('Archivo seleccionado: segunda.png')).toBeInTheDocument();

    await user.click(within(dialogo).getByRole('button', { name: 'Subir ecografía' }));

    expect(await screen.findByText('Ecografías cargadas y saneadas.')).toBeInTheDocument();
    expect(subidas).toBe(2);
    await waitFor(() =>
      expect(screen.getAllByRole('img', { name: /Ecografía de/ })).toHaveLength(5),
    );
  });

  it('un archivo rechazado no tumba la galería', async () => {
    const user = userEvent.setup();
    montarApp();

    await screen.findByRole('heading', { name: 'Caso CASO-0001' });
    await user.click(screen.getByRole('button', { name: 'Subir ecografía' }));
    const dialogo = await screen.findByRole('dialog');
    await user.upload(within(dialogo).getByLabelText(/Selecciona una o varias ecografías/), [
      archivoDePrueba('buena.png'),
      new File([], 'vacia.png', { type: 'image/png' }),
    ]);
    await user.click(within(dialogo).getByRole('button', { name: 'Subir ecografía' }));

    expect(await screen.findByText('El archivo está vacío.')).toBeInTheDocument();
    expect(screen.getByText('Rechazado')).toBeInTheDocument();
    expect(screen.getByText('Lista')).toBeInTheDocument();
    expect(subidas).toBe(1);

    const abierto = await screen.findByRole('dialog');
    await user.click(within(abierto).getByRole('button', { name: 'Cancelar' }));
    await waitFor(() =>
      expect(screen.getAllByRole('img', { name: /Ecografía de/ })).toHaveLength(4),
    );
  });

  it('muestra el error por archivo y permite reintentar', async () => {
    const user = userEvent.setup();
    fallarProximaSubida = true;
    montarApp();

    await screen.findByRole('heading', { name: 'Caso CASO-0001' });
    await user.click(screen.getByRole('button', { name: 'Subir ecografía' }));
    const dialogo = await screen.findByRole('dialog');
    await user.upload(
      within(dialogo).getByLabelText(/Selecciona una o varias ecografías/),
      archivoDePrueba('eco.png'),
    );
    await user.click(within(dialogo).getByRole('button', { name: 'Subir ecografía' }));

    expect(await screen.findByText('No se pudo subir la ecografía.')).toBeInTheDocument();
    const reintento = screen.getByRole('button', { name: 'Reintentar subida' });
    expect(reintento).toBeEnabled();

    await user.click(reintento);

    expect(await screen.findByText('Ecografía cargada y saneada.')).toBeInTheDocument();
    expect(subidas).toBe(2);
    await waitFor(() =>
      expect(screen.getAllByRole('img', { name: /Ecografía de/ })).toHaveLength(4),
    );
  });
});
