import type { Meta, StoryObj } from '@storybook/react-vite';
import { Callout } from '../molecules/Callout';
import { ConfusionMatrix } from './ConfusionMatrix';

const meta = {
  title: 'Sistema de diseño/Organismos/ConfusionMatrix',
  component: ConfusionMatrix,
  args: {
    classes: ['Clase A', 'Clase B'],
    values: [
      [14, 3],
      [2, 9],
    ],
    caption: 'Matriz de ejemplo con valores ilustrativos',
  },
  decorators: [
    (Story) => (
      <div className="space-y-4 p-6">
        <Callout tone="warning" title="Valores ilustrativos">
          No son datos de rendimiento ni resultados de un modelo real.
        </Callout>
        <Story />
      </div>
    ),
  ],
  parameters: { a11y: { test: 'error' } },
  tags: ['ai-generated'],
} satisfies Meta<typeof ConfusionMatrix>;

export default meta;

type Story = StoryObj<typeof meta>;

export const ValoresSinteticos: Story = {
  args: {
    classes: ['Grupo A', 'Grupo B', 'Grupo C'],
    values: [
      [8, 2, 1],
      [1, 11, 3],
      [0, 2, 7],
    ],
    caption: 'Matriz sintética de tres grupos; valores solo ilustrativos',
  },
};
export const MuchasCategorias: Story = {
  args: {
    classes: ['Grupo A', 'Grupo B', 'Grupo C'],
    values: [
      [8, 2, 1],
      [1, 11, 3],
      [0, 2, 7],
    ],
    caption: 'Matriz sintética de tres grupos; valores solo ilustrativos',
  },
};
