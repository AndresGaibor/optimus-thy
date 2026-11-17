import { Route, Routes } from 'react-router-dom';
import { delay, http, HttpResponse } from 'msw';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { crearHandlers } from '../../mocks/handlers';
import { CasoPage } from './CasoPage';

const CASO = {
  id: 'caso-demo',
  codigo: 'CASO-0001',
  paciente_id: 'paciente-demo',
  paciente_codigo: 'PAC-0001',
  creado_en: '2026-05-10T09:00:00Z',
  tiene_ficha: false,
  documentos: 0,
  imagenes: 1,
  consentimientos: 1,
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
  confianza: 0.56,
  probabilidad_benigno: 1,
  probabilidad_maligno: 0,
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

const meta = {
  title: 'Aplicación/Médico/Caso',
  component: CasoPage,
  // La previsualización ya envuelve cada historia en un MemoryRouter.
  decorators: [
    (Story) => (
      <Routes>
        <Route path="/medico/casos/:casoId" element={<Story />} />
      </Routes>
    ),
  ],
  parameters: { router: { initialEntries: ['/medico/casos/caso-demo'] } },
  tags: ['ai-generated'],
} satisfies Meta<typeof CasoPage>;

export default meta;
type Story = StoryObj<typeof meta>;

const INFERENCIA_NORMAL = { ...INFERENCIA, resultado: 'sin_nodulo', nodulos: [] };
const CONSENTIMIENTO = {
  id: 'consentimiento-demo',
  caso_id: 'caso-demo',
  base_legal: 'atencion_de_salud',
  version_texto: 'v1',
  otorgado_en: '2026-05-10T09:00:00Z',
  revocado_en: null,
  vigente: true,
};

const handlersCaso = (
  estado: 'lista' | 'vacio' | 'error' | 'trabajo',
  opciones: { conResultados?: boolean; normal?: boolean; sinConsentimiento?: boolean } = {},
) => [
  ...crearHandlers('ok'),
  http.get(/\/casos\/[^/]+$/, () =>
    estado === 'error'
      ? HttpResponse.json({ error: { code: 'error', message: 'Error de prueba' } }, { status: 500 })
      : HttpResponse.json(CASO),
  ),
  http.get(/\/casos\/[^/]+\/imagenes$/, () =>
    estado === 'error' || estado === 'vacio'
      ? HttpResponse.json({ total: 0, items: [] })
      : HttpResponse.json({ total: 1, items: [IMAGEN] }),
  ),
  http.get(/\/casos\/[^/]+\/inferencias$/, () => {
    if (opciones.conResultados === false) return HttpResponse.json({ total: 0, items: [] });
    return HttpResponse.json({
      total: 1,
      items: [opciones.normal ? INFERENCIA_NORMAL : INFERENCIA],
    });
  }),
  http.get(/\/casos\/[^/]+\/consentimientos$/, () =>
    HttpResponse.json({
      total: opciones.sinConsentimiento ? 0 : 1,
      items: opciones.sinConsentimiento ? [] : [CONSENTIMIENTO],
    }),
  ),
  http.post(/\/casos\/[^/]+\/consentimientos$/, () =>
    HttpResponse.json(CONSENTIMIENTO, { status: 201 }),
  ),
  http.post(/\/trabajos$/, () =>
    HttpResponse.json({
      id: 'trabajo-demo',
      tipo: 'inferencia',
      estado: 'pendiente',
      intentos: 0,
      max_intentos: 3,
    }),
  ),
  http.get(/\/trabajos\/[^/]+$/, async () => {
    await delay(50);
    return HttpResponse.json({
      id: 'trabajo-demo',
      tipo: 'inferencia',
      estado: 'completado',
      intentos: 1,
      max_intentos: 3,
    });
  }),
];

export const ConResultados: Story = {
  parameters: { msw: { handlers: handlersCaso('lista') } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText('Caso CASO-0001');
    await expect(canvas.getByText('Resultado de IA: apoyo, no diagnóstico')).toBeInTheDocument();
    await expect(canvas.getAllByText('Benigno').length).toBeGreaterThan(0);
    await expect(canvas.getByRole('button', { name: 'Analizar' })).toBeInTheDocument();
  },
};

export const Vacio: Story = {
  parameters: { msw: { handlers: handlersCaso('vacio', { conResultados: false }) } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText('Sin ecografías');
    await canvas.findByText('Sin inferencias');
  },
};

export const ErrorDeCarga: Story = {
  parameters: { msw: { handlers: handlersCaso('error') } },
  play: async ({ canvasElement }) => {
    await within(canvasElement).findByText('No se pudo cargar el caso. Inténtalo de nuevo.');
  },
};

export const TrabajoEnCurso: Story = {
  parameters: { msw: { handlers: handlersCaso('trabajo', { conResultados: false }) } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByRole('button', { name: 'Analizar' });
  },
};

export const NormalSinNodulo: Story = {
  parameters: { msw: { handlers: handlersCaso('lista', { normal: true }) } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText('Normal: sin nódulo detectado');
    await expect(canvas.getByText('Normal (sin nódulo)')).toBeInTheDocument();
  },
};

export const SinConsentimiento: Story = {
  parameters: {
    msw: { handlers: handlersCaso('lista', { sinConsentimiento: true, conResultados: false }) },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText('Sin consentimiento registrado');
    await expect(canvas.getByRole('button', { name: 'Analizar' })).toBeDisabled();
    await expect(
      canvas.getByText('Falta un consentimiento vigente de atención de salud.'),
    ).toBeInTheDocument();
  },
};
