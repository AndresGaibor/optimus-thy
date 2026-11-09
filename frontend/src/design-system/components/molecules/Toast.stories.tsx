import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '../atoms/Button';
import { Toast } from './Toast';

const meta = {
  title: 'Sistema de diseño/Moléculas/Toast',
  component: Toast,
  args: {
    title: 'Notificación de demostración',
    description: 'Mensaje sintético; no representa una acción real.',
  },
  parameters: { a11y: { test: 'error' } },
  tags: ['ai-generated'],
} satisfies Meta<typeof Toast>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Neutra: Story = {
  args: { tone: 'neutral', title: 'Notificación neutra de demostración' },
};
export const Informativa: Story = { args: { tone: 'info', title: 'Información de demostración' } };
export const Correcta: Story = { args: { tone: 'success', title: 'Acción sintética completada' } };
export const Atención: Story = {
  args: {
    tone: 'warning',
    title: 'Aviso de demostración',
    description: 'Mensaje sintético para mostrar una advertencia.',
  },
};
export const Error: Story = {
  args: {
    tone: 'danger',
    title: 'Error de demostración',
    description: 'Mensaje sintético para mostrar un estado de alerta.',
  },
};
export const ConAcción: Story = {
  args: {
    tone: 'info',
    title: 'Elemento sintético disponible',
    description: 'Mensaje sintético con una acción opcional.',
    action: (
      <Button size="sm" variant="outline">
        Ver demostración
      </Button>
    ),
  },
};
export const Playground: Story = {};
export const ContenidoLargo: Story = {
  args: {
    title:
      'Demostracionsinteticaparacomprobarqueeltitulodelanotificacionpuedeajustarsecuandoelanchodisponibleesreducidodemostracionsinteticadigitaldeejemplo',
    description:
      'Este mensaje de ejemplo presenta una descripción extensa para comprobar el ajuste dentro de una notificación. La información es sintética, no comunica datos personales ni clínicos y permite verificar que el botón de cierre, si se muestra, continúa siendo reconocible y utilizable con teclado. El contenido largo facilita evaluar el salto de línea y mantener el propósito del aviso claro en distintos tamaños de pantalla.',
  },
};
