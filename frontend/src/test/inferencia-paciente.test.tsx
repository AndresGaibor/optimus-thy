import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { InferenciaPacientePage } from '../pages/medico/InferenciaPacientePage';

const CASO = {
  id: 'caso-demo',
  codigo: 'CASO-0001',
  paciente_id: 'pac-demo',
  paciente_codigo: 'PAC-0001',
  creado_en: '2026-05-10T09:00:00Z',
};

const PACIENTE = {
  id: 'pac-demo',
  codigo: 'PAC-0001',
  creado_en: '2026-03-10T10:15:00Z',
  total_casos: 1,
  casos: [CASO],
};

const IMAGEN = {
  id: 'imagen-demo',
  caso_id: 'caso-demo',
  sha256: 'a'.repeat(64),
  formato: 'png',
  ancho: 314,
  alto: 402,
  tamano_bytes: 2048,
  sin_metadatos_exif_dicom: true,
  creado_en: '2026-05-10T09:00:00Z',
  url: 'https://storage.local/caso-demo/eco.png',
  url_expira_en: 600,
};

const NODULO = {
  indice: 1,
  clase: 'benigno',
  confianza: 0.87,
  probabilidad_benigno: 0.91,
  probabilidad_maligno: 0.09,
  caja: { x: 78, y: 96, w: 140, h: 143 },
  region_analizada: { xmin: 64, ymin: 82, xmax: 232, ymax: 253 },
  pixeles_mascara: 8178,
  artefactos: {
    mascara_url: 'https://storage.local/mascara.png',
    mgac_url: 'https://storage.local/mgac.png',
    xml_url: 'https://storage.local/resultado.xml',
    superposicion_url: 'https://storage.local/superposicion.png',
  },
};

const INFERENCIA = {
  id: 'inferencia-demo',
  imagen_id: 'imagen-demo',
  modelo: { id: 'modelo-demo', nombre: 'Nodo', version: '1.0' },
  resultado: 'benigno',
  confianza: 0.93,
  tiempo_ms: 11800,
  ancho: 314,
  alto: 402,
  version_contrato: '1.1',
  huella_modelos: 'a74d',
  umbrales: { max_nodulos: 3 },
  creado_en: '2026-05-10T09:05:00Z',
  nodulos: [NODULO],
};

const CONSENTIMIENTO = {
  id: 'consentimiento-demo',
  caso_id: 'caso-demo',
  base_legal: 'atencion_de_salud',
  version_texto: 'v1',
  otorgado_en: '2026-05-10T09:00:00Z',
  revocado_en: null,
  vigente: true,
};

