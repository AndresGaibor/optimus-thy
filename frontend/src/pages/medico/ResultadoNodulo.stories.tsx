import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { ResultadoNodulo } from './ResultadoNodulo';

const meta = {
  title: 'Aplicación/Médico/Resultado por nódulo',
  component: ResultadoNodulo,
  tags: ['ai-generated'],
} satisfies Meta<typeof ResultadoNodulo>;

export default meta;
type Story = StoryObj<typeof meta>;

const nodulo = {
  indice: 1,
  clase: 'maligno',
  confianza: 0.91,
  probabilidad_benigno: 0.08,
  probabilidad_maligno: 0.92,
  caja: { x: 10, y: 20, w: 50, h: 60 },
  region_analizada: { xmin: 0, ymin: 0, xmax: 96, ymax: 96 },
  pixeles_mascara: 1234,
  artefactos: {
    mascara_url: null,
    mgac_url: null,
    xml_url: 'https://storage.local/resultado.xml',
    superposicion_url: null,
  },
};

export const Maligno: Story = {
  args: { nodulo, modelo: { nombre: 'Nodo', version: '1.0' }, creadoEn: '2026-05-10T09:05:00Z' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/Nódulo 1: Maligno/)).toBeInTheDocument();
    await expect(canvas.getAllByText('92 %').length).toBeGreaterThan(0);
    await expect(canvas.getByRole('link', { name: /Descargar XML/ })).toBeInTheDocument();
  },
};
