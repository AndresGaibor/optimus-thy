import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { RocCurve } from './RocCurve';

const meta = {
  title: 'Sistema de diseño/Organismos/RocCurve',
  component: RocCurve,
  args: {
    caption: 'Curva ROC sintética de demostración',
    auc: 0.92,
    points: [
      { fpr: 0, tpr: 0 },
      { fpr: 0.1, tpr: 0.9 },
      { fpr: 0.2, tpr: 0.95 },
      { fpr: 0.3, tpr: 0.97 },
      { fpr: 0.4, tpr: 0.98 },
      { fpr: 0.5, tpr: 0.985 },
      { fpr: 0.6, tpr: 0.99 },
      { fpr: 0.7, tpr: 0.993 },
      { fpr: 0.8, tpr: 0.996 },
      { fpr: 0.9, tpr: 0.998 },
      { fpr: 1, tpr: 1 },
    ],
  },
  decorators: [
    (Story) => (
      <div className="max-w-lg p-6">
        <Story />
      </div>
    ),
  ],
  parameters: { a11y: { test: 'error' } },
  tags: ['ai-generated'],
} satisfies Meta<typeof RocCurve>;

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
  args: { points: [] },
};