function responderJson(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function montarApp() {
  return render(
    <MemoryRouter initialEntries={['/medico/pacientes/pac-demo/inferencia']}>
      <Routes>
        <Route path="/medico/pacientes/:id/inferencia" element={<InferenciaPacientePage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('inferencia del paciente', () => {
  let respuestaPaciente: { status: number; body: unknown };
  let imagenes: unknown[];
  let resultados: unknown[];
  let consentimientos: unknown[];

  beforeEach(() => {
    vi.restoreAllMocks();
    respuestaPaciente = { status: 200, body: PACIENTE };
    imagenes = [IMAGEN];
    resultados = [INFERENCIA];
    consentimientos = [CONSENTIMIENTO];

    const fetchMock = vi.fn(async (input: unknown) => {
      const url = input instanceof Request ? input.url : String(input);
      const metodo = input instanceof Request ? input.method : 'GET';
      if (url.includes('/casos/') && url.includes('/imagenes')) {
        if (metodo === 'POST') {
          return responderJson(IMAGEN, 201);
        }
        return responderJson({ total: imagenes.length, items: imagenes });
      }
      if (url.includes('/inferencias')) {
        return responderJson({ total: resultados.length, items: resultados });
      }
      if (url.includes('/consentimientos')) {
        return responderJson({ total: consentimientos.length, items: consentimientos });
      }
      if (url.endsWith('/trabajos') && metodo === 'POST') {
        return responderJson(
          {
            id: 'trabajo-demo',
            tipo: 'inferencia',
            estado: 'pendiente',
            intentos: 0,
            max_intentos: 3,
          },
          201,
        );
      }
      if (url.includes('/trabajos/')) {
        return responderJson({
          id: 'trabajo-demo',
          tipo: 'inferencia',
          estado: 'completado',
          intentos: 1,
          max_intentos: 3,
        });
      }
      if (/\/pacientes\/[^/?]+$/.test(url)) {
        return responderJson(respuestaPaciente.body, respuestaPaciente.status);
      }
      return responderJson({});
    });

    globalThis.fetch = fetchMock as unknown as typeof fetch;
  });

  it('muestra la ecografía, el apoyo y la evidencia por nódulo', async () => {
    montarApp();

    expect(
      await screen.findByRole('heading', { name: 'Inferencia del paciente' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Resultado de IA: apoyo, no diagnóstico')).toBeInTheDocument();
    expect(
      await screen.findByRole('img', { name: 'Ecografía de 314 por 402 píxeles' }),
    ).toBeInTheDocument();
    expect(await screen.findByText('Nódulo 1: Benigno')).toBeInTheDocument();
    expect(screen.getByText(/Confianza del resultado/)).toBeInTheDocument();
    expect(screen.getByText('Confianza del detector')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Máscara del nódulo 1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Analizar' })).toBeEnabled();
  });

  it('invita a subir una ecografía cuando el caso está vacío', async () => {
    imagenes = [];
    resultados = [];
    montarApp();

    expect(await screen.findByText('Sin ecografías')).toBeInTheDocument();
    expect(screen.getByText('Sin inferencias')).toBeInTheDocument();
  });

  it('muestra el estado sin casos del paciente', async () => {
    respuestaPaciente = { status: 200, body: { ...PACIENTE, total_casos: 0, casos: [] } };
    montarApp();

    expect(await screen.findByText('Sin casos registrados')).toBeInTheDocument();
  });

  it('reintenta la carga del paciente', async () => {
    respuestaPaciente = {
      status: 500,
      body: { error: { code: 'internal_error', message: 'Error de prueba' } },
    };
    const user = userEvent.setup();
    montarApp();

    expect(await screen.findByText('No se pudo cargar el paciente')).toBeInTheDocument();
    respuestaPaciente = { status: 200, body: PACIENTE };
    await user.click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(await screen.findByText('Nódulo 1: Benigno')).toBeInTheDocument();
  });

  it('bloquea el análisis sin consentimiento vigente', async () => {
    consentimientos = [];
    resultados = [];
    montarApp();

    expect(await screen.findByText('Falta el consentimiento para inferir')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Analizar' })).toBeDisabled();
    expect(
      screen.getByText('Falta un consentimiento vigente de atención de salud.'),
    ).toBeInTheDocument();
  });

  it('encola la inferencia y muestra el estado completado', async () => {
    const user = userEvent.setup();
    montarApp();

    await screen.findByText('Nódulo 1: Benigno');
    await user.click(screen.getByRole('button', { name: 'Analizar' }));

    expect(await screen.findByText('Inferencia en cola…')).toBeInTheDocument();
    expect(
      await screen.findByText('Inferencia completada.', undefined, { timeout: 5000 }),
    ).toBeInTheDocument();
  });

  it('avisa cuando el nódulo no trae artefactos', async () => {
    resultados = [
      {
        ...INFERENCIA,
        nodulos: [
          {
            ...NODULO,
            artefactos: {
              mascara_url: null,
              mgac_url: null,
              xml_url: null,
              superposicion_url: null,
            },
          },
        ],
      },
    ];
    montarApp();

    expect(await screen.findByText('Sin artefactos para este nódulo.')).toBeInTheDocument();
  });

  it('sube una ecografía y confirma la copia saneada', async () => {
    const user = userEvent.setup();
    montarApp();

    await screen.findByRole('heading', { name: 'Inferencia del paciente' });
    await screen.findByText('Nódulo 1: Benigno');
    await user.click(screen.getByRole('button', { name: 'Subir ecografía' }));

    const dialogo = await screen.findByRole('dialog');
    const archivo = new File(['contenido sintético'], 'eco.png', { type: 'image/png' });
    await user.upload(
      within(dialogo).getByLabelText(/Selecciona una o varias ecografías PNG o JPEG/),
      archivo,
    );
    expect(within(dialogo).getByText('Archivo seleccionado: eco.png')).toBeInTheDocument();

    await user.click(within(dialogo).getByRole('button', { name: 'Subir ecografía' }));
    expect(await screen.findByText('Ecografía cargada y saneada.')).toBeInTheDocument();
  });
});
