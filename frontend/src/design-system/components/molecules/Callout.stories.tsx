import type { Meta, StoryObj } from '@storybook/react-vite';
import { Callout } from './Callout';

const meta = {
  title: 'Sistema de diseño/Moléculas/Callout',
  component: Callout,
  args: {
    title: 'Información de demostración',
    children: 'El contenido de esta historia es sintético y solo ilustra el componente.',
  },
  parameters: { a11y: { test: 'error' } },
  tags: ['ai-generated'],
} satisfies Meta<typeof Callout>;

export default meta;

export const Informativo: StoryObj<typeof meta> = {
  args: { tone: 'info', title: 'Información de demostración' },
};
export const Correcto: StoryObj<typeof meta> = {
  args: { tone: 'success', title: 'Acción de muestra completada' },
};
export const Atención: StoryObj<typeof meta> = {
  args: {
    tone: 'warning',
    role: 'alert',
    title: 'Revisión de demostración',
    children: 'Mensaje sintético para mostrar una advertencia.',
  },
};
export const Error: StoryObj<typeof meta> = {
  args: {
    tone: 'danger',
    role: 'alert',
    title: 'No se pudo completar la demostración',
    children: 'Mensaje sintético para mostrar un estado de alerta.',
  },
};
export const Playground: StoryObj<typeof meta> = {};
export const ContenidoLargo: StoryObj<typeof meta> = {
  args: {
    title:
      'Demostracionsinteticaparacomprobarqueelencabezadopermanecelegiblecuandoelcontenidoseextiendeenuncontenedorestrechoycambiaelviewport',
    children:
      'Este texto de demostración comprueba cómo se presenta un mensaje de apoyo extenso dentro del bloque, sin utilizar datos reales ni afirmaciones clínicas. El contenido debe conservar su legibilidad, ajustarse al espacio disponible y seguir comunicando que se trata únicamente de una muestra sintética para la interfaz.',
  },
};
