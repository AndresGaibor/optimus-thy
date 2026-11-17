import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import type { Inferencia } from '../../api/resultados';
import { ResultadoInferencia } from './ResultadoInferencia';

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

const INFERENCIA: Inferencia = {
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
  title: 'Aplicación/Médico/Resultado de inferencia (HT-064)',
  component: ResultadoInferencia,
  args: { inferencia: INFERENCIA, casoId: 'caso-demo' },
  tags: ['ai-generated'],
} satisfies Meta<typeof ResultadoInferencia>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SinNodulo: Story = {
  args: { inferencia: { ...INFERENCIA, resultado: 'sin_nodulo', nodulos: [] } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Normal: sin nódulo detectado')).toBeInTheDocument();
    await expect(canvas.queryByText('Nódulo 1')).not.toBeInTheDocument();
  },
};

export const Benigno: Story = {
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getAllByText('Benigno').length).toBeGreaterThan(0);
  },
};

export const Maligno: Story = {
  args: {
    inferencia: {
      ...INFERENCIA,
      resultado: 'maligno',
      nodulos: [{ ...NODULO, clase: 'maligno', probabilidad_benigno: 0, probabilidad_maligno: 1 }],
    },
  },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getAllByText('Maligno').length).toBeGreaterThan(0);
  },
};
