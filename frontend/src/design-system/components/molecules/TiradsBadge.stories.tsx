import type { Meta, StoryObj } from '@storybook/react';
import { TiradsBadge } from '../../index';

const meta = {
  title: 'Sistema de diseño/Moléculas/TiradsBadge',
  component: TiradsBadge,
  args: { value: 3 },
  parameters: { a11y: { test: 'error' } },
  tags: ['ai-generated'],
} satisfies Meta<typeof TiradsBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CategoríaTres: Story = { args: { value: 3 } };
export const CategoríaUno: Story = { args: { value: 1 } };
export const CategoríaCuatro: Story = { args: { value: 4 } };
export const SinClasificar: Story = { args: { value: null } };
