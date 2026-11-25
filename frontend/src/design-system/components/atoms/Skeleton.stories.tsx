import type { Meta, StoryObj } from '@storybook/react';
import { Skeleton } from './Skeleton';

const meta = {
  title: 'Sistema de diseño/Átomos/Skeleton',
  component: Skeleton,
  args: { className: 'h-4 w-48' },
  parameters: { a11y: { test: 'error' } },
  tags: ['ai-generated'],
} satisfies Meta<typeof Skeleton>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Predeterminado: Story = {};
export const EstructuraDeTarjeta: Story = {
  render: () => (
    <div className="space-y-3">
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-8 w-full" />
    </div>
  ),
};
