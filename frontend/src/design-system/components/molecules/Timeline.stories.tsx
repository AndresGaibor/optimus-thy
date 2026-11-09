import type { Meta, StoryObj } from '@storybook/react';
import { Timeline } from '../../index';

const meta = {
  title: 'Sistema de diseño/Moléculas/Timeline',
  component: Timeline,
  args: {
    label: 'Cronología sintética de demostración',
    items: [
      {
        id: 'demo-1',
        title: 'Elemento de demostración creado',
        description: 'Registro sintético DEMO-001.',
        timestamp: '27 oct 2026, 09:00',
        dateTime: '2026-10-27T09:00:00',
        tone: 'info',
      },
      {
        id: 'demo-2',
        title: 'Revisión de muestra completada',
        description: 'El evento solo ilustra el componente.',
        timestamp: '27 oct 2026, 09:15',
        dateTime: '2026-10-27T09:15:00',
        tone: 'success',
      },
      {
        id: 'demo-3',
        title: 'Paso pendiente de demostración',
        timestamp: '27 oct 2026, 09:30',
        dateTime: '2026-10-27T09:30:00',
        tone: 'warning',
      },
    ],
  },
  parameters: { a11y: { test: 'error' } },
  tags: ['ai-generated'],
} satisfies Meta<typeof Timeline>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ConEventosSintéticos: Story = {};
export const SinEventos: Story = {
  args: { items: [], label: 'Cronología vacía de demostración' },
};
