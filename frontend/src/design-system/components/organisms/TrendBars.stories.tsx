import type { Meta, StoryObj } from '@storybook/react-vite';
import { TrendBars } from './TrendBars';

const meta = {
  title: 'Sistema de diseño/Organismos/TrendBars',
  component: TrendBars,
  args: {
    caption: 'Conteos de ejemplo por grupo',
    items: [
      { label: 'Grupo A', value: 6, valueLabel: '6 elementos', tone: 'info' },
      { label: 'Grupo B', value: 4, valueLabel: '4 elementos', tone: 'success' },
      { label: 'Grupo C', value: 2, valueLabel: '2 elementos', tone: 'attention' },
    ],
  },
  decorators: [
    (Story) => (
      <div className="space-y-4 p-6">
        <Story />
      </div>
    ),
  ],
  parameters: { a11y: { test: 'error' } },
  tags: ['ai-generated'],
} satisfies Meta<typeof TrendBars>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Conteos: Story = {};
export const ValoresCero: Story = {
  args: {
    caption: 'Ejemplo vacío con valores cero',
    items: [
      { label: 'Grupo A', value: 0, valueLabel: '0' },
      { label: 'Grupo B', value: 0, valueLabel: '0' },
    ],
  },
};
export const Playground: Story = {};
