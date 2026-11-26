import { Route, Routes } from 'react-router-dom';
import { delay, http, HttpResponse } from 'msw';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { crearHandlers } from '../../mocks/handlers';
import { InferenciaPacientePage } from './InferenciaPacientePage';

const CASO = {
  id: 'caso-demo',
  codigo: 'CASO-0001',
  paciente_id: 'pac-demo',
  paciente_codigo: 'PAC-0001',
  creado_en: '2026-05-10T09:00:00Z',
};

const CASO_ANTERIOR = {
  id: 'caso-demo-anterior',
  codigo: 'CASO-0000',
  paciente_id: 'pac-demo',
  paciente_codigo: 'PAC-0001',
  creado_en: '2026-04-10T09:00:00Z',
};

const PACIENTE = {
  id: 'pac-demo',
  codigo: 'PAC-0001',
  creado_en: '2026-03-10T10:15:00Z',
  total_casos: 2,
  casos: [CASO_ANTERIOR, CASO],
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

const NODULO_SIN_ARTEFACTOS = {
  ...NODULO,
  artefactos: {
    mascara_url: null,
    mgac_url: null,
    xml_url: null,
    superposicion_url: null,
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

const meta = {
  title: 'Aplicación/Médico/Inferencia del paciente',
  component: InferenciaPacientePage,
  decorators: [
    (Story) => (
      <Routes>
        <Route path="/medico/inferencia" element={<Story />} />
        <Route path="/medico/pacientes/:id/inferencia" element={<Story />} />
      </Routes>
    ),
  ],
  parameters: { router: { initialEntries: ['/medico/pacientes/pac-demo/inferencia'] } },
  tags: ['ai-generated'],
} satisfies Meta<typeof InferenciaPacientePage>;

export default meta;
type Story = StoryObj<typeof meta>;

interface OpcionesInferencia {
  conResultados?: boolean;
  sinCasos?: boolean;
  sinConsentimiento?: boolean;
  sinArtefactos?: boolean;
}

const handlersInferencia = (
  estado: 'lista' | 'vacio' | 'error',
  opciones: OpcionesInferencia = {},
) => [
  ...crearHandlers('ok'),
  http.get(/\/pacientes\/[^/]+$/, () => {
    if (estado === 'error') {
      return HttpResponse.json(
        { error: { code: 'internal_error', message: 'Error de prueba' } },
        { status: 500 },
      );
    }
    return HttpResponse.json({
      ...PACIENTE,
      total_casos: opciones.sinCasos ? 0 : PACIENTE.casos.length,
      casos: opciones.sinCasos ? [] : PACIENTE.casos,
    });
  }),
  http.get(/\/casos\/[^/]+\/imagenes$/, () =>
    estado === 'vacio'
      ? HttpResponse.json({ total: 0, items: [] })
      : HttpResponse.json({ total: 1, items: [IMAGEN] }),
  ),
  http.get(/\/casos\/[^/]+\/inferencias$/, () => {
    if (estado === 'vacio' || opciones.conResultados === false) {
      return HttpResponse.json({ total: 0, items: [] });
    }
    const inferencia = opciones.sinArtefactos
      ? { ...INFERENCIA, nodulos: [NODULO_SIN_ARTEFACTOS] }
      : INFERENCIA;
    return HttpResponse.json({ total: 1, items: [inferencia] });
  }),
  http.get(/\/casos\/[^/]+\/consentimientos$/, () =>
    HttpResponse.json({
      total: opciones.sinConsentimiento ? 0 : 1,
      items: opciones.sinConsentimiento ? [] : [CONSENTIMIENTO],
    }),
  ),
];

export const ConResultados: Story = {
  parameters: { msw: { handlers: handlersInferencia('lista') } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole('heading', { name: 'Inferencia del paciente' });
    await canvas.findByText('Nódulo 1: Benigno');
    await expect(canvas.getByText('Resultado de IA: apoyo, no diagnóstico')).toBeInTheDocument();
    await expect(canvas.getAllByText('Benigno').length).toBeGreaterThan(0);
    await expect(canvas.getByText(/Confianza del resultado/)).toBeInTheDocument();
    await expect(canvas.getByText('Confianza del detector')).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: 'Analizar' })).toBeEnabled();
  },
};

export const SinArtefactos: Story = {
  parameters: {
    msw: { handlers: handlersInferencia('lista', { sinArtefactos: true }) },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText('Sin artefactos para este nódulo.');
  },
};

export const SinEcografias: Story = {
  parameters: {
    msw: { handlers: handlersInferencia('vacio', { conResultados: false }) },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText('Sin ecografías');
    await expect(canvas.getByText('Sin inferencias')).toBeInTheDocument();
  },
};

export const SinCasos: Story = {
  parameters: { msw: { handlers: handlersInferencia('lista', { sinCasos: true }) } },
  play: async ({ canvasElement }) => {
    await within(canvasElement).findByText('Sin casos registrados');
  },
};

export const SinConsentimiento: Story = {
  parameters: {
    msw: {
      handlers: handlersInferencia('lista', { conResultados: false, sinConsentimiento: true }),
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText('Falta el consentimiento para inferir');
    await expect(
      canvas.getByText(/consentimiento vigente de atención de salud/),
    ).toBeInTheDocument();
    await expect(
      canvas.getByRole('link', { name: 'Abrir el caso para registrar el consentimiento' }),
    ).toBeInTheDocument();
  },
};

export const ErrorDeCarga: Story = {
  parameters: { msw: { handlers: handlersInferencia('error') } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText('No se pudo cargar el paciente');
    await expect(canvas.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
  },
};

export const Cargando: Story = {
  parameters: {
    msw: {
      handlers: [
        ...crearHandlers('ok'),
        http.get(/\/pacientes\/[^/]+$/, async () => {
          await delay('infinite');
          return HttpResponse.json(PACIENTE);
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    await within(canvasElement).findByRole('status');
  },
};

export const SeleccionPaciente: Story = {
  parameters: {
    router: { initialEntries: ['/medico/inferencia'] },
    msw: { handlers: crearHandlers('ok') },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole('heading', { name: 'Inferencia de IA' });
    await expect(canvas.getByLabelText('Paciente')).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: 'Continuar' })).toBeEnabled();
  },
};
