import type { Meta, StoryObj } from '@storybook/react';
import { Spinner } from './Spinner';

const meta = {
  title: 'Sistema de diseño/Átomos/Spinner',
  component: Spinner,
  args: { label: 'Cargando demostración' },
  parameters: { a11y: { test: 'error' } },
  tags: ['ai-generated'],
} satisfies Meta<typeof Spinner>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Predeterminado: Story = {};
export const Tamaños: Story = {
  render: (args) => (
    <div className="flex items-center gap-5">
      <Spinner {...args} size="sm" />
      <Spinner {...args} size="default" />
      <Spinner {...args} size="lg" />
    </div>
  ),
};
export const Decorativo: Story = { render: () => <Spinner /> };
export const Playground: Story = {};
