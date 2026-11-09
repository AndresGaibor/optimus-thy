import type { Meta, StoryObj } from '@storybook/react';
import { BrandMark } from './BrandMark';

const meta = {
  title: 'Sistema de diseño/Átomos/BrandMark',
  component: BrandMark,
  parameters: { a11y: { test: 'error' } },
  tags: ['ai-generated'],
} satisfies Meta<typeof BrandMark>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Predeterminado: Story = {};

export const Tamaños: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-4">
      <BrandMark size="sm" />
      <BrandMark size="default" />
      <BrandMark size="lg" />
    </div>
  ),
};

export const SoloSimbolo: Story = { args: { showWordmark: false } };
export const Playground: Story = {};
