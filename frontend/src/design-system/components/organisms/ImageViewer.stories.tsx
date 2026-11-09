import type { Meta, StoryObj } from '@storybook/react-vite';
import { ImageViewer } from './ImageViewer';

const SYNTHETIC_IMAGE = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240"><rect x="24" y="24" width="272" height="192" fill="none" stroke="currentColor" stroke-width="4"/><ellipse cx="160" cy="120" rx="82" ry="56" fill="none" stroke="currentColor" stroke-width="4"/><path d="M88 120h144M160 62v116" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
)}`;

const meta = {
  title: 'Sistema de diseño/Organismos/ImageViewer',
  component: ImageViewer,
  args: {
    src: SYNTHETIC_IMAGE,
    alt: 'Ilustración geométrica sintética; no corresponde a una imagen clínica.',
    caption: 'Ejemplo visual sintético para revisar los controles del visor.',
    analyzedRegion: 'Elipse central ilustrativa.',
  },
  parameters: { a11y: { test: 'error' } },
  tags: ['ai-generated'],
} satisfies Meta<typeof ImageViewer>;

export default meta;

type Story = StoryObj<typeof meta>;

export const ConImagen: Story = {};
export const ConImagenDePrueba: Story = {
  args: {
    src: './images/eco-nodulo-hipoecoico.png',
    alt: 'Imagen de prueba del mockup anterior: nódulo hipoecoico.',
    caption: 'Imagen de prueba del mockup anterior para el visor.',
    analyzedRegion: 'Nódulo hipoecoico (región de prueba)',
  },
};
export const SinImagen: Story = {
  args: { caption: 'Visor sin imagen cargada.' },
  render: ({ caption }) => <ImageViewer {...(caption ? { caption } : {})} />,
};

export const ConZoom: Story = {
  args: {
    zoom: 1.5,
    pan: { x: 0, y: 0 },
    caption: 'Vista ampliada sin alterar la imagen original.',
  },
};

export const ConBrillo: Story = {
  args: {
    brightness: 1.2,
    contrast: 1.15,
    caption: 'Ajuste de brillo y contraste aplicado solo a la vista.',
  },
};

export const Arrastrando: Story = {
  args: {
    zoom: 1.5,
    pan: { x: 28, y: -18 },
    caption: 'Vista desplazada para revisar la imagen sin modificar el original.',
  },
};
