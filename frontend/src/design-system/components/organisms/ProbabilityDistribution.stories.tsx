import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { ProbabilityDistribution } from './ProbabilityDistribution';

const meta = {
  title: 'Sistema de diseño/Organismos/ProbabilityDistribution',
  component: ProbabilityDistribution,
  args: {
    caption: 'Distribución sintética de probabilidades',
    bins: [
      { rango: '0.0–0.2', negativos: 28, positivos: 1 },
      { rango: '0.2–0.4', negativos: 14, positivos: 3 },
      { rango: '0.4–0.6', negativos: 5, positivos: 6 },
      { rango: '0.6–0.8', negativos: 2, positivos: 12 },
      { rango: '0.8–1.0', negativos: 1, positivos: 28 },
    ],
  },
  decorators: [
    (Story) => (
      <div className="p-6">
        <Story />
      </div>
    ),
  ],
  parameters: { a11y: { test: 'error' } },
  tags: ['ai-generated'],
} satisfies Meta<typeof ProbabilityDistribution>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Normal: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByText('Ver tabla equivalente'));
    await expect(canvas.getByRole('table')).toBeVisible();
  },
};

export const SinDatos: Story = {
  args: { bins: [] },
};
