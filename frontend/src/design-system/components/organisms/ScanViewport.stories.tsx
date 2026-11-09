import type { Meta, StoryObj } from '@storybook/react-vite';
import { ScanViewport } from './ScanViewport';

const meta = {
  title: 'Sistema de diseño/Organismos/ScanViewport',
  component: ScanViewport,
  args: {
    label: 'Ilustración geométrica sintética para el visor',
    note: 'Ilustración sintética: no es una imagen clínica ni corresponde a un caso real.',
  },
  parameters: { a11y: { test: 'error' } },
  tags: ['ai-generated'],
} satisfies Meta<typeof ScanViewport>;

export default meta;

type Story = StoryObj<typeof meta>;

export const ConMarcas: Story = {
  args: {
    overlays: [
      {
        id: 'marca-rectangulo',
        label: 'Área rectangular de prueba',
        shape: 'rect',
        x: 18,
        y: 12,
        width: 26,
        height: 18,
        tone: 'warning',
      },
      {
        id: 'marca-eliptica',
        label: 'Área elíptica de prueba',
        shape: 'ellipse',
        x: 58,
        y: 36,
        width: 24,
        height: 20,
        tone: 'info',
      },
    ],
    showOverlays: true,
  },
};
export const SinMarcas: Story = { args: { overlays: [], showOverlays: false } };
export const Playground: Story = {};
