import type { Meta, StoryObj } from '@storybook/react';
import { SupportNotice } from '../../index';

const meta = {
  title: 'Sistema de diseño/Moléculas/SupportNotice',
  component: SupportNotice,
  args: { context: 'inferencia' },
  parameters: { a11y: { test: 'error' } },
  tags: ['ai-generated'],
} satisfies Meta<typeof SupportNotice>;

export default meta;
type Story = StoryObj<typeof meta>;

export const EnInferencia: Story = { args: { context: 'inferencia' } };
export const EnInforme: Story = { args: { context: 'informe' } };
export const Playground: Story = {};
