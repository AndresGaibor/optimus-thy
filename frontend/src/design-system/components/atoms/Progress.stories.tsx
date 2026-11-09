import type { Meta, StoryObj } from '@storybook/react';
import { Progress } from './Progress';

const meta = {
  title: 'Sistema de diseño/Átomos/Progress',
  component: Progress,
  args: { label: 'Progreso de demostración', value: 64 },
  parameters: { a11y: { test: 'error' } },
  tags: ['ai-generated'],
} satisfies Meta<typeof Progress>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Predeterminado: Story = {};
export const Tonos: Story = {
  render: (args) => (
    <div className="grid max-w-md gap-4">
      {(['info', 'success', 'warning', 'danger', 'ai'] as const).map((tone) => (
        <Progress {...args} key={tone} tone={tone} label={`Progreso: ${tone}`} />
      ))}
    </div>
  ),
};
export const Indeterminado: Story = { render: () => <Progress label="Progreso en curso" /> };
export const Completado: Story = {
  args: { value: 100, tone: 'success', label: 'Progreso completado' },
};
export const Playground: Story = {};
